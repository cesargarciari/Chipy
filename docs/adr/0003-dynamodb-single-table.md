# 3. DynamoDB single-table, accessed via the AWS SDK directly

Date: 2026-08-28

## Status

Accepted

## Context

Persistence needs: store a career document by id, list a month's top careers by
grade, and keep per-choice counters. That is three or four fixed access patterns
with no ad-hoc querying. The project also doubles as AWS Solutions Architect prep.

Options: DynamoDB on-demand; RDS PostgreSQL (t4g.micro, ~$12/mo after the 12-month
free tier, plus a VPC); Aurora Serverless v2 (~$40+/mo floor).

For the ODM layer: ElectroDB vs. the AWS SDK's `DynamoDBDocumentClient` directly.

## Decision

**DynamoDB on-demand**, one table with one GSI, accessed through
`@aws-sdk/lib-dynamodb` directly (no ODM). Key design in
`apps/api/src/db/keys.ts`; the `CreateTable` input in
`apps/api/src/db/table-schema.ts` is the single source shared by the local
script, the test helper, and (in M2) Terraform.

## Consequences

- Zero idle cost; nothing to pay for between playthroughs.
- Writing the `PK`/`SK`/`gsi1` scheme by hand is the point — it is the SA-exam
  skill and it stays visible in the code rather than hidden behind a library.
- No SQL, no joins, no migrations tool. New access patterns need deliberate key
  design (and possibly a new GSI), not just a new `WHERE` clause.
- The leaderboard sort key packs a zero-padded score so a `Query ... desc` with a
  `Limit` returns the top N without a scan.
