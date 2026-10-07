# The API on Lambda behind a Function URL. Only CloudFront can call it.

data "aws_iam_policy_document" "assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "lambda" {
  name               = "${var.name}-api"
  assume_role_policy = data.aws_iam_policy_document.assume.json
}

# Logs only. Other permissions are in the inline policy below.
resource "aws_iam_role_policy_attachment" "basic" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

data "aws_iam_policy_document" "dynamo" {
  statement {
    sid = "TableAndIndex"
    actions = [
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
      "dynamodb:Query",
    ]
    resources = [
      var.dynamodb_table_arn,
      "${var.dynamodb_table_arn}/index/*",
    ]
  }
}

resource "aws_iam_role_policy" "dynamo" {
  name   = "dynamodb-access"
  role   = aws_iam_role.lambda.id
  policy = data.aws_iam_policy_document.dynamo.json
}

# Create the log group here so retention is set.
resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${var.name}-api"
  retention_in_days = var.log_retention_days
}

resource "aws_lambda_function" "this" {
  function_name = "${var.name}-api"
  role          = aws_iam_role.lambda.arn

  filename         = var.lambda_zip_path
  source_code_hash = var.lambda_zip_hash
  handler          = "index.handler"
  runtime          = "nodejs22.x"
  architectures    = ["arm64"]

  memory_size = var.memory_size
  timeout     = var.timeout_seconds
  # 0 means no reserved concurrency. New AWS accounts often have too low a quota to reserve any.
  reserved_concurrent_executions = var.reserved_concurrency > 0 ? var.reserved_concurrency : null

  environment {
    variables = merge(
      {
        NODE_ENV       = "production"
        DYNAMODB_TABLE = var.dynamodb_table_name
        LOG_LEVEL      = var.log_level
      },
      # Optional, since same-origin requests through CloudFront don't need CORS.
      var.cors_origin == "" ? {} : { CORS_ORIGIN = var.cors_origin },
    )
  }

  depends_on = [
    aws_iam_role_policy_attachment.basic,
    aws_iam_role_policy.dynamo,
    aws_cloudwatch_log_group.lambda,
  ]
}

resource "aws_lambda_function_url" "this" {
  function_name      = aws_lambda_function.this.function_name
  authorization_type = "AWS_IAM"
  invoke_mode        = "BUFFERED"
}
