# Schedule Management Module

This module contains two different schedule management interfaces:

## 1. ScheduleList (Brand-Level Templates)

**Route**: `/brand/schedule`  
**Purpose**: Manage brand-level schedule templates and library entries

Features:

- Create/edit/delete brand schedule templates (for StrictSync)
- Create/edit/delete library entries (reusable schedules)
- Manage slots within templates/libraries
- Day-by-day slot view with table
- Used by Brand Managers to create reusable schedule patterns

## 2. ScheduleManagement (Space-Level Calendar)

**Route**: TBD (needs to be added)  
**Purpose**: Visual calendar interface for space-level scheduling

Features:

- Weekly calendar view with FullCalendar
- Drag & drop to create/edit slots (planned)
- Visual time slot management
- Sidebar with music catalog and templates
- Save schedule to library
- Apply library templates to space

## Implementation Status

### ✅ Completed

- Type definitions (`types/schedule.types.ts`)
- Calendar helper utilities (`utils/calendarHelpers.ts`)
- Bootstrap data hook (`hooks/useScheduleBootstrap.ts`)
- Slot mutation hooks (`hooks/useSlotMutations.ts`)
- Main calendar component (`components/ScheduleCalendar.tsx`)
- Sidebar component (`components/ScheduleSidebar.tsx`)
- Create/edit slot drawer (`components/CreateSlotDrawer.tsx`)
- Save to library modal (`components/SaveToLibraryModal.tsx`)
- CSS styling for FullCalendar (`ScheduleManagement.css`)
- Main page component (`index.tsx`)

### ⏳ Pending

- Route configuration (needs to be added to `brandRoutes.tsx`)
- Menu item (needs to be added to brand menu)
- Integration with real spaceId (currently using temp ID)

### 🔴 Waiting for Backend

- Slot color field (currently hardcoded to `#4A2EA1`)
- Bulk slot operations (currently sequential API calls)
- Overlap validation from BE (currently client-side only)
- Drag-to-resize and drag-to-move functionality

## Usage

### For Brand-Level Templates

```tsx
import { ScheduleList } from '@/features/brand/pages/ScheduleManagement/ScheduleList';
```

### For Space-Level Calendar

```tsx
import { ScheduleManagement } from '@/features/brand/pages/ScheduleManagement';
```

## API Documentation

See `calendar-note.md` for complete API documentation  
See `BE-REQUIREMENTS.md` for pending backend requirements
