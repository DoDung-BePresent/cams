# Test Cases — Music Schedule Management

**Module:** Space Schedule  
**Role:** StoreManager (primary), BrandManager (via store access)  
**Route:** `/store/spaces/:spaceId/schedule`  
**APIs:** `GET /api/cms/schedule/spaces/{spaceId}/bootstrap`, `PUT /api/cms/schedule/spaces/{spaceId}/slots/{slotId}`, `DELETE /api/cms/schedule/spaces/{spaceId}/slots/{slotId}`, `POST /api/cms/schedule/spaces/{spaceId}/apply-source`, `POST /api/cms/schedule/spaces/{spaceId}/save-to-library`, `PATCH /api/cms/schedule/spaces/{spaceId}/toggle`  
**Components:** `SpaceSchedulePage`, `UpsertScheduleSlotDrawer`, `ScheduleSourcePickerModal`, `SaveToLibraryModal`

---

## Bootstrap & Initial Load

| Test Case ID | Test Case Description                    | Test Case Procedure                       | Expected Results                                                                                                                  | Pre-conditions                       |
| ------------ | ---------------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| SCHED-01     | Schedule page loads bootstrap data       | Navigate to `spaces/:spaceId/schedule`    | `GET /api/cms/schedule/spaces/{id}/bootstrap` called; `draftSchedule`, `librarySources`, `templateSources`, `musicCatalog` loaded | StoreManager logged in; space exists |
| SCHED-02     | Welcome stage shown when no draft exists | Open schedule page with no existing draft | `stage = 'welcome'` shown; user prompted to create new schedule or apply from source                                              | Space has no draft schedule          |
| SCHED-03     | Editor stage shown when draft exists     | Open schedule page with existing draft    | `stage = 'editor'` shown directly; draft slots displayed on selected day                                                          | Space has existing draft schedule    |
| SCHED-04     | Day selector defaults to current day     | Open schedule editor                      | Day segmented control defaults to today's day of week                                                                             | Draft schedule exists                |

---

## Slot Management (Create/Edit)

| Test Case ID | Test Case Description                      | Test Case Procedure                                                | Expected Results                                                                    | Pre-conditions                    |
| ------------ | ------------------------------------------ | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------- | --------------------------------- |
| SCHED-05     | Create schedule slot with valid time range | Click Add Slot; fill `startTime`, `endTime`, select playlist; save | `PUT /api/cms/schedule/spaces/{id}/slots/{slotId}` called; slot appears in day view | Playlists available; draft exists |
| SCHED-06     | Edit existing schedule slot                | Click on a slot; modify time or playlist; save                     | Slot updated via upsert API; updated values shown in UI                             | At least one slot exists          |
| SCHED-07     | Create slot spanning midnight not allowed  | Enter `startTime` later than `endTime`; submit                     | Validation error shown in `UpsertScheduleSlotDrawer`; slot not saved                | Schedule editor open              |
| SCHED-08     | Create slot for multiple days of week      | Select multiple day checkboxes in slot drawer; save                | Slot created with `daysOfWeek` array containing all selected days                   | Draft schedule exists             |
| SCHED-09     | Playlist required for slot creation        | Submit slot form without selecting playlist                        | Validation error: playlist is required                                              | Schedule drawer open              |

---

## Delete Slot

| Test Case ID | Test Case Description            | Test Case Procedure                       | Expected Results                                                                         | Pre-conditions           |
| ------------ | -------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------ |
| SCHED-10     | Delete a schedule slot           | Click delete on a slot; confirm via modal | `DELETE /api/cms/schedule/spaces/{id}/slots/{slotId}` called; slot removed from day view | At least one slot exists |
| SCHED-11     | Delete confirmation dialog shown | Click delete on a slot                    | AppModal.confirm shown before deletion; cancelling prevents deletion                     | Slot exists              |

---

## Apply Schedule from Source

| Test Case ID | Test Case Description                              | Test Case Procedure                                                | Expected Results                                                                                      | Pre-conditions                      |
| ------------ | -------------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- | ----------------------------------- |
| SCHED-12     | Apply schedule from library source                 | Open `ScheduleSourcePickerModal`; select a library source; confirm | `POST /api/cms/schedule/spaces/{id}/apply-source` called; draft replaced with selected source's slots | Library sources exist in bootstrap  |
| SCHED-13     | Apply schedule from template source                | Select a system template in picker; confirm                        | Draft updated with template slots; template source shown in `sourceLabel`                             | Template sources exist in bootstrap |
| SCHED-14     | Source picker shows both library and template tabs | Open source picker modal                                           | Two tabs visible: Library and Template; each lists respective sources                                 | Bootstrap has both source types     |
| SCHED-15     | Applying source overwrites existing draft          | Existing draft has slots; apply new source                         | Previous draft slots replaced entirely with new source slots                                          | Existing draft with slots           |

---

## Save to Library

| Test Case ID | Test Case Description          | Test Case Procedure                                      | Expected Results                                                                                  | Pre-conditions                      |
| ------------ | ------------------------------ | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------- |
| SCHED-16     | Save current draft to library  | Click Save to Library; enter title and subtitle; confirm | `POST /api/cms/schedule/spaces/{id}/save-to-library` called; new entry appears in library sources | Draft with at least one slot exists |
| SCHED-17     | Save to library requires title | Submit `SaveToLibraryModal` without title                | Validation error shown; API not called                                                            | Draft exists; library modal open    |

---

## Enable / Disable Schedule

| Test Case ID | Test Case Description                   | Test Case Procedure           | Expected Results                                                                                        | Pre-conditions                   |
| ------------ | --------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------- | -------------------------------- |
| SCHED-18     | Enable space schedule                   | Toggle schedule switch to ON  | `PATCH /api/cms/schedule/spaces/{id}/toggle` called with `enabled: true`; switch reflects enabled state | Draft schedule exists with slots |
| SCHED-19     | Disable space schedule                  | Toggle schedule switch to OFF | API called with `enabled: false`; schedule suspended; CAMS falls back to AI-driven selection            | Schedule currently enabled       |
| SCHED-20     | Schedule status persists on page reload | Enable schedule; reload page  | Bootstrap returns schedule with `enabled: true`; toggle shows correct state                             | Schedule enabled                 |

---

## Integration with Playlists & CAMS

| Test Case ID | Test Case Description                        | Test Case Procedure                        | Expected Results                                                                                   | Pre-conditions                         |
| ------------ | -------------------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------- | -------------------------------------- |
| SCHED-21     | Only active playlists shown in slot dropdown | Open slot drawer; check playlist options   | Only playlists with active status appear in `playlistId` selector                                  | Mix of active/inactive playlists exist |
| SCHED-22     | Music catalog renders track previews         | View `musicCatalog` items in source picker | Each item shows `title`, `artist`, `artworkLabel`, colored badge using `primaryHex`/`secondaryHex` | Bootstrap returns musicCatalog entries |

---

## Authorization & Edge Cases

| Test Case ID | Test Case Description                               | Test Case Procedure                                            | Expected Results                                                      | Pre-conditions                     |
| ------------ | --------------------------------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------- | ---------------------------------- |
| SCHED-23     | StoreManager can only access own store's spaces     | Navigate to another store's space schedule URL                 | 403 returned or redirect; space detail not loaded                     | StoreManager with specific storeId |
| SCHED-24     | SystemAdmin cannot access store schedule route      | Login as SystemAdmin; navigate to `/store/spaces/:id/schedule` | Redirect to admin dashboard or unauthorized page                      | SystemAdmin account                |
| SCHED-25     | Space with no playlists shows empty playlist picker | Create slot in a space whose store has no playlists            | Empty state shown in playlist dropdown; informative message displayed | Store has no playlists             |
