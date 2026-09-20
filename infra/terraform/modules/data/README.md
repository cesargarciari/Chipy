# module: data

The DynamoDB single table (Milestone 2).

- `aws_dynamodb_table` on-demand (`PAY_PER_REQUEST`), key schema mirroring
  [`apps/api/src/db/table-schema.ts`](../../../../apps/api/src/db/table-schema.ts):
  `PK`/`SK` (S/S) + one GSI `gsi1` on `gsi1pk`/`gsi1sk`, projection `ALL`.
- Point-in-time recovery on by default.
- `deletion_protection_enabled` on by default (set `deletion_protection = false`
  to allow `terraform destroy`).
- TTL is **declared** on an `expiresAt` attribute but is a no-op: `saveCareer()`
  does not write that attribute today. It is here as a zero-cost lever if stored
  careers ever need to age out.

Outputs: `table_name`, `table_arn`.

Cost at idle: **~$0** (25 GB storage is always-free; requests are billed per
call and amount to fractions of a cent at portfolio traffic).
