# Làm gì tiếp theo – Cấu hình AWS từ đâu

Hướng dẫn **thứ tự** tạo tài nguyên AWS và cấu hình GitHub, để chạy Full CI/CD và có Swagger qua ALB.

> Update: Bạn chọn triển khai bằng **EC2 + Terraform** (không dùng ECS/ALB).  
> Vì vậy Swagger sẽ truy cập trực tiếp: `http://<EC2_PUBLIC_DNS>/swagger`.

---

## Tổng quan thứ tự

| Bước | Làm gì | Cấu hình ở đâu |
|------|--------|-----------------|
| 0 | Chuẩn bị AWS Account + IAM user (cho GitHub) | AWS Console → IAM |
| 1 | Tạo ECR repository (chứa Docker image) | AWS Console → ECR hoặc CLI |
| 2 | Tạo RDS PostgreSQL (database, **giữ khi Destroy**) | AWS Console → RDS |
| 3 | (Terraform) Run workflow tạo EC2 + chạy app | GitHub Actions |
| 4 | Mở Swagger | Browser |

---

## Bước 0: Chuẩn bị AWS

- **Region:** chọn một region cố định, ví dụ **ap-southeast-1** (Singapore). Mọi thứ sau tạo cùng region.
- **IAM user cho GitHub Actions:**
  - **Nếu đã có user** (vd. `logcams-app` dùng cho MediaConvert + S3): chỉ cần **thêm** policy cho CI/CD (ECR + ECS + ALB/Destroy). Dùng file **[docs/AWS-IAM-POLICY-CICD.json](./AWS-IAM-POLICY-CICD.json)** → IAM → Users → `logcams-app` → Permissions → **Add permissions** → Create inline policy → JSON → dán nội dung file (đã điền sẵn account `231838752005` và repo ECR `logaicams-api`). Access key hiện tại của user đó dùng luôn cho GitHub Secrets.
  - **Nếu chưa có user:** tạo user mới (vd. `github-actions-logaicams`), attach policy theo mục **3.1** trong `AWS-CICD-SETUP.md`, rồi tạo Access key cho GitHub Secrets.

> Với mô hình **Terraform + EC2**, bạn cần attach thêm policy Terraform EC2 để workflow có quyền tạo EC2/SG/IAM profile:  
> **`docs/AWS-IAM-POLICY-TERRAFORM-EC2.json`**

---

## Bước 1: ECR (Docker registry)

**Ở đâu:** [ECR → Repositories](https://console.aws.amazon.com/ecr/repositories) (đúng region).

- **Console:** Create repository → Name: `logaicams-api` → Create.
- **CLI:**
  ```bash
  aws ecr create-repository --repository-name logaicams-api --region ap-southeast-1 --image-scanning-configuration scanOnPush=true
  ```
- Ghi lại **URI** (vd. `123456789012.dkr.ecr.ap-southeast-1.amazonaws.com/logaicams-api`). Task Definition sẽ dùng image `uri:latest`.

---

## Bước 2: RDS PostgreSQL

**Ở đâu:** [RDS → Databases](https://console.aws.amazon.com/rds/home#databases:) (cùng region).

- Create database:
  - Engine: **PostgreSQL 15** (hoặc 14).
  - Template: Dev/Test (hoặc Production nếu cần).
  - DB instance identifier: `logaicams-db`.
  - Master username / password: lưu lại (sẽ đưa vào ECS env hoặc Secrets Manager).
  - VPC: mặc định hoặc VPC dùng chung với ECS.
  - **Public access:** No (nên để ECS và RDS cùng VPC, không cần public).
  - Security group: tạo hoặc chọn SG mở port **5432** cho nguồn là **Security group của ECS** (sẽ tạo ở bước 6).

Sau khi tạo xong, lấy **Endpoint** (hostname) của DB. Connection string dạng:

`Host=<endpoint>;Port=5432;Database=logaicams;Username=postgres;Password=...`

---

## Bước 3: Run workflow dựng EC2 (Terraform)

Workflow mới:
- **Full Deploy (Terraform + EC2)**: `/.github/workflows/aws-ec2-full.yml`
- **Destroy (Terraform EC2, giữ RDS)**: `/.github/workflows/aws-ec2-destroy.yml`

Bạn chỉ cần cấu hình GitHub **Secrets/Variables** (mục dưới) rồi bấm **Run workflow**.

Sau khi workflow chạy xong, nó sẽ in ra link: `http://<EC2_PUBLIC_DNS>/swagger`.

---

## Bước 7: Cấu hình GitHub

**Ở đâu:** Repo GitHub → **Settings** → **Secrets and variables** → **Actions**.

- **Secrets** (không hiển thị lại):
  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY`
  - `DB_CONNECTION_STRING` (RDS logaicams_db)
  - `OUTER_DB_CONNECTION_STRING` (RDS logaicams_outerdb)
  - `JWT_KEY` (>= 32 chars)
  - `REDIS_PASSWORD`
  - (optional) `FIREBASE_CREDENTIALS_JSON`

- **Variables** (repository variables):
  - `AWS_REGION` = `ap-southeast-1`
  - `ECR_REPOSITORY` = `logaicams-api`
  - (optional) `EC2_INSTANCE_TYPE` = `t3.small`
  - (optional) `EC2_SSH_KEY_NAME` = tên KeyPair nếu muốn SSH
  - (optional) `FIRESTORE_ENABLED` = `true/false`
  - (optional) `AwsCdn__CloudFrontDomain`, `AwsCdn__S3BucketName`, `AwsCdn__S3Region`
  - (optional) `MediaConvert__Endpoint`, `MediaConvert__RoleArn`, `MediaConvert__Queue`, `MediaConvert__OutputBucket`
  - (recommended) `TF_STATE_BUCKET` = S3 bucket lưu Terraform state
  - (recommended) `TF_STATE_DDB_TABLE` = DynamoDB table cho state lock
  - (optional) `TF_STATE_KEY` = key path cho state (default `logaicams/terraform/ec2.tfstate`)

---

## Bước 8: Chạy Full Deploy (EC2)

1. Push code (hoặc đã push) nhánh cần deploy (vd. `develop`).
2. Vào **Actions** → workflow **Full Deploy (Terraform + EC2)** → **Run workflow**.
3. Chọn branch (vd. `develop`) → **Run workflow**.
4. Workflow sẽ:
   - `terraform apply` tạo EC2 và chạy Docker Compose (API + Redis)
   - build/push image lên ECR
   - in ra Swagger: **http://\<EC2_PUBLIC_DNS\>/swagger**

---

## Tóm tắt: cấu hình ở đâu

| Thứ tự | Cấu hình gì | Ở đâu (AWS) |
|--------|-------------|-------------|
| 1 | ECR repo | ECR → Repositories |
| 2 | RDS PostgreSQL | RDS → Create database |
| 3 | ECS cluster | ECS → Clusters |
| 4 | Task Definition (image ECR + env RDS) | ECS → Task definitions |
| 5 | Target Group + ALB | EC2 → Target Groups, Load Balancers |
| 6 | ECS Service (gắn ALB) | ECS → Cluster → Create service |
| 7 | GitHub Secrets/Variables | GitHub repo → Settings → Actions |

Khi cần dọn môi trường nhưng **giữ database**, chạy workflow **Destroy (Terraform EC2, giữ RDS)** và nhập `destroy`. RDS không bị xóa; chỉ EC2/SG/IAM profile do Terraform tạo bị xóa.
