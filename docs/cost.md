# Cost model (AWS, Milestone 2 target)

Goal: **as close to $0 as possible** at portfolio traffic, no idle compute.

| Service              | Free tier                             | Expected M2 usage                             | Est. monthly |
| -------------------- | ------------------------------------- | --------------------------------------------- | ------------ |
| CloudFront           | 1 TB out + 10M requests (perpetual)   | well under                                    | $0           |
| S3                   | 5 GB + 20k GET (12 mo)                | a few MB of assets                            | ~$0          |
| Lambda               | 1M requests + 400k GB-s (perpetual)   | far under                                     | $0           |
| API Gateway HTTP API | 1M requests (12 mo), then $1.00/M     | far under                                     | $0           |
| DynamoDB on-demand   | 25 GB storage (perpetual)             | kilobytes; on-demand R/W billed per request   | ~$0          |
| CloudWatch           | 5 GB logs + 10 metrics + 3 dashboards | 14-day retention, small                       | ~$0          |
| Route 53             | none                                  | 1 hosted zone (only if using a custom domain) | **$0.50**    |
| ACM                  | free                                  | 1 cert                                        | $0           |
| Data transfer        | see CloudFront                        | —                                             | $0           |

**Idle total: ~$0.50/month** (just the hosted zone, and only if a custom domain
is used — the `*.cloudfront.net` URL is free). Domain registration is separate,
~$12–15/year.

## Guardrails

- `modules/observability` provisions an **AWS Budgets** alarm at `$5/mo` with
  notifications at 50% / 80% / 100%.
- Lambda **reserved concurrency** is capped so a traffic spike (or a loop bug)
  cannot run up a bill.
- DynamoDB stays **on-demand** — no provisioned capacity to pay for while idle.
- No NAT Gateway, no ALB, no RDS, no idle EC2/Fargate — the usual "why is my AWS
  bill $40" suspects are all absent by design.

## What would change the bill

- Real traffic in the millions/month → API Gateway + DynamoDB request costs
  become pennies-to-dollars, still small.
- Switching the API to Fargate (always-on) → ~$3–9/month for one small task.
  Kept as a documented option, not the default.
