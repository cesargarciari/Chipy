provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# CloudFront + ACM for the site certificate must live in us-east-1.
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = {
      Project     = var.project
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

locals {
  name = "${var.project}-${var.environment}"
}

# ---------------------------------------------------------------------------
# Milestone 2 wires these up. Left commented so `terraform validate` stays
# green on the skeleton.
# ---------------------------------------------------------------------------

# module "data" {
#   source  = "./modules/data"
#   name    = local.name
# }

# module "http_api" {
#   source         = "./modules/http-api"
#   name           = local.name
#   dynamodb_table = module.data.table_name
#   dynamodb_arn   = module.data.table_arn
# }

# module "static_site" {
#   source      = "./modules/static-site"
#   providers   = { aws.us_east_1 = aws.us_east_1 }
#   name        = local.name
#   domain_name = var.domain_name
#   api_domain  = module.http_api.invoke_domain
# }

# module "observability" {
#   source             = "./modules/observability"
#   name               = local.name
#   monthly_budget_usd = var.monthly_budget_usd
#   lambda_name        = module.http_api.function_name
# }
