variable "name" {
  description = "Resource name prefix (e.g. chipy-prod)"
  type        = string
}

variable "dynamodb_table_name" {
  description = "Table name, passed to the app as DYNAMODB_TABLE"
  type        = string
}

variable "dynamodb_table_arn" {
  description = "Table ARN, for the least-privilege IAM policy"
  type        = string
}

variable "lambda_zip_path" {
  description = "Path to the built deployment zip (from data.archive_file)"
  type        = string
}

variable "lambda_zip_hash" {
  description = "base64sha256 of the zip, so Terraform redeploys on change"
  type        = string
}

variable "reserved_concurrency" {
  description = "Hard cap on concurrent executions - bounds cost and blast radius. 0 = unmanaged (required on accounts whose total regional Lambda concurrency quota is still the low new-account default; AWS requires >=10 to stay unreserved account-wide, so any positive value fails until that quota is raised). Check yours with `aws lambda get-account-settings`."
  type        = number
  default     = 5
}

variable "memory_size" {
  description = "Lambda memory (MB). 512 is a good Fastify cold-start / cost point."
  type        = number
  default     = 512
}

variable "timeout_seconds" {
  description = "Lambda timeout"
  type        = number
  default     = 15
}

variable "log_retention_days" {
  description = "CloudWatch log retention"
  type        = number
  default     = 14
}

variable "log_level" {
  description = "pino log level"
  type        = string
  default     = "info"
}

variable "cors_origin" {
  description = "Comma-separated allowed origins. Empty = don't set CORS_ORIGIN (same-origin via CloudFront needs none)."
  type        = string
  default     = ""
}
