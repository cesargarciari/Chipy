provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# CloudFront certificates must live in us-east-1. Only used when `domain_name`
# is set (the `dns` module); harmless otherwise.
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = {
      Project     = var.project
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

locals {
  name       = "${var.project}-${var.environment}"
  has_domain = var.domain_name != ""
  # Two ways to get HTTPS on a custom domain:
  #  - bring your own validated cert (acm_certificate_arn set) -> DNS can live
  #    anywhere (Cloudflare, etc.); Terraform never touches Route 53.
  #  - let Terraform manage the cert (and optionally the zone) in Route 53.
  external_cert   = var.acm_certificate_arn != ""
  use_managed_dns = local.has_domain && !local.external_cert
  acm_certificate = local.external_cert ? var.acm_certificate_arn : (local.use_managed_dns ? module.dns[0].certificate_arn : "")
}

# ---------------------------------------------------------------------------
# Lambda deployment package. Built beforehand:
#   pnpm --filter "@chipy/api..." build && pnpm --filter @chipy/api build:lambda
# CI does this automatically; do it by hand before a local `terraform apply`.
# ---------------------------------------------------------------------------
data "archive_file" "lambda" {
  type        = "zip"
  source_dir  = "${path.module}/../../apps/api/dist-lambda"
  output_path = "${path.module}/.build/lambda.zip"
}

# ---------------------------------------------------------------------------
# Modules
# ---------------------------------------------------------------------------
module "data" {
  source = "./modules/data"

  name                   = local.name
  point_in_time_recovery = var.point_in_time_recovery
  deletion_protection    = var.deletion_protection
}

module "api" {
  source = "./modules/api"

  name                = local.name
  dynamodb_table_name = module.data.table_name
  dynamodb_table_arn  = module.data.table_arn

  lambda_zip_path      = data.archive_file.lambda.output_path
  lambda_zip_hash      = data.archive_file.lambda.output_base64sha256
  reserved_concurrency = var.lambda_reserved_concurrency
  log_retention_days   = var.log_retention_days
  cors_origin          = var.api_cors_origin
}

# Custom domain, Route-53-managed path: cert + DNS validation. Skipped when
# there's no domain, or when acm_certificate_arn brings an external cert instead.
module "dns" {
  count  = local.use_managed_dns ? 1 : 0
  source = "./modules/dns"
  providers = {
    aws           = aws
    aws.us_east_1 = aws.us_east_1
  }

  domain_name     = var.domain_name
  route53_zone_id = var.route53_zone_id
}

module "static_site" {
  source = "./modules/static-site"

  name                = local.name
  api_origin_domain   = module.api.function_url_domain
  api_function_name   = module.api.function_name
  domain_name         = var.domain_name
  acm_certificate_arn = local.acm_certificate
  force_destroy       = var.site_bucket_force_destroy
}

# Point the domain at CloudFront - only when Terraform also owns the zone. With
# an external cert (Cloudflare etc.) this record is added by hand instead; see
# the `manual_dns_needed` output.
resource "aws_route53_record" "alias" {
  for_each = local.use_managed_dns ? toset(["A", "AAAA"]) : toset([])

  zone_id = module.dns[0].zone_id
  name    = var.domain_name
  type    = each.value

  alias {
    name                   = module.static_site.cloudfront_domain_name
    zone_id                = module.static_site.cloudfront_hosted_zone_id
    evaluate_target_health = false
  }
}

module "observability" {
  source = "./modules/observability"

  name                 = local.name
  lambda_function_name = module.api.function_name
  monthly_budget_usd   = var.monthly_budget_usd
  alert_email          = var.alert_email
}
