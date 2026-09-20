# bootstrap

Run **once**, by hand, with an admin identity, before the root module exists.
It creates the things the root module's backend and CI need:

| Resource                          | Purpose                                  |
| --------------------------------- | ---------------------------------------- |
| `chipy-tfstate-<account-id>` (S3) | Terraform remote state (versioned, SSE)  |
| `chipy-tflock` (DynamoDB)         | State lock                               |
| GitHub OIDC provider              | Lets Actions assume a role with no keys  |
| `chipy-github-deploy` (IAM role)  | What CI assumes to run `terraform apply` |

```bash
cd infra/terraform/bootstrap
terraform init
terraform apply -var 'github_repo=<owner>/<repo>'   # e.g. cesargarciari/Chipy
terraform output
```

Then:

1. `cp ../backend.hcl.example ../backend.hcl` and set `bucket` + `dynamodb_table`
   from the outputs.
2. Add three **GitHub repository secrets**:
   `AWS_DEPLOY_ROLE_ARN`, `TF_STATE_BUCKET`, `TF_LOCK_TABLE`.

Bootstrap state stays **local** (it is what creates remote state). Keep
`bootstrap/terraform.tfstate` on your machine or just re-run - it is idempotent.

The deploy role's policy is broad _by service_ on purpose (a Terraform deploy
role touches many APIs). Tighten `resources` once the resource set stops moving.
