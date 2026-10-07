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

  # Backend settings come from bootstrap/ at init time, so no account id is committed:
  #   terraform init -backend-config=backend.hcl
  backend "s3" {
    key     = "chipy/terraform.tfstate"
    encrypt = true
  }
}
