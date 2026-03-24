# Implementation: AI Explainability Panel

## Overview

Implemented Phase 2 of the new CAMS metadata extraction system - displaying AI fuzzy logic decisions and BPM-based selection transparency.

## Implementation Date

2026-03-24

## Background

Backend now uses fuzzy logic to analyze IoT context (people count, temperature, wifi devices) and determine optimal mood + BPM range for music selection. This panel makes those AI decisions transparent to managers.

See: `docs/cams/FE_IMPLEMENTATION_METADATA_TO_FUZZY_AI.md` §3-4

---

## Changes Made

### 1. Types (`src/shared/modules/cams/types/camsTypes.ts`)

#### Added AI Explainability Fields

**To `SpaceStateDto` (SignalR):**

```typescript
// AI Explainability (NEW 2026-03-24)
bpmMin?: number | null;           // Recommended BPM range minimum
bpmMax?: number | null;           // Recommended BPM range maximum
bpmTarget?: number | null;        // Target BPM within range
fuzzyRule?: string | null;        // Triggered rule name (e.g., "RULE_1_RUSH_HOUR")
fuzzyReason?: string | null;      // Human-readable reason (e.g., "Critical pressure detected")
isBpmFallback?: boolean | null;   // True if using mood-only selection
```

**To `SpaceStateResponse` (REST API):**
Same fields as above.

---

### 2. Component (`src/shared/modules/cams/components/AIExplainabilityPanel.tsx`)

#### Created AIExplainabilityPanel Component

**Props:**

```typescript
interface AIExplainabilityPanelProps {
  spaceState: SpaceStateDto | SpaceStateResponse;
  compact?: boolean; // Compact mode for smaller displays
}
```

**Features:**

1. **Conditional Rendering**
   - Only shows if AI info is available (BPM range, fuzzy info, or fallback)
   - Hides when manual override is active (shown in parent component)

2. **Two Display Modes**

   **Compact Mode (`compact={true}`):**
   - Single-line Alert with tags
   - Suitable for dashboards or small spaces
   - Shows: Mood + BPM range + Fallback indicator

   **Full Mode (default):**
   - Detailed Card with Descriptions
   - Shows all AI decision details
   - Includes tooltips for explanations

3. **Information Displayed**

   **Current Mood:**
   - Tag with icon (Thunder/Fire/Eye based on mood)
   - Color: blue

   **BPM Range:**
   - Shows min-max range
   - Shows target BPM if available
   - Tooltip: "AI selects tracks within this BPM range based on context analysis"

   **Context Rule:**
   - Formatted rule name (e.g., "Rush Hour" from "RULE_1_RUSH_HOUR")
   - Color: purple
   - Tooltip: "The fuzzy logic rule that determined current mood and BPM"

   **Reason:**
   - Human-readable explanation
   - Example: "Critical pressure detected"

   **Fallback Warning:**
   - Info alert when `isBpmFallback === true`
   - Message: "Using mood-only selection"
   - Description: "Not enough tracks with BPM metadata in the selected range..."

   **Manual Override Notice:**
   - Warning alert when `isManualOverride === true`
   - Message: "Manual Override Active"
   - Description: "Manager has manually selected music. AI recommendations are paused."

4. **Helper Functions**

   **`getMoodIcon(moodName)`:**
   - Returns appropriate icon for mood
   - Energetic → ThunderboltOutlined
   - Chill → FireOutlined
   - Focus → EyeOutlined
   - Default → SoundOutlined

   **`formatRuleName(rule)`:**
   - Converts "RULE_1_RUSH_HOUR" → "Rush Hour"
   - Removes prefix and converts to Title Case

---

### 3. Integration (`src/features/store/pages/SpaceManagement/components/SpacePlayerCard.tsx`)

#### Added Panel to Space Player Card

**Location:** After SpacePlayer component, before closing tag

**Conditions:**

- Only shows when `spaceState` exists
- Only shows when NOT in manual override mode
- Separated by divider for visual clarity

**Code:**

```tsx
{
  spaceState && !spaceState.isManualOverride && (
    <>
      <Divider style={{ margin: '8px 0' }} />
      <AIExplainabilityPanel spaceState={spaceState} />
    </>
  );
}
```

---

## User Experience

### When AI is Active (No Manual Override)

**Panel Shows:**

1. Current mood with icon
2. BPM range (e.g., "85-105 BPM")
3. Target BPM if available
4. Context rule that triggered (e.g., "Rush Hour")
5. Reason for decision (e.g., "Critical pressure detected")

**Example Display:**

```
┌─ AI Music Selection ─────────────────┐
│ Current Mood:    [⚡ Energetic]       │
│ BPM Range:       [120-140 BPM]       │
│                  [Target: 130]        │
│ Context Rule:    [Rush Hour]         │
│ Reason:          Critical pressure    │
│                  detected             │
└───────────────────────────────────────┘
```

### When Fallback is Used

**Additional Alert:**

```
ℹ️ Using mood-only selection
Not enough tracks with BPM metadata in the selected
range. AI is using mood-only selection to maintain
queue stability.
```

### When Manual Override is Active

**Panel Hidden** - Manual override notice shown in settings section instead.

---

## Technical Details

### Fuzzy Rules Mapping

Backend sends rule names like:

- `RULE_1_RUSH_HOUR` → Displayed as "Rush Hour"
- `RULE_2_HEATWAVE` → Displayed as "Heatwave"
- `RULE_3_RETENTION` → Displayed as "Retention"

### BPM Range Logic

- **bpmMin/bpmMax**: Recommended range from fuzzy engine
- **bpmTarget**: Specific target within range (biased by context)
- **isBpmFallback**: `true` when not enough tracks with BPM metadata

### Null Safety

All fields are optional and null-safe:

```typescript
bpmMin?: number | null;
fuzzyRule?: string | null;
// etc.
```

Panel only renders if at least one field has data.

---

## Real-World Scenarios

### Scenario 1: Rush Hour (High Traffic)

```
Context: 50+ people, high wifi devices
Fuzzy Decision:
  - Rule: RULE_1_RUSH_HOUR
  - Mood: Energetic
  - BPM: 120-140 (target: 130)
  - Reason: "Critical pressure detected"

Panel Shows:
  ⚡ Energetic | 120-140 BPM (target: 130)
  Context: Rush Hour
  Reason: Critical pressure detected
```

### Scenario 2: Heatwave (Hot + Crowded)

```
Context: High temperature, crowded space
Fuzzy Decision:
  - Rule: RULE_2_HEATWAVE
  - Mood: Chill
  - BPM: 60-80 (target: 70)
  - Reason: "High stress and crowded detected"

Panel Shows:
  🔥 Chill | 60-80 BPM (target: 70)
  Context: Heatwave
  Reason: High stress and crowded detected
```

### Scenario 3: Retention (Low Traffic, Moderate Density)

```
Context: Few people, moderate wifi
Fuzzy Decision:
  - Rule: RULE_3_RETENTION
  - Mood: Focus
  - BPM: 85-105 (target: 95)
  - Reason: "Low pressure with moderate density"

Panel Shows:
  👁️ Focus | 85-105 BPM (target: 95)
  Context: Retention
  Reason: Low pressure with moderate density
```

### Scenario 4: Fallback (Not Enough BPM Data)

```
Context: AI selected Energetic mood, but only 3 tracks
         have BPM metadata in 120-140 range

Fuzzy Decision:
  - Mood: Energetic
  - BPM: 120-140
  - Fallback: true (using mood-only)

Panel Shows:
  ⚡ Energetic | 120-140 BPM
  ℹ️ Using mood-only selection
  Not enough tracks with BPM metadata...
```

---

## Benefits

### For Managers

1. **Transparency**: Understand why AI chose specific music
2. **Trust**: See the logic behind decisions
3. **Context Awareness**: Know what factors influenced selection
4. **Debugging**: Identify if fallback is being used too often

### For System Operators

1. **Monitoring**: Track fuzzy rule distribution
2. **Optimization**: Identify if more tracks need BPM metadata
3. **Validation**: Verify fuzzy logic is working as expected

### For Business

1. **Explainable AI**: Meet transparency requirements
2. **Customer Confidence**: Show system is intelligent, not random
3. **Data-Driven**: Identify patterns in music selection

---

## Future Enhancements (Not Implemented Yet)

### 1. Historical View

Show past AI decisions over time:

- Rule distribution chart
- BPM range trends
- Fallback frequency

### 2. Context Telemetry Display

Show raw telemetry data that influenced decision:

- People count: 45
- Temperature: 28°C
- WiFi devices: 38

### 3. Manual Override with AI Suggestion

When manager overrides, show what AI would have selected:

```
Manual Override Active
AI Suggestion: Energetic (120-140 BPM)
Your Selection: Chill playlist
```

### 4. Confidence Score

If backend provides confidence metrics:

```
Confidence: 85%
Based on 12 data points
```

---

## Testing Checklist

### Visual Testing

- [ ] Panel renders correctly in Space Player Card
- [ ] Icons display for different moods
- [ ] Tags are properly colored
- [ ] Tooltips show on hover
- [ ] Divider separates player from panel
- [ ] Panel hides when manual override active

### Functional Testing

- [ ] Panel shows when AI info available
- [ ] Panel hides when no AI info
- [ ] Fallback alert shows when `isBpmFallback === true`
- [ ] Rule name formatting works (RULE_1_RUSH_HOUR → Rush Hour)
- [ ] BPM range displays correctly
- [ ] Target BPM shows when available

### Edge Cases

- [ ] All fields null → panel doesn't render
- [ ] Only mood available → shows mood only
- [ ] Only BPM range → shows BPM only
- [ ] Very long reason text → wraps properly
- [ ] Unknown mood name → default icon

### Integration Testing

- [ ] SignalR updates trigger panel refresh
- [ ] REST API data displays correctly
- [ ] Manual override toggle hides/shows panel
- [ ] Multiple spaces don't interfere

---

## Files Modified

1. `src/shared/modules/cams/types/camsTypes.ts` - Added AI explainability fields
2. `src/shared/modules/cams/components/AIExplainabilityPanel.tsx` - Created panel component (NEW)
3. `src/shared/modules/cams/components/index.ts` - Export panel component
4. `src/features/store/pages/SpaceManagement/components/SpacePlayerCard.tsx` - Integrated panel

---

## Related Documentation

- `docs/cams/FE_IMPLEMENTATION_METADATA_TO_FUZZY_AI.md` - Backend implementation guide
- `docs/cams/SDD_BPM_BASED_AI_QUEUE.md` - BPM-based selection details
- `docs/cams-engine/FUZZYLOGIC_MUSIC_SELECTION_EXPLAINED.md` - Fuzzy logic explanation
- `IMPLEMENTATION_TRACK_METADATA_STATUS.md` - Phase 1 implementation

---

## Next Steps (Phase 3)

After this implementation is tested and deployed:

1. **SignalR Real-time Updates** - Ensure AI fields update via SignalR
2. **Metadata Polling** - Auto-refresh track metadata after upload
3. **Queue Display Enhancement** - Show why specific tracks were selected
4. **Analytics Dashboard** - Track fuzzy rule usage and fallback frequency

See: `docs/cams/FE_IMPLEMENTATION_METADATA_TO_FUZZY_AI.md` §7-10
