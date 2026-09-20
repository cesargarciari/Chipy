output "url" {
  description = "Public site URL"
  value       = var.domain_name == "" ? "https://${aws_cloudfront_distribution.this.domain_name}" : "https://${var.domain_name}"
}

output "cloudfront_domain_name" {
  description = "The *.cloudfront.net domain"
  value       = aws_cloudfront_distribution.this.domain_name
}

output "distribution_id" {
  description = "CloudFront distribution id (for cache invalidations)"
  value       = aws_cloudfront_distribution.this.id
}

output "distribution_arn" {
  description = "CloudFront distribution ARN"
  value       = aws_cloudfront_distribution.this.arn
}

output "cloudfront_hosted_zone_id" {
  description = "Fixed CloudFront zone id, for Route 53 alias records"
  value       = aws_cloudfront_distribution.this.hosted_zone_id
}

output "bucket_name" {
  description = "S3 bucket holding the SPA build (for `aws s3 sync`)"
  value       = aws_s3_bucket.site.bucket
}
