# Cost model (AWS, Milestone 2)

Goal: **as close to $0 as possible** at portfolio traffic, no idle compute.
Architecture: [ADR 0008](adr/0008-cheapest-viable-aws.md).

| Service                 | Free tier                             | Expected M2 usage                         | Est. monthly |
| ----------------------- | ------------------------------------- | ----------------------------------------- | ------------ |
| CloudFront              | 1 TB out + 10M requests (perpetual)   | well under                                | $0           |
| S3                      | 5 GB + 20k GET (12 mo)                | a few MB of assets                        | ~$0          |
| Lambda                  | 1M requests + 400k GB-s (perpetual)   | far under                                 | $0           |
| **Lambda Function URL** | n/a - no per-request charge           | all API traffic                           | **$0**       |
| DynamoDB on-demand      | 25 GB storage (perpetual)             | kilobytes; R/W billed per request         | ~$0          |
| CloudWatch              | 5 GB logs + 10 metrics + 3 dashboards | 14-day retention, two alarms              | ~$0          |
| SNS                     | 1,000 email notifications/mo          | budget + alarm mail                       | $0           |
| Budgets                 | first 2 budgets free                  | one $5 budget                             | $0           |
| Route 53                | none                                  | 1 hosted zone (only with a custom domain) | **$0.50**    |
| ACM                     | free                                  | 1 cert (only with a custom domain)        | $0           |

**Idle total: $0.00/month** on the free `*.cloudfront.net` domain. A custom
domain adds **$0.50/month** (the hosted zone) plus ~$12-15/year registration.

## Not using API Gateway

The earlier plan had an **API Gateway HTTP API** (free 12 months, then
$1.00/million requests). Replaced by a **Lambda Function URL** behind the same
CloudFront distribution (OAC + `AWS_IAM`): no per-request charge, one fewer
service. See ADR 0008. API Gateway stays a documented one-variable swap if real
throttling / WAF / custom authorizers are ever needed.

## Guardrails

- **AWS Budgets** alarm at `$5/mo`, notifications at 50% / 80% actual and 100%
  forecast (`modules/observability`).
- Lambda **reserved concurrency = 5**: a traffic spike or a loop bug cannot run
  up a compute bill. A `Throttles` alarm fires if the cap is hit.
- DynamoDB stays **on-demand** - no provisioned capacity to pay for while idle.
- CloudFront `PriceClass_100` (North America + Europe edges only).
- No NAT Gateway, no ALB, no RDS, no idle EC2/Fargate - the usual "why is my AWS
  bill $40" suspects are all absent by design.

## What would change the bill

- Real traffic in the millions/month -> DynamoDB request costs and Lambda
  compute above the free tier become pennies-to-dollars, still small.
- A custom domain -> +$0.50/mo (hosted zone).
- Switching the API to Fargate (always-on) -> ~$3-9/month for one small task.
  Kept as a documented option, not the default.
