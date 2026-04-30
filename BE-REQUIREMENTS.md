# Backend Requirements for Schedule Calendar Feature

**Date**: 2026-04-30  
**Status**: Pending BE implementation  
**Priority**: Medium (FE can work with workarounds first)

---

## 🔴 **Critical Requirements**

### 1. Slot Overlap Validation

**Current**: Unknown if BE validates slot overlap  
**Request**:

- Add validation to prevent overlapping slots on same day/time
- Return clear error message: `"Slot overlaps with existing slot {slotId} on {day} from {startTime} to {endTime}"`
- Error code: `Schedule_Slot_Overlap`

**API Impact**:

- `PUT /spaces/{spaceId}/slots/{slotId}` - Should validate before save
- `POST /spaces/{spaceId}/apply-source` - Should validate all slots in source

**FE Workaround**:

- ✅ Implement client-side overlap validation
- ⚠️ May have race condition if multiple users edit simultaneously

---

### 2. Conflict Resolution Documentation

**Current**: Unclear what happens when 2 slots overlap at runtime  
**Request**: Document the behavior:

- Which slot takes priority? (First created? Last updated? Playlist priority?)
- Does system play both? Skip one? Show error?

**FE Impact**: Need to show warning to users about conflict behavior

**FE Workaround**:

- ✅ Show warning: "Overlapping slots may cause unexpected behavior"
- ⚠️ Cannot guarantee which slot will play

---

## 🟡 **Nice-to-Have Requirements**

### 3. Slot Color/Category Field

**Current**: No color field in slot model  
**Request**: Add optional `color` field to slot

```json
{
  "id": "guid",
  "daysOfWeek": [1, 2, 3],
  "startTime": "09:00",
  "endTime": "18:00",
  "playlistId": "guid",
  "color": "#4A2EA1" // NEW FIELD
}
```

**Benefits**:

- Users can visually distinguish slot types
- Better UX for complex schedules
- Consistent colors across devices

**FE Workaround**:

- ✅ Use hardcoded color for all slots: `#4A2EA1` (primary purple)
- ✅ Later: Generate color from playlist ID hash (consistent but not user-controlled)

---

### 4. Bulk Slot Operations

**Current**: Must call API for each slot individually  
**Request**: Add bulk endpoints

#### 4.1 Bulk Create/Update

```
POST /spaces/{spaceId}/slots/bulk
Body: {
  "slots": [
    { "id": "guid", "daysOfWeek": [...], ... },
    { "id": "guid", "daysOfWeek": [...], ... }
  ]
}
```

#### 4.2 Bulk Delete

```
DELETE /spaces/{spaceId}/slots/bulk
Body: {
  "slotIds": ["guid1", "guid2", "guid3"]
}
```

**Benefits**:

- Faster template application (1 API call instead of N)
- Atomic operation (all succeed or all fail)
- Better UX (no partial failures)

**FE Workaround**:

- ✅ Call API sequentially for each slot
- ✅ Show progress indicator: "Applying template... 3/10 slots"
- ⚠️ Handle partial failures gracefully

---

### 5. Slot Metadata Fields

**Current**: Only basic fields (time, playlist)  
**Request**: Add optional metadata

```json
{
  "id": "guid",
  "daysOfWeek": [1, 2, 3],
  "startTime": "09:00",
  "endTime": "18:00",
  "playlistId": "guid",
  "color": "#4A2EA1",
  "label": "Morning Rush", // NEW: User-defined label
  "description": "High energy", // NEW: Optional description
  "priority": 1 // NEW: For conflict resolution
}
```

**Benefits**:

- Better slot identification in UI
- User can add notes/context
- Priority field for conflict resolution

**FE Workaround**:

- ✅ Use playlist name as label
- ✅ No description field
- ⚠️ Cannot set priority

---

## 🟢 **Future Enhancements**

### 6. Advanced Recurring Patterns

**Current**: Only weekly recurring (daysOfWeek array)  
**Request**: Support more patterns

```json
{
  "recurrence": {
    "type": "weekly", // weekly | biweekly | monthly
    "interval": 1, // Every N weeks/months
    "daysOfWeek": [1, 2, 3],
    "endDate": "2026-12-31", // Optional end date
    "occurrences": 52 // Or end after N times
  }
}
```

**FE Workaround**:

- ✅ Only support weekly recurring
- ⚠️ Users must manually create slots for complex patterns

---

### 7. Slot History/Audit Log

**Current**: No history tracking  
**Request**: Track slot changes

```
GET /spaces/{spaceId}/slots/{slotId}/history
Response: [
  {
    "timestamp": "2026-04-30T10:00:00Z",
    "action": "created",
    "userId": "guid",
    "userName": "John Doe",
    "changes": { ... }
  }
]
```

**FE Workaround**:

- ⚠️ No history available
- ✅ Show last updated timestamp from schedule

---

### 8. Slot Templates/Presets

**Current**: Only brand-level sources  
**Request**: System-wide preset templates

```
GET /schedule/presets
Response: [
  {
    "id": "weekday-9to5",
    "name": "Weekday 9-5",
    "description": "Standard office hours",
    "slots": [...]
  }
]
```

**FE Workaround**:

- ⚠️ No system presets
- ✅ Users can save their own to library

---

## 📋 **Implementation Priority**

| Priority | Requirement              | Impact | Workaround Difficulty     |
| -------- | ------------------------ | ------ | ------------------------- |
| 🔴 P0    | Overlap validation       | High   | Easy (client-side)        |
| 🔴 P0    | Conflict resolution docs | High   | N/A (just docs)           |
| 🟡 P1    | Slot color field         | Medium | Easy (hardcode)           |
| 🟡 P1    | Bulk operations          | Medium | Medium (sequential calls) |
| 🟡 P2    | Slot metadata            | Low    | Easy (use playlist name)  |
| 🟢 P3    | Advanced recurring       | Low    | N/A (not needed yet)      |
| 🟢 P3    | Slot history             | Low    | N/A (not needed yet)      |
| 🟢 P3    | System presets           | Low    | N/A (not needed yet)      |

---

## 🚀 **FE Implementation Plan**

### Phase 1: MVP (Can start now)

- ✅ Use existing API as-is
- ✅ Hardcode color: `#4A2EA1` for all slots
- ✅ Client-side overlap validation
- ✅ Sequential API calls for bulk operations
- ✅ Show warnings for potential conflicts

### Phase 2: Enhanced (After BE updates)

- ⏳ Use slot color field if added
- ⏳ Use bulk endpoints if added
- ⏳ Remove client-side overlap validation (rely on BE)

### Phase 3: Advanced (Future)

- ⏳ Advanced recurring patterns
- ⏳ Slot history viewer
- ⏳ System preset templates

---

## 📝 **Notes for BE Team**

1. **Overlap Validation**: Most critical - prevents data inconsistency
2. **Bulk Operations**: Would significantly improve UX for template application
3. **Color Field**: Simple addition, big UX improvement
4. **Conflict Resolution**: Just need documentation, no code change needed

**Timeline Request**:

- P0 items: Next sprint (1-2 weeks)
- P1 items: Within 1 month
- P2+ items: Backlog (as needed)

---

## 🔗 **Related Documents**

- `calendar-note.md` - Full API documentation
- `src/features/brand/pages/ScheduleManagement/` - FE implementation
