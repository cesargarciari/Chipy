# Custom domain: an ACM certificate (in us-east-1, where CloudFront reads certs)
# validated via DNS records in a Route 53 hosted zone. The zone must already
# exist with its nameservers live at your registrar - pass its id as
# `route53_zone_id`. (If you leave it empty Terraform creates the zone, but then
# ACM validation hangs until you point the registrar at it, so prefer passing
# an id.)

terraform {
  required_providers {
    aws = {
      source                = "hashicorp/aws"
      configuration_aliases = [aws.us_east_1]
    }
  }
}

locals {
  create_zone = var.route53_zone_id == ""
}

resource "aws_route53_zone" "this" {
  count = local.create_zone ? 1 : 0
  name  = var.domain_name
}

data "aws_route53_zone" "existing" {
  count   = local.create_zone ? 0 : 1
  zone_id = var.route53_zone_id
}

locals {
  zone_id = local.create_zone ? aws_route53_zone.this[0].zone_id : data.aws_route53_zone.existing[0].zone_id
}

resource "aws_acm_certificate" "this" {
  provider          = aws.us_east_1
  domain_name       = var.domain_name
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "validation" {
  for_each = {
    for dvo in aws_acm_certificate.this.domain_validation_options :
    dvo.domain_name => {
      name   = dvo.resource_record_name
      type   = dvo.resource_record_type
      record = dvo.resource_record_value
    }
  }

  zone_id         = local.zone_id
  name            = each.value.name
  type            = each.value.type
  records         = [each.value.record]
  ttl             = 60
  allow_overwrite = true
}

resource "aws_acm_certificate_validation" "this" {
  provider                = aws.us_east_1
  certificate_arn         = aws_acm_certificate.this.arn
  validation_record_fqdns = [for r in aws_route53_record.validation : r.fqdn]
}
