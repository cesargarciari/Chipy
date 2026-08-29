# module: data

Milestone 2. Creates the DynamoDB table `chipy`:

- Billing mode `PAY_PER_REQUEST` (on-demand — no idle cost)
- Keys: `PK` (HASH), `SK` (RANGE)
- GSI `gsi1`: `gsi1pk` (HASH), `gsi1sk` (RANGE), projection `ALL`
- Point-in-time recovery enabled
- `deletion_protection_enabled = true` in prod

Must stay identical to `apps/api/src/db/table-schema.ts`.

Outputs: `table_name`, `table_arn`.
