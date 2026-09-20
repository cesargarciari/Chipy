variable "name" {
  description = "Table name (also the resource name prefix from the caller)"
  type        = string
}

variable "point_in_time_recovery" {
  description = "Enable continuous backups / PITR"
  type        = bool
  default     = true
}

variable "deletion_protection" {
  description = "Block `terraform destroy` / console deletion of the table"
  type        = bool
  default     = true
}
