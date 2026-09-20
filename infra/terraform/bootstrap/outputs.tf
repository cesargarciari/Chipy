output "tfstate_bucket" {
  description = "-> infra/terraform/backend.hcl `bucket` and GH secret TF_STATE_BUCKET"
  value       = aws_s3_bucket.tfstate.bucket
}

output "tflock_table" {
  description = "-> backend.hcl `dynamodb_table` and GH secret TF_LOCK_TABLE"
  value       = aws_dynamodb_table.tflock.name
}

output "github_deploy_role_arn" {
  description = "-> GH secret AWS_DEPLOY_ROLE_ARN"
  value       = aws_iam_role.github_deploy.arn
}
