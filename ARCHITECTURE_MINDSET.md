# CAMS Architecture Mindset Guide

> **Mục đích:** Giải thích tư duy và nguyên tắc đằng sau cấu trúc thư mục của CAMS project

---

## 🎯 Mindset Kiến Trúc: Features vs Shared vs Modules

### 1. FEATURES - "Ai sở hữu?"

**Câu hỏi then chốt:** "Chức năng này thuộc về role/user nào?"

```
features/
├── admin/      ← SystemAdmin sở hữu
├── brand/      ← BrandManager sở hữu
├── store/      ← StoreManager sở hữu
└── auth/       ← Authentication (đặc biệt, dùng chung nhưng vẫn là feature)
```

**Đặt vào `features/` khi:**

- ✅ Chức năng chỉ dành cho 1 role cụ thể
- ✅ UI/UX khác nhau giữa các role
- ✅ Business logic khác nhau theo role
- ✅ Permissions/Authorization khác nhau

**Ví dụ:**

```typescript
// ✅ features/admin/pages/AccountManagement/
// Vì: Chỉ SystemAdmin được quản lý accounts

// ✅ features/brand/pages/StoreManagement/
// Vì: BrandManager quản lý stores của brand mình

// ✅ features/store/pages/SpaceManagement/
// Vì: StoreManager quản lý spaces của store mình
```

---

### 2. SHARED - "Ai cũng dùng?"

**Câu hỏi then chốt:** "Có phải nhiều features cần dùng chung không?"

```
shared/
├── components/     ← UI components dùng chung
├── services/       ← API services cross-cutting
├── hooks/          ← React hooks generic
├── utils/          ← Helper functions
├── types/          ← TypeScript types chung
├── constants/      ← Constants toàn cục
└── modules/        ← Domain modules (xem phần 3)
```

**Đặt vào `shared/` khi:**

- ✅ Ít nhất 2 features cần dùng
- ✅ Logic không phụ thuộc vào role
- ✅ Có thể tái sử dụng
- ✅ Không có business logic specific

**Ví dụ:**

```typescript
// ✅ shared/components/ui/DataTable.tsx
// Vì: Admin, Brand, Store đều dùng table

// ✅ shared/components/profile/ProfileView.tsx
// Vì: Tất cả roles đều có profile page giống nhau

// ✅ shared/services/authService.ts
// Vì: Login/logout dùng chung cho tất cả

// ✅ shared/utils/formatDate.ts
// Vì: Format date là utility chung
```

---

### 3. SHARED/MODULES - "Domain Entity hay không?"

**Câu hỏi then chốt:** "Đây có phải là một domain entity độc lập không?"

```
shared/modules/
├── auth/           ← Authentication domain
├── users/          ← User entity
├── spaces/         ← Space entity
├── tracks/         ← Track entity
├── playlists/      ← Playlist entity
├── moods/          ← Mood entity
└── cams/           ← CAMS domain logic
```

**Mỗi module có cấu trúc:**

```
auth/
├── services/       ← API calls cho Auth (login, logout, profile)
├── hooks/          ← React hooks cho Auth (useProfile, useMyProfile)
├── types/          ← Types cho Auth (User, LoginPayload, etc.)
└── constants/      ← Constants cho Auth (nếu cần)

users/
├── services/       ← API calls cho User (getById)
├── types/          ← Types cho User (UserDetail)
└── hooks/          ← React hooks cho User (nếu cần)

spaces/
├── services/       ← API calls cho Space
├── hooks/          ← React Query hooks
├── types/          ← Space types
├── constants/      ← Space constants
└── components/     ← Space-specific components (nếu có)
```

**Đặt vào `shared/modules/` khi:**

- ✅ Là một domain entity rõ ràng (Space, Track, Playlist...)
- ✅ Có CRUD operations riêng
- ✅ Nhiều features cần access entity này
- ✅ Logic business của entity không phụ thuộc role

**Ví dụ:**

```typescript
// ✅ shared/modules/spaces/
// Vì: Space là entity, Admin/Brand/Store đều cần xem/quản lý spaces

// ✅ shared/modules/tracks/
// Vì: Track là entity, Admin/Brand đều upload/manage tracks

// ✅ shared/modules/playlists/
// Vì: Playlist là entity, nhiều roles tạo/edit playlists

// ❌ KHÔNG nên: shared/modules/dashboard/
// Vì: Dashboard không phải entity, mà là UI feature
```

---

## 🤔 Decision Tree

Khi tạo code mới, hỏi theo thứ tự:

### Bước 1: "Đây có phải PAGE không?"

```
YES → Đặt vào features/{role}/pages/
NO  → Tiếp Bước 2
```

**Giải thích:** Pages là routing endpoints (`<Route path="..." />`), luôn thuộc về một role cụ thể.

### Bước 2: "Chỉ 1 role dùng?"

```
YES → Đặt vào features/{role}/
NO  → Tiếp Bước 3
```

**Giải thích:** Nếu logic chỉ dành riêng cho một role, không nên đặt vào shared.

### Bước 3: "Đây có phải Domain Entity không?"

```
YES → Đặt vào shared/modules/{entity}/
NO  → Tiếp Bước 4
```

**Giải thích:** Domain entity là các đối tượng nghiệp vụ có CRUD operations (Space, Track, Playlist...).

### Bước 4: "Đây là gì?"

```
Component → shared/components/
Service   → shared/services/
Hook      → shared/hooks/
Util      → shared/utils/
Type      → shared/types/
Constant  → shared/constants/
```

---

## 📚 Ví Dụ Thực Tế

### Case 1: Account Management

```typescript
// ❓ Câu hỏi: Đặt Account Management ở đâu?

// Phân tích:
// - Chỉ SystemAdmin quản lý accounts → Role-specific
// - BrandManager không được xem accounts của brand khác
// - StoreManager không có quyền quản lý accounts

// ✅ Quyết định:
features /
  admin /
  pages /
  AccountManagement /
  features /
  admin /
  services /
  accountService.ts;
features / admin / hooks / useAccounts.ts;
```

### Case 2: Space Entity

```typescript
// ❓ Câu hỏi: Đặt Space logic ở đâu?

// Phân tích:
// - Space là domain entity
// - Admin xem tất cả spaces
// - Brand xem spaces của brand mình
// - Store quản lý spaces của store mình
// - Logic CRUD giống nhau, chỉ khác filter/permissions

// ✅ Quyết định:
shared/modules/spaces/services/spaceService.ts  ← API calls
shared/modules/spaces/hooks/useSpaces.ts        ← React Query
shared/modules/spaces/types/spaceTypes.ts       ← Types

// Pages vẫn ở features vì UI/permissions khác:
features/admin/pages/SpaceManagement/           ← Admin view all
features/brand/pages/StoreManagement/           ← Brand view by brand
features/store/pages/SpaceManagement/           ← Store manage own
```

### Case 3: Profile Page

```typescript
// ❓ Câu hỏi: Profile page giống nhau cho tất cả roles, đặt ở đâu?

// Phân tích:
// - UI giống hệt nhau cho Admin/Brand/Store
// - Chỉ khác breadcrumbs
// - Là PAGE (routing endpoint)

// ✅ Quyết định:
// Component presentation:
shared / components / profile / ProfileView.tsx;

// Page wrappers (vì là routing endpoints):
features / admin / pages / Profile / AdminProfile.tsx;
features / brand / pages / Profile / BrandProfile.tsx;
features / store / pages / Profile / StoreProfile.tsx;
```

**Giải thích:** Mặc dù UI giống nhau, nhưng vì là PAGE (routing endpoint), mỗi role vẫn cần wrapper riêng. Component presentation được share.

### Case 4: Auth Service

```typescript
// ❓ Câu hỏi: Login/Logout đặt ở đâu?

// Phân tích:
// - Tất cả roles đều login/logout giống nhau
// - Không phải domain entity (không có CRUD)
// - Là cross-cutting concern

// ✅ Quyết định:
shared/services/authService.ts     ← API calls
features/auth/hooks/useProfile.ts  ← Auth-specific hooks
features/auth/pages/LoginPage.tsx  ← Login UI
```

**Giải thích:** Auth service là cross-cutting (tất cả roles dùng), nhưng auth feature vẫn cần để chứa pages và hooks specific.

### Case 5: DataTable Component

```typescript
// ❓ Câu hỏi: Table component dùng chung đặt ở đâu?

// Phân tích:
// - Tất cả features đều dùng table
// - Không phải domain entity
// - Là UI component thuần túy

// ✅ Quyết định:
shared / components / ui / DataTable.tsx;
```

### Case 6: Playlist Module

```typescript
// ❓ Câu hỏi: Playlist logic đặt ở đâu?

// Phân tích:
// - Playlist là domain entity
// - Admin xem tất cả playlists
// - Brand tạo/edit playlists của brand mình
// - Store xem playlists để assign vào spaces
// - CRUD operations giống nhau

// ✅ Quyết định:
shared/modules/playlists/services/playlistService.ts
shared/modules/playlists/hooks/usePlaylists.ts
shared/modules/playlists/types/playlistTypes.ts

// Pages khác nhau:
features/admin/pages/PlaylistManagement/    ← View all, approve
features/brand/pages/PlaylistManagement/    ← Create, edit own
features/store/pages/SpaceManagement/       ← Assign to spaces
```

---

## 🚫 Anti-Patterns (Sai lầm thường gặp)

### ❌ Sai: Đặt Page vào Shared

```typescript
// ❌ WRONG
shared/modules/users/pages/ProfilePage.tsx

// ✅ CORRECT
shared/components/profile/ProfileView.tsx      ← Component
features/admin/pages/Profile/AdminProfile.tsx  ← Page
```

**Lý do:** Pages là routing endpoints, luôn thuộc features. Nếu UI giống nhau, tách thành component trong shared.

---

### ❌ Sai: Shared import từ Features

```typescript
// ❌ WRONG
// shared/hooks/useMyProfile.ts
import { accountService } from '@/features/admin/services';

// ✅ CORRECT
// features/auth/hooks/useMyProfile.ts
import { userService } from '@/shared/services';
```

**Lý do:** Dependency phải đi từ cao xuống thấp: `features → shared`. Shared không được phụ thuộc vào features.

---

### ❌ Sai: Feature import từ Feature khác

```typescript
// ❌ WRONG
// features/brand/hooks/useBrandStores.ts
import { storeService } from '@/features/admin/services';

// ✅ CORRECT
// features/brand/hooks/useBrandStores.ts
import { useStores } from '@/shared/modules/stores/hooks';
```

**Lý do:** Features không nên phụ thuộc lẫn nhau. Nếu cần share logic, move to shared/modules.

---

### ❌ Sai: Module cho non-entity

```typescript
// ❌ WRONG
shared/modules/dashboard/

// ✅ CORRECT
features/admin/pages/Dashboard/
features/brand/pages/Dashboard/
```

**Lý do:** Dashboard là UI feature, không phải domain entity. Mỗi role có dashboard riêng.

---

### ❌ Sai: Duplicate logic thay vì share

```typescript
// ❌ WRONG
features / admin / utils / formatDate.ts;
features / brand / utils / formatDate.ts;
features / store / utils / formatDate.ts;

// ✅ CORRECT
shared / utils / formatDate.ts;
```

**Lý do:** DRY principle - Don't Repeat Yourself. Logic dùng chung nên ở shared.

---

### ❌ Sai: Tên folder không rõ ràng

```typescript
// ❌ WRONG
shared/modules/common/
shared/modules/helpers/
shared/modules/misc/

// ✅ CORRECT
shared/modules/spaces/
shared/modules/tracks/
shared/modules/playlists/
```

**Lý do:** Tên folder phải thể hiện rõ domain entity. Tránh tên chung chung.

---

## 🎓 Nguyên Tắc Vàng

### 1. **Separation of Concerns**

- **Features** = Role-specific logic
- **Shared** = Cross-cutting concerns
- **Modules** = Domain entities

### 2. **Dependency Direction**

```
features/ (cao)
    ↓ can import
shared/ (thấp)
    ↓ can import
config/ (thấp nhất)
```

**Quy tắc:** Code ở layer cao có thể import từ layer thấp, nhưng không được ngược lại.

### 3. **DRY (Don't Repeat Yourself)**

- Nếu 2+ features cần → Move to shared
- Nếu là entity → Move to shared/modules

### 4. **Single Responsibility**

- Mỗi module chỉ quản lý 1 domain entity
- Mỗi feature chỉ quản lý logic của 1 role

### 5. **Explicit over Implicit**

- Tên folder phải rõ ràng (spaces, tracks, playlists)
- Không dùng tên chung chung (common, misc, helpers)

### 6. **Pages belong to Features**

- Pages là routing endpoints → Luôn ở features
- Reusable UI → Tách thành components trong shared

### 7. **Services follow Domain**

- Domain entity services → shared/modules/{entity}/services
- Cross-cutting services → shared/services
- Role-specific services → features/{role}/services

---

## 📊 Tóm Tắt Bằng Bảng

| Loại Code                  | Đặt ở đâu                  | Ví dụ                              | Lý do                        |
| -------------------------- | -------------------------- | ---------------------------------- | ---------------------------- |
| **Pages** (routing)        | `features/{role}/pages/`   | `AdminProfile.tsx`                 | Routing endpoints thuộc role |
| **Role-specific logic**    | `features/{role}/`         | `accountService.ts` (admin only)   | Chỉ 1 role dùng              |
| **Domain entity**          | `shared/modules/{entity}/` | `spaces/`, `tracks/`               | Entity dùng chung, có CRUD   |
| **UI components**          | `shared/components/`       | `DataTable.tsx`, `ProfileView.tsx` | UI dùng chung                |
| **Cross-cutting services** | `shared/services/`         | `authService.ts`, `userService.ts` | API calls dùng chung         |
| **Generic hooks**          | `shared/hooks/`            | `useDebounce.ts`                   | React hooks generic          |
| **Utilities**              | `shared/utils/`            | `formatDate.ts`                    | Helper functions             |
| **Types**                  | `shared/types/`            | `commonTypes.ts`, `userTypes.ts`   | TypeScript types chung       |
| **Constants**              | `shared/constants/`        | `ROLE_LABELS`                      | Constants toàn cục           |

---

## 🔄 Workflow: Khi Thêm Code Mới

### Step 1: Xác định loại code

- Page? Component? Service? Hook? Util?

### Step 2: Áp dụng Decision Tree

1. Page? → `features/{role}/pages/`
2. Chỉ 1 role? → `features/{role}/`
3. Domain entity? → `shared/modules/{entity}/`
4. Còn lại? → `shared/{type}/`

### Step 3: Kiểm tra dependency

- Có import từ features khác? → ❌ Sai
- Shared import từ features? → ❌ Sai
- Features import từ shared? → ✅ Đúng

### Step 4: Review naming

- Tên folder rõ ràng?
- Tránh tên chung chung?
- Thể hiện đúng domain?

---

## 💡 Tips & Best Practices

### Tip 1: Khi không chắc chắn

**Bắt đầu với features**, sau đó refactor sang shared khi thấy duplicate.

```typescript
// Iteration 1: Đặt trong features/admin
features / admin / utils / formatCurrency.ts;

// Iteration 2: Brand cũng cần → Move to shared
shared / utils / formatCurrency.ts;
```

### Tip 2: Module vs Component

**Module** = Domain entity với business logic  
**Component** = UI presentation thuần túy

```typescript
// Module (có business logic)
shared/modules/spaces/
  ├── services/
  ├── hooks/
  └── types/

// Component (UI thuần)
shared/components/ui/
  └── DataTable.tsx
```

### Tip 3: Khi entity có role-specific logic

Tách thành:

- **Shared module** = Common CRUD
- **Feature services** = Role-specific logic

```typescript
// Common CRUD
shared / modules / playlists / services / playlistService.ts;

// Role-specific
features / admin / services / playlistApprovalService.ts;
features / brand / services / playlistCreationService.ts;
```

### Tip 4: Pages vs Components

**Rule of thumb:** Nếu có `<Route path="..." />` → Page → Features

```typescript
// ✅ Page (routing)
features / admin / pages / Dashboard / Dashboard.tsx;

// ✅ Component (reusable)
shared / components / dashboard / DashboardCard.tsx;
```

---

## 🎯 Checklist Khi Review Code

- [ ] Pages có ở đúng features không?
- [ ] Shared có import từ features không? (phải là không)
- [ ] Features có import từ features khác không? (phải là không)
- [ ] Domain entities có ở shared/modules không?
- [ ] Tên folder có rõ ràng không?
- [ ] Code có duplicate giữa features không? (nên move to shared)
- [ ] Dependency direction đúng không? (features → shared → config)

---

## 📖 Tài Liệu Liên Quan

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Chi tiết technical architecture
- [.github/copilot-instructions.md](./.github/copilot-instructions.md) - Coding standards

---

**Tóm lại:** Khi code, luôn tự hỏi 3 câu:

1. **Ai sở hữu?** → Features
2. **Ai cũng dùng?** → Shared
3. **Entity hay không?** → Modules

**Last Updated:** March 2026
