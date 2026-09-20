# module: observability

The cheap guardrails (Milestone 2). No dashboard, no idle cost.

- `aws_budgets_budget` - a **$5/month** account ceiling (`monthly_budget_usd`).
  Emails at 50% / 80% actual and 100% forecast when `alert_email` is set. This is
  the backstop against every "why is my bill $40" surprise.
- `aws_sns_topic` + optional email subscription for alarm fan-out.
- `aws_cloudwatch_metric_alarm` **lambda-errors** - Lambda `Errors` > N (default 5) in 5 minutes.
- `aws_cloudwatch_metric_alarm` **lambda-throttles** - Lambda `Throttles` >= 1,
  i.e. the reserved-concurrency cap is being hit (a spike, or a client loop).

Outputs: `alerts_topic_arn`.

Cost at idle: **~$0** (Budgets: first 2 budgets free; alarms: first 10 free;
SNS email: first 1,000 notifications free).
