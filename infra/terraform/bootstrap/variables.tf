variable "aws_region" {
  description = "Region for the state bucket + lock table"
  type        = string
  default     = "ca-central-1"
}

variable "github_repo" {
  description = "owner/repo the deploy role trusts (e.g. cesargarciari/Chipy)"
  type        = string
}
