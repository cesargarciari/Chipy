output "alerts_topic_arn" {
  description = "SNS topic that budget + Lambda alarms publish to"
  value       = aws_sns_topic.alerts.arn
}
