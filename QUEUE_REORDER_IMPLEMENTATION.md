# Queue Reorder Implementation

## Overview

Implemented drag-and-drop functionality for queue reordering using `@dnd-kit` library.

## Changes Made

### 1. Dependencies Added

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

### 2. QueueList Component (`src/shared/modules/cams/components/QueueList.tsx`)

**Added drag-and-drop functionality:**

- Integrated `@dnd-kit/core` for drag context
- Integrated `@dnd-kit/sortable` for sortable list
- Created `SortableItem` component for individual draggable items
- Only `Pending` status items are draggable (Playing/Played/Skipped are disabled)
- Visual feedback: drag icon changes color based on draggable state
- Cursor changes to `grab` for draggable items, `not-allowed` for non-draggable
- Opacity reduces to 0.5 during drag for visual feedback

**Key Features:**

- ✅ Drag handle with visual state (blue for draggable, gray for disabled)
- ✅ Touch support via `PointerSensor`
- ✅ Keyboard support via `KeyboardSensor`
- ✅ Smooth animations during reorder
- ✅ Collision detection using `closestCenter` strategy
- ✅ Vertical list sorting strategy

**Props Updated:**

```typescript
interface QueueListProps {
  items: SpaceQueueItemResponse[];
  loading?: boolean;
  onRemove: (queueItemId: string) => void;
  onReorder?: (queueItemIds: string[]) => void; // NEW
}
```

### 3. QueueManagementDrawer Component (`src/shared/modules/cams/components/QueueManagementDrawer.tsx`)

**Added reorder handler:**

```typescript
const reorderQueue = useReorderQueue();

const handleReorder = async (queueItemIds: string[]) => {
  try {
    await reorderQueue.mutateAsync({
      spaceId,
      data: { queueItemIds },
    });
  } catch (error) {
    console.error('Failed to reorder queue:', error);
  }
};
```

**Updated QueueList usage:**

```typescript
<QueueList
  items={queueData || []}
  loading={isLoading}
  onRemove={handleRemoveItem}
  onReorder={handleReorder} // NEW
/>
```

## API Integration

**Endpoint:** `PATCH /api/cams/spaces/{spaceId}/queue/reorder`

**Request Body:**

```typescript
{
  queueItemIds: string[] // Array of queue item IDs in new order
}
```

**Hook:** `useReorderQueue()` from `src/shared/modules/cams/hooks/useQueueManagement.ts`

## User Experience

### Draggable Items

- Only items with `queueStatus === QueueItemStatus.Pending` can be dragged
- Drag icon is blue (#1890ff) for draggable items
- Cursor changes to `grab` on hover

### Non-Draggable Items

- Items with status Playing, Played, or Skipped cannot be dragged
- Drag icon is gray (#d9d9d9) for non-draggable items
- Cursor shows `not-allowed` on hover

### Drag Interaction

1. User clicks and holds drag icon on a pending item
2. Item becomes semi-transparent (opacity 0.5)
3. User drags item to new position
4. Other items shift to make space
5. User releases mouse/touch
6. API call is made with new order
7. Queue updates with new positions
8. Success message: "Queue reordered"

## Error Handling

- API errors are caught and logged to console
- Error messages displayed via `handleApiError()` utility
- Queue state reverts on failure (handled by React Query)

## Cache Invalidation

After successful reorder, the following query is invalidated:

```typescript
queryClient.invalidateQueries({
  queryKey: QUERY_KEYS.cams.queue(spaceId),
});
```

## Testing Checklist

- [ ] Verify only pending items are draggable
- [ ] Verify drag icon visual states (blue vs gray)
- [ ] Verify cursor changes (grab vs not-allowed)
- [ ] Verify drag animation and opacity change
- [ ] Verify API is called with correct order after drag
- [ ] Verify queue updates after successful reorder
- [ ] Verify success message appears
- [ ] Verify error handling when API fails
- [ ] Test keyboard navigation (Tab + Space/Enter)
- [ ] Test touch devices (mobile/tablet)

## Related Files

- `src/shared/modules/cams/components/QueueList.tsx`
- `src/shared/modules/cams/components/QueueManagementDrawer.tsx`
- `src/shared/modules/cams/hooks/useQueueManagement.ts`
- `docs/cams/API_CAMS.md` (Section 3.3.4)

## Implementation Date

2026-03-24
