## EC2 logging & access guide (Log.AI-CAMS)

### 1. Kiến trúc log trên EC2

- EC2 chạy Docker + docker-compose (tạo bởi `infra/terraform/ec2/userdata.sh.tftpl`).
- Container API `logaicams-api`:
  - Ghi log console → xem qua `docker logs`.
  - Ghi log file (Serilog, v.v.) vào thư mục **trong container**: `/app/Logs`.
- User-data mount:
  - `/opt/logaicams/logs` (host EC2, EBS) → `/app/Logs` (trong container).
  - `/opt/logaicams/uploads` → `/app/wwwroot/uploads`.

**Kết quả:**

- Log & uploads **không bị mất** khi deploy image mới / recreate container (CI/CD pull ECR image mới, `docker compose up -d`).

---

### 2. Quyền IAM & công cụ cần có

#### 2.1. IAM user (ví dụ: `logcams-app`)

User dùng để:

- Chạy `terraform` (EC2, IAM, S3, Dynamo, ECR).
- Chạy `aws ssm start-session` để vào EC2.

Policy tối thiểu cho SSM (identity-based, gắn vào user):

```json
{
  "Sid": "AllowSSMSessionManager",
  "Effect": "Allow",
  "Action": [
    "ssm:StartSession",
    "ssm:TerminateSession",
    "ssm:DescribeSessions",
    "ssm:GetConnectionStatus",
    "ssm:DescribeInstanceInformation"
  ],
  "Resource": "*"
}
```

Ec2 instance đã có IAM role kèm `AmazonSSMManagedInstanceCore` (Terraform gắn trong `main.tf`).

#### 2.2. Cài AWS CLI & cấu hình

Trên máy local:

```bash
aws configure
# Nhập Access key / Secret key cho user (vd. logcams-app)
# Region: ap-southeast-1
# Output: json
```

#### 2.3. Cài Session Manager Plugin (Windows)

Mở **PowerShell (Run as Administrator)**:

```powershell
Invoke-WebRequest `
  -Uri https://s3.amazonaws.com/session-manager-downloads/plugin/latest/windows/SessionManagerPluginSetup.exe `
  -OutFile "$env:TEMP\SessionManagerPluginSetup.exe"

Start-Process "$env:TEMP\SessionManagerPluginSetup.exe" -Wait
```

Đóng/mở lại PowerShell, kiểm tra:

```powershell
session-manager-plugin
```

Nếu in ra usage/version là OK.

---

### 3. Truy cập EC2

#### 3.1. Lấy instance ID & IP qua CLI

**Windows PowerShell:**

```powershell
aws ec2 describe-instances `
  --filters "Name=tag:Name,Values=*logaicams*" "Name=instance-state-name,Values=running" `
  --query "Reservations[].Instances[].{Id:InstanceId,Name:Tags[?Key=='Name']|[0].Value,IP:PublicIpAddress,LaunchTime:LaunchTime}" `
  --output table
```

**Linux / macOS shell (bash/zsh):**

```bash
aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=*logaicams*" "Name=instance-state-name,Values=running" \
  --query "Reservations[].Instances[].{Id:InstanceId,Name:Tags[?Key=='Name']|[0].Value,IP:PublicIpAddress,LaunchTime:LaunchTime}" \
  --output table
```

Trong output bạn sẽ thấy thêm cột `LaunchTime` (UTC).  
Nếu có nhiều instance `logaicams`, hãy chọn instance có `LaunchTime` mới nhất để làm việc (INSTANCE_ID mới nhất).

Ghi lại:

- `INSTANCE_ID` (vd. `i-058b413ef6bbcb325`)
- `PUBLIC_IP` (dùng cho SSH nếu cần)

#### 3.2. Cách A — AWS Console (Session Manager)

1. AWS Console → **Systems Manager** → **Session Manager**.
2. **Start session** → chọn instance `logaicams-api-ec2`.
3. Bạn nhận được shell trong EC2 (`sh-5.2$` hoặc tương tự).

#### 3.3. Cách B — AWS CLI (SSM)

Từ PowerShell/terminal local:

```bash
aws ssm start-session --target <INSTANCE_ID>
# ví dụ
aws ssm start-session --target i-058b413ef6bbcb325
```

Thành công:

```text
Starting session with SessionId: ...
sh-5.2$
```

#### 3.4. Cách C — SSH bằng Private Key (.pem)

> **Lưu ý bảo mật:** Không nên chia sẻ file `.pem` tuỳ tiện. Nếu dùng chung, hãy chắc chắn thu hồi quyền (đổi key) sau khi teammate làm xong, hoặc tốt nhất là dùng Session Manager (Cách A/B) để không cần đụng đến key.

**Bước 1: Mở cổng 22 cho IP của teammate**
Bạn cần vào AWS Console (hoặc dùng CLI) để mở port 22 ở Security Group của EC2, chỉ allow IP của teammate.
_AWS CLI Command (thay `<SG_ID>` và `<TEAMMATE_IP>`):_

```bash
aws ec2 authorize-security-group-ingress \
  --group-id <SG_ID> \
  --protocol tcp \
  --port 22 \
  --cidr <TEAMMATE_IP>/32
```

**Bước 2: Gửi file `.pem` cho teammate an toàn**
Gửi file private key (ví dụ `logaicams-key.pem`) cho teammate qua kênh an toàn.

**Bước 3: Hướng dẫn teammate truy cập**

_Nếu teammate dùng Linux/macOS:_
Phải phân quyền file key trước khi chạy ssh:

```bash
chmod 400 logaicams-key.pem
ssh -i logaicams-key.pem ec2-user@<PUBLIC_IP>
```

_Nếu teammate dùng Windows (PowerShell/CMD):_

```powershell
ssh -i .\logaicams-key.pem ec2-user@<PUBLIC_IP>
```

_(Nếu Windows báo lỗi "UNPROTECTED PRIVATE KEY FILE!", teammate có thể ssh qua WSL/Git Bash hoặc phải xoá quyền các user khác đối với file `.pem` qua Properties (Tab Security) trên Windows.)_

---

### 4. Mở port 443 để teammate truy cập API trên EC2

> Mục tiêu: cho phép truy cập HTTPS từ Internet (hoặc từ IP teammate cụ thể) vào EC2.

#### 4.1. Xác định Security Group đang gắn với instance

**Windows PowerShell:**

```powershell
aws ec2 describe-instances `
  --instance-ids <INSTANCE_ID> `
  --query "Reservations[].Instances[].SecurityGroups[].{Id:GroupId,Name:GroupName}" `
  --output table
```

**Linux / macOS (bash/zsh):**

```bash
aws ec2 describe-instances \
  --instance-ids <INSTANCE_ID> \
  --query "Reservations[].Instances[].SecurityGroups[].{Id:GroupId,Name:GroupName}" \
  --output table
```

Ghi lại `SG_ID` (ví dụ `sg-0abc123...`).

#### 4.2. Mở inbound TCP 443 (khuyến nghị theo IP teammate)

**Khuyến nghị (an toàn hơn):** chỉ mở cho IP public cố định của teammate (`x.x.x.x/32`).

**Windows PowerShell:**

```powershell
aws ec2 authorize-security-group-ingress `
  --group-id <SG_ID> `
  --ip-permissions '[{"IpProtocol":"tcp","FromPort":443,"ToPort":443,"IpRanges":[{"CidrIp":"<TEAMMATE_IP>/32","Description":"Teammate HTTPS access"}]}]'
```

**Linux / macOS (bash/zsh):**

```bash
aws ec2 authorize-security-group-ingress \
  --group-id <SG_ID> \
  --ip-permissions '[{"IpProtocol":"tcp","FromPort":443,"ToPort":443,"IpRanges":[{"CidrIp":"<TEAMMATE_IP>/32","Description":"Teammate HTTPS access"}]}]'
```

**Tạm thời để test nhanh (ít an toàn):**

**Windows PowerShell:**

```powershell
aws ec2 authorize-security-group-ingress `
  --group-id <SG_ID> `
  --protocol tcp `
  --port 443 `
  --cidr 0.0.0.0/0
```

**Linux / macOS (bash/zsh):**

```bash
aws ec2 authorize-security-group-ingress \
  --group-id <SG_ID> \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0
```

> Sau khi test xong, nên thu hẹp lại về IP cụ thể thay vì để `0.0.0.0/0`.

#### 4.3. Kiểm tra rule đã áp dụng chưa

**Windows PowerShell:**

```powershell
aws ec2 describe-security-groups `
  --group-ids <SG_ID> `
  --query 'SecurityGroups[].IpPermissions[?FromPort==`443` && ToPort==`443`]' `
  --output json
```

**Linux / macOS (bash/zsh):**

```bash
aws ec2 describe-security-groups \
  --group-ids <SG_ID> \
  --query "SecurityGroups[].IpPermissions[?FromPort==\`443\` && ToPort==\`443\`]" \
  --output json
```

#### 4.4. Kiểm tra trong EC2 có service đang listen cổng 443

Vào EC2 qua SSM rồi chạy:

```bash
sudo ss -lntp | grep :443
```

Nếu chưa có process listen `:443`, kiểm tra map port của docker-compose:

```bash
cd /opt/logaicams
sudo docker compose ps
sudo docker ps --format "table {{.Names}}\t{{.Ports}}"
```

> Nếu app chỉ mở `80` hoặc `8080`, mở SG port 443 thôi vẫn chưa đủ. Cần reverse proxy/TLS termination (Nginx/Caddy/ALB/CloudFront) hoặc cấu hình app/container listen 443.

#### 4.5. Kiểm tra từ máy teammate

**PowerShell (Windows):**

```powershell
Test-NetConnection -ComputerName <PUBLIC_IP_OR_DOMAIN> -Port 443
```

**curl:**

```bash
curl -vk https://<PUBLIC_IP_OR_DOMAIN>/swagger
```

**PowerShell (tránh alias `curl`):**

```powershell
curl.exe -vk https://<PUBLIC_IP_OR_DOMAIN>/swagger
```

Nếu có domain, nên truy cập bằng domain (TLS certificate đúng CN/SAN).

#### 4.6. Thu hồi rule mở rộng sau khi hoàn tất test (khuyến nghị)

Ví dụ xoá rule `0.0.0.0/0`:

**Windows PowerShell:**

```powershell
aws ec2 revoke-security-group-ingress `
  --group-id <SG_ID> `
  --protocol tcp `
  --port 443 `
  --cidr 0.0.0.0/0
```

**Linux / macOS (bash/zsh):**

```bash
aws ec2 revoke-security-group-ingress \
  --group-id <SG_ID> \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0
```

---

### 5. Xem log trên EC2

Các bước dưới đây áp dụng **sau khi đã vào shell EC2** (SSM hoặc SSH).

#### 5.1. Đi tới thư mục deploy

```bash
cd /opt/logaicams
ls
# docker-compose.yml
# .env
```

#### 5.2. Kiểm tra container

```bash
sudo docker ps
# hoặc
sudo docker compose ps   # nếu docker compose V2 khả dụng
```

Xác nhận có container: `logaicams-api`.

#### 5.3. Xem log runtime (stdout/stderr)

```bash
sudo docker logs -f logaicams-api
# Ctrl + C để thoát
```

Nếu cần quyền cao:

```bash
sudo docker logs -f logaicams-api
```

#### 5.4. Xem log file (persisted trên EBS)

**Trên host EC2:**

```bash
cd /opt/logaicams/logs
ls -lah
tail -n 200 application-2026-03-16.log
```

Nếu bị hạn chế quyền:

```bash
sudo ls -lah /opt/logaicams/logs
sudo tail -n 200 /opt/logaicams/logs/application-2026-03-16.log
```

**Bên trong container:**

```bash
docker exec -it logaicams-api sh
cd /app/Logs
ls
tail -n 200 application-2026-03-16.log
```

> `/app/Logs` trong container tương đương `/opt/logaicams/logs` trên host.

---

### 6. Debug bootstrapping (khi API không chạy)

Nếu sau deploy mà API không lên (Swagger 404 / connection refused), xem log cloud-init:

```bash
sudo less /var/log/cloud-init-output.log
```

Tìm các dòng prefix `[logaicams]` (được in bởi `userdata.sh.tftpl`):

- `[logaicams] Installing docker...`
- `[logaicams] Writing docker-compose.yml...`
- `[logaicams] Logging in to ECR and starting compose...`
- Lỗi nếu `docker compose up -d` fail.

---

### 7. Thoát session

- Trong shell EC2: gõ:

```bash
exit
```

- Với **SSM session** (CLI hoặc Console):
  - `exit` kết thúc shell, plugin tự gọi `ssm:TerminateSession`.
  - Hoặc từ AWS Console → Session Manager → End session.
- Với SSH: `exit` đóng kết nối SSH.

---

### 8. Tóm tắt nhanh

- 1 lần setup:
  - IAM user có block `AllowSSMSessionManager` (Start/TerminateSession + Describe\*).
  - Cài AWS CLI + Session Manager Plugin.
- Mỗi lần cần xem log:
  1. `aws ssm start-session --target <INSTANCE_ID>` (hoặc Console → Session Manager → Start session).
  2. Trên EC2:
  - `cd /opt/logaicams`
  - `sudo docker logs -f logaicams-api` (runtime)
  - hoặc `tail -n 200 /opt/logaicams/logs/<file>.log` (file log).
  3. `exit` để thoát session.
- Nếu cần teammate vào HTTPS:
  1. Mở inbound `tcp/443` trên Security Group của instance (ưu tiên `<TEAMMATE_IP>/32`).
  2. Kiểm tra EC2 có service listen `:443`.
  3. Test từ máy teammate bằng `Test-NetConnection`/`curl`.

---

### 9. Mô hình HTTPS chuẩn khi có nhiều instance (khuyến nghị)

Để tránh phải cấu hình cert HTTPS trên từng EC2, nên dùng mô hình:

```text
Domain (Route53)
    -> ALB Listener 443 (ACM certificate)
    -> Target Group (HTTP 80 hoặc 8080)
    -> EC2 instances (Auto Scaling Group)
```

Ý nghĩa:

- HTTPS terminate tại ALB (dùng ACM), không terminate ở từng instance.
- Mỗi lần build/deploy image mới chỉ thay container/app trên EC2, HTTPS vẫn giữ nguyên tại ALB.
- Instance scale-out/replace tự động vẫn dùng chung HTTPS vì traffic đi qua ALB.

#### 9.1. Security Group khuyến nghị

- SG của ALB:
  - Inbound: `443` từ Internet (`0.0.0.0/0`) hoặc dải IP mong muốn.
  - Outbound: tới SG của EC2 ở cổng app (`80` hoặc `8080`).
- SG của EC2:
  - Inbound: chỉ cho phép từ SG của ALB ở cổng app (`80` hoặc `8080`).
  - Không cần mở public `443` trực tiếp vào EC2.

#### 9.2. Trả lời câu hỏi thường gặp

"Mỗi lần build, tất cả instance đều mang HTTPS này không?"

- Có, nếu HTTPS đặt ở ALB + ACM: mọi instance phía sau ALB đều dùng chung HTTPS.
- Không, nếu cài cert trực tiếp trên từng EC2: instance mới/recreate có thể mất cấu hình nếu không có automation.
