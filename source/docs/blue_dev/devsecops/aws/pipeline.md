# Basis for a secure AWS deployment pipeline

This pipeline provides a basis for a security-focused deployment process for Dockerized applications on AWS in Europe, 
with infrastructure as code, automated security scanning, and compliance with GDPR requirements.

## Architecture overview

Developer → AWS CodeCommit → AWS CodeBuild (CI) → 
Amazon ECR (Container Registry) → Amazon ECS Fargate (Staging/Prod) → 
AWS WAF + CloudFront → Amazon CloudWatch + GuardDuty

All resources deployed in eu-west-1 (Ireland) with GDPR compliance.

## Prerequisites

* AWS account with admin permissions
* AWS CLI v2 installed and configured
* Docker installed locally
* Git installed
* Terraform v1.3+ (for infrastructure as code)

## AWS infrastructure setup

### Configure AWS organizations SCPs (If available)

```bash
# Example SCP to enforce EU region deployment
cat > eu-scp.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyNonEURegions",
      "Effect": "Deny",
      "Action": "*",
      "Resource": "*",
      "Condition": {
        "StringNotEquals": {
          "aws:RequestedRegion": [
            "eu-west-1",
            "eu-west-2",
            "eu-west-3",
            "eu-north-1",
            "eu-central-1",
            "eu-south-1"
          ]
        }
      }
    }
  ]
}
EOF

aws organizations create-policy \
  --name "EU-Deployment-Restriction" \
  --description "Restrict deployments to EU regions only" \
  --content file://eu-scp.json \
  --type SERVICE_CONTROL_POLICY
```

### Set up base infrastructure with Terraform

Create `main.tf` for foundational infrastructure:

```
terraform {
  required_version = ">= 1.3.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.55" # Latest stable as of 2023
    }
  }
}

provider "aws" {
  region = "eu-west-1"
  default_tags {
    tags = {
      Environment     = "Shared"
      SecurityScheme  = "Tiered"
      DataClassification = "Confidential"
      Compliance     = "GDPR"
    }
  }
}

# Create separate VPC for each environment
module "vpc_prod" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 3.0"

  name = "prod-vpc"
  cidr = "10.10.0.0/16"
  azs  = ["eu-west-1a", "eu-west-1b", "eu-west-1c"]

  private_subnets = ["10.10.1.0/24", "10.10.2.0/24", "10.10.3.0/24"]
  public_subnets  = ["10.10.101.0/24", "10.10.102.0/24", "10.10.103.0/24"]

  enable_nat_gateway = true
  single_nat_gateway = false # High availability

  # Flow logs for security monitoring
  enable_flow_log                      = true
  create_flow_log_cloudwatch_log_group = true
  create_flow_log_cloudwatch_iam_role  = true
  flow_log_max_aggregation_interval    = 60
}

module "vpc_staging" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 3.0"

  name = "staging-vpc"
  cidr = "10.20.0.0/16"
  azs  = ["eu-west-1a", "eu-west-1b"]

  private_subnets = ["10.20.1.0/24", "10.20.2.0/24"]
  public_subnets  = ["10.20.101.0/24", "10.20.102.0/24"]

  enable_nat_gateway = true
  single_nat_gateway = true # Cost optimization for staging

  enable_flow_log = true
}

# ECR Repositories with image scanning
resource "aws_ecr_repository" "app" {
  name                 = "secure-app"
  image_tag_mutability = "IMMUTABLE" # Prevent tag overwrites

  image_scanning_configuration {
    scan_on_push = true # Automatic vulnerability scanning
  }

  encryption_configuration {
    encryption_type = "KMS" # Use AWS KMS for encryption
  }
}

# ECS Cluster with Fargate
resource "aws_ecs_cluster" "prod" {
  name = "prod-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  configuration {
    execute_command_configuration {
      logging = "OVERRIDE"
      log_configuration {
        cloud_watch_log_group_name = aws_cloudwatch_log_group.ecs_command.name
      }
    }
  }
}

resource "aws_cloudwatch_log_group" "ecs_command" {
  name              = "/aws/ecs/exec"
  retention_in_days = 365
  kms_key_id        = aws_kms_key.logs.arn
}
```

## CI/CD pipeline configuration

AWS CodePipeline Setup

Create `pipeline.tf`:

```
# CodeBuild IAM Role with least privilege
resource "aws_iam_role" "codebuild" {
  name = "codebuild-secure-app-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "codebuild.amazonaws.com"
        }
      }
    ]
  })

  # Permissions boundary for additional safety
  permissions_boundary = aws_iam_policy.codebuild_boundary.arn
}

resource "aws_iam_policy" "codebuild_boundary" {
  name        = "CodeBuildPermissionsBoundary"
  description = "Restrict CodeBuild to minimal required permissions"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Deny"
        Action   = "*"
        Resource = "*"
        Condition = {
          StringNotEquals = {
            "aws:RequestedRegion" = "eu-west-1"
          }
        }
      },
      {
        Effect   = "Deny"
        Action   = [
          "iam:*",
          "organizations:*",
          "account:*"
        ]
        Resource = "*"
      }
    ]
  })
}

# CodeBuild project for CI
resource "aws_codebuild_project" "secure_app_ci" {
  name          = "secure-app-ci"
  description   = "CI pipeline for secure app with security scanning"
  service_role  = aws_iam_role.codebuild.arn
  build_timeout = 10

  artifacts {
    type = "NO_ARTIFACTS"
  }

  environment {
    compute_type                = "BUILD_GENERAL1_MEDIUM"
    image                       = "aws/codebuild/standard:6.0" # Latest as of 2023
    type                        = "LINUX_CONTAINER"
    image_pull_credentials_type = "CODEBUILD"
    privileged_mode             = true # Required for Docker

    environment_variable {
      name  = "ECR_REPO"
      value = aws_ecr_repository.app.repository_url
    }

    environment_variable {
      name  = "AWS_ACCOUNT_ID"
      value = data.aws_caller_identity.current.account_id
    }
  }

  source {
    type            = "CODECOMMIT"
    location        = aws_codecommit_repository.secure_app.clone_url_http
    git_clone_depth = 1
    buildspec       = <<EOF
version: 0.2

phases:
  pre_build:
    commands:
      - echo Logging in to Amazon ECR...
      - aws ecr get-login-password --region eu-west-1 | docker login --username AWS --password-stdin ${aws_ecr_repository.app.repository_url}
      - docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image --download-db-only
  build:
    commands:
      - echo Build started on `date`
      - echo Building the Docker image...
      - docker build -t $ECR_REPO:latest .
      - docker tag $ECR_REPO:latest $ECR_REPO:$CODEBUILD_RESOLVED_SOURCE_VERSION
      - echo Running vulnerability scan...
      - docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image --exit-code 1 --severity CRITICAL $ECR_REPO:latest
      - echo Scanning for secrets in code...
      - docker run --rm -v $PWD:/src ghcr.io/gitleaks/gitleaks:latest detect --source="/src" --verbose --redact
  post_build:
    commands:
      - echo Build completed on `date`
      - echo Pushing the Docker images...
      - docker push $ECR_REPO:latest
      - docker push $ECR_REPO:$CODEBUILD_RESOLVED_SOURCE_VERSION
      - echo Writing image definitions file...
      - printf '[{"name":"secure-app","imageUri":"%s"}]' $ECR_REPO:$CODEBUILD_RESOLVED_SOURCE_VERSION > imagedefinitions.json
artifacts:
  files: imagedefinitions.json
EOF
  }

  logs_config {
    cloudwatch_logs {
      group_name  = "/aws/codebuild/secure-app-ci"
      stream_name = "build-log"
    }
  }
}

# Pipeline for staging deployment
resource "aws_codepipeline" "staging" {
  name     = "secure-app-staging"
  role_arn = aws_iam_role.codepipeline.arn

  artifact_store {
    location = aws_s3_bucket.artifacts.bucket
    type     = "S3"
  }

  stage {
    name = "Source"
    action {
      name             = "Source"
      category         = "Source"
      owner            = "AWS"
      provider         = "CodeCommit"
      version          = "1"
      output_artifacts = ["source_output"]

      configuration = {
        RepositoryName = aws_codecommit_repository.secure_app.repository_name
        BranchName     = "staging"
      }
    }
  }

  stage {
    name = "Build"
    action {
      name             = "Build"
      category         = "Build"
      owner            = "AWS"
      provider         = "CodeBuild"
      input_artifacts  = ["source_output"]
      output_artifacts = ["build_output"]
      version          = "1"

      configuration = {
        ProjectName = aws_codebuild_project.secure_app_ci.name
      }
    }
  }

  stage {
    name = "DeployToStaging"
    action {
      name            = "Deploy"
      category        = "Deploy"
      owner           = "AWS"
      provider        = "ECS"
      input_artifacts = ["build_output"]
      version         = "1"

      configuration = {
        ClusterName = aws_ecs_cluster.staging.name
        ServiceName = aws_ecs_service.staging.name
        FileName    = "imagedefinitions.json"
      }
    }
  }
}
```

## Security hardening

### Network security

```
# Web Application Firewall (WAF)
resource "aws_wafv2_web_acl" "app" {
  name        = "secure-app-acl"
  scope       = "REGIONAL"
  description = "WAF for secure app with OWASP Top 10 rules"

  default_action {
    allow {}
  }

  rule {
    name     = "AWS-AWSManagedRulesCommonRuleSet"
    priority = 1

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRulesCommonRuleSet"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "RateLimit"
    priority = 2

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 1000
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimit"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "secure-app-waf"
    sampled_requests_enabled   = true
  }
}

# Associate WAF with ALB
resource "aws_wafv2_web_acl_association" "app" {
  resource_arn = aws_lb.app.arn
  web_acl_arn  = aws_wafv2_web_acl.app.arn
}

# Security Groups
resource "aws_security_group" "app" {
  name        = "secure-app-sg"
  description = "Allow HTTPS inbound and restrict outbound"
  vpc_id      = module.vpc_prod.vpc_id

  ingress {
    description      = "HTTPS from ALB"
    from_port        = 443
    to_port          = 443
    protocol         = "tcp"
    security_groups  = [aws_security_group.alb.id]
  }

  egress {
    description      = "Outbound to ECR and CloudWatch"
    from_port        = 443
    to_port          = 443
    protocol         = "tcp"
    prefix_list_ids  = [
      data.aws_ec2_managed_prefix_list.s3.id,
      data.aws_ec2_managed_prefix_list.ecr.id
    ]
  }

  tags = {
    Name = "secure-app-sg"
  }
}
```

### IAM and secrets management

```
# KMS for encryption
resource "aws_kms_key" "secrets" {
  description             = "KMS key for app secrets"
  enable_key_rotation    = true
  deletion_window_in_days = 30
  policy = data.aws_iam_policy_document.kms_policy.json
}

# Secrets Manager for credentials
resource "aws_secretsmanager_secret" "db_credentials" {
  name        = "prod/db/credentials"
  description = "Database credentials for production"
  kms_key_id = aws_kms_key.secrets.arn

  recovery_window_in_days = 7 # Minimum for immediate deletion

  replica {
    region = "eu-west-2" # Secondary EU region for DR
  }
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id     = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username = "app_user"
    password = "initial-password" # Rotate immediately after creation
  })
}

# IAM Policy for ECS Task
data "aws_iam_policy_document" "ecs_task" {
  statement {
    effect = "Allow"
    actions = [
      "secretsmanager:GetSecretValue",
      "kms:Decrypt"
    ]
    resources = [
      aws_secretsmanager_secret.db_credentials.arn,
      aws_kms_key.secrets.arn
    ]
  }

  statement {
    effect = "Allow"
    actions = [
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = ["*"]
  }
}
```

## Monitoring and maintenance

### CloudWatch alarms and dashboards

```
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "secure-app-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ECS CPU utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    ClusterName = aws_ecs_cluster.prod.name
    ServiceName = aws_ecs_service.prod.name
  }
}

resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "secure-app-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/ECS", "CPUUtilization", "ClusterName", aws_ecs_cluster.prod.name, "ServiceName", aws_ecs_service.prod.name],
            [".", "MemoryUtilization", ".", ".", ".", "."]
          ]
          period = 300
          stat   = "Average"
          region = "eu-west-1"
          title  = "ECS Service Metrics"
        }
      }
    ]
  })
}
```

### AWS GuardDuty and Inspector

```
resource "aws_guardduty_detector" "primary" {
  enable = true

  datasources {
    s3_logs {
      enable = true
    }
    kubernetes {
      audit_logs {
        enable = true
      }
    }
    malware_protection {
      scan_ec2_instance_with_findings {
        ebs_volumes {
          enable = true
        }
      }
    }
  }
}

resource "aws_inspector2_enabler" "example" {
  account_ids    = [data.aws_caller_identity.current.account_id]
  resource_types = ["ECR", "EC2"]
}
```

## Code example

For ECS task definition with security best practices, create a `task-definition.json`:

```json
{
  "family": "secure-app",
  "executionRoleArn": "arn:aws:iam::ACCOUNT_ID:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::ACCOUNT_ID:role/secure-app-task-role",
  "networkMode": "awsvpc",
  "cpu": "1024",
  "memory": "2048",
  "requiresCompatibilities": ["FARGATE"],
  "runtimePlatform": {
    "cpuArchitecture": "X86_64",
    "operatingSystemFamily": "LINUX"
  },
  "containerDefinitions": [
    {
      "name": "secure-app",
      "image": "ACCOUNT_ID.dkr.ecr.eu-west-1.amazonaws.com/secure-app:latest",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 8080,
          "hostPort": 8080,
          "protocol": "tcp"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/secure-app",
          "awslogs-region": "eu-west-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "secrets": [
        {
          "name": "DB_PASSWORD",
          "valueFrom": "arn:aws:secretsmanager:eu-west-1:ACCOUNT_ID:secret:prod/db/credentials:password::"
        }
      ],
      "linuxParameters": {
        "initProcessEnabled": true,
        "sharedMemorySize": 256,
        "capabilities": {
          "drop": ["ALL"]
        },
        "maxSwap": 512,
        "swappiness": 60
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:8080/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

## CI/CD pipeline security checklist

* All infrastructure deployed in EU region (eu-west-1)
* Immutable container tags in ECR
* Automated vulnerability scanning in CI pipeline
* Secret scanning in code (Gitleaks)
* Least privilege IAM roles for CodeBuild/CodePipeline
* WAF with OWASP rules enabled
* Encrypted secrets with KMS and rotation
* Network isolation with VPC and security groups
* Container runtime security (no root, dropped capabilities)
* Comprehensive monitoring with CloudWatch and GuardDuty

