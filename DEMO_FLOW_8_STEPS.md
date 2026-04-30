# Demo Flow: Brand Schedule Management (8 Steps)

**Purpose**: Show how Brand Manager schedules music for stores automatically  
**Duration**: ~8-10 minutes

---

## 🎯 8-Step Flow

### 1️⃣ **Brand Creates Schedule Template**

- Brand Manager opens Schedule Management
- Creates new template: "Demo Template"
- **Result**: Empty template ready for time slots

---

### 2️⃣ **Brand Adds Time Slot**

- Adds slot to template:
  - Days: Today (e.g., Monday)
  - Time: Current time + 1 min → Current time + 5 min
  - Playlist: "Demo Playlist"
- **Result**: Slot appears in template

---

### 3️⃣ **Brand Applies Template to Store**

- Goes to Store Management → Store A
- Sets mode: **Strict Sync**
- Selects template: "Demo Template"
- **Result**: Store A now controlled by brand schedule

---

### 4️⃣ **System Auto-Schedules Job**

- Backend automatically registers Hangfire job
- Job name: `brand-schedule:spaceA1:...`
- **Result**: System will auto-play music at scheduled time

---

### 5️⃣ **Music Auto-Plays at Scheduled Time** ⏰

- Clock hits scheduled time (current + 1 min)
- System automatically:
  - Loads "Demo Playlist"
  - Starts playing music
  - Shows "Brand Schedule" badge
- **Result**: Music plays without anyone clicking anything

---

### 6️⃣ **Store Manager Tries to Override → Blocked** 🚫

- Store Manager tries to:
  - Skip current track
  - Remove songs from queue
  - Add different songs
- **Result**: All actions rejected - "No permission"

---

### 7️⃣ **Music Auto-Stops at End Time** ⏰

- Clock hits end time (current + 5 min)
- System automatically:
  - Stops brand schedule
  - Clears scheduled queue
  - Returns control to AI or manual mode
- **Result**: Schedule ends automatically

---

### 8️⃣ **Brand Returns Control to Store**

- Brand Manager changes Store A mode: **Freedom**
- **Result**:
  - Hangfire job removed
  - Store Manager can now control music freely
  - Schedule template still saved for future use

---

## 🎬 Visual Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Brand Creates Template                                   │
│    "Demo Template" (empty)                                  │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Brand Adds Time Slot                                     │
│    Mon 10:31-10:35 → "Demo Playlist"                        │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Brand Applies to Store A                                 │
│    Mode: Strict Sync + "Demo Template"                      │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. System Registers Hangfire Job                            │
│    brand-schedule:spaceA1:slot123                           │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼ (wait until 10:31)
┌─────────────────────────────────────────────────────────────┐
│ 5. Music Auto-Plays ⏰                                       │
│    ✓ "Demo Playlist" loaded                                 │
│    ✓ Badge: "Brand Schedule"                                │
│    ✓ Playing automatically                                  │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼ (Store Manager tries to interfere)
┌─────────────────────────────────────────────────────────────┐
│ 6. Store Manager Blocked 🚫                                 │
│    ✗ Cannot skip track                                      │
│    ✗ Cannot remove songs                                    │
│    ✗ Cannot add songs                                       │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼ (wait until 10:35)
┌─────────────────────────────────────────────────────────────┐
│ 7. Music Auto-Stops ⏰                                       │
│    ✓ Badge removed                                          │
│    ✓ Queue cleared                                          │
│    ✓ AI takes over                                          │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. Brand Returns Control                                    │
│    Mode: Freedom                                            │
│    ✓ Store Manager can control music again                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 Animation Suggestions

### Step 1-2: Template Creation

- Show Brand Manager UI
- Highlight "Create Template" button
- Show form filling
- Zoom into template with slot

### Step 3: Apply to Store

- Show Store Management page
- Highlight Store A row
- Show "Set Mode" modal
- Animate mode change: Freedom → Strict Sync

### Step 4: System Background

- Show Hangfire Dashboard
- Highlight new recurring job appearing
- Show cron expression: `31 10 * * 1` (Mon 10:31)

### Step 5: Auto-Play

- Show clock ticking to 10:31
- **Flash effect** when time hits
- Show Space A1 Player:
  - Badge appears: "Brand Schedule"
  - Queue fills with songs
  - Play button activates
  - Music waveform animation

### Step 6: Store Manager Blocked

- Split screen: Store Manager trying actions
- Show error messages popping up:
  - "Permission denied"
  - "Brand is controlling this space"
- Red X animations

### Step 7: Auto-Stop

- Show clock ticking to 10:35
- **Flash effect** when time hits
- Show Space A1 Player:
  - Badge fades out
  - Queue clears
  - AI badge appears

### Step 8: Return Control

- Show Brand Manager changing mode
- Animate mode change: Strict Sync → Freedom
- Show Hangfire job disappearing
- Show Store Manager UI unlocking

---

## 📊 Key Metrics to Highlight

| Metric                    | Value                   |
| ------------------------- | ----------------------- |
| Manual actions required   | **0** (fully automatic) |
| Time to schedule          | **< 2 minutes**         |
| Stores controlled         | **1 to N** (scalable)   |
| Override attempts blocked | **100%**                |
| Schedule accuracy         | **Exact to the minute** |

---

## 💬 Narration Script

**Step 1-2**: "Brand Manager creates a schedule template and adds a time slot for Monday 10:31 to 10:35 with Demo Playlist."

**Step 3**: "They apply this template to Store A using Strict Sync mode, giving the brand full control."

**Step 4**: "The system automatically registers a background job - no manual setup needed."

**Step 5**: "At exactly 10:31, the music starts playing automatically. No one clicked anything."

**Step 6**: "When the Store Manager tries to change the music, all actions are blocked. The brand is in control."

**Step 7**: "At 10:35, the schedule ends automatically. The music stops and AI takes over."

**Step 8**: "Finally, the brand can return control to the store by switching back to Freedom mode."

---

## 🎯 Key Takeaways

1. ✅ **Zero manual intervention** - Music plays automatically
2. ✅ **Brand control** - Store cannot override during Strict Sync
3. ✅ **Precise timing** - Starts and stops exactly on schedule
4. ✅ **Scalable** - One template can control multiple stores
5. ✅ **Flexible** - Brand can return control anytime

---

## 🔄 Alternative Scenarios (Bonus)

### Bonus A: Manual Toggle During Schedule

- Turn schedule OFF → music stops
- Turn schedule ON → music resumes (if still in time window)

### Bonus B: Past Schedule Ignored

- Create slot with past time (e.g., 2 hours ago)
- Apply to store
- **Result**: System checks "Is now in window?" → No → Ignores

### Bonus C: Multiple Stores

- Apply same template to Store A, B, C
- All 3 stores play same music at same time
- **Result**: Centralized brand control

---

## 📝 Notes for Presenter

- **Timing is critical**: Make sure demo time + 1 min is accurate
- **Have backup**: If live demo fails, have screen recording ready
- **Emphasize automation**: Keep saying "automatically", "no manual action"
- **Show Hangfire**: Technical audience will appreciate seeing the job scheduler
- **Contrast modes**: Show Freedom vs Strict Sync side-by-side if possible
