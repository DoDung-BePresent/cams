# Test Cases — Suno AI Music Generation

**Module:** Suno AI Generator  
**Role:** BrandManager only  
**Base path:** `/brand/suno-ai`  
**APIs:** `GET/PUT /api/cms/suno/config`, `POST /api/cms/suno/generations`, `GET /api/cms/suno/generations/{id}`, `POST /api/cms/suno/generations/{id}/cancel`  
**Real-time:** SignalR `SunoGenerationStatusChanged` event

---

## Config Management

| Test Case ID | Test Case Description         | Test Case Procedure                                               | Expected Results                                                                                         | Pre-conditions                                |
| ------------ | ----------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| SUNO-01      | Load Suno config successfully | Navigate to Suno AI page; observe config form                     | Config form loads with `sunoPromptTemplate`, `sunoDefaultPlaylistId`, `aiGenerationMode` values from API | BrandManager logged in; brand has Suno config |
| SUNO-02      | Update prompt template        | Edit `sunoPromptTemplate` field; click Save                       | `PUT /api/cms/suno/config` called; success message shown; form reflects saved value                      | BrandManager logged in                        |
| SUNO-03      | Set default target playlist   | Select a playlist in `sunoDefaultPlaylistId` dropdown; save       | Config saved; selected playlist shown in generation form as default                                      | Active playlists exist in brand               |
| SUNO-04      | Switch AI generation mode     | Toggle `aiGenerationMode` between Suno(1) and BrandModel(2); save | Mode saved correctly; generation form adapts to mode                                                     | BrandManager logged in                        |

---

## Generation — Create

| Test Case ID | Test Case Description                              | Test Case Procedure                                                                                | Expected Results                                                                                                      | Pre-conditions                            |
| ------------ | -------------------------------------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| SUNO-05      | Submit generation with prompt only                 | Enter prompt text; leave other fields empty; click Generate                                        | `POST /api/cms/suno/generations` called with `202 Accepted`; new job appears in history list with status `Queued (0)` | Brand wallet has sufficient tokens        |
| SUNO-06      | Submit generation with full fields                 | Fill prompt, style, title, artist, duration, mood, target playlist; enable autoAdd; click Generate | Job created with all fields; `generationStatus = 0` (Queued)                                                          | Mood and playlist exist                   |
| SUNO-07      | Submit instrumental generation                     | Enable `instrumental` toggle; click Generate                                                       | Job created with `instrumental: true`; no lyrics expected in output                                                   | Brand wallet has tokens                   |
| SUNO-08      | Submit generation with custom lyrics               | Enable `customMode`; enter lyrics; click Generate                                                  | Job created with `customMode: true` and lyrics payload                                                                | BrandManager logged in                    |
| SUNO-09      | Submit generation with empty prompt                | Leave prompt blank; click Generate                                                                 | Validation error shown or request proceeds per backend rules; no crash                                                | BrandManager on generate tab              |
| SUNO-10      | Submit generation with insufficient wallet balance | Brand wallet locked/empty; click Generate                                                          | Error response from API shown; user informed about insufficient tokens                                                | Brand wallet is locked (`isLocked: true`) |

---

## Generation — Real-time Status Tracking

| Test Case ID | Test Case Description                                  | Test Case Procedure                      | Expected Results                                                                                                                        | Pre-conditions                        |
| ------------ | ------------------------------------------------------ | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| SUNO-11      | Status updates from Queued → Generating via SignalR    | Submit generation; observe status in UI  | Status tag updates from `Queued` → `Generating` without page refresh; `progressPercent` increases                                       | SignalR connected; brand group joined |
| SUNO-12      | Status updates from Generating → Completed via SignalR | Wait for generation to complete          | Status tag updates to `Completed`; `generatedTrackId` populated; track auto-added to target playlist if `autoAddToTargetPlaylist: true` | Active generation in progress         |
| SUNO-13      | Status updates to Failed via SignalR                   | Simulate or wait for a failed generation | Status shows `Failed`; `errorMessage` displayed in UI                                                                                   | Generation job exists                 |
| SUNO-14      | Status persists on page reload (polling fallback)      | Refresh page during active generation    | `GET /api/cms/suno/generations/{id}` called; status loaded correctly from API                                                           | Active generation in progress         |

---

## Generation — Cancel & History

| Test Case ID | Test Case Description                       | Test Case Procedure                              | Expected Results                                                                                     | Pre-conditions                                  |
| ------------ | ------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| SUNO-15      | Cancel an active generation                 | Open generation detail; click Cancel             | `POST /api/cms/suno/generations/{id}/cancel` called; status updates to `Cancelled (4)`               | Generation is in `Queued` or `Generating` state |
| SUNO-16      | Cannot cancel a completed generation        | Open a completed generation; check Cancel button | Cancel button hidden or disabled for `Completed`/`Failed`/`Cancelled` states                         | Completed generation exists                     |
| SUNO-17      | View generation history list                | Navigate to history tab on Suno page             | List of past generations shown with status, prompt, timestamp; pagination works                      | At least one generation exists                  |
| SUNO-18      | Open generation detail drawer               | Click on a generation in history list            | `SunoGenerationLogDrawer` opens with full details: prompt, status, progress, track link if completed | Generation history loaded                       |
| SUNO-19      | Completed generation links to created track | View completed generation detail                 | `generatedTrackId` displayed as a link or track info; navigating it shows the track                  | Generation status is `Completed`                |

---

## Authorization & Edge Cases

| Test Case ID | Test Case Description                             | Test Case Procedure                                      | Expected Results                                                                                       | Pre-conditions                            |
| ------------ | ------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ----------------------------------------- |
| SUNO-20      | SystemAdmin cannot access Suno page               | Login as SystemAdmin; navigate to `/brand/suno-ai`       | Redirected to unauthorized or route not found                                                          | SystemAdmin account                       |
| SUNO-21      | StoreManager cannot access Suno page              | Login as StoreManager; navigate to `/brand/suno-ai`      | Redirected to unauthorized                                                                             | StoreManager account                      |
| SUNO-22      | BrandManager can only see own brand's generations | Login as BrandManager; view history                      | Only generations belonging to own brand are returned                                                   | Multiple brands exist                     |
| SUNO-23      | SignalR event from different brand ignored        | Another brand's generation completes                     | UI does not update with wrong brand's event; own brand group filtering works                           | SignalR connected; multiple brands active |
| SUNO-24      | Network disconnection during generation           | Disconnect network after submitting                      | UI shows connection lost; reconnects automatically; status resumes via polling or SignalR on reconnect | Active generation in progress             |
| SUNO-25      | Generation history pagination                     | Generate more than page size entries; observe pagination | Pagination controls appear; navigating pages loads correct entries                                     | More than 10 generations exist            |
