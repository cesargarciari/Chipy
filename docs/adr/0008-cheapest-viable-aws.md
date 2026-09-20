# 8. Cheapest viable AWS: static SPA + Lambda Function URL behind CloudFront

Date: 2026-09-08

## Status

Accepted (refines ADR 0002 and ADR 0004)

## Context

Milestone 2 puts Chipy on AWS. The brief: **cheapest that is still viable**, no
idle compute, and it should read as a competent Solutions Architect artifact.

What the app allows:

- The engine runs in the browser, so the site is playable with the API down.
- The API only backs save / share / leaderboard, and each call fails soft.
- No auth, no PII, low stakes, portfolio-level traffic.
- `apps/api/src/lambda.ts` already wraps the Fastify app with
  `@fastify/aws-lambda`; DynamoDB is on-demand; config is env-driven.

ADR 0004 assumed **API Gateway HTTP API** in front of the Lambda. Revisiting that
against "cheapest viable".

## Decision

| Concern     | Choice                                                                                                                                                                                                                  |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SPA         | **S3 (private) + CloudFront**, Origin Access Control. `PriceClass_100`.                                                                                                                                                 |
| API compute | **Lambda** `nodejs22.x`, `arm64`, 512 MB, reserved concurrency 5.                                                                                                                                                       |
| API edge    | **Lambda Function URL** (`AuthType = AWS_IAM`), **not API Gateway**. One CloudFront distribution routes `/api/*` to it via OAC + SigV4, so the browser is same-origin and the Function URL is not anonymously callable. |
| Data        | DynamoDB **on-demand**, single table, PITR on, TTL declared (unused).                                                                                                                                                   |
| Logs        | One CloudWatch log group, 14-day retention.                                                                                                                                                                             |
| Guardrails  | AWS Budgets alarm ($5, 50/80/100%), Lambda `Errors`/`Throttles` alarms, reserved concurrency as a hard cap.                                                                                                             |
| Bundle      | esbuild -> one ESM file; `@aws-sdk/*` and the dev-only `@fastify/swagger*` marked external. `server.ts` imports swagger lazily so the bundle drops it.                                                                  |
| IaC         | Terraform, module-per-concern, S3 remote state + DynamoDB lock (created by a one-time `bootstrap/`).                                                                                                                    |
| Deploy      | GitHub Actions via **OIDC** (no stored keys): `fmt`/`validate` on PRs, `apply` + `s3 sync` + CloudFront invalidation on `main`.                                                                                         |

### Why Function URL over API Gateway HTTP API

|                                  | API Gateway HTTP API                     | Lambda Function URL                  |
| -------------------------------- | ---------------------------------------- | ------------------------------------ |
| Request cost                     | free 12 months, then **$1.00 / million** | **$0, always** (Lambda compute only) |
| Services to manage               | one more (routes, stage, throttle)       | none                                 |
| Per-route throttling             | yes                                      | no                                   |
| Access logs                      | yes (extra CloudWatch cost if on)        | Lambda logs only                     |
| Same-origin via CloudFront + OAC | yes                                      | yes (Function URL OAC, GA Apr 2024)  |

For an unauthenticated, fails-soft API at this scale, API Gateway's authorizers /
usage plans / per-route throttling buy nothing. Function URL is strictly cheaper
and one fewer moving part.

## Consequences

- **Idle bill: $0.00** on the `*.cloudfront.net` domain; **$0.50/mo** only if a
  custom domain (Route 53 hosted zone) is added. Registration is separate.
- Lost vs API Gateway: edge throttling and structured access logs. Mitigated by
  Lambda reserved concurrency (a hard blast-radius cap), the Budgets alarm, the
  `Throttles` alarm, and CloudFront caching the GET routes if needed.
- Function URL + CloudFront OAC is newer and less-documented than API Gateway;
  the origin needs `Managed-AllViewerExceptHostHeader` and an
  `aws_lambda_permission` scoped to the distribution ARN.
- API Gateway remains a **documented one-variable swap** (see
  `modules/api/README.md`) if a hiring conversation wants to see it, or if real
  throttling / WAF / custom authorizers are ever needed.
- `lambda.ts` no longer calls `app.ready()` before `awsLambdaFastify(app)` (that
  triggered "decorator added after start"); the proxy readies the app on the
  first invocation.
- ADR 0004 stands: still Terraform, still OIDC, still module-per-concern. Only
  the `http-api` module becomes `api` and drops API Gateway.

**Update: a domain whose DNS is not in Route 53.** The custom-domain design
above assumed Route 53 hosts the zone. In practice a domain's root is often
already managed elsewhere (Cloudflare, a registrar's own DNS, Vercel) for an
unrelated site, and standing up a second Route 53 hosted zone just for a Chipy
subdomain costs $0.50/mo for no real benefit. `variables.tf` gains
`acm_certificate_arn`: when set, `main.tf` skips the `dns` module and Route 53
entirely and wires that pre-validated certificate straight into CloudFront. The
certificate is validated by hand once, with `aws acm request-certificate` /
`describe-certificate` / `wait certificate-validated`, by adding the DNS
validation CNAME at whichever provider hosts the zone; the final traffic route
(`domain_name` -> CloudFront) is one more manual CNAME, printed by the
`manual_dns_needed` output after `apply`. ACM auto-renews using the same
validation record, so once added it is never touched again. This path costs
**$0.00** (no Route 53 zone at all) versus Path A's $0.50/mo, at the cost of two
one-time manual DNS records instead of full automation.
