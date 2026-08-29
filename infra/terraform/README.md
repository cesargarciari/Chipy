# Infrastructure (Terraform)

> **Milestone 1 status: skeleton only.** Nothing here is applied yet. The local
> app runs entirely on `docker compose` (DynamoDB Local). This directory exists
> so Milestone 2 is "fill in the modules", not "design the infra".

## Prerequisites (for Milestone 2)

- Terraform CLI ≥ 1.9 — `brew install terraform` (or `tfenv`)
- An AWS account + `aws configure sso` / credentials with permission to create
  the resources below
- A registered domain (optional; CloudFront gives you a `*.cloudfront.net` URL
  for free)

## Planned layout

| Module                  | Resources                                                           | Est. cost at idle       |
| ----------------------- | ------------------------------------------------------------------- | ----------------------- |
| `modules/data`          | DynamoDB table `chipy` (on-demand) + `gsi1`, point-in-time recovery | ~$0                     |
| `modules/http-api`      | Lambda (from `apps/api`), API Gateway HTTP API, IAM role, log group | ~$0                     |
| `modules/static-site`   | S3 bucket (private) + CloudFront (OAC), ACM cert, Route53 records   | ~$0.50/mo (hosted zone) |
| `modules/observability` | CloudWatch dashboard, alarms → SNS, **AWS Budgets** alarm           | ~$0                     |

Remote state: S3 bucket + DynamoDB lock table, created once by a bootstrap step,
then referenced in `backend.tf`.

Deploy path (Milestone 2): GitHub Actions assumes an AWS role via **OIDC** (no
long-lived keys), runs `terraform plan` on PRs and `terraform apply` on merge to
`main`, then uploads the built web assets to S3 and publishes the Lambda.

## Key-schema parity

The real DynamoDB table must match `apps/api/src/db/table-schema.ts` exactly
(PK/SK + `gsi1` on `gsi1pk`/`gsi1sk`, projection ALL).
