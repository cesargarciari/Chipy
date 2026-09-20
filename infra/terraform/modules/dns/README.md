# module: dns

Only used when `domain_name` is set. Gives the site a custom domain with HTTPS.

- `aws_acm_certificate` (DNS-validated) in **us-east-1** - CloudFront reads its
  cert there regardless of the site's region.
- `aws_route53_record` validation records + `aws_acm_certificate_validation`
  (blocks until the cert is issued).
- The hosted zone: pass `route53_zone_id` for one that already exists with live
  nameservers (the common case). Leave it empty and Terraform creates the zone -
  but then validation hangs until you point the registrar at the new
  nameservers, so a two-step apply is needed.

The apex/subdomain **A/AAAA alias records** that point the domain at CloudFront
live in the root `main.tf` (they need the distribution, which needs this cert -
so the alias records come after both).

Outputs: `certificate_arn`, `zone_id`, `nameservers`.

Cost: ACM certs are free. A Route 53 hosted zone is **$0.50/month**. Domain
registration (~$12-15/year) is billed by whoever you register with.
