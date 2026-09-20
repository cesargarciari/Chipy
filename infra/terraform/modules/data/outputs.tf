output "table_name" {
  description = "DynamoDB table name (feed to the API as DYNAMODB_TABLE)"
  value       = aws_dynamodb_table.this.name
}

output "table_arn" {
  description = "DynamoDB table ARN (for the Lambda IAM policy)"
  value       = aws_dynamodb_table.this.arn
}
