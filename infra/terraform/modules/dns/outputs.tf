output "certificate_arn" {
  description = "Validated ACM cert ARN, for the CloudFront distribution"
  value       = aws_acm_certificate_validation.this.certificate_arn
}

output "zone_id" {
  description = "Hosted-zone id (created or existing), for the site alias records"
  value       = local.zone_id
}

output "nameservers" {
  description = "Set these at your registrar if Terraform created the zone (empty otherwise)"
  value       = local.create_zone ? aws_route53_zone.this[0].name_servers : []
}
