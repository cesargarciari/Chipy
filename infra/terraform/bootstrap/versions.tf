terraform {
  required_version = ">= 1.9.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.70"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
  }

  # Bootstrap uses LOCAL state on purpose - it creates the remote backend that
  # everything else uses. Commit bootstrap/terraform.tfstate is NOT wanted; keep
  # it on the machine that ran it (or re-run it, it's idempotent).
}
