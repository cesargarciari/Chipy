variable "name" {
  description = "Resource name prefix (e.g. chipy-prod)"
  type        = string
}

variable "api_origin_domain" {
  description = "Host of the Lambda Function URL (no scheme, no trailing slash)"
  type        = string
}

variable "api_function_name" {
  description = "Lambda function name, for the CloudFront invoke permission"
  type        = string
}

variable "domain_name" {
  description = "Custom domain (empty = serve on the *.cloudfront.net domain)"
  type        = string
  default     = ""
}

variable "acm_certificate_arn" {
  description = "us-east-1 ACM cert ARN for `domain_name` (empty = CloudFront default cert)"
  type        = string
  default     = ""
}

variable "force_destroy" {
  description = "Allow `terraform destroy` to empty and delete the site bucket"
  type        = bool
  default     = false
}
