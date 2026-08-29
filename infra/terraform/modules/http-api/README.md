# module: http-api

Milestone 2. The Fastify app on Lambda:

- Lambda function from `apps/api` (zip or container image), handler `lambda.handler`
- API Gateway **HTTP API** (cheaper than REST API) with a `$default` route
- IAM execution role: least-privilege access to the `chipy` table + its `gsi1`
  (GetItem / PutItem / UpdateItem / Query), plus CloudWatch Logs
- Log group with 14-day retention
- Env: `DYNAMODB_TABLE`, `AWS_REGION`, `CORS_ORIGIN`, `NODE_ENV=production`
  (no `DYNAMODB_ENDPOINT` — uses the real service)
- Reserved concurrency cap to bound cost

Outputs: `function_name`, `invoke_url`, `invoke_domain`.
