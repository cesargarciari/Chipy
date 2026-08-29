# module: observability

Milestone 2:

- CloudWatch dashboard: Lambda invocations / errors / p95 duration, API Gateway
  4xx/5xx, DynamoDB throttles + consumed capacity
- Alarms → SNS topic (email subscription):
  - Lambda error rate > 2% for 5 min
  - API Gateway 5xx > 5 in 5 min
  - DynamoDB `ThrottledRequests` > 0
- **AWS Budgets**: monthly cost alarm at `monthly_budget_usd` (and at 50% / 80%)

Outputs: `dashboard_name`, `sns_topic_arn`.
