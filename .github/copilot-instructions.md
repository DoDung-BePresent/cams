# GitHub Copilot Instructions for CAMS Project

## Project Overview

**CAMS (Content and Music System)** is a React + TypeScript application for managing music content across multiple brands and stores. The system uses **role-based access control** with three user roles: SystemAdmin, BrandManager, and StoreManager.

---

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: Ant Design 5.x
- **Styling**: Tailwind CSS + UnoCSS
- **State Management**: TanStack Query (React Query) v5
- **Routing**: React Router v7
- **API Client**: Axios
- **Form Validation**: Yup
- **Maps**: Leaflet + React-Leaflet
- **Media**: HLS.js, WaveSurfer.js
- **SEO**: React Helmet Async

---

## 🎯 Core Architecture Principles

### 1. Feature-Based Structure

```
src/
├── features/           # Feature modules (admin, brand, store, auth)
├── shared/            # Shared utilities, components, types
├── layouts/           # Layout components per role
├── routes/            # Route definitions
├── providers/         # Context providers
└── config/            # Configuration files
```

### 2. Module Organization Pattern

Each feature module follows this structure:

```
features/{role}/
├── constants/         # Role-specific constants
├── hooks/            # Custom React Query hooks
├── pages/            # Page components
├── routes/           # Route definitions
├── services/         # API service layer
├── types/            # TypeScript types
└── validations/      # Yup validation schemas
```

### 3. Shared Modules Structure

```
shared/modules/{entity}/
├── components/       # Reusable components
├── constants/        # Entity constants
├── hooks/           # React Query hooks
├── services/        # API services
├── types/           # TypeScript types
└── validations/     # Validation schemas
```

---

## 📋 Code Style & Conventions

### TypeScript

#### Type Definitions

```typescript
// ✅ Use explicit type imports
import type { User } from '@/shared/types';

// ✅ Use Record for mapped types
export const STATUS_LABELS: Record<EntityStatusEnum, string> = {
  [EntityStatusEnum.Active]: 'Active',
  [EntityStatusEnum.Inactive]: 'Inactive',
};

// ✅ Use enum for status/role values
export enum EntityStatusEnum {
  Inactive = 0,
  Active = 1,
  Pending = 2,
  Rejected = 3,
}

// ❌ Avoid inline types in props
// ✅ Define types separately
type UserCardProps = {
  user: User;
  onSelect: (id: string) => void;
};
```

#### Type Naming

- **Interfaces/Types**: PascalCase with descriptive suffixes
  - `UserListItem`, `CreateUserRequest`, `UserDetailResponse`
- **Enums**: PascalCase with `Enum` suffix
  - `EntityStatusEnum`, `RoleEnum`
- **Props**: Component name + `Props`
  - `UserCardProps`, `DataTableProps<T>`

### React Components

#### Component Structure

```typescript
/**
 * Imports organized in sections
 */
import { useState } from 'react'; // React core
import { Button, Form } from 'antd'; // UI library
import { useAuth } from '@/providers'; // Hooks
import { UserCard } from './components'; // Local components
import type { User } from '@/shared/types'; // Types

/**
 * Component with JSDoc if needed
 */
export const UserList = () => {
  // 1. Hooks
  const [filter, setFilter] = useState<UserFilter>({});
  const { data, isLoading } = useUsers(filter);

  // 2. Event handlers
  const handleFilterChange = (key: string, value: any) => {
    setFilter(prev => ({ ...prev, [key]: value }));
  };

  // 3. Render helpers (if needed)
  const renderUserCard = (user: User) => <UserCard user={user} />;

  // 4. Return JSX
  return (
    <div>
      {/* Content */}
    </div>
  );
};
```

#### Component Naming

- **Page Components**: Descriptive name without suffix
  - `BrandList`, `CreateStore`, `Dashboard`
- **Drawer Components**: Entity + Action + `Drawer`
  - `CreateBrandDrawer`, `EditStoreDrawer`, `PlaylistDetailsDrawer`
- **Shared Components**: Descriptive name
  - `DataTable`, `PageHeader`, `MapPicker`

### File Naming

```
✅ Correct:
- UserList.tsx (PascalCase for components)
- useUsers.ts (camelCase for hooks)
- userService.ts (camelCase for services)
- userTypes.ts (camelCase for types)
- userConstants.ts (camelCase for constants)

❌ Incorrect:
- user-list.tsx (kebab-case)
- UserService.ts (PascalCase for non-components)
```

---

## 🎨 UI/UX Patterns

### Ant Design Components

#### Always Use Size Prop

```typescript
// ✅ All interactive components use size='large'
<Button size='large' />
<Input size='large' />
<Select size='large' />
<Form size='large' />
```

#### Modal vs Drawer

```typescript
// ✅ Use AppModal for confirmations
AppModal.confirm({
  title: 'Delete Brand',
  content: 'Are you sure?',
  okText: 'Delete',
  okButtonProps: { danger: true },
  onOk: () => handleDelete(),
});

// ✅ Use Drawer for forms/details
<CreateBrandDrawer open={open} onClose={onClose} />
```

#### Table Columns Pattern

```typescript
// ✅ Always use factory function for columns
export const getUserColumns = ({
  onView,
  onEdit,
  onDelete,
}: GetColumnsProps): ColumnsType<UserListItem> => [
  {
    title: 'Name',
    dataIndex: 'name',
    sorter: true,
  },
  // ... more columns
];
```

### Form Patterns

#### Form with Drawer

```typescript
export const CreateUserDrawer = ({ open, onClose, onSuccess }) => {
  const [form] = Form.useForm<CreateUserRequest>();
  const createUser = useCreateUser();

  useEffect(() => {
    if (open) {
      form.resetFields();
    }
  }, [open, form]);

  const handleSubmit = (values: CreateUserRequest) => {
    createUser.mutate(values, {
      onSuccess: () => {
        handleCancel();
        onSuccess?.();
      },
    });
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Drawer
      closeIcon={null}
      title='Create User'
      open={open}
      onClose={handleCancel}
      footer={
        <Flex justify='end' gap='small'>
          <Button size='large' onClick={handleCancel}>Cancel</Button>
          <Button
            size='large'
            type='primary'
            onClick={() => form.submit()}
            loading={createUser.isPending}
          >
            Create
          </Button>
        </Flex>
      }
    >
      <Form
        size='large'
        form={form}
        layout='vertical'
        onFinish={handleSubmit}
        styles={{ label: { height: 22 } }}
      >
        {/* Form fields */}
      </Form>
    </Drawer>
  );
};
```

### Page Header + SEO Pattern

```typescript
export const BrandList = () => {
  return (
    <div>
      <PageHeader
        title='Brand Management'
        breadcrumbs={breadcrumbs}
        extra={<Button>Create Brand</Button>}
        seo={{
          description: 'Manage all brands',
          keywords: 'brand, management',
        }}
      />
      {/* Page content */}
    </div>
  );
};
```

---

## 🔄 TanStack Query Patterns

### Query Hooks

```typescript
// ✅ Correct: Optional params, enabled flag
export const useUsers = (filter: UserFilter = {}) => {
  return useQuery({
    queryKey: ['users', filter],
    queryFn: () => userService.getList(filter),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// ✅ Single entity with conditional fetch
export const useUser = (id?: string, enabled = true) => {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => userService.getById(id!),
    enabled: !!id && enabled,
  });
};
```

### Mutation Hooks

```typescript
// ✅ Correct: Return useMutation directly
export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUserRequest) => userService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      message.success('User created successfully');
    },
    onError: (error) => {
      handleApiError(error);
    },
  });
};
```

---

## 🌐 API Service Layer

### Service Structure

```typescript
import { api } from '@/config/api';
import type { PaginationResult, Result } from '@/shared/types/commonTypes';
import type { UserListItem, CreateUserRequest } from '../types';

const USER_ENDPOINTS = {
  list: '/api/users',
  detail: (id: string) => `/api/users/${id}`,
  create: '/api/users',
} as const;

export const userService = {
  // GET with filters
  getList: (filter: UserFilter = {}) => {
    const params = new URLSearchParams();
    if (filter.page) params.append('page', filter.page.toString());
    if (filter.search) params.append('search', filter.search);

    return api.get<PaginationResult<UserListItem>>(
      `${USER_ENDPOINTS.list}?${params.toString()}`,
    );
  },

  // GET single
  getById: (id: string) =>
    api.get<Result<UserDetailResponse>>(USER_ENDPOINTS.detail(id)),

  // POST with JSON
  create: (data: CreateUserRequest) =>
    api.post<Result>(USER_ENDPOINTS.create, data),

  // POST with FormData (for file uploads)
  createWithAvatar: (formData: FormData) =>
    api.post<Result>(USER_ENDPOINTS.create, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // PUT/PATCH
  update: (id: string, data: UpdateUserRequest) =>
    api.patch<Result>(USER_ENDPOINTS.detail(id), data),

  // DELETE
  delete: (id: string) => api.delete<Result>(USER_ENDPOINTS.detail(id)),
};
```

### Response Types

```typescript
// ✅ Always use Result<T> for API responses
export interface Result<T = void> {
  isSuccess: boolean;
  message: string;
  data?: T;
  errors?: Array<{ field: string; message: string }> | null;
  errorCode?: string | null;
}

// ✅ Pagination wrapper
export interface PaginationResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
```

---

## 🎭 Role-Based Access Control

### Authorization Matrix

| Feature       | SystemAdmin |        BrandManager         |     StoreManager      |
| ------------- | :---------: | :-------------------------: | :-------------------: |
| **Brands**    |  Full CRUD  |         View (own)          |          N/A          |
| **Stores**    |  View all   |    Full CRUD (own brand)    |      View (own)       |
| **Tracks**    |  View all   |    Full CRUD (own brand)    |       View all        |
| **Playlists** |  View all   |    Full CRUD (own brand)    | Full CRUD (own store) |
| **Accounts**  |  Full CRUD  | View/Edit (own brand staff) |          N/A          |

### Route Protection

```typescript
// ✅ Routes are protected by role at layout level
const AdminRoutes = {
  path: '/admin',
  element: <AdminDashboardLayout />, // Checks role
  children: adminRoutes,
};
```

---

## 📦 Import Path Aliases

```typescript
// ✅ Use @ alias for src root
import { api } from '@/config/api';
import { useAuth } from '@/providers';
import { Button } from 'antd';

// ✅ Relative imports for local files
import { UserCard } from './components';
import { USER_STATUS } from './constants';
```

---

## 🎨 Styling Guidelines

### Tailwind/UnoCSS Classes

```typescript
// ✅ Use utility classes with ! for important
<div className='flex items-center justify-between mb-4!' />

// ✅ Use Ant Design's inline styles for specific values
<div style={{ marginBottom: 24 }} />

// ❌ Avoid mixing both for same property
```

### Component Styling Priority

1. **Ant Design props** (size, type, etc.)
2. **Utility classes** (Tailwind/UnoCSS)
3. **Inline styles** (specific values)
4. **CSS modules** (complex components only)

---

## 🔒 Validation Patterns

### Yup Schema

```typescript
import * as yup from 'yup';

export const createUserValidation = {
  email: [
    { required: true, message: 'Email is required' },
    { type: 'email', message: 'Invalid email format' },
  ],
  firstName: [
    { required: true, message: 'First name is required' },
    { max: 50, message: 'Maximum 50 characters' },
  ],
};

// ✅ Export Yup schema for API validation
export const createUserSchema = yup.object({
  email: yup.string().email().required(),
  firstName: yup.string().max(50).required(),
});
```

---

## 📊 Constants Organization

### Status/Role Constants

```typescript
// ✅ Use enum values as keys
export const ENTITY_STATUS_LABELS: Record<EntityStatusEnum, string> = {
  [EntityStatusEnum.Active]: 'Active',
  [EntityStatusEnum.Inactive]: 'Inactive',
};

// ✅ Ant Design Select options
export const ENTITY_STATUS_OPTIONS: SelectProps['options'] = [
  { label: 'Active', value: EntityStatusEnum.Active },
  { label: 'Inactive', value: EntityStatusEnum.Inactive },
];
```

---

## 🐛 Error Handling

### API Error Handler

```typescript
// ✅ Use centralized error handler
import { handleApiError } from '@/shared/utils';

onError: (error) => {
  handleApiError(error); // Shows Ant Design message
};
```

### Form Error Display

```typescript
// ✅ Backend errors map to form fields
if (error.response?.data?.errors) {
  form.setFields(
    error.response.data.errors.map((e) => ({
      name: e.field,
      errors: [e.message],
    })),
  );
}
```

---

## 📝 Comments & Documentation

### When to Comment

```typescript
// ✅ Complex business logic
// Calculate total duration excluding break time
const activeDuration = totalSeconds - breakSeconds;

// ✅ API endpoint documentation
/**
 * POST /api/users/{id}/reset-password
 * Requires SystemAdmin role
 */
resetPassword: (id: string, data: ResetPasswordRequest) => {...}

// ❌ Self-explanatory code
// Set user to null
setUser(null);
```

---

## 🚫 What to Avoid

```typescript
// ❌ Don't use any
const data: any = response.data;

// ✅ Use proper types
const data: UserDetailResponse = response.data;

// ❌ Don't use inline styles for reusable values
<Button style={{ fontSize: 16 }} />

// ✅ Use Tailwind or Ant Design props
<Button size='large' />

// ❌ Don't create multiple hooks for same entity
useGetUsers(), useFetchUsers(), useLoadUsers()

// ✅ Single hook with options
useUsers(filter)

// ❌ Don't put business logic in components
const isValid = user.status === 1 && user.email.includes('@');

// ✅ Extract to utils/helpers
const isValidUser = (user: User) => {...}
```

---

## 🎯 Quick Reference Checklist

When creating a new feature:

- [ ] Create feature folder under `features/{role}/`
- [ ] Define types in `types/{entity}Types.ts`
- [ ] Create API service in `services/{entity}Service.ts`
- [ ] Create React Query hooks in `hooks/{entity}/`
- [ ] Create validation schemas in `validations/{entity}Validation.ts`
- [ ] Create constants in `constants/{entity}Constants.ts`
- [ ] Create page components in `pages/{Entity}Management/`
- [ ] Create drawer components in `pages/{Entity}Management/components/`
- [ ] Add routes to `routes/{role}Routes.tsx`
- [ ] Update menu items in `constants/{role}MenuItems.tsx`
- [ ] Update route map in `constants/{role}RouteMap.ts`
- [ ] Use `PageHeader` with SEO for list pages
- [ ] Use `AppModal.confirm()` for delete confirmations
- [ ] Use `Drawer` for create/edit/details forms
- [ ] Always use `size='large'` for interactive components
- [ ] Implement proper error handling with `handleApiError()`

---

## 🔄 Migration Notes

When updating existing code:

1. **Replace Modal with AppModal** for confirmations
2. **Replace Modal with Drawer** for forms
3. **Add SEO to PageHeader** instead of separate Seo component
4. **Use Result<T>** type for all API responses
5. **Use EntityStatusEnum** instead of hardcoded numbers
6. **Add size='large'** to all buttons, inputs, selects
7. **Replace filterOption** with `optionFilterProp='label'` in Select

---

## 📚 Common Patterns Reference

See `/docs/patterns/` for detailed examples:

- CRUD operations
- Role-based features
- File uploads
- Map integration
- Media players
- Table with filters
- Drawer forms

---

**Last Updated**: March 2026  
**Version**: 1.0.0
