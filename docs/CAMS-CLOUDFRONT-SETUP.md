# CAMS – AWS CloudFront Setup Guide for HLS Audio Streaming

> **Audience:** DevOps / Cloud Engineer  
> **Project:** CAMS (Context-Aware AI Music System)  
> **Date:** 2025 – maintained by the backend team  

---

## Why CloudFront (not direct S3)?

| Without CloudFront | With CloudFront |
|--------------------|-----------------|
| Each tablet hits S3 Singapore directly – high latency, buffers easily | Audio served from AWS Edge Location in Hanoi / HCMC – near-zero latency |
| S3 not designed for thousands of tiny `.ts` chunk requests per second | CloudFront handles massive concurrency with edge caching |
| S3 egress cost is high (charged per GB) | S3 → CloudFront transfer is **free**; only CloudFront → Internet is billed (free 1 TB/month) |
| S3 URL must be public (security risk) | S3 stays **private** – only CloudFront can read via OAC |

---

## Architecture

```
React Native Tablet
       │
       │  HTTPS GET /audio/brand-a/chill/master.m3u8
       ▼
┌─────────────────────────────┐
│  CloudFront Distribution    │  ← Edge Location (HAN / SGN)
│  d12345abcdef.cloudfront.net│
└──────────────┬──────────────┘
               │ Cache MISS only
               ▼
┌─────────────────────────────┐
│  S3 Bucket (PRIVATE)        │
│  cams-audio-production      │
│  ap-southeast-1             │
└─────────────────────────────┘
        ▲
        │ (backend only, via AWS SDK)
  .NET 8 Backend uploads files
```

---

## Step 1 – Create CloudFront Distribution

1. Go to **AWS Console → CloudFront → Create Distribution**.
2. **Origin domain**: Select your S3 bucket (`cams-audio-production.s3.ap-southeast-1.amazonaws.com`).
3. **Origin access**: Choose **Origin access control settings (OAC)** → Create new OAC.
4. Copy the generated **S3 bucket policy** and apply it to your S3 bucket's policy editor.  
   (This is the only permission that allows CloudFront to read from the private bucket.)
5. **Viewer protocol policy**: `Redirect HTTP to HTTPS`.
6. **Allowed HTTP methods**: `GET, HEAD`.
7. **Price class**: `Use only North America, Europe, Asia, Middle East, and Africa`  
   (covers Vietnam well; use "All Edge Locations" for global coverage).

---

## Step 2 – Configure Cache Behaviors (Critical!)

HLS has **two very different file types** that require different caching rules.  
Go to **CloudFront → Your Distribution → Behaviors → Create Behavior**.

### Behavior 1 – Audio Chunks (`.ts` / `.aac`)  ← Cache FOREVER

| Setting | Value |
|---------|-------|
| Path pattern | `*.ts` |
| Cache policy | Create custom: **Minimum TTL** = `31536000` (1 year), **Maximum TTL** = `31536000` |
| Origin request policy | `CORS-S3Origin` |
| Response headers policy | `CORS-With-Preflight` |

Repeat the same for `*.aac`.

> **Why 1 year?**  
> Once an audio chunk is encoded and uploaded, it **never changes**. Caching it forever means  
> the first tablet in Vietnam plays it fresh; every subsequent tablet worldwide gets it instantly  
> from the edge — S3 is never contacted again.

---

### Behavior 2 – HLS Manifest (`.m3u8`)  ← Cache SHORT

| Setting | Value |
|---------|-------|
| Path pattern | `*.m3u8` |
| Cache policy | Create custom: **Minimum TTL** = `0`, **Maximum TTL** = `60` (1 minute) |
| Origin request policy | `CORS-S3Origin` |
| Response headers policy | `CORS-With-Preflight` |

> **Why short TTL?**  
> The `.m3u8` manifest is a text file listing which `.ts` segments to play. When you upload a  
> new playlist or update segments, the manifest changes. A 1-minute TTL ensures tablets pick up  
> changes quickly without hammering S3 on every request.

---

### Behavior 3 – Default (`*`)  ← Fallback

| Setting | Value |
|---------|-------|
| Path pattern | `Default (*)` |
| Cache policy | `CachingDisabled` |
| Origin request policy | `CORS-S3Origin` |

---

## Step 3 – CORS Configuration

### On the S3 Bucket

Go to **S3 → Your Bucket → Permissions → Cross-origin resource sharing (CORS)** and add:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

> **Note:** In production, replace `"*"` in `AllowedOrigins` with your actual app domains.

### On CloudFront (Response Headers Policy)

For each Behavior above, attach the **`CORS-With-Preflight`** managed policy, or create a custom one:

| Header | Value |
|--------|-------|
| `Access-Control-Allow-Origin` | `*` |
| `Access-Control-Allow-Methods` | `GET, HEAD` |
| `Access-Control-Max-Age` | `600` |

---

## Step 4 – Update Backend Configuration

After creating the distribution, copy the **Distribution domain name** (e.g. `d12345abcdef.cloudfront.net`)  
and update `appsettings.json` (do NOT include trailing slash):

```json
"AwsCdn": {
  "CloudFrontDomain": "https://d12345abcdef.cloudfront.net",
  "S3BucketName": "cams-audio-production",
  "S3Region": "ap-southeast-1"
}
```

The `HlsUrlBuilderService` will automatically prepend this domain to any relative path or  
strip-and-replace any legacy S3 URL stored in the `Playlist.HlsUrl` column.

---

## Step 5 – How URLs Flow Through the System

```
PostgreSQL Playlist.HlsUrl column  (stored value)
  "audio/brand-a/chill/master.m3u8"         ← preferred relative key
  OR
  "https://cams-audio-production.s3.ap-southeast-1.amazonaws.com/audio/..."  ← legacy

         │
         │  IHlsUrlBuilderService.BuildUrl()
         ▼

  "https://d12345abcdef.cloudfront.net/audio/brand-a/chill/master.m3u8"

         │
         │  MoodChangedDomainEventHandler
         ▼

  SignalR "PlayStream" event → React Native Tablet
```

---

## Step 6 – Testing

### Quick health check

```bash
# Should return HTTP 200 with Cache-Control: max-age=31536000
curl -I "https://d12345abcdef.cloudfront.net/audio/brand-a/chill/segment_001.ts"

# Should return HTTP 200 with Cache-Control: max-age=60
curl -I "https://d12345abcdef.cloudfront.net/audio/brand-a/chill/master.m3u8"

# Should include: Access-Control-Allow-Origin: *
curl -H "Origin: http://localhost" -I "https://d12345abcdef.cloudfront.net/audio/brand-a/chill/master.m3u8"
```

### Invalidate CloudFront cache after re-uploading a playlist

```bash
aws cloudfront create-invalidation \
  --distribution-id E1234ABCDEF \
  --paths "/audio/brand-a/chill/*"
```

> Invalidations cost $0.005 per path (first 1000/month free). Only invalidate `.m3u8` files  
> in practice; `.ts` segments are immutable so never need invalidation.

---

## Security Checklist

- [ ] S3 bucket **Block All Public Access** is ON.
- [ ] OAC policy is attached to the S3 bucket (not the old OAI/legacy method).
- [ ] No direct S3 URL is ever returned to the tablet (all go through `IHlsUrlBuilderService`).
- [ ] CloudFront **WAF** is enabled in production to rate-limit per IP.
- [ ] **Signed URLs / Signed Cookies** are considered if per-brand access control is needed.

---

*Generated by the CAMS Backend Team. For questions, contact the platform architecture channel.*
