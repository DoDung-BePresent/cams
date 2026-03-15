# AWS S3 + CloudFront – Setup Log (Thực tế đã làm)

> **Project:** Log.AI-CAMS v2  
> **Ngày thực hiện:** 2026-03-04  
> **Trạng thái CloudFront:** ⏳ Chờ AWS xác minh tài khoản  

---

## Tổng quan trạng thái

| Hạng mục | Trạng thái |
|---|---|
| S3 Bucket | ✅ Hoàn thành |
| IAM User + Policy | ✅ Hoàn thành |
| S3FileService (.NET) | ✅ Hoàn thành |
| Biến môi trường `.env` | ✅ Hoàn thành |
| CloudFront Distribution | ⏳ Chờ AWS mở khoá tài khoản |

---

## Phần 1 – Tạo S3 Bucket

### 1.1 Truy cập S3 Console

1. Đăng nhập **AWS Console** → tìm **S3** → **Create bucket**.

### 1.2 Cấu hình bucket

| Trường | Giá trị |
|---|---|
| Bucket name | `logaicams-bucket` |
| AWS Region | `ap-southeast-1` (Singapore – gần VN nhất) |
| Object Ownership | **ACLs disabled** (Bucket owner enforced — mặc định từ AWS tháng 4/2023) |
| Block Public Access | ✅ **Block all public access** (bucket private) |
| Bucket Versioning | Disabled (có thể bật sau) |
| Encryption | SSE-S3 (mặc định) |

> ⚠️ **Lưu ý ACL:** Kể từ tháng 4/2023, AWS tắt ACL mặc định trên bucket mới.  
> Không đặt `CannedACL` khi upload — sẽ bị lỗi `AccessControlListNotSupported`.

### 1.3 Tạo bucket xong

Click **Create bucket** → bucket `logaicams-bucket` xuất hiện trong danh sách.

---

## Phần 2 – Tạo IAM User + Policy (Least Privilege)

### 2.1 Tạo IAM Policy

1. **AWS Console → IAM → Policies → Create policy** → **JSON editor**.
2. Dán policy sau (chỉ cấp quyền tối thiểu cho bucket `logaicams-bucket`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3ObjectAccess",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::logaicams-bucket/*"
    },
    {
      "Sid": "S3ListAccess",
      "Effect": "Allow",
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::logaicams-bucket"
    }
  ]
}
```

3. **Policy name:** `LogAICAMS-S3-Policy` → **Create policy**.

### 2.2 Tạo IAM User

1. **IAM → Users → Create user**.
2. **Username:** `logaicams-app`
3. Chọn **Attach policies directly** → tìm `LogAICAMS-S3-Policy` → tick → **Next → Create user**.

### 2.3 Tạo Access Key

1. Click vào user `logaicams-app` → tab **Security credentials**.
2. **Access keys → Create access key**.
3. Use case: **Application running outside AWS** → Next → Create.
4. **Lưu ngay** `Access key ID` và `Secret access key` (chỉ hiện 1 lần).

> ⚠️ **QUAN TRỌNG:** Access key đã được expose trong quá trình session → **cần rotate ngay**.  
> IAM → Users → `logaicams-app` → Security credentials → Deactivate key cũ → Delete → Create key mới.

---

## Phần 3 – Cài đặt NuGet + Implement S3FileService (.NET)

### 3.1 Thêm NuGet packages

Vào `src/LogAICAMS.Infrastructure/LogAICAMS.Infrastructure.csproj`:

```xml
<PackageReference Include="AWSSDK.S3" Version="3.7.414.1" />
<PackageReference Include="AWSSDK.Extensions.NETCore.Setup" Version="3.7.300.1" />
```

Chạy:
```bash
dotnet restore
```

### 3.2 Thêm settings model

File: `src/LogAICAMS.Application/Common/Models/FileStorageSettings.cs`  
Thêm property vào class `S3StorageSettings`:

```csharp
public class S3StorageSettings
{
    public string BucketName { get; set; } = string.Empty;
    public string Region { get; set; } = string.Empty;
    public string AccessKey { get; set; } = string.Empty;
    public string SecretKey { get; set; } = string.Empty;
    public int PresignedUrlExpiryMinutes { get; set; } = 60;  // ← đã thêm
}
```

### 3.3 Tạo S3FileService

File mới: `src/LogAICAMS.Infrastructure/Services/S3FileService.cs`

Các method đã implement:

| Method | Mô tả |
|---|---|
| `UploadFileAsync` | `PutObjectRequest` → trả về relative key `uploads/{subDir}/{fileName}` (không set ACL) |
| `GetFileUrl` | Trả **Presigned URL** với TTL `PresignedUrlExpiryMinutes` phút (tránh 403) |
| `DeleteFileAsync` | `DeleteObjectRequest`, bỏ qua lỗi 404 nếu file không tồn tại |
| `GetFileContentAsync` | `GetObjectRequest` → đọc `ResponseStream` vào `MemoryStream` |

**Tại sao dùng Presigned URL thay vì plain S3 URL?**  
Bucket là **private** → plain URL `https://s3.amazonaws.com/...` trả về `403 Forbidden`.  
Presigned URL nhúng chữ ký tạm thời → FE/tablet có thể fetch file mà không cần AWS credential.

**TTL Presigned URL:** 120 phút = 2× JWT expiry (60 phút) → đảm bảo URL còn hiệu lực trong suốt session.

### 3.4 Cập nhật FileServiceFactory

File: `src/LogAICAMS.Infrastructure/Factories/FileServiceFactory.cs`  
Bỏ comment case `AmazonS3`, thay `throw NotImplementedException` bằng `CreateS3FileService()`.

### 3.5 Đăng ký DI

File: `src/LogAICAMS.Infrastructure/InfrastructureDependencyInjection.cs`

```csharp
services.AddScoped<LocalFileService>();
services.AddScoped<S3FileService>();  // ← bỏ comment
services.AddScoped<IFileServiceFactory, FileServiceFactory>();
```

---

## Phần 4 – Cấu hình biến môi trường

File: `.env` (root project)

```bash
# File Storage – chuyển sang S3
FileStorage__ProviderType=AmazonS3
FileStorage__Local__RootPath=uploads

# S3 Settings
FileStorage__S3__BucketName=logaicams-bucket
FileStorage__S3__Region=ap-southeast-1
FileStorage__S3__AccessKey=<ACCESS_KEY_MỚI_SAU_KHI_ROTATE>
FileStorage__S3__SecretKey=<SECRET_KEY_MỚI_SAU_KHI_ROTATE>
FileStorage__S3__PresignedUrlExpiryMinutes=120
```

> ⚠️ **Không commit file `.env` lên Git.** Kiểm tra `.gitignore` đã có dòng `.env`.

---

## Phần 5 – Fix DI Startup Error (Đã gặp & đã sửa)

**Lỗi:**
```
System.InvalidOperationException: Cannot consume scoped service
  'ITelemetryRepository' from singleton 'ISlidingWindowAggregator'
```

**Nguyên nhân:**  
`SlidingWindowAggregator` đăng ký **Singleton** nhưng inject `ITelemetryRepository` là **Scoped**.  
Singleton không thể giữ Scoped service → DI validation crash lúc khởi động.

**Sửa** trong `src/LogAICAMS.Application/ApplicationDependencyInjection.cs`:

```csharp
// TRƯỚC (sai)
services.AddSingleton<ISlidingWindowAggregator, SlidingWindowAggregator>();

// SAU (đúng)
services.AddScoped<ISlidingWindowAggregator, SlidingWindowAggregator>();
```

**Kết quả:** Build 0 errors, app khởi động thành công.

---

## Phần 6 – CloudFront (⏳ Chưa thực hiện được)

**Lý do:** AWS chặn tạo CloudFront Distribution do tài khoản mới chưa được xác minh.  
AWS Support case đã được submit → chờ phản hồi.

**Khi tài khoản được mở khoá, làm theo hướng dẫn chi tiết tại:**  
📄 [docs/CAMS-CLOUDFRONT-SETUP.md](./CAMS-CLOUDFRONT-SETUP.md)

**Tóm tắt nhanh các bước CloudFront:**

1. **CloudFront → Create Distribution**
   - Origin domain: `logaicams-bucket.s3.ap-southeast-1.amazonaws.com`
   - Origin path: `/audio` (chỉ serve folder audio)
   - Origin access: **Origin access control (OAC)** → Create new OAC

2. **Copy bucket policy** mà CloudFront generate → paste vào S3 bucket policy

3. **Viewer protocol:** Redirect HTTP to HTTPS

4. **Price class:** Use only Southeast Asia and other (tiết kiệm chi phí)

5. **WAF:** Skip (optional, bật sau nếu cần)

6. Sau khi tạo xong, lấy domain `dXXXXXXXXX.cloudfront.net` → cập nhật `.env`:

```bash
AwsCdn__CloudFrontDomain=dXXXXXXXXX.cloudfront.net
AwsCdn__S3BucketName=logaicams-bucket
```

---

## Checklist sau khi hoàn thành

- [x] S3 bucket `logaicams-bucket` tạo xong (ap-southeast-1)
- [x] IAM User `logaicams-app` + Policy `LogAICAMS-S3-Policy` tạo xong
- [ ] **Rotate IAM Access Key ngay** (key cũ đã expose trong chat)
- [x] `S3FileService.cs` implement đầy đủ
- [x] DI Startup Error (`SlidingWindowAggregator`) đã sửa
- [x] App `docker-compose up --build -d` chạy thành công
- [ ] Test upload file thực tế qua Swagger
- [ ] CloudFront Distribution tạo xong (đang chờ AWS)
- [ ] Cập nhật `.env` với CloudFront domain
- [ ] Rotate IAM credentials và cập nhật `.env` + deploy lại

---

## Lệnh kiểm tra nhanh

```bash
# Rebuild + restart toàn bộ stack
docker-compose up --build -d

# Xem logs app
docker-compose logs -f app

# Xem logs chỉ lỗi
docker-compose logs app 2>&1 | grep -i "error\|exception\|fail"
```
