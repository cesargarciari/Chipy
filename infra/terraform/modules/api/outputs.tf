output "function_name" {
  description = "Lambda function name (for alarms and `aws lambda update-function-code`)"
  value       = aws_lambda_function.this.function_name
}

output "function_arn" {
  description = "Lambda function ARN"
  value       = aws_lambda_function.this.arn
}

output "function_url" {
  description = "Raw Function URL, e.g. https://<id>.lambda-url.<region>.on.aws/"
  value       = aws_lambda_function_url.this.function_url
}

output "function_url_domain" {
  description = "Just the host, for a CloudFront custom origin"
  value       = trimsuffix(trimprefix(aws_lambda_function_url.this.function_url, "https://"), "/")
}
