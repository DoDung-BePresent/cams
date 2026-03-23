# Bugfix: Queue Data Unwrapping [2026-03-24]

## Issue

TypeScript error in `QueueManagementDrawer.tsx`:

```
Property 'length' does not exist on type 'Result<SpaceQueueItemResponse[]>'.
Type 'never[] | Result<SpaceQueueItemResponse[]>' is not assignable to type 'SpaceQueueItemResponse[]'.
```

## Root Cause

The `useSpaceQueue` hook was not properly unwrapping the API response structure.

### API Response Structure

```typescript
AxiosResponse<Result<SpaceQueueItemResponse[]>>
  └─ data: Result<SpaceQueueItemResponse[]>
      └─ data: SpaceQueueItemResponse[]  // ← This is what we need
```

### Before (Incorrect)

```typescript
export const useSpaceQueue = (spaceId: string, enabled = true) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.cams.queue(spaceId)],
    queryFn: () => camsService.getQueue(spaceId),
    enabled: !!spaceId && enabled,
    select: (response) => response.data, // ❌ Returns Result<T>, not T
  });
};
```

This returned `Result<SpaceQueueItemResponse[]>` instead of `SpaceQueueItemResponse[]`.

### After (Correct)

```typescript
export const useSpaceQueue = (spaceId: string, enabled = true) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.cams.queue(spaceId)],
    queryFn: () => camsService.getQueue(spaceId),
    enabled: !!spaceId && enabled,
    select: (response) => response.data.data, // ✅ Unwrap AxiosResponse.data.data
  });
};
```

Now correctly returns `SpaceQueueItemResponse[]`.

## Fix Applied

**File:** `src/shared/modules/cams/hooks/useQueueManagement.ts`

**Change:**

```diff
- select: (response) => response.data,
+ select: (response) => response.data.data, // Unwrap AxiosResponse.data.data
```

## Verification

### Other Hooks Checked

All other CAMS hooks already unwrap correctly:

✅ `useSpaceState` - Uses `response.data.data` in queryFn
✅ `useAudioState` - Mutation hook (no select needed)
✅ `usePairDeviceInfo` - Already unwraps correctly

### TypeScript Errors

- Before: 1 error in `QueueManagementDrawer.tsx`
- After: 0 errors ✅

## Impact

### Components Fixed

- `QueueManagementDrawer` - Can now access `queueData.length`
- `QueueList` - Receives proper array type

### Type Safety

- `queueData` is now correctly typed as `SpaceQueueItemResponse[] | undefined`
- Array methods (`.length`, `.map`, etc.) work correctly
- No type casting needed

## Testing

### Manual Testing Required

1. Open Queue Management Drawer
2. Verify queue items display correctly
3. Verify "X tracks" count shows correctly
4. Verify "Clear All" button enables/disables based on queue length
5. Verify empty state shows when queue is empty

### Expected Behavior

- Queue items render in list
- Track count displays correctly
- Array operations work without errors
- No runtime errors in console

## Related Files

- `src/shared/modules/cams/hooks/useQueueManagement.ts` (fixed)
- `src/shared/modules/cams/components/QueueManagementDrawer.tsx` (now works)
- `src/shared/modules/cams/components/QueueList.tsx` (now works)
- `src/shared/modules/cams/services/camsService.ts` (no change needed)

## Lesson Learned

When using React Query with Axios and Result wrapper:

- Axios returns: `AxiosResponse<T>`
- Our API returns: `Result<T>` where `Result = { data: T, ... }`
- Combined: `AxiosResponse<Result<T>>`
- To get `T`: `response.data.data`

Always check the full response structure when using `select` in React Query!

---

**Fixed by:** Kiro AI Assistant  
**Date:** 2026-03-24  
**Status:** ✅ Resolved
