# CI/CD trên AWS – Hướng dẫn thiết lập

**→ Bạn mới bắt đầu?** Xem **[Làm gì tiếp theo – Cấu hình AWS từ đâu](./AWS-NEXT-STEPS.md)**.  
Bạn chọn triển khai **Terraform + EC2** (không dùng ECS/ALB), nên chỉ cần: **ECR → RDS (tạo tay) → GitHub Secrets → Run workflow**.

---

Dự án hỗ trợ hai hướng CI/CD trên AWS:

1. **GitHub Actions** → build/test → Docker → **ECR** → **ECS** (khuyến nghị, dễ bắt đầu).
2. **AWS CodePipeline** + **CodeBuild** → ECR → ECS (100% trên AWS).

---

## 1. Kiến trúc tổng quan

```
GitHub Actions (chạy tay: Run workflow)
    │
    ├── [CI] ci.yml
    │         → dotnet restore, build, test
    │
    ├── [Full Deploy] aws-ec2-full.yml  ← Terraform apply EC2 + push ECR + chạy container
    │         → Build Docker → Push ECR
    │         → Terraform apply (EC2 user-data chạy docker compose: API + Redis)
    │         → Swagger: http://<EC2_PUBLIC_DNS>/swagger
    │
    └── [Destroy] aws-ec2-destroy.yml  ← Terraform destroy EC2 (GIỮ LẠI RDS)
              → RDS không bị xóa
```

---

## 2. Chuẩn bị trên AWS (EC2)

### 2.1. Tạo ECR repository

```bash
aws ecr create-repository \
  --repository-name logaicams-api \
  --region ap-southeast-1 \
  --image-scanning-configuration scanOnPush=true
```

Ghi nhớ **URI** (ví dụ: `123456789012.dkr.ecr.ap-southeast-1.amazonaws.com/logaicams-api`).

### 2.2. Tạo RDS PostgreSQL (tạo tay, giữ khi Destroy)

Bạn tạo RDS thủ công và đưa connection string vào GitHub Secrets:
- `DB_CONNECTION_STRING`
- `OUTER_DB_CONNECTION_STRING`

EC2 sẽ chạy API + Redis bằng Docker Compose, không cần PostgreSQL local.

---

## 3. Cấu hình GitHub

### 3.1. Cách 1: Dùng AWS Access Key (đơn giản)

Vào **GitHub repo** → Settings → Secrets and variables → Actions:

| Secret / Variable | Mô tả |
|-------------------|--------|
| `AWS_ACCESS_KEY_ID` | IAM user có quyền ECR push, ECS update-service |
| `AWS_SECRET_ACCESS_KEY` | Secret key tương ứng |
| `AWS_REGION` (variable) | Ví dụ: `ap-southeast-1` |
| `ECR_REPOSITORY` (variable) | Tên ECR repo, ví dụ: `logaicams-api` |
| `EC2_INSTANCE_TYPE` (variable, optional) | Ví dụ: `t3.small` |
| `EC2_SSH_KEY_NAME` (variable, optional) | KeyPair name nếu muốn SSH |
| `FIRESTORE_ENABLED` (variable, optional) | `true/false` |
| `AwsCdn__CloudFrontDomain` (variable, optional) | CDN domain |
| `MediaConvert__Endpoint` (variable, optional) | MediaConvert endpoint |
| `TF_STATE_BUCKET` (variable, recommended) | S3 bucket lưu Terraform state |
| `TF_STATE_DDB_TABLE` (variable, recommended) | DynamoDB table cho state lock |
| `TF_STATE_KEY` (variable, optional) | Key path cho tfstate (default: `logaicams/terraform/ec2.tfstate`) |

**IAM policy tối thiểu** (cho user dùng trong GitHub):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload"
      ],
      "Resource": "arn:aws:ecr:ap-southeast-1:ACCOUNT_ID:repository/logaicams-api"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ecs:UpdateService",
        "ecs:DescribeServices"
      ],
      "Resource": "*"
    }
  ]
}
```

### 3.2. Cách 2: OIDC (không lưu Access Key trên GitHub)

1. Trong **IAM** tạo IdP cho GitHub:
   - Provider: OpenID Connect
   - URL: `https://token.actions.githubusercontent.com`
   - Audience: `sts.amazonaws.com`

2. Tạo role IAM (Trust policy cho `token.actions.githubusercontent.com`, repo của bạn).

3. Trong GitHub → **Variables**:
   - `AWS_ROLE_ARN`: ARN của role vừa tạo.
   - Các biến còn lại giống bảng trên (không cần `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`).

Workflow `cd-aws.yml` đã hỗ trợ cả hai: ưu tiên OIDC nếu có `AWS_ROLE_ARN`, không thì dùng Access Key.

---

## 4. Khi nào CI/CD chạy (manual)

Tất cả workflow **chỉ chạy khi bấm "Run workflow"** trong tab Actions:

- **CI** (`ci.yml`): chọn branch → build + test .NET.
- **Full Deploy (EC2)** (`aws-ec2-full.yml`): chọn branch → build Docker → push ECR → `terraform apply` dựng EC2 và chạy API/Redis. Swagger: `http://<EC2_PUBLIC_DNS>/swagger`.
- **Destroy (EC2)** (`aws-ec2-destroy.yml`): gõ đúng `destroy` → `terraform destroy` EC2/SG/IAM profile. **RDS không bị xóa.**

---

## 5. Dùng 100% AWS (CodePipeline + CodeBuild)

1. **CodeBuild** → Create project:
   - Source: GitHub (hoặc CodeCommit), chọn repo và branch.
   - Environment: Managed image, Linux, Docker.
   - Buildspec: dùng file `Log.AI-CAMS-v2/buildspec.yml` (cần chỉnh **Primary source** hoặc path tới buildspec nếu repo root là `Log.AI-CAMS`).
   - Env variables: `IMAGE_REPO_NAME` = `logaicams-api`, `AWS_DEFAULT_REGION`, v.v.

2. **ECR**: tạo repository như bước 2.1.

3. **CodePipeline** → Create pipeline:
   - Source: GitHub (branch main/develop).
   - Build: CodeBuild project ở bước 1.
   - Deploy: ECS (Deploy to Amazon ECS) – chọn cluster và service đã tạo.

File `buildspec.yml` trong `Log.AI-CAMS-v2` đã hỗ trợ build Docker với context là `Log.AI-CAMS-v2` (kể cả khi source clone cả repo `Log.AI-CAMS`).

---

## 6. Biến môi trường cho container ECS

API cần ít nhất:

- `ConnectionStrings__DefaultConnection` (PostgreSQL).
- `Redis__Configuration` (nếu dùng Redis).
- `AwsCdn__CloudFrontDomain`, `Firestore__*`, `FIREBASE_CREDENTIALS_JSON` (nếu dùng).
- `ASPNETCORE_ENVIRONMENT=Production`.

Nên lưu trong **AWS Secrets Manager** hoặc **Systems Manager Parameter Store** và map vào ECS Task Definition (environment / secrets) thay vì ghi trong workflow.

---

## 7. Tóm tắt file workflow

| File | Mục đích |
|------|----------|
| `.github/workflows/ci.yml` | CI: build + test .NET (chạy tay) |
| `.github/workflows/aws-ec2-full.yml` | Full Deploy: Terraform EC2 + Docker → ECR → EC2 chạy API (chạy tay) |
| `.github/workflows/aws-ec2-destroy.yml` | Destroy: Terraform destroy EC2, **giữ RDS** (chạy tay, gõ `destroy`) |
| `Log.AI-CAMS-v2/buildspec.yml` | Buildspec cho AWS CodeBuild (tùy chọn) |
| `docs/AWS-CICD-SETUP.md` | Tài liệu này |

**Lấy ALB ARN cho Destroy:**  
`aws elbv2 describe-load-balancers --query 'LoadBalancers[?contains(LoadBalancerName,`logaicams`)].LoadBalancerArn' --output text --region ap-southeast-1`
