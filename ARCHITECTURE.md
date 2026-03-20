# CAMS Architecture Guide

## Dependency Rules

### Layer Structure

```
features/          (High-level, role-specific)
    ↓ can import
shared/            (Low-level, cross-cutting)
    ↓ can import
config/            (Lowest level, configuration)
```

### Critical Rules

1. **Shared CANNOT import from Features**
   - ❌ `shared/` importing from `features/auth`
   - ✅ `features/auth` importing from `shared/services`

2. **Features can import from Shared**
   - ✅ `features/admin` importing from `shared/services`
   - ✅ `features/brand` importing from `shared/components`

3. **Features can import from other Features (with caution)**
   - ⚠️ Only for types and constants
   - ❌ Avoid importing services/hooks between features

---

## Directory Structure

### `/src/shared/`

Cross-cutting concerns used by multiple features:

```
shared/
├── services/          # API services (auth, user, etc.)
├── components/        # Reusable UI components
├── hooks/            # Generic React hooks
├── utils/            # Utility functions
├── types/            # Shared TypeScript types
├── constants/        # Global constants
└── modules/          # Domain modules (spaces, tracks, playlists, etc.)
    ├── spaces/
    │   ├── services/
    │   ├── hooks/
    │   ├── types/
    │   └── constants/
    └── tracks/
        └── ...
```

### `/src/features/`

Role-specific features:

```
features/
├── auth/             # Authentication (login, profile)
├── admin/            # SystemAdmin features
├── brand/            # BrandManager features
└── store/            # StoreManager features
```

Each feature follows this structure:

```
features/{role}/
├── components/       # Role-specific components
├── hooks/           # Role-specific hooks
├── pages/           # Page components
├── routes/          # Route definitions
├── types/           # Role-specific types
├── constants/       # Role-specific constants
└── validations/     # Form validation schemas
```

---

## Query Keys Management

All React Query keys are centralized in `/src/config/query.ts`:

```typescript
export const QUERY_KEYS = {
  auth: {
    profile: ['auth', 'profile'] as const,
  },
  users: {
    all: ['users'] as const,
    list: (filter?: Record<string, unknown>) =>
      ['users', 'list', filter] as const,
    detail: (id?: string) => ['users', 'detail', id] as const,
  },
  // ... more keys
};
```

### Usage

```typescript
// ✅ Use centralized keys
useQuery({
  queryKey: QUERY_KEYS.users.detail(userId),
  queryFn: () => userService.getById(userId),
});

// ❌ Don't use hardcoded strings
useQuery({
  queryKey: ['users', userId],
  queryFn: () => userService.getById(userId),
});
```

---

## Service Layer Organization

### Shared Services (`/src/shared/services/`)

For cross-cutting API calls:

- `authService.ts` - Authentication (login, logout, profile, refresh)
- `userService.ts` - Basic user data access (getById only)

### Feature Services

For role-specific CRUD operations:

- `features/admin/services/accountService.ts` - Full user CRUD (SystemAdmin)
- `features/brand/services/staffService.ts` - Staff management (BrandManager)
- `features/store/services/` - Store-specific services

### Module Services (`/src/shared/modules/{entity}/services/`)

For domain entities used across features:

- `shared/modules/spaces/services/spaceService.ts`
- `shared/modules/tracks/services/trackService.ts`
- `shared/modules/playlists/services/playlistService.ts`

---

## Common Patterns

### Pattern 1: Auth Profile + User Detail

When you need both auth profile and full user details:

```typescript
// ✅ Use useMyProfile hook
import { useMyProfile } from '@/features/auth/hooks';

const { data: user, isLoading } = useMyProfile();
```

This hook:

1. Fetches auth profile (userId, roles, brandId, storeId)
2. Fetches full user detail by userId
3. Returns combined data with type `UserDetail`

### Pattern 2: Shared UI Components vs Pages

**Pages belong to features, not shared!**

```
❌ Wrong:
shared/modules/users/pages/ProfilePage.tsx

✅ Correct:
shared/components/profile/ProfileView.tsx    ← Presentation component
features/admin/pages/Profile/AdminProfile.tsx ← Page wrapper
features/brand/pages/Profile/BrandProfile.tsx
features/store/pages/Profile/StoreProfile.tsx
```

**Rule:** If it's used in routing (`<Route path="/profile" element={...} />`), it's a PAGE and belongs in `features/`. If it's a reusable UI component, it goes in `shared/components/`.

### Pattern 3: Cross-Feature Data Access

When Feature A needs data from Feature B's domain:

```typescript
// ❌ Don't import from other features
import { brandService } from '@/features/admin/services';

// ✅ Move shared logic to shared/modules
import { useBrands } from '@/shared/modules/brands/hooks';
```

### Pattern 4: Role-Specific vs Shared

**Use Feature Services when:**

- Logic is specific to one role
- Different roles have different permissions
- CRUD operations vary by role

**Use Shared Modules when:**

- Multiple roles need the same data
- Read-only access across features
- Domain entity is cross-cutting

---

## Migration Checklist

When refactoring code:

- [ ] Check dependency direction (features → shared, not reverse)
- [ ] Use QUERY_KEYS from config
- [ ] Move cross-cutting services to shared/
- [ ] Keep role-specific logic in features/
- [ ] Update imports after moving files
- [ ] Run diagnostics to verify no errors

---

## Examples

### ✅ Good Architecture

```typescript
// features/admin/hooks/useAccounts.ts
import { accountService } from '@/features/admin/services';
import { QUERY_KEYS } from '@/config';

export const useAccounts = (filter) => {
  return useQuery({
    queryKey: QUERY_KEYS.users.list(filter),
    queryFn: () => accountService.getList(filter),
  });
};
```

```typescript
// features/brand/pages/Dashboard.tsx
import { useMyProfile } from '@/features/auth/hooks';
import { useStores } from '@/shared/modules/stores/hooks';

const Dashboard = () => {
  const { data: user } = useMyProfile();
  const { data: stores } = useStores({ brandId: user?.brandId });
  // ...
};
```

### ❌ Bad Architecture

```typescript
// shared/hooks/useMyProfile.ts
import { accountService } from '@/features/admin/services'; // ❌ Shared importing from features

export const useMyProfile = () => {
  // ...
};
```

```typescript
// features/brand/hooks/useBrandStores.ts
import { storeService } from '@/features/admin/services'; // ❌ Feature importing from another feature

export const useBrandStores = () => {
  // ...
};
```

---

**Last Updated**: March 2026
