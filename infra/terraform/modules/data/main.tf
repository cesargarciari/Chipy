# DynamoDB single table. Mirrors apps/api/src/db/table-schema.ts exactly:
# PK/SK (S/S), one GSI `gsi1` on gsi1pk/gsi1sk projecting ALL, on-demand billing.
resource "aws_dynamodb_table" "this" {
  name         = var.name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "PK"
  range_key    = "SK"

  attribute {
    name = "PK"
    type = "S"
  }
  attribute {
    name = "SK"
    type = "S"
  }
  attribute {
    name = "gsi1pk"
    type = "S"
  }
  attribute {
    name = "gsi1sk"
    type = "S"
  }

  global_secondary_index {
    name            = "gsi1"
    hash_key        = "gsi1pk"
    range_key       = "gsi1sk"
    projection_type = "ALL"
  }

  # Free lever: the app does not write `expiresAt` today, so this is a no-op
  # until saveCareer() sets one. Flip it on there if stored careers ever need
  # to age out (keeps storage flat forever at zero cost).
  ttl {
    attribute_name = "expiresAt"
    enabled        = true
  }

  point_in_time_recovery {
    enabled = var.point_in_time_recovery
  }

  deletion_protection_enabled = var.deletion_protection
}
