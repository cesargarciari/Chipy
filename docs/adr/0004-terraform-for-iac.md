# 4. Terraform for infrastructure as code

Date: 2026-08-28

## Status

Accepted

## Context

Milestone 2 provisions AWS (DynamoDB, Lambda, API Gateway, S3, CloudFront,
CloudWatch, Budgets). Options: Terraform, AWS CDK (TypeScript), SST.

## Decision

**Terraform.** Module-per-concern under `infra/terraform/modules/`, remote state
in S3 with a DynamoDB lock, `terraform plan` on PRs and `apply` on merge to
`main` via GitHub Actions using AWS **OIDC** (no long-lived keys).

## Consequences

- Most-requested IaC skill in Canadian job postings; cloud-agnostic knowledge.
- A second toolchain/language alongside the TypeScript app (CDK would have reused
  it). Accepted for the hiring signal and the explicit, reviewable plan output.
- CI needs an IAM role trust policy for the GitHub OIDC provider — set up once.
- The skeleton lives in the repo from Milestone 1 so M2 is "fill in modules",
  and `terraform validate` stays green in the meantime.
