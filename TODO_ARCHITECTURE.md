# CAMS Architecture - TODO & Improvements

> **Mục đích:** Tracking các cải thiện cần làm cho kiến trúc CAMS  
> **Đánh giá hiện tại:** 78/100 - Khá tốt! 🎉  
> **Cập nhật:** March 2026

---

## 📊 Đánh Giá Tổng Quan

| Khía Cạnh                  | Điểm | Trạng Thái   | Ghi Chú                                |
| -------------------------- | ---- | ------------ | -------------------------------------- |
| **Separation of Concerns** | 9/10 | ✅ Tốt       | Chỉ cần clarify auth placement         |
| **Domain-Driven Design**   | 9/10 | ✅ Excellent | Module structure rất tốt               |
| **Type Safety**            | 9/10 | ✅ Strong    | TypeScript usage tốt                   |
| **Code Reusability**       | 8/10 | ⚠️ Good      | Có thể improve với base services       |
| **Scalability**            | 9/10 | ✅ Excellent | Dễ add features/modules mới            |
| **Maintainability**        | 8/10 | ⚠️ Good      | Clear structure, cần thêm tests        |
| **Documentation**          | 7/10 | ⚠️ OK        | Good docs, cần inline comments         |
| **Error Handling**         | 8/10 | ⚠️ Good      | Centralized, có thể thêm custom errors |
| **Testing**                | 3/10 | ❌ Critical  | Thiếu tests nghiêm trọng               |
| **Performance**            | 8/10 | ✅ Good      | React Query usage tốt                  |

**Tổng điểm: 78/100**

---

## 🎯 Roadmap Cải Thiện

### Phase 1: Critical (Làm ngay) 🔴

#### 1.1 Clarify Auth Structure

**Trạng thái:** ✅ DONE  
**Priority:** HIGH  
**Effort:** 2-3 hours  
**Completed:** March 2026

**Vấn đề:**

```
features/auth/          ← Auth là feature?
shared/services/
  └── authService.ts    ← Nhưng service lại ở shared?
```

**Giải pháp đã áp dụng (Updated March 2026):**

```
shared/modules/auth/
├── services/
│   ├── authService.ts     ← ✅ Moved to module
│   └── index.ts
├── hooks/
│   ├── useProfile.ts      ← ✅ Moved to module
│   ├── useMyProfile.ts    ← ✅ Moved to module
│   └── index.ts
└── types/
    ├── authTypes.ts       ← ✅ Moved to module
    └── index.ts

shared/modules/users/
├── services/
│   ├── userService.ts     ← ✅ Moved to module
│   └── index.ts
└── types/
    ├── userTypes.ts       ← ✅ Moved to module
    └── index.ts

features/auth/
├── pages/
│   └── LoginPage.tsx      ← ✅ Kept pages only
├── components/
│   └── LoginForm.tsx
└── validations/
    └── authValidation.ts
```

**Rationale:**

- Auth and Users are domain entities → belong in `shared/modules/`
- Consistent with other modules (spaces, tracks, playlists)
- Each module has services, hooks, types structure
- Backward compatibility via re-exports in `shared/services/`, `shared/hooks/`, `shared/types/`

**Tasks:**

- [x] Create `shared/modules/auth/` structure
- [x] Move authService → `modules/auth/services/`
- [x] Move auth hooks → `modules/auth/hooks/`
- [x] Move auth types → `modules/auth/types/`
- [x] Create `shared/modules/users/` structure
- [x] Move userService → `modules/users/services/`
- [x] Move user types → `modules/users/types/`
- [x] Add re-exports for backward compatibility
- [x] Update all imports
- [x] Delete old files
- [x] Update ARCHITECTURE_MINDSET.md
- [ ] Test thoroughly (next)

---

#### 1.2 Add Unit Tests

**Trạng thái:** ⏳ TODO  
**Priority:** CRITICAL  
**Effort:** 2-3 weeks

**Target Coverage:** 70%+

**Test Structure:**

```
src/
├── features/
│   └── admin/
│       ├── services/
│       │   ├── accountService.ts
│       │   └── accountService.test.ts    ← Add
│       └── hooks/
│           ├── useAccounts.ts
│           └── useAccounts.test.ts       ← Add
├── shared/
│   ├── utils/
│   │   ├── formatDate.ts
│   │   └── formatDate.test.ts            ← Add
│   └── modules/
│       └── spaces/
│           └── services/
│               ├── spaceService.ts
│               └── spaceService.test.ts  ← Add
```

**Tasks:**

- [ ] Setup testing framework (Vitest recommended)
- [ ] Add tests cho shared/utils (easiest first)
- [ ] Add tests cho shared/services
- [ ] Add tests cho shared/modules/\*/services
- [ ] Add tests cho features/\*/services
- [ ] Add tests cho hooks (React Testing Library)
- [ ] Setup CI/CD to run tests
- [ ] Add coverage reports

**Example Test:**

```typescript
// shared/utils/formatDate.test.ts
import { describe, it, expect } from 'vitest';
import { formatDate } from './formatDate';

describe('formatDate', () => {
  it('should format ISO date correctly', () => {
    const result = formatDate('2026-03-20T10:00:00Z');
    expect(result).toBe('Mar 20, 2026');
  });

  it('should handle null/undefined', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate(undefined)).toBe('—');
  });
});
```

---

#### 1.3 Add Error Boundaries

**Trạng thái:** ✅ DONE  
**Priority:** HIGH  
**Effort:** 4-6 hours  
**Completed:** March 2026

**Implementation completed:**

```typescript
// shared/components/common/ErrorBoundary.tsx
// Enhanced with:
// - Custom fallback prop
// - onReset callback
// - Dev-only error details
// - Try Again button

// shared/components/common/FeatureErrorFallback.tsx
// Feature-specific error UI with:
// - Navigation options (Go Home, Go Back)
// - Custom feature name
// - Try Again option
```

**Integration:**

```typescript
// App.tsx - Root level
<ErrorBoundary>
  <AppProvider>
    <RouterProvider router={router} />
  </AppProvider>
</ErrorBoundary>

// Each layout - Feature level
<ErrorBoundary fallback={<FeatureErrorFallback featureName='Admin Dashboard' />}>
  <Outlet />
</ErrorBoundary>
```

**Tasks:**

- [x] Enhance ErrorBoundary component with fallback, onReset, dev details
- [x] Create FeatureErrorFallback component
- [x] Add to App.tsx (root level) - already existed
- [x] Add to AdminDashboardLayout
- [x] Add to BrandDashboardLayout
- [x] Add to StoreDashboardLayout
- [x] Export from shared/components
- [ ] Test error boundaries (manual testing recommended)
- [ ] Integrate with monitoring service (future - Phase 2)

---

### Phase 2: Important (1-2 tuần) 🟡

#### 2.1 Refactor Shared Base Services

**Trạng thái:** ⏳ TODO  
**Priority:** MEDIUM  
**Effort:** 1 week

**Vấn đề:** Duplicate code giữa `accountService` và `staffService`

**Giải pháp:**

```typescript
// shared/modules/users/services/userService.ts
export const userService = {
  // Base CRUD operations
  getById: (id: string) => api.get<Result<UserDetail>>(`/api/users/${id}`),

  getList: (filter: UserFilter) => {
    const params = new URLSearchParams();
    // ... build params
    return api.get<PaginationResult<UserListItem>>(`/api/users?${params}`);
  },

  update: (id: string, formData: FormData) =>
    api.patch<Result>(`/api/users/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  toggleStatus: (id: string) => api.put<Result>(`/api/users/${id}/status`),
};

// features/admin/services/accountService.ts
import { userService } from '@/shared/modules/users/services';

export const accountService = {
  ...userService,

  // Admin-specific operations
  create: (formData: FormData) =>
    api.post<Result>('/api/users', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  resetPassword: (id: string, data: ResetPasswordRequest) =>
    api.put<Result>(`/api/users/${id}/reset-password`, data),

  assignBrand: (id: string, data: AssignBrandRequest) =>
    api.put<Result>(`/api/users/${id}/brand`, data),
};
```

**Tasks:**

- [ ] Create `shared/modules/users/` structure
- [ ] Move common user operations to base service
- [ ] Refactor `accountService` to extend base
- [ ] Refactor `staffService` to extend base
- [ ] Update all imports
- [ ] Test thoroughly

---

#### 2.2 Add API Interceptors

**Trạng thái:** ⏳ TODO  
**Priority:** MEDIUM  
**Effort:** 1 day

**Implementation:**

```typescript
// config/api.ts
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000,
  withCredentials: true,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add request ID for tracing
    config.headers['X-Request-ID'] = uuidv4();

    // Add timestamp
    config.headers['X-Request-Time'] = new Date().toISOString();

    // Add auth token (if not already set)
    const token = localStorage.getItem('accessToken');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  },
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.config.url} - ${response.status}`);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 - Unauthorized (token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const response = await api.post('/api/auth/refresh-token');
        const { accessToken } = response.data.data;

        // Update token
        localStorage.setItem('accessToken', accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        // Retry original request
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed - redirect to login
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle 403 - Forbidden
    if (error.response?.status === 403) {
      console.error('[API] Access denied');
      // Optional: Show notification or redirect
    }

    // Log error
    console.error('[API Response Error]', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
    });

    return Promise.reject(error);
  },
);
```

**Tasks:**

- [ ] Add request interceptor (auth, tracing, logging)
- [ ] Add response interceptor (error handling, retry)
- [ ] Implement token refresh logic
- [ ] Add request/response logging
- [ ] Test with expired tokens
- [ ] Test with network errors

---

#### 2.3 Add Logging/Monitoring

**Trạng thái:** ⏳ TODO  
**Priority:** MEDIUM  
**Effort:** 2-3 days

**Options:**

- Sentry (Error tracking)
- LogRocket (Session replay)
- Google Analytics (Usage tracking)

**Implementation:**

```typescript
// shared/services/monitoringService.ts
import * as Sentry from '@sentry/react';

export const monitoringService = {
  init: () => {
    if (import.meta.env.PROD) {
      Sentry.init({
        dsn: import.meta.env.VITE_SENTRY_DSN,
        environment: import.meta.env.MODE,
        tracesSampleRate: 1.0,
      });
    }
  },

  logError: (error: Error, context?: Record<string, any>) => {
    console.error(error);
    if (import.meta.env.PROD) {
      Sentry.captureException(error, { extra: context });
    }
  },

  logEvent: (eventName: string, data?: Record<string, any>) => {
    console.log(`[Event] ${eventName}`, data);
    // Send to analytics
  },
};
```

**Tasks:**

- [ ] Choose monitoring service
- [ ] Setup account and get API keys
- [ ] Implement monitoring service
- [ ] Integrate with ErrorBoundary
- [ ] Add to API interceptors
- [ ] Test error reporting

---

### Phase 3: Nice to Have (Khi có thời gian) 🟢

#### 3.1 Add Storybook

**Trạng thái:** ⏳ TODO  
**Priority:** LOW  
**Effort:** 1 week

**Benefits:**

- Component documentation
- Visual testing
- Design system showcase

**Tasks:**

- [ ] Install Storybook
- [ ] Add stories for shared/components
- [ ] Add stories for shared/modules/\*/components
- [ ] Setup Storybook deployment
- [ ] Add interaction tests

---

#### 3.2 Add E2E Tests

**Trạng thái:** ⏳ TODO  
**Priority:** LOW  
**Effort:** 2-3 weeks

**Framework:** Playwright or Cypress

**Test Scenarios:**

- [ ] Login flow
- [ ] Create/Edit/Delete operations
- [ ] Role-based access control
- [ ] Form validation
- [ ] Error handling

---

#### 3.3 Add Performance Monitoring

**Trạng thái:** ⏳ TODO  
**Priority:** LOW  
**Effort:** 3-5 days

**Metrics to track:**

- Page load time
- API response time
- React component render time
- Bundle size

**Tools:**

- Lighthouse CI
- Web Vitals
- React DevTools Profiler

---

#### 3.4 Add Code Coverage Reports

**Trạng thái:** ⏳ TODO  
**Priority:** LOW  
**Effort:** 1 day

**Setup:**

```json
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.ts',
        '**/*.test.tsx',
      ],
    },
  },
});
```

**Tasks:**

- [ ] Configure coverage in vitest
- [ ] Add coverage badge to README
- [ ] Setup coverage threshold (70%+)
- [ ] Add to CI/CD pipeline

---

## 🔧 Specific Improvements

### Improvement 1: Config Structure

**Trạng thái:** ⏳ TODO  
**Priority:** LOW  
**Effort:** 2 hours

**Current:**

```
config/
├── api.ts
├── env.ts
├── query.ts      ← QUERY_KEYS + STALE_TIME mixed
├── theme.ts
└── ui.ts
```

**Proposed:**

```
config/
├── api.ts
├── env.ts
├── constants/
│   ├── queryKeys.ts    ← Tách riêng
│   ├── staleTime.ts    ← Tách riêng
│   └── ui.ts           ← DRAWER_WIDTHS, MODAL_WIDTHS
├── theme.ts
└── index.ts
```

**Tasks:**

- [ ] Create `config/constants/` folder
- [ ] Split `query.ts` into `queryKeys.ts` and `staleTime.ts`
- [ ] Move UI constants to `constants/ui.ts`
- [ ] Update all imports
- [ ] Update documentation

---

### Improvement 2: Add Service Documentation

**Trạng thái:** ⏳ TODO  
**Priority:** LOW  
**Effort:** 2-3 hours

**Add README files:**

```
shared/services/README.md
shared/modules/spaces/README.md
shared/modules/tracks/README.md
```

**Template:**

```markdown
# {Module} Service

## Purpose

Brief description of what this service does.

## When to Use

- Use case 1
- Use case 2

## API Reference

- `getList(filter)` - Get paginated list
- `getById(id)` - Get single item
- ...

## Examples

\`\`\`typescript
// Example usage
\`\`\`
```

---

### Improvement 3: Custom Error Classes

**Trạng thái:** ⏳ TODO  
**Priority:** LOW  
**Effort:** 3-4 hours

**Implementation:**

```typescript
// shared/types/errors.ts
export class ApiError extends Error {
  constructor(
    public code: ErrorCodeEnum,
    public statusCode: number,
    message: string,
    public details?: any,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ValidationError extends Error {
  constructor(public fields: Array<{ field: string; message: string }>) {
    super('Validation failed');
    this.name = 'ValidationError';
  }
}

export class NetworkError extends Error {
  constructor(message: string = 'Network error occurred') {
    super(message);
    this.name = 'NetworkError';
  }
}
```

**Usage:**

```typescript
// In services
try {
  const response = await api.get('/api/users');
  return response.data;
} catch (error) {
  if (axios.isAxiosError(error)) {
    throw new ApiError(
      ErrorCodeEnum.NetworkError,
      error.response?.status || 500,
      error.message,
      error.response?.data,
    );
  }
  throw error;
}
```

---

## 📝 Documentation Improvements

### Doc 1: Add Inline Comments

**Trạng thái:** ⏳ TODO  
**Priority:** LOW  
**Effort:** Ongoing

**Guidelines:**

```typescript
// ✅ Good - Explain WHY, not WHAT
// Use sliding-window algorithm to avoid repeating recently played playlists
const selectPlaylist = (history: string[]) => {...}

// ❌ Bad - Obvious comment
// Get user by ID
const getUser = (id: string) => {...}
```

**Focus areas:**

- Complex business logic
- Non-obvious algorithms
- Workarounds for bugs
- Performance optimizations

---

### Doc 2: Add ADR (Architecture Decision Records)

**Trạng thái:** ⏳ TODO  
**Priority:** LOW  
**Effort:** 1-2 hours per decision

**Template:**

```markdown
# ADR-001: Use React Query for State Management

## Status

Accepted

## Context

Need to manage server state efficiently...

## Decision

Use React Query instead of Redux...

## Consequences

Pros:

- Less boilerplate
- Built-in caching

Cons:

- Learning curve
```

**Topics to document:**

- Why features by role?
- Why shared/modules structure?
- Why React Query over Redux?
- Why Ant Design?

---

## ✅ Completed Improvements

### ✓ 1.1 Clarify Auth Structure

**Completed:** March 2026  
**Impact:** High

Moved auth hooks and types from `features/auth` to `shared`:

- `shared/hooks/auth/useProfile.ts`
- `shared/hooks/auth/useMyProfile.ts`
- `shared/types/authTypes.ts`

`features/auth/` now only contains pages, components, and validations.

---

### ✓ 1.3 Add Error Boundaries

**Completed:** March 2026  
**Impact:** High

Enhanced ErrorBoundary with:

- Custom fallback prop
- onReset callback
- Dev-only error details display
- Try Again functionality

Created FeatureErrorFallback for feature-specific errors with navigation options.

Integrated at two levels:

- Root level: App.tsx wraps entire app
- Feature level: Each dashboard layout (Admin, Brand, Store) wraps its routes

---

### ✓ Centralized Query Keys

**Completed:** March 2026  
**Impact:** High

Created `QUERY_KEYS` in `config/query.ts` for consistent cache management.

---

### ✓ Shared Services Structure

**Completed:** March 2026  
**Impact:** High

Moved `authService` and `userService` to `shared/services/` for cross-cutting concerns.

---

### ✓ Architecture Documentation

**Completed:** March 2026  
**Impact:** High

Created:

- `ARCHITECTURE.md` - Technical details
- `ARCHITECTURE_MINDSET.md` - Decision-making guide
- `TODO_ARCHITECTURE.md` - Improvement roadmap

---

## 📊 Progress Tracking

### Overall Progress: 40% Complete (2/5 Critical Tasks Done)

| Phase                  | Progress | Status         |
| ---------------------- | -------- | -------------- |
| Phase 1 (Critical)     | 2/3      | ⏳ In Progress |
| Phase 2 (Important)    | 0/3      | ⏳ Not Started |
| Phase 3 (Nice to Have) | 0/4      | ⏳ Not Started |

### Priority Breakdown

| Priority        | Total | Completed | Remaining |
| --------------- | ----- | --------- | --------- |
| 🔴 Critical     | 3     | 2         | 1         |
| 🟡 Important    | 3     | 0         | 3         |
| 🟢 Nice to Have | 4     | 0         | 4         |

---

## 🎯 Next Steps

### This Week

1. [x] Clarify auth structure (2-3 hours) ✅ DONE
2. [x] Add Error Boundaries (4-6 hours) ✅ DONE
3. [ ] Setup testing framework (2-3 hours)
4. [ ] Add first batch of unit tests (4-6 hours)

### This Month

1. [x] Complete Phase 1 Critical: Auth structure ✅
2. [x] Complete Phase 1 Critical: Error boundaries ✅
3. [ ] Complete Phase 1 Critical: Unit tests (1.2)
4. [ ] Start Phase 2 (API interceptors)
5. [ ] Reach 50% test coverage

### This Quarter

1. [ ] Complete Phase 2 (Important items)
2. [ ] Reach 70% test coverage
3. [ ] Start Phase 3 (Nice to Have)

---

## 📚 Resources

### Testing

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

### Error Handling

- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [Sentry React Integration](https://docs.sentry.io/platforms/javascript/guides/react/)

### Architecture

- [Feature-Sliced Design](https://feature-sliced.design/)
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)

---

**Last Updated:** March 2026  
**Next Review:** April 2026
