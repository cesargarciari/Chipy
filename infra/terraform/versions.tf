terraform {
  required_version = ">= 1.9.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.70"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.6"
    }
  }

  # Partial config: the bucket / lock table are created by `bootstrap/` first,
  # then passed at init time so no account id is committed. Locally:
  #   terraform init -backend-config=backend.hcl
  # CI passes -backend-config flags from repo secrets.
  backend "s3" {
    key     = "chipy/terraform.tfstate"
    encrypt = true
  }
}
