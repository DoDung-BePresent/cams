# AWS CloudFront & MediaConvert Setup Guide

> **Phân chia tài nguyên:**
> - **Bạn** (account `YOUR_ACCOUNT_ID`): sở hữu S3 bucket `logaicams-bucket` + chạy MediaConvert, region `ap-southeast-1`
> - **Teammate** (account `TEAMMATE_ACCOUNT_ID`): sở hữu CloudFront distribution (đã setup xong)

---

## Tổng quan luồng dữ liệu

```
[Upload MP3]  →  S3: uploads/tracks/audio/<uuid>.mp3
                         ↓ MediaConvert job
[HLS output]  →  S3: audio/playlists/<storeId>/<playlistId>/v<N>/*.m3u8 + *.ts
                         ↓ CloudFront serve
[Client]      ←  https://dXXX.cloudfront.net/audio/playlists/.../*.m3u8
```

---

## Phần 1 — S3 Bucket Policy (bạn thực hiện — account `YOUR_ACCOUNT_ID`)

Đây là policy **hoàn chỉnh** cần đặt vào bucket `logaicams-bucket`. Cập nhật trước khi làm bất cứ việc gì với CloudFront hay MediaConvert.

Vào **S3 → logaicams-bucket → Permissions → Bucket policy → Edit**, paste toàn bộ JSON sau (thay `DISTRIBUTION_ID` bằng ID thật):

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowCloudFrontServicePrincipal",
            "Effect": "Allow",
            "Principal": {
                "Service": "cloudfront.amazonaws.com"
            },
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::logaicams-bucket/*",
            "Condition": {
                "StringEquals": {
                    "AWS:SourceArn": "arn:aws:cloudfront::TEAMMATE_ACCOUNT_ID:distribution/DISTRIBUTION_ID"
                }
            }
        },
        {
            "Sid": "AllowMediaConvertRole",
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:iam::YOUR_ACCOUNT_ID:role/MediaConvertServiceRole"
            },
            "Action": [
                "s3:GetObject",
                "s3:GetObjectVersion",
                "s3:PutObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::logaicams-bucket",
                "arn:aws:s3:::logaicams-bucket/*"
            ]
        }
    ]
}
```

> **Lưu ý**: `AllowMediaConvertRole` hiện dùng account `YOUR_ACCOUNT_ID` (account của bạn) vì MediaConvert chạy trong account của bạn.

**Block Public Access** → vào **Permissions → Block public access** → đảm bảo **bật hết 4 option**. Bucket giữ private, CloudFront dùng OAC để truy cập.

---

## Phần 2 — CloudFront

### Trường hợp A — Tạo Distribution mới (teammate thực hiện trong account `TEAMMATE_ACCOUNT_ID`)

#### Bước A.1: Tạo Origin Access Control (OAC)

Trước khi tạo distribution, tạo OAC để dùng:

1. **CloudFront → Security → Origin access → Origin access control → Create control setting**
2. Điền:
   - **Name**: `logaicams-oac`
   - **Description**: OAC for logaicams-bucket
   - **Signing behavior**: `Sign requests (recommended)`
   - **Origin type**: `S3`
3. **Create**

#### Bước A.2: Tạo Distribution

1. **CloudFront → Distributions → Create distribution**
2. **Origin section:**

   | Field | Giá trị |
   |---|---|
   | **Origin domain** | `logaicams-bucket.s3.ap-southeast-1.amazonaws.com` ⚠️ **phải dùng regional endpoint** |
   | **Origin name** | `logaicams-s3-origin` |
   | **Origin path** | *(để trống)* |
   | **Origin access** | `Origin access control settings (recommended)` |
   | **Origin access control** | Chọn `logaicams-oac` vừa tạo |

   > ⚠️ **Lỗi thường gặp**: Nếu chọn `logaicams-bucket.s3.amazonaws.com` (global endpoint) thay vì `logaicams-bucket.s3.ap-southeast-1.amazonaws.com` (regional) → sẽ bị **403 AccessDenied** ngay cả khi bucket policy đúng.

3. **Default cache behavior:**

   | Field | Giá trị |
   |---|---|
   | **Viewer protocol policy** | `Redirect HTTP to HTTPS` |
   | **Cache policy** | `Managed-CachingDisabled` |
   | **Origin request policy** | `Managed-CORS-S3Origin` |
   | **Response headers policy** | `Managed-CORS-with-preflight-and-SecurityHeadersPolicy` |

4. **Settings:**
   - **Price class**: `Use only North America, Europe, Asia, Middle East, and Africa` (hoặc All)
   - **Default root object**: *(để trống)*

5. **Create distribution** → đợi status `Enabled` (~5 phút)

6. CloudFront hiển thị banner **"The S3 bucket policy needs to be updated"** → click **Copy policy** → paste vào bucket policy của `logaicams-bucket` (xem Phần 1).

---

### Trường hợp B — Distribution đã có sẵn (teammate thực hiện)

#### Bước B.1: Thêm Origin mới cho `logaicams-bucket`

1. **CloudFront → Distributions → [ID distribution] → Origins tab → Create origin**
2. Điền:

   | Field | Giá trị |
   |---|---|
   | **Origin domain** | `logaicams-bucket.s3.ap-southeast-1.amazonaws.com` ⚠️ **regional endpoint — bắt buộc** |
   | **Origin name** | `logaicams-s3-origin` |
   | **Origin path** | *(để trống)* |
   | **Origin access** | `Origin access control settings (recommended)` |
   | **Origin access control** | Click **Create new OAC** → name `logaicams-oac` → Sign requests → Create |

3. **Save changes**

   > ⚠️ **Lỗi thường gặp**: Nếu AWS Console tự điền `logaicams-bucket.s3.amazonaws.com` (global) thay vì `logaicams-bucket.s3.ap-southeast-1.amazonaws.com` (regional) → xóa đi và tự gõ regional endpoint → **đây là nguyên nhân 403 phổ biến nhất**.

#### Bước B.2: Tạo Behaviors cho các path cần serve từ S3 mới

Vào **Behaviors tab → Create behavior** — tạo **2 behaviors** sau:

**Behavior 1 — HLS audio output:**

| Field | Giá trị |
|---|---|
| **Path pattern** | `/audio/*` |
| **Origin** | `logaicams-s3-origin` |
| **Viewer protocol policy** | `Redirect HTTP to HTTPS` |
| **Cache policy** | `Managed-CachingDisabled` |
| **Origin request policy** | `Managed-CORS-S3Origin` |
| **Response headers policy** | `Managed-CORS-with-preflight-and-SecurityHeadersPolicy` |

**Behavior 2 — Raw uploads (MP3 gốc):**

| Field | Giá trị |
|---|---|
| **Path pattern** | `/uploads/*` |
| **Origin** | `logaicams-s3-origin` |
| **Viewer protocol policy** | `Redirect HTTP to HTTPS` |
| **Cache policy** | `Managed-CachingDisabled` |
| **Origin request policy** | `Managed-CORS-S3Origin` |
| **Response headers policy** | `Managed-CORS-with-preflight-and-SecurityHeadersPolicy` |

> **Lưu ý thứ tự precedence**: Behaviors có path pattern cụ thể hơn phải có precedence thấp hơn (số nhỏ hơn) so với `Default (*)`.

#### Bước B.3: Test nhanh

Upload 1 file test lên S3 tại `audio/test.mp3`, sau đó:

```
https://dXXXXXXXXXXXXXX.cloudfront.net/audio/test.mp3
```

Kết quả mong đợi: HTTP 200, file trả về đúng.

Nếu vẫn bị 403 sau khi cấu hình đúng → tạo invalidation:
- **CloudFront → Invalidations → Create invalidation**  
- Path: `/audio/*`
- Submit → đợi ~2 phút → test lại

---

## Phần 3 — MediaConvert (**bạn thực hiện** — account `YOUR_ACCOUNT_ID`)

> **Tại sao cùng account đơn giản hơn?**  
> Code `MediaConvertService.cs` dùng luôn `AccessKey` / `SecretKey` của S3 (IAM user `YOUR_IAM_USER`) để khởi tạo `AmazonMediaConvertClient`. MediaConvert trong account `YOUR_ACCOUNT_ID` → dùng được credentials hiện tại, không cần assume role hay thêm code.

### Bước 3.1: Tạo IAM Role cho MediaConvert

Vào **IAM → Roles → Create role** (trong account `YOUR_ACCOUNT_ID`):

1. **Trusted entity type**: `AWS service`
2. **Use case**: gõ `MediaConvert` trong search box → chọn **MediaConvert** → Next
3. **Add permissions**: bỏ qua bước này (Next)
4. **Role name**: `MediaConvertServiceRole`
5. **Create role**

### Bước 3.2: Thêm Inline Policy cho Role

Vào **IAM → Roles → MediaConvertServiceRole → Add permissions → Create inline policy → JSON tab**, paste:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "ReadS3Input",
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:GetObjectVersion"
            ],
            "Resource": "arn:aws:s3:::logaicams-bucket/*"
        },
        {
            "Sid": "WriteS3Output",
            "Effect": "Allow",
            "Action": [
                "s3:PutObject"
            ],
            "Resource": "arn:aws:s3:::logaicams-bucket/audio/*"
        },
        {
            "Sid": "ListBucket",
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket"
            ],
            "Resource": "arn:aws:s3:::logaicams-bucket"
        }
    ]
}
```

**Policy name**: `MediaConvertS3Policy` → Create policy.

> - `GetObject` → đọc raw MP3 từ `uploads/tracks/audio/`
> - `PutObject` giới hạn `audio/*` → ghi HLS output vào `audio/playlists/{storeId}/{playlistId}/v{N}/`
> - `ListBucket` → cần cho một số MediaConvert operations

### Bước 3.3: Cấp quyền MediaConvert cho IAM user `YOUR_IAM_USER`

Code dùng credentials của `YOUR_IAM_USER` để gọi MediaConvert API. User này cần thêm quyền:

Vào **IAM → Users → YOUR_IAM_USER → Add permissions → Create inline policy → JSON tab**, paste:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "MediaConvertAccess",
            "Effect": "Allow",
            "Action": [
                "mediaconvert:CreateJob",
                "mediaconvert:GetJob",
                "mediaconvert:ListJobs",
                "mediaconvert:ListQueues",
                "mediaconvert:CancelJob",
                "mediaconvert:DescribeEndpoints"
            ],
            "Resource": "*"
        },
        {
            "Sid": "PassRoleToMediaConvert",
            "Effect": "Allow",
            "Action": "iam:PassRole",
            "Resource": "arn:aws:iam::YOUR_ACCOUNT_ID:role/MediaConvertServiceRole"
        }
    ]
}
```

**Policy name**: `AllowMediaConvertJobs` → Create policy.

> `iam:PassRole` là bắt buộc — khi tạo job, MediaConvert cần được "trao" `MediaConvertServiceRole` để có quyền đọc/ghi S3.

### Bước 3.4: Lấy MediaConvert Endpoint

Chạy lệnh dưới đây với profile `default` (account `YOUR_ACCOUNT_ID`):

```bash
aws mediaconvert describe-endpoints --region ap-southeast-1
```

Hoặc dùng PowerShell:

```powershell
aws mediaconvert describe-endpoints --region ap-southeast-1 --profile default
```

Output — AWS hiện trả về **generic regional endpoint** (không còn dạng có account ID nữa):

```json
{
    "Endpoints": [
        {
            "Url": "https://mediaconvert.ap-southeast-1.amazonaws.com"
        }
    ]
}
```

> Đây là format mới của AWS từ cuối 2023 — hoàn toàn đúng, dùng được luôn.

Copy URL này → dùng cho `MediaConvert__Endpoint` trong `.env`.

### Bước 3.5: Lấy MediaConvert Queue ARN

```bash
aws mediaconvert list-queues --region ap-southeast-1 --endpoint-url https://mediaconvert.ap-southeast-1.amazonaws.com --profile default
```

Copy ARN của queue `Default`:

```
arn:aws:mediaconvert:ap-southeast-1:YOUR_ACCOUNT_ID:queues/Default
```

---

## Phần 4 — Cập nhật `.env` (bạn thực hiện)

```dotenv
# CloudFront (teammate's account TEAMMATE_ACCOUNT_ID)
AwsCdn__CloudFrontDomain=https://XXXXXXXXXXXXX.cloudfront.net

# MediaConvert (your account YOUR_ACCOUNT_ID)
MediaConvert__Endpoint=https://mediaconvert.ap-southeast-1.amazonaws.com
MediaConvert__RoleArn=arn:aws:iam::YOUR_ACCOUNT_ID:role/MediaConvertServiceRole
MediaConvert__Queue=arn:aws:mediaconvert:ap-southeast-1:YOUR_ACCOUNT_ID:queues/Default
MediaConvert__OutputBucket=logaicams-bucket
```

---

## Phần 5 — Apply EF Migration

```powershell
cd "d:\MyLearning\Ky9\SEP\Log.AI-CAMS\Log.AI-CAMS-v2"
.\scripts\migrations\migrate.ps1 -Action update -Context main
```

---

## Phần 6 — Checklist xác nhận

| # | Việc cần làm | Ai | Trạng thái |
|---|---|---|---|
| 1 | Cập nhật S3 Bucket Policy (cả CloudFront + MediaConvert) | Bạn | ✅ |
| 2 | Bật Block Public Access trên bucket | Bạn | ✅ |
| 3 | Tạo OAC `logaicams-oac` | Teammate | ✅ |
| 4 | Thêm Origin `logaicams-s3-origin` với **regional endpoint** | Teammate | ✅ |
| 5 | Tạo Behavior `/audio/*` → `logaicams-s3-origin` | Teammate | ✅ |
| 6 | Tạo Behavior `/uploads/*` → `logaicams-s3-origin` | Teammate | ⬜ |
| 7 | Test CloudFront URL `/audio/*` trả về 200 | Bạn | ✅ |
| 8 | Tạo IAM Role `MediaConvertServiceRole` (account `YOUR_ACCOUNT_ID`) | Bạn | ⬜ |
| 9 | Attach Inline Policy `MediaConvertS3Policy` cho Role | Bạn | ⬜ |
| 10 | Attach Inline Policy `AllowMediaConvertJobs` cho user `YOUR_IAM_USER` | Bạn | ⬜ |
| 11 | Lấy MediaConvert Endpoint + Queue ARN (account `YOUR_ACCOUNT_ID`) | Bạn | ⬜ |
| 12 | Cập nhật `.env` với giá trị thật | Bạn | ⬜ |
| 13 | Chạy `migrate.ps1 -Action update -Context main` | Bạn | ⬜ |
| 14 | `docker-compose up` và test end-to-end | Bạn | ⬜ |

---

## Phụ lục — Troubleshooting 403 AccessDenied

| Triệu chứng | Nguyên nhân | Fix |
|---|---|---|
| 403 ngay cả khi file có trong S3 | Origin domain dùng global endpoint `.s3.amazonaws.com` | Sửa thành `.s3.ap-southeast-1.amazonaws.com` |
| 403 sau khi sửa domain | Behavior chưa có `Origin request policy` | Edit behavior → thêm `Managed-CORS-S3Origin` |
| 403 sau khi sửa behavior | CloudFront cache lại 403 cũ | Tạo invalidation `/audio/*` |
| 403 trên file mới upload | Bucket policy thiếu statement CloudFront | Kiểm tra `AWS:SourceArn` có đúng Distribution ID không |
| 404 (không phải 403) | File không tồn tại trong S3 | Upload file test thủ công để verify |
| 403 khi tạo MediaConvert job | `YOUR_IAM_USER` thiếu `iam:PassRole` | Thêm policy `AllowMediaConvertJobs` cho user |
