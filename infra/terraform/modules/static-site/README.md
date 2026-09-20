# module: static-site

The Vite build on S3 + CloudFront (Milestone 2).

- Private `aws_s3_bucket` (`BucketOwnerEnforced`, all public access blocked,
  SSE-S3). No website hosting - CloudFront reads it over OAC.
- One `aws_cloudfront_distribution`:
  - **default behaviour** -> S3 origin, `Managed-CachingOptimized`,
    `redirect-to-https`, compression.
  - **`/api/*`** -> the Lambda Function URL origin (`https-only`),
    `Managed-CachingDisabled` + `Managed-AllViewerExceptHostHeader`, all methods.
    So the browser calls the same origin and `VITE_API_URL` stays empty.
  - SPA fallback: S3 403/404 -> `/index.html` with `200`.
  - `PriceClass_100` (North America + Europe edges) - the cheapest tier.
  - CloudFront default certificate unless `domain_name` + `acm_certificate_arn`
    are set.
- Two `aws_cloudfront_origin_access_control` resources (`s3` + `lambda` types).
- `aws_s3_bucket_policy` and `aws_lambda_permission` both scope access to **this
  distribution's ARN only** (`AWS:SourceArn`), so neither the bucket nor the
  Function URL is reachable directly.

Inputs of note: `api_origin_domain` (`module.api.function_url_domain`),
`api_function_name` (`module.api.function_name`).

Outputs: `url`, `cloudfront_domain_name`, `distribution_id`, `distribution_arn`,
`bucket_name`.

Cost at idle: **~$0** (CloudFront free tier: 1 TB egress + 10M requests/mo,
perpetual; a few MB in S3).
