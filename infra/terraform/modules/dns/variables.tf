variable "domain_name" {
  description = "The domain the site answers on (apex like chipy.gg or a subdomain like play.example.com)"
  type        = string
}

variable "route53_zone_id" {
  description = "Existing hosted-zone id for domain_name. Empty = Terraform creates the zone (then set its nameservers at your registrar before re-applying)."
  type        = string
  default     = ""
}
