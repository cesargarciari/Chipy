# Infrastructure (Terraform)

The cheapest viable AWS deployment for Chipy. **Idle cost: $0.00** (custom
domain: $0.00 if its DNS lives outside Route 53, $0.50/mo if Route 53 hosts the
zone). See [`../../docs/cost.md`](../../docs/cost.md) and
[ADR 0008](../../docs/adr/0008-cheapest-viable-aws.md).

```
                        ┌───────────── CloudFront (one distribution) ─────────────┐
   browser ── HTTPS ──▶ │  default  ─▶ S3 (private, OAC)      → the SPA           │
                        │  /api/*   ─▶ Lambda Function URL (OAC, AWS_IAM)         │
                        └────────────────────────────┬───────────────────────────┘
                                                     ▼
                                    Lambda (Fastify, nodejs22.x, arm64)
                                                     ▼
                                    DynamoDB (on-demand, single table)
```

No API Gateway, no ALB, no NAT, no idle compute. Guardrails: Lambda reserved
concurrency (5), an AWS Budgets alarm ($5), and CloudWatch alarms on Lambda
errors / throttles.

## Prerequisites

- Terraform ≥ 1.9 — `brew install terraform`
- AWS credentials with permission to create the resources below
- pnpm workspace installed (`pnpm install`)

## Layout

| Path                    | What                                                            |
| ----------------------- | --------------------------------------------------------------- |
| `bootstrap/`            | Run once: state bucket, lock table, GitHub OIDC + deploy role   |
| `modules/data`          | DynamoDB table (mirrors `apps/api/src/db/table-schema.ts`)      |
| `modules/api`           | Lambda + Function URL + IAM role + log group                    |
| `modules/static-site`   | S3 (private) + CloudFront (OAC for S3 **and** the Function URL) |
| `modules/observability` | Budgets alarm, SNS, Lambda error/throttle alarms                |
| `main.tf`               | Wires the four modules + zips the Lambda bundle                 |

## First-time setup

```bash
# 1. Bootstrap (local state, admin identity, once).
cd infra/terraform/bootstrap
terraform init && terraform apply -var 'github_repo=<owner>/<repo>'
terraform output                       # note the three values

# 2. Point the root module at the new backend.
cd ..
cp backend.hcl.example backend.hcl      # fill bucket + dynamodb_table
cp terraform.tfvars.example terraform.tfvars

# 3. Build the app artifacts, then apply.
pnpm --filter "@chipy/api..." build && pnpm --filter @chipy/api build:lambda
pnpm --filter "@chipy/web..." build
terraform init -backend-config=backend.hcl
terraform fmt -recursive && terraform validate
terraform apply

# 4. Upload the SPA.
aws s3 sync ../../apps/web/dist "s3://$(terraform output -raw site_bucket)" --delete
aws cloudfront create-invalidation \
  --distribution-id "$(terraform output -raw cloudfront_distribution_id)" --paths '/*'

open "$(terraform output -raw site_url)"
```

## CI deploys

`.github/workflows/deploy.yml`: on PRs it runs `terraform fmt -check` + `validate`
(no credentials). On `main` it assumes `AWS_DEPLOY_ROLE_ARN` via OIDC, builds the
Lambda bundle + SPA, runs `terraform apply`, then `s3 sync` + a CloudFront
invalidation. Repo secrets required: `AWS_DEPLOY_ROLE_ARN`, `TF_STATE_BUCKET`,
`TF_LOCK_TABLE` (all from `bootstrap` outputs).

## Key-schema parity

The `modules/data` table must match
[`apps/api/src/db/table-schema.ts`](../../apps/api/src/db/table-schema.ts)
exactly: `PK`/`SK` + `gsi1` on `gsi1pk`/`gsi1sk`, projection `ALL`, on-demand.

## Custom domain

Two paths, pick one (both end with `domain_name` set in `terraform.tfvars`).

**Path A - DNS hosted in Route 53.** Also set `route53_zone_id`. The `dns`
module creates a DNS-validated ACM cert in us-east-1, and `main.tf` adds the
A/AAAA alias records. The hosted zone must already exist with **live
nameservers** - either it was auto-created when you registered the domain in
Route 53, or you made it and pointed your registrar at its NS records. Verify
before applying: `dig NS yourdomain.com +short` should list `awsdns-*.*`. This
path costs an extra **$0.50/mo** (the hosted zone).

**Path B - DNS hosted elsewhere (Cloudflare, Namecheap, Vercel, ...).** Set
`acm_certificate_arn` instead of `route53_zone_id`; Terraform then never touches
Route 53 for this domain, so there's no extra hosted zone and no extra cost.
You validate the cert yourself first:

```bash
aws acm request-certificate --domain-name chipy.yourdomain.com \
  --validation-method DNS --region us-east-1
# -> note the CertificateArn

aws acm describe-certificate --region us-east-1 --certificate-arn <arn> \
  --query 'Certificate.DomainValidationOptions[0].ResourceRecord'
# -> add this as a CNAME at your DNS provider (DNS-only / not proxied)

aws acm wait certificate-validated --region us-east-1 --certificate-arn <arn>
```

Then set `domain_name` + `acm_certificate_arn = "<arn>"` and `terraform apply`.
After it finishes, `terraform output manual_dns_needed` gives you one more
record to add - the actual traffic route, `domain_name` -> CloudFront.

Leaving `domain_name` empty serves on the free `*.cloudfront.net` URL.

## Tear down

```bash
terraform destroy -var 'deletion_protection=false' -var 'site_bucket_force_destroy=true'
# then, if you want the backend gone too:
cd bootstrap && terraform destroy
```
