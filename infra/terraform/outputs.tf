output "site_url" {
  description = "Open this in a browser"
  value       = module.static_site.url
}

output "cloudfront_distribution_id" {
  description = "For `aws cloudfront create-invalidation` after a web deploy"
  value       = module.static_site.distribution_id
}

output "cloudfront_url" {
  description = "The always-working *.cloudfront.net URL (use it to test before DNS propagates)"
  value       = "https://${module.static_site.cloudfront_domain_name}"
}

output "cloudfront_domain_name" {
  description = "Bare CloudFront domain (no scheme) - the value for a manual CNAME at an external DNS provider"
  value       = module.static_site.cloudfront_domain_name
}

output "site_bucket" {
  description = "For `aws s3 sync apps/web/dist s3://<this>`"
  value       = module.static_site.bucket_name
}

output "api_function_name" {
  description = "API Lambda name"
  value       = module.api.function_name
}

output "api_function_url" {
  description = "Raw Function URL (CloudFront-only; not callable anonymously)"
  value       = module.api.function_url
}

output "dynamodb_table" {
  description = "DynamoDB table name"
  value       = module.data.table_name
}

output "route53_nameservers" {
  description = "Only if Terraform created the hosted zone: set these at your registrar, then re-apply"
  value       = local.use_managed_dns ? module.dns[0].nameservers : []
}

output "manual_dns_needed" {
  description = "Only with acm_certificate_arn (external DNS, e.g. Cloudflare): add this record at your DNS provider, DNS-only / not proxied"
  value = local.external_cert ? {
    name  = var.domain_name
    type  = "CNAME"
    value = module.static_site.cloudfront_domain_name
  } : null
}
