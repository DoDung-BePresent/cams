# 🎨 CAMS Frontend - Coding Standards

> **Last Updated:** 2026-03-10
> **Purpose:** Ensure consistency across all features (admin, brand, store)

---

## 📦 **1. API Response Handling**

### **1.1 Response Structure**

All API responses follow this pattern:

```typescript
// shared/types/commonTypes.ts
export interface Result<T = any> {
  success: boolean;
  message: string;
  data: T;
  errors?: Record<string, string[]>;
}

export interface PaginationResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}
```

---

### **1.2 Service Layer Response**

**✅ CORRECT - Services return raw response:**

```typescript
// services/spaceService.ts
export const spaceService = {
  getList: (filter: SpaceFilter = {}) => {
    return api.get<SpacePaginationResult>(`${SPACE_ENDPOINTS.list}?${params}`);
    // Returns: { data: { items: [...], page: 1, ... } }
  },

  getById: (id: string) => {
    return api.get<Result<SpaceDetailResponse>>(SPACE_ENDPOINTS.detail(id));
    // Returns: { data: { success: true, data: {...}, message: "..." } }
  },

  create: (data: CreateSpaceRequest) => {
    return api.post<Result>(SPACE_ENDPOINTS.create, data);
    // Returns: { data: { success: true, message: "...", data: {...} } }
  },
};
```

**❌ WRONG - Services should NOT unwrap data:**

```typescript
// ❌ DON'T DO THIS in service layer
getById: (id: string) => {
  const response = await api.get<Result<SpaceDetailResponse>>(...);
  return response.data.data; // ❌ NO! Keep full response
}
```

---

### **1.3 Hook Layer Response Unwrapping**

**✅ CORRECT - Hooks unwrap data for component use:**

```typescript
// hooks/useSpace.ts
export const useSpace = (id?: string, enabled = true) => {
  return useQuery({
    queryKey: ['space', id],
    queryFn: async () => {
      if (!id) throw new Error('Space ID is required');
      const response = await spaceService.getById(id);
      return response.data.data; // ✅ Unwrap here for component
    },
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000,
  });
};
```

**Component usage:**

```typescript
const { data: space, isLoading } = useSpace(spaceId);
// ✅ `space` is SpaceDetailResponse, NOT Result<SpaceDetailResponse>
```

---

### **1.4 List Endpoint Pattern**

**✅ CORRECT - List endpoints return `PaginationResult` directly:**

```typescript
// hooks/useSpaces.ts
export const useSpaces = (filter: SpaceFilter = {}) => {
  return useQuery({
    queryKey: ['spaces', filter],
    queryFn: () => spaceService.getList(filter),
    // Returns: { data: { items: [...], page: 1, pageSize: 10, ... } }
    staleTime: 5 * 60 * 1000,
  });
};

// Component usage
const { data, isLoading } = useSpaces(filter);
console.log(data?.items); // ✅ Direct access to items
console.log(data?.totalPages); // ✅ Direct access to pagination
```

**❌ WRONG - Don't wrap list response in Result:**

```typescript
// ❌ Backend should NOT return this for list endpoints:
{
  success: true,
  data: { items: [...], page: 1, ... }
}

// ✅ Backend SHOULD return this directly:
{ items: [...], page: 1, pageSize: 10, totalItems: 50, totalPages: 5 }
```

---

### **1.5 Mutation Response Pattern**

**✅ CORRECT - Mutations check `response.data.success`:**

```typescript
// hooks/useCreateSpace.ts
export const useCreateSpace = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSpaceRequest) => spaceService.create(data),
    onSuccess: (response) => {
      // ✅ Check response.data.success
      if (response.data.success) {
        queryClient.invalidateQueries({ queryKey: ['spaces'] });
        message.success(response.data.message || 'Space created successfully!');
      }
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message || 'Failed to create space.';
      message.error(errorMessage);
    },
  });
};
```

---

## 🗂️ **2. File Organization Standards**

### **2.1 Feature Structure (admin, brand, store)**

```
features/{feature}/
├── constants/
│   ├── index.ts              ✅ REQUIRED - Barrel export
│   └── {feature}Constants.ts
├── hooks/
│   ├── index.ts              ✅ REQUIRED - Barrel export
│   ├── use{Entity}.ts        (GET detail)
│   ├── use{Entities}.ts      (GET list)
│   ├── useCreate{Entity}.ts  (POST)
│   ├── useUpdate{Entity}.ts  (PUT)
│   ├── useDelete{Entity}.ts  (DELETE)
│   └── useToggle{Entity}Status.ts
├── services/
│   ├── index.ts              ✅ REQUIRED - Barrel export
│   └── {entity}Service.ts
├── types/
│   ├── index.ts              ✅ REQUIRED - Barrel export
│   └── {entity}Types.ts
├── validations/
│   ├── index.ts              ✅ REQUIRED - Barrel export
│   └── {entity}Validation.ts
└── pages/
    └── {EntityManagement}/
        ├── {Entity}List.tsx
        └── components/
            ├── index.ts      ✅ REQUIRED - Barrel export
            ├── {Entity}TableColumns.tsx
            ├── Create{Entity}Drawer.tsx
            ├── Edit{Entity}Drawer.tsx
            └── ...
```

---

### **2.2 Shared Module Structure**

```
shared/modules/{module}/
├── constants/
│   ├── index.ts
│   └── {module}Constants.ts
├── types/
│   ├── index.ts
│   └── {module}Types.ts
├── services/
│   ├── index.ts
│   └── {module}Service.ts
├── hooks/
│   ├── index.ts
│   └── use{Action}.ts
├── validations/
│   ├── index.ts
│   └── {module}Validation.ts
└── components/
    ├── index.ts
    └── {Component}.tsx
```

---

## 📝 **3. Import Standards**

### **3.1 Import Order**

```typescript
// 1. React & external libraries
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Table, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';

// 2. Shared modules (sorted alphabetically)
import { ENTITY_STATUS_LABELS } from '@/shared/constants';
import { useTracks } from '@/shared/modules/tracks/hooks';
import type { TrackListItem } from '@/shared/modules/tracks/types';

// 3. Feature-specific imports (sorted alphabetically)
import { useCreateSpace } from '@/features/store/hooks';
import type { SpaceFilter } from '@/features/store/types';

// 4. Local imports (relative paths)
import { getSpaceColumns } from './components';
import './styles.css';
```

---

### **3.2 Barrel Exports Usage**

**✅ CORRECT - Use barrel exports:**

```typescript
// ✅ GOOD
import {
  useTracks,
  useCreateTrack,
  useDeleteTrack,
} from '@/shared/modules/tracks/hooks';
import {
  TRACK_ENDPOINTS,
  GENRE_OPTIONS,
} from '@/shared/modules/tracks/constants';
import type { TrackListItem, TrackFilter } from '@/shared/modules/tracks/types';
```

**❌ WRONG - Direct file imports:**

```typescript
// ❌ BAD
import { useTracks } from '@/shared/modules/tracks/hooks/useTracks';
import { useCreateTrack } from '@/shared/modules/tracks/hooks/useCreateTrack';
```

---

## 🎯 **4. Naming Conventions**

### **4.1 Files**

| Type           | Convention                         | Example                                  |
| -------------- | ---------------------------------- | ---------------------------------------- |
| **Component**  | PascalCase                         | `SpaceList.tsx`, `CreateSpaceDrawer.tsx` |
| **Hook**       | camelCase with `use` prefix        | `useSpaces.ts`, `useCreateSpace.ts`      |
| **Service**    | camelCase with `Service` suffix    | `spaceService.ts`, `trackService.ts`     |
| **Type**       | camelCase with `Types` suffix      | `spaceTypes.ts`, `trackTypes.ts`         |
| **Constant**   | camelCase with `Constants` suffix  | `spaceConstants.ts`                      |
| **Validation** | camelCase with `Validation` suffix | `spaceValidation.ts`                     |

---

### **4.2 Variables & Functions**

```typescript
// ✅ CORRECT
const spaceList = data?.items || [];
const isLoading = query.isLoading;
const handleCreateSpace = () => { ... };
const onSubmit = (values: CreateSpaceRequest) => { ... };

// ❌ WRONG
const SpaceList = data?.items || []; // Should be camelCase
const IsLoading = query.isLoading;   // Should be camelCase
```

---

### **4.3 Types & Interfaces**

```typescript
// ✅ CORRECT - PascalCase
export interface SpaceListItem extends BaseResponse { ... }
export interface CreateSpaceRequest { ... }
export type SpacePaginationResult = PaginationResult<SpaceListItem>;
export enum SpaceTypeEnum { ... }

// ❌ WRONG
export interface spaceListItem { ... } // Should be PascalCase
export interface create_space_request { ... } // Use PascalCase, not snake_case
```

---

## 🔧 **5. React Query Patterns**

### **5.1 Query Keys Convention**

```typescript
// ✅ CORRECT - Hierarchical query keys
queryKey: ['spaces']; // List all
queryKey: ['spaces', filter]; // List with filter
queryKey: ['spaces', spaceId]; // Single item detail
queryKey: ['spaces', spaceId, 'devices']; // Nested resource

// ❌ WRONG
queryKey: ['space-list']; // Use plural for collections
queryKey: ['getSpaces']; // Don't include action verb
```

---

### **5.2 Mutation Invalidation**

```typescript
// ✅ CORRECT - Invalidate all related queries
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['spaces'] }); // Invalidates all spaces queries
  message.success('Space created successfully!');
};

// ❌ WRONG - Too specific
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['spaces', filter] }); // Only invalidates with exact filter
};
```

---

### **5.3 Stale Time**

```typescript
// ✅ CORRECT - Use consistent stale time
staleTime: 5 * 60 * 1000, // 5 minutes

// ❌ WRONG - Inconsistent or no stale time
staleTime: 300000, // Use readable expression
// or no staleTime at all
```

---

## 🎨 **6. Component Patterns**

### **6.1 Drawer/Modal Props**

```typescript
// ✅ CORRECT - Consistent prop naming
interface CreateSpaceDrawerProps {
  open: boolean; // Always `open` for visibility
  onClose: () => void; // Always `onClose` for close handler
  onSuccess?: () => void; // Optional success callback
}

// ❌ WRONG
interface CreateSpaceDrawerProps {
  visible: boolean; // Use `open` instead
  handleClose: () => void; // Use `onClose` instead
}
```

---

### **6.2 Table Columns Pattern**

```typescript
// ✅ CORRECT - Exported function with actions
export const getSpaceColumns = ({
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
}: SpaceColumnActions): ColumnsType<SpaceListItem> => [
  // ... columns
];

// Usage in component
const columns = getSpaceColumns({
  onView: handleViewSpace,
  onEdit: handleEditSpace,
  onDelete: handleDeleteSpace,
  onToggleStatus: handleToggleStatus,
});
```

---

### **6.2 Form Layout in Drawer/Modal**

**✅ CORRECT - Standard form configuration:**

```tsx
<Form
  size='large'
  form={form}
  layout='vertical'
  onFinish={handleSubmit}
  styles={{
    label: {
      height: 22, // ✅ REQUIRED - Consistent label height
    },
  }}
>
  {/* Form items */}
</Form>
```

**❌ WRONG - Missing label height:**

```tsx
<Form
  size='large'
  form={form}
  layout='vertical'
  onFinish={handleSubmit}
>
  {/* ❌ Missing styles prop for label height */}
</Form>
```

---

### **6.3 Form Section Organization**

**✅ CORRECT - Group related fields with section titles:**

```tsx
{
  /* Basic Information */
}
<div style={{ marginBottom: 24 }}>
  <Title
    level={5}
    style={{ marginBottom: 16 }}
  >
    Basic Information
  </Title>

  <Row gutter={16}>
    <Col span={12}>
      <Form.Item
        label='First Name'
        name='firstName'
        rules={validation.firstName}
      >
        <Input placeholder='e.g., Nguyen' />
      </Form.Item>
    </Col>
    <Col span={12}>
      <Form.Item
        label='Last Name'
        name='lastName'
        rules={validation.lastName}
      >
        <Input placeholder='e.g., Van A' />
      </Form.Item>
    </Col>
  </Row>

  <Form.Item
    label='Email'
    name='email'
    rules={validation.email}
  >
    <Input placeholder='email@example.com' />
  </Form.Item>
</div>;

{
  /* Account Setup */
}
<div style={{ marginBottom: 24 }}>
  <Title
    level={5}
    style={{ marginBottom: 16 }}
  >
    Account Setup
  </Title>
  {/* ... */}
</div>;
```

---

### **6.4 Image Upload Component**

**✅ CORRECT - Use shared `ImageDragger` component:**

```tsx
import { ImageDragger } from '@/shared/components/common/ImageDragger';
import { createImageUploadProps } from '@/shared/utils/uploadHelpers';

// In component
const [avatarFile, setAvatarFile] = useState<UploadFile | null>(null);

const uploadProps = createImageUploadProps<CreateStaffRequest>(
  setAvatarFile,
  (field, value) => form.setFieldValue(field, value),
);

const getPreviewUrl = () => {
  if (avatarFile?.originFileObj) {
    return URL.createObjectURL(avatarFile.originFileObj);
  }
  return null;
};

// In form
<Form.Item
  label='Avatar'
  name='avatar'
  valuePropName='file'
>
  <ImageDragger
    previewUrl={getPreviewUrl()}
    uploadProps={uploadProps}
  />
</Form.Item>;
```

**❌ WRONG - Custom upload component:**

```tsx
// ❌ Don't create custom upload components
<Form.Item label='Avatar'>
  <Upload {...customUploadProps}>
    <Button icon={<UploadOutlined />}>Upload Avatar</Button>
  </Upload>
</Form.Item>
```

---

### **6.5 Table Component**

**✅ CORRECT - Use shared `DataTable` component:**

```tsx
import { DataTable } from '@/shared/components/common/DataTable';

<DataTable<SpaceListItem>
  columns={columns}
  dataSource={data?.items || []}
  loading={isLoading}
  pagination={{
    current: filter.page,
    pageSize: filter.pageSize,
    total: data?.totalItems,
    showSizeChanger: true,
    showTotal: (total) => `Total ${total} items`,
  }}
  onChange={handleTableChange}
/>;
```

**❌ WRONG - Direct Ant Design Table:**

```tsx
// ❌ Use DataTable wrapper instead
<Table
  columns={columns}
  dataSource={data}
  loading={isLoading}
  // ... manual pagination setup
/>
```

---

### **6.6 Drawer Footer Pattern**

**✅ CORRECT - Standard footer with action buttons:**

```tsx
<Drawer
  title='Create Space'
  open={open}
  onClose={handleCancel}
  width={720}
  footer={
    <Flex
      justify='end'
      gap='small'
    >
      <Button
        size='large'
        onClick={handleCancel}
      >
        Cancel
      </Button>
      <Button
        size='large'
        type='primary'
        onClick={() => form.submit()}
        loading={mutation.isPending}
      >
        Create
      </Button>
    </Flex>
  }
>
  {/* Drawer content */}
</Drawer>
```

---

### **6.7 Password Input with Strength Indicator**

**✅ CORRECT - Use shared `PasswordStrength` component:**

```tsx
import { PasswordStrength } from '@/shared/components/ui/PasswordStrength';

const [password, setPassword] = useState('');

const handlePasswordChange = (newPassword: string) => {
  setPassword(newPassword);
  form.setFieldValue('password', newPassword);
};

<Form.Item
  label='Password'
  name='password'
  rules={validation.password}
  extra={
    <PasswordStrength
      password={password}
      onPasswordChange={handlePasswordChange}
      showGenerator
      description='This is the password to your account, so it must be strong and hard to guess.'
    />
  }
>
  <Input.Password
    placeholder='Enter password'
    value={password}
    onChange={(e) => setPassword(e.target.value)}
  />
</Form.Item>;
```

---

### **6.8 Table Columns Pattern**

```typescript
// ✅ CORRECT - Exported function with actions
export const getSpaceColumns = ({
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
}: SpaceColumnActions): ColumnsType<SpaceListItem> => [
  // ... columns
];

// Usage in component
const columns = getSpaceColumns({
  onView: handleViewSpace,
  onEdit: handleEditSpace,
  onDelete: handleDeleteSpace,
  onToggleStatus: handleToggleStatus,
});
```

---

### **6.9 Form Submit Handler Pattern**

**✅ CORRECT - FormData for multipart uploads:**

```tsx
const handleSubmit = async (values: CreateStaffRequest) => {
  const formData = new FormData();

  // Required fields
  if (values.firstName) formData.append('firstName', values.firstName);
  if (values.lastName) formData.append('lastName', values.lastName);

  // Optional file upload
  if (avatarFile?.originFileObj) {
    formData.append('avatar', avatarFile.originFileObj);
  }

  createMutation.mutate(formData, {
    onSuccess: () => {
      handleCancel();
      onSuccess();
    },
  });
};
```

---

### **6.10 Form Reset on Close**

**✅ CORRECT - Reset form and state:**

```tsx
const handleCancel = () => {
  form.resetFields();
  setAvatarFile(null);
  setPassword('');
  onClose();
};
```

---

## 📊 **7. Error Handling**

### **7.1 Service Layer**

```typescript
// ✅ CORRECT - Let errors bubble up
export const spaceService = {
  getById: (id: string) => {
    return api.get<Result<SpaceDetailResponse>>(SPACE_ENDPOINTS.detail(id));
    // Don't catch errors here - let React Query handle them
  },
};
```

---

### **7.2 Hook Layer - Use `showErrorMessage` Utility**

**✅ CORRECT - Use shared error handler:**

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { showErrorMessage } from '@/shared/utils/errorHandler';
import { spaceService } from '../services';
import type { CreateSpaceRequest } from '../types';

export const useCreateSpace = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSpaceRequest) => spaceService.create(data),
    onSuccess: (response) => {
      if (response.data.success) {
        queryClient.invalidateQueries({ queryKey: ['spaces'] });
        message.success(response.data.message || 'Space created successfully!');
      }
    },
    onError: (error: any) => {
      showErrorMessage(error, 'Failed to create space.');
    },
  });
};
```

**❌ WRONG - Manual error message extraction:**

```typescript
// ❌ DON'T DO THIS
onError: (error: any) => {
  const errorMessage =
    error.response?.data?.message || 'Failed to create space.';
  message.error(errorMessage);
};
```

---

### **7.3 Error Handler Features**

The `showErrorMessage` utility from `@/shared/utils/errorHandler` provides:

1. **Automatic error code mapping** - Maps backend error codes to user-friendly messages
2. **Validation error handling** - Extracts and displays validation errors
3. **Fallback messages** - Uses default message if no error data available
4. **Consistent UX** - Same error display logic across all features

**Available utilities:**

```typescript
import {
  showErrorMessage, // Display error with Ant Design message
  getErrorMessage, // Get error message string
  getValidationErrors, // Extract validation errors
  isAuthError, // Check if auth error (401)
  isPermissionError, // Check if permission error (403)
  handleApiError, // Handle error with custom logic
} from '@/shared/utils/errorHandler';
```

**Example - Custom error handling:**

```typescript
import { handleApiError } from '@/shared/utils/errorHandler';
import { ErrorCodeEnum } from '@/shared/types/errorTypes';

export const useDeleteSpace = () => {
  return useMutation({
    mutationFn: (id: string) => spaceService.delete(id),
    onSuccess: (response) => {
      if (response.data.success) {
        queryClient.invalidateQueries({ queryKey: ['spaces'] });
        message.success(response.data.message || 'Space deleted successfully!');
      }
    },
    onError: (error: any) => {
      handleApiError(
        error,
        {
          [ErrorCodeEnum.BusinessRuleViolation]: () => {
            message.error('Cannot delete space. It is currently in use.');
          },
        },
        'Failed to delete space.',
      );
    },
  });
};
```

---

### **7.4 Component Layer**

```typescript
// ✅ CORRECT - Let hooks handle error display
const createSpace = useCreateSpace();

const handleSubmit = (values: CreateSpaceRequest) => {
  createSpace.mutate(values);
  // No try-catch needed - hook handles error messages via showErrorMessage
};
```

---

### **7.5 Error Handling Pattern Summary**

| Layer         | Responsibility                        | Tools                                |
| ------------- | ------------------------------------- | ------------------------------------ |
| **Service**   | Return raw API response               | N/A                                  |
| **Hook**      | Handle errors with `showErrorMessage` | `showErrorMessage`, `handleApiError` |
| **Component** | Call mutation methods                 | N/A (errors handled by hook)         |

---

## 🎯 **8. TypeScript Standards**

### **8.1 Use `type` for unions, `interface` for objects**

```typescript
// ✅ CORRECT
export interface SpaceListItem extends BaseResponse { ... }
export type SpacePaginationResult = PaginationResult<SpaceListItem>;
export type SpaceColumnActions = {
  onView: (id: string) => void;
  onEdit: (id: string) => void;
};

// ❌ WRONG
export type SpaceListItem = BaseResponse & { ... }; // Use interface for objects
```

---

### **8.2 Import Types with `type` keyword**

```typescript
// ✅ CORRECT - Explicitly mark type imports
import type { SpaceListItem, SpaceFilter } from '@/features/store/types';
import type { ColumnsType } from 'antd/es/table';

// ❌ WRONG
import { SpaceListItem, SpaceFilter } from '@/features/store/types';
```

---

## 📦 **9. Validation Standards**

### **9.1 Ant Design Form Rules**

```typescript
// ✅ CORRECT - Export validation objects
export const createSpaceValidation = {
  name: [
    { required: true, message: 'Please enter space name!' },
    { max: 255, message: 'Name cannot exceed 255 characters!' },
    { whitespace: true, message: 'Name cannot be only whitespace!' },
  ],
  type: [
    { required: true, message: 'Please select space type!' },
  ],
};

// Usage in form
<Form.Item name="name" rules={createSpaceValidation.name}>
  <Input />
</Form.Item>
```

---

## **10. Shared Utility Functions**

| Utility | Import Path | Use Case |
|---------|-------------|----------|
| **formatDateTime** | `@/shared/utils/formHelpers` | Format ISO date to "MMM DD, YYYY HH:mm" |
| **formatDate** | `@/shared/utils/formHelpers` | Format ISO date to "MMM DD, YYYY" |
| **formatTime** | `@/shared/utils/formHelpers` | Format ISO date to "HH:mm:ss" |
| **formatRelativeTime** | `@/shared/utils/formHelpers` | Format to "2 hours ago" |
| **formatPhoneNumber** | `@/shared/utils/formHelpers` | Format phone numbers |
| **formatCurrency** | `@/shared/utils/formHelpers` | Format VND currency |
| **formatFileSize** | `@/shared/utils/formHelpers` | Format bytes to KB/MB/GB |

**Example Usage:**

```typescript
import { formatDateTime, formatDate, formatRelativeTime } from '@/shared/utils/formHelpers';

// In component/column render
<span>{formatDateTime(track.createdAt)}</span>
// Output: "Mar 11, 2026 14:30"

<span>{formatDate(track.createdAt)}</span>
// Output: "Mar 11, 2026"

<span>{formatRelativeTime(track.lastPlayedAt)}</span>
// Output: "2 hours ago"
```

**Day.js Configuration:**

We use **Day.js** (Ant Design's built-in date library) with the following plugins:
- `relativeTime` - for "2 hours ago" formatting
- `utc` - for UTC conversion
- `timezone` - for timezone support
- `customParseFormat` - for custom date parsing

**DatePicker Integration:**

```typescript
import { DatePicker } from 'antd';
import dayjs from 'dayjs';

// Set default value
<DatePicker defaultValue={dayjs('2026-03-11')} />

// Get ISO string from DatePicker
const handleDateChange = (date: dayjs.Dayjs | null) => {
  const isoString = date?.toISOString();
  form.setFieldValue('startDate', isoString);
};
```
---

**Last Updated:** 2026-03-10
**Version:** 1.0.0
