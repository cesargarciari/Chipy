variable "name" {
  description = "Resource name prefix (e.g. chipy-prod)"
  type        = string
}

variable "lambda_function_name" {
  description = "API Lambda name to alarm on"
  type        = string
}

variable "monthly_budget_usd" {
  description = "AWS Budgets ceiling for the whole account"
  type        = number
  default     = 5
}

variable "alert_email" {
  description = "Address for budget + alarm notifications (empty = no email, alarms still fire to SNS)"
  type        = string
  default     = ""
}

variable "error_threshold" {
  description = "Lambda errors in a 5-minute window before the alarm trips"
  type        = number
  default     = 5
}
