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
  description = "Custom domain for the site (empty = use the CloudFront domain)"
  type        = string
  default     = ""
}

variable "monthly_budget_usd" {
  description = "AWS Budgets alarm threshold"
  type        = number
  default     = 5
}
