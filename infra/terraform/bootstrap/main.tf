# Run once, with an admin/bootstrap identity, BEFORE the root module:
#
#   cd infra/terraform/bootstrap
#   terraform init && terraform apply -var 'github_repo=<owner>/<repo>'
#   terraform output          # copy into ../backend.hcl and GitHub secrets
#
# Idempotent - safe to re-run. Uses local state (it is what creates remote state).

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = { Project = "chipy", ManagedBy = "terraform-bootstrap" }
  }
}

data "aws_caller_identity" "current" {}

# ---------------------------------------------------------------------------
# Remote state: S3 bucket (versioned, encrypted, private) + a lock table
# ---------------------------------------------------------------------------
resource "aws_s3_bucket" "tfstate" {
  bucket = "chipy-tfstate-${data.aws_caller_identity.current.account_id}"
}

resource "aws_s3_bucket_versioning" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "tfstate" {
  bucket                  = aws_s3_bucket.tfstate.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id
  rule {
    id     = "expire-old-state-versions"
    status = "Enabled"
    filter {}
    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }
}

resource "aws_dynamodb_table" "tflock" {
  name         = "chipy-tflock"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"
  attribute {
    name = "LockID"
    type = "S"
  }
}

# ---------------------------------------------------------------------------
# GitHub Actions OIDC: a role CI can assume with no stored keys
# ---------------------------------------------------------------------------
# AWS no longer verifies this thumbprint for token.actions.githubusercontent.com
# (it uses its own trust store), but the resource still requires a value - read
# the live one rather than pinning a string that rotates.
data "tls_certificate" "github" {
  url = "https://token.actions.githubusercontent.com"
}

resource "aws_iam_openid_connect_provider" "github" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.github.certificates[0].sha1_fingerprint]
}

data "aws_iam_policy_document" "github_assume" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github.arn]
    }
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }
    condition {
      # GitHub's `sub` claim can embed immutable owner/repo IDs
      # (repo:name@owner_id/name@repo_id:...) instead of plain names, depending
      # on account settings - so pin on the stable `repository` claim (plain
      # "owner/repo", unaffected either way) for identity, and only use `sub`
      # to restrict *which ref/event*, wildcarding the owner/repo portion.
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:repository"
      values   = [var.github_repo]
    }
    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values = [
        "repo:*:ref:refs/heads/main",
        "repo:*:pull_request",
      ]
    }
  }
}

resource "aws_iam_role" "github_deploy" {
  name                 = "chipy-github-deploy"
  assume_role_policy   = data.aws_iam_policy_document.github_assume.json
  max_session_duration = 3600
}

# Broad by service, not by resource: a Terraform deploy role touches a lot, and a
# perfectly least-privilege policy here is a maintenance sink. Scope it down once
# the resource set is stable. Notably absent: no `*:Delete*` on data stores it
# should never remove, and no org/account-level actions.
data "aws_iam_policy_document" "github_deploy" {
  statement {
    sid    = "State"
    effect = "Allow"
    actions = [
      "s3:GetObject", "s3:PutObject", "s3:DeleteObject", "s3:ListBucket",
      "dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:DeleteItem",
    ]
    resources = [
      aws_s3_bucket.tfstate.arn, "${aws_s3_bucket.tfstate.arn}/*",
      aws_dynamodb_table.tflock.arn,
    ]
  }

  statement {
    sid    = "Provision"
    effect = "Allow"
    actions = [
      "lambda:*",
      "cloudfront:*",
      "dynamodb:CreateTable", "dynamodb:DescribeTable", "dynamodb:UpdateTable",
      "dynamodb:TagResource", "dynamodb:UntagResource",
      "dynamodb:ListTagsOfResource", "dynamodb:DescribeContinuousBackups",
      "dynamodb:UpdateContinuousBackups", "dynamodb:DescribeTimeToLive",
      "dynamodb:UpdateTimeToLive",
      "s3:CreateBucket", "s3:PutBucketPolicy", "s3:GetBucketPolicy",
      "s3:PutBucketPublicAccessBlock", "s3:GetBucketPublicAccessBlock",
      "s3:PutEncryptionConfiguration", "s3:GetEncryptionConfiguration",
      "s3:PutBucketOwnershipControls", "s3:GetBucketOwnershipControls",
      "s3:GetBucketTagging", "s3:PutBucketTagging", "s3:GetBucketVersioning",
      "s3:ListAllMyBuckets", "s3:GetBucketLocation", "s3:GetAccelerateConfiguration",
      "s3:GetBucketAcl", "s3:GetBucketCors", "s3:GetBucketWebsite",
      "s3:GetBucketLogging", "s3:GetLifecycleConfiguration", "s3:GetReplicationConfiguration",
      "s3:GetBucketRequestPayment", "s3:GetBucketObjectLockConfiguration",
      "iam:CreateRole", "iam:DeleteRole", "iam:GetRole", "iam:PassRole",
      "iam:TagRole", "iam:UntagRole", "iam:ListRolePolicies",
      "iam:PutRolePolicy", "iam:GetRolePolicy", "iam:DeleteRolePolicy",
      "iam:AttachRolePolicy", "iam:DetachRolePolicy", "iam:ListAttachedRolePolicies",
      "iam:ListInstanceProfilesForRole",
      "logs:CreateLogGroup", "logs:DeleteLogGroup", "logs:DescribeLogGroups",
      "logs:PutRetentionPolicy", "logs:TagResource", "logs:ListTagsForResource",
      "logs:TagLogGroup", "logs:ListTagsLogGroup",
      "sns:CreateTopic", "sns:DeleteTopic", "sns:GetTopicAttributes",
      "sns:SetTopicAttributes", "sns:Subscribe", "sns:Unsubscribe",
      "sns:ListSubscriptionsByTopic", "sns:GetSubscriptionAttributes",
      "sns:ListTagsForResource", "sns:TagResource",
      "cloudwatch:PutMetricAlarm", "cloudwatch:DeleteAlarms",
      "cloudwatch:DescribeAlarms", "cloudwatch:ListTagsForResource", "cloudwatch:TagResource",
      "budgets:ViewBudget", "budgets:ModifyBudget",
      "acm:RequestCertificate", "acm:DescribeCertificate", "acm:DeleteCertificate",
      "acm:ListCertificates", "acm:ListTagsForCertificate", "acm:AddTagsToCertificate",
      "route53:CreateHostedZone", "route53:DeleteHostedZone", "route53:GetHostedZone",
      "route53:ListHostedZones", "route53:ListHostedZonesByName",
      "route53:ChangeResourceRecordSets", "route53:ListResourceRecordSets",
      "route53:GetChange", "route53:ChangeTagsForResource", "route53:ListTagsForResource",
    ]
    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "github_deploy" {
  name   = "deploy"
  role   = aws_iam_role.github_deploy.id
  policy = data.aws_iam_policy_document.github_deploy.json
}
