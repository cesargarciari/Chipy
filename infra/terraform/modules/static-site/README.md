# module: static-site

Milestone 2. The Vite build on S3 + CloudFront:

- Private S3 bucket (no public access) holding `apps/web/dist`
- CloudFront distribution with Origin Access Control (OAC) to the bucket
- SPA behaviour: 403/404 → `/index.html` (200)
- `/api/*` behaviour forwarded to the HTTP API origin (so the browser calls the
  same origin and `VITE_API_URL` can be empty)
- ACM certificate (in `us-east-1`) + Route53 alias records when `domain_name` is set
- Long cache TTL for `/assets/*`, short for `index.html`

Outputs: `url`, `distribution_id`, `bucket_name`.
