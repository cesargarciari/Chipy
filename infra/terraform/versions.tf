terraform {
  required_version = ">= 1.9.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.70"
    }
  }

  # Milestone 2: create the state bucket + lock table once, then uncomment.
  # backend "s3" {
  #   bucket         = "chipy-tfstate-<account-id>"
  #   key            = "chipy/terraform.tfstate"
  #   region         = "ca-central-1"
  #   dynamodb_table = "chipy-tflock"
  #   encrypt        = true
  # }
}
