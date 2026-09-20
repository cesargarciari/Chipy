variable "project" {
  description = "Resource name prefix"
  type        = string
  default     = "chipy"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "prod"
}

variable "aws_region" {
  description = "AWS region for all regional resources"
  type        = string
  default     = "ca-central-1"
}

variable "domain_name" {
  description = "Custom domain for the site (empty = use the free *.cloudfront.net domain)"
  type        = string
  default     = ""
}

variable "route53_zone_id" {
  description = "Existing Route 53 hosted-zone id for domain_name (with live nameservers). Empty = Terraform creates the zone. Ignored (and irrelevant) when acm_certificate_arn is set."
  type        = string
  default     = ""
}

variable "acm_certificate_arn" {
  description = "A pre-validated ACM cert ARN (must be in us-east-1) for domain_name. Set this when DNS lives outside Route 53 (e.g. Cloudflare): Terraform then skips the `dns` module and Route 53 entirely, and just wires this cert into CloudFront. Leave empty to have Terraform manage the cert (and optionally the zone) in Route 53 instead."
  type        = string
  default     = ""
}

variable "monthly_budget_usd" {
  description = "AWS Budgets alarm threshold for the account"
  type        = number
  default     = 5
}

variable "alert_email" {
  description = "Email for the budget alarm + Lambda alarms (empty = SNS topic only, no email)"
  type        = string
  default     = ""
}

variable "lambda_reserved_concurrency" {
  description = "Hard cap on concurrent API executions (bounds cost / blast radius)"
  type        = number
  default     = 5
}

variable "log_retention_days" {
  description = "CloudWatch retention for the API log group"
  type        = number
  default     = 14
}

variable "api_cors_origin" {
  description = "Comma-separated CORS origins for the API. Empty is fine: the browser calls CloudFront same-origin."
  type        = string
  default     = ""
}

variable "point_in_time_recovery" {
  description = "DynamoDB continuous backups"
  type        = bool
  default     = true
}

variable "deletion_protection" {
  description = "Protect the DynamoDB table from deletion"
  type        = bool
  default     = true
}

variable "site_bucket_force_destroy" {
  description = "Let `terraform destroy` empty + delete the SPA bucket"
  type        = bool
  default     = false
}
