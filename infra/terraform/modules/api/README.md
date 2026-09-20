# module: api

The Fastify app on Lambda (Milestone 2). **No API Gateway** - a Lambda Function
URL, reachable only through CloudFront.

- `aws_lambda_function` - `nodejs22.x`, `arm64`, handler `index.handler`, from the
  esbuild bundle (`pnpm --filter @chipy/api build:lambda` -> `apps/api/dist-lambda/`,
  zipped by `data.archive_file` in the root module).
- `aws_lambda_function_url` - `authorization_type = "AWS_IAM"`, so it is not
  callable anonymously. The `static-site` module attaches an
  `aws_lambda_permission` letting _only_ its CloudFront distribution invoke it
  (Origin Access Control, SigV4).
- IAM execution role: `AWSLambdaBasicExecutionRole` (logs) + an inline policy for
  `GetItem`/`PutItem`/`UpdateItem`/`Query` on the table and `…/index/*` only.
- `aws_cloudwatch_log_group` with `retention_in_days` (a Lambda-created group
  never expires).
- `reserved_concurrent_executions` (default 5): a hard cap so a loop bug or a bot
  cannot run up a bill. A `Throttles` alarm in `observability` fires if it's hit.

Env: `NODE_ENV=production`, `DYNAMODB_TABLE`, `LOG_LEVEL`, optional `CORS_ORIGIN`.
`AWS_REGION` is set by the runtime and must not be passed. `DYNAMODB_ENDPOINT` is
left unset so the real service is used.

Outputs: `function_name`, `function_arn`, `function_url`, `function_url_domain`.

Cost at idle: **~$0** (Lambda free tier is 1M requests + 400k GB-s, perpetual;
Function URLs add no per-request charge).

## Why not API Gateway HTTP API

It bills $1.00/million requests after the 12-month free tier and adds a service
to manage. Its throttling / usage plans / authorizers buy nothing for an
unauthenticated, fails-soft API. To switch back: put an `aws_apigatewayv2_api`
(`protocol_type = "HTTP"`) with a `$default`route +`AWS_PROXY`integration in
front of the function, drop the Function URL, and point CloudFront's`/api/*`
origin at the API's invoke domain.
