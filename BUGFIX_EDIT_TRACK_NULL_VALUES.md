# Bugfix: Edit Track Null Values Error

## Issue Description

**Error:** `TypeError: Cannot read properties of null (reading 'toString')`

**Location:** `trackService.ts:72` in `createUpdateFormData` function

**Trigger:** When updating a track that has `null` values for `energyLevel` or `valence` fields

**Stack Trace:**

```
TypeError: Cannot read properties of null (reading 'toString')
  at createUpdateFormData (trackService.ts:72:63)
  at Object.update (trackService.ts:172:22)
  at Object.mutationFn (useUpdateTrack.ts:24:20)
```

## Root Cause

### Problem 1: Insufficient Null Check in Service

In `trackService.ts`, the `createUpdateFormData` function only checked for `undefined`:

```typescript
// ❌ BEFORE (only checks undefined)
if (data.energyLevel !== undefined)
  formData.append('energyLevel', data.energyLevel.toString());
```

When `energyLevel` is `null`, the condition passes but `.toString()` fails.

### Problem 2: Null Propagation in Component

In `EditTrackDrawer.tsx`, when track has `null` values, the state was set to `null`:

```typescript
// ❌ BEFORE (propagates null)
setEnergyLevel(track.energyLevel || 0.5); // 0 is falsy, so null becomes 0.5
setValence(track.valence || 0.5); // but null is also falsy!
```

The `||` operator treats `0` as falsy, but more importantly, if the backend returns `null` explicitly, it gets passed through.

## Solution

### Fix 1: Add Null Check in Service

Updated `createUpdateFormData` to check both `undefined` and `null`:

```typescript
// ✅ AFTER (checks both undefined and null)
if (data.energyLevel !== undefined && data.energyLevel !== null)
  formData.append('energyLevel', data.energyLevel.toString());
if (data.valence !== undefined && data.valence !== null)
  formData.append('valence', data.valence.toString());
```

Also applied to other numeric fields for consistency:

- `durationSec`
- `bpm`

### Fix 2: Use Nullish Coalescing in Component

Updated `EditTrackDrawer.tsx` to use nullish coalescing operator (`??`):

```typescript
// ✅ AFTER (only replaces null/undefined, not 0)
setEnergyLevel(track.energyLevel ?? 0.5);
setValence(track.valence ?? 0.5);
```

The `??` operator only replaces `null` or `undefined`, not falsy values like `0`.

## Files Modified

1. **`src/shared/modules/tracks/services/trackService.ts`**
   - Added null checks for `durationSec`, `bpm`, `energyLevel`, `valence`
   - Prevents `.toString()` being called on `null` values

2. **`src/features/brand/pages/TrackManagement/components/EditTrackDrawer.tsx`**
   - Changed `||` to `??` for `energyLevel` and `valence`
   - Ensures default value (0.5) only when value is `null` or `undefined`

## Testing

### Test Cases

1. **Track with null energyLevel/valence:**
   - ✅ Should default to 0.5 in UI
   - ✅ Should not send null values to API
   - ✅ Should update successfully

2. **Track with 0 energyLevel/valence:**
   - ✅ Should display 0 in UI (not 0.5)
   - ✅ Should send 0 to API
   - ✅ Should update successfully

3. **Track with valid energyLevel/valence:**
   - ✅ Should display actual values
   - ✅ Should send actual values to API
   - ✅ Should update successfully

4. **Track with undefined energyLevel/valence:**
   - ✅ Should default to 0.5 in UI
   - ✅ Should not send undefined values to API
   - ✅ Should update successfully

## Related Issues

This fix also prevents similar errors for:

- `durationSec` field
- `bpm` field

Both now have proper null checks before calling `.toString()`.

## Prevention

### Best Practices

1. **Always check both `null` and `undefined` for optional numeric fields:**

   ```typescript
   if (value !== undefined && value !== null) {
     // safe to use value
   }
   ```

2. **Use nullish coalescing (`??`) instead of logical OR (`||`) for default values:**

   ```typescript
   const value = apiValue ?? defaultValue; // ✅ Good
   const value = apiValue || defaultValue; // ❌ Bad (treats 0 as falsy)
   ```

3. **Consider using TypeScript strict null checks:**
   ```json
   {
     "compilerOptions": {
       "strictNullChecks": true
     }
   }
   ```

## Impact

- **Severity:** High (blocks track editing functionality)
- **Affected Users:** BrandManager role editing tracks
- **Frequency:** Occurs when editing any track with null energyLevel/valence
- **Resolution:** Immediate (no data migration needed)

## Date

2026-03-24
