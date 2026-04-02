# Giai thich vi sao CAMS AI chon bai nhac do (de review voi mentor)

## Muc tieu tai lieu

Tai lieu nay tra loi cau hoi: "Tai sao engine chon bai nay ma khong phai bai khac?"

Thay vi mo ta chung chung, toan bo luong duoc phan tich theo 3 lop quyet dinh co the audit:

1. Fuzzy Logic quyet dinh `mood` + `recommended BPM band/target`.
2. Queue selector loc tap candidate theo mood + BPM + cooldown + trang thai dang phat.
3. Co fallback de dam bao queue khong bi rong trong dieu kien du lieu chua day du (vi du `Track.Bpm = null`).

---

## 1) Lop 1 - Fuzzy Logic quyet dinh mood va BPM

### 1.1 Inputs duoc fuzzify

Engine nhan telemetry da duoc lam muot (sliding window):

- `PeopleCount`
- `Sensors.Temperature`
- `WifiDeviceCount`

Sau do map ve tap ngon ngu:

- Pressure:
  - Low neu `peopleCount < PressureLowMax`
  - Critical neu `peopleCount > PressureCriticalMin`
  - Nguoc lai la Medium
- Stress:
  - Comfortable neu `temperature < StressComfortableMax`
  - High neu `temperature > StressHighMin`
  - Nguoc lai la Tolerable
  - Neu `temperature = null` => Comfortable (safe default)
- Density:
  - ratio = `wifiDeviceCount / SpaceCapacity`
  - Neu wifi null hoac capacity <= 0 => dung ratio mac dinh `0.5` (Moderate)
  - Sparse neu `ratio < DensitySparseMax`
  - Crowded neu `ratio > DensityCrowdedMin`
  - Nguoc lai la Moderate

### 1.2 Rule base theo thu tu uu tien (first-match-wins)

Thu tu rule la diem quan trong de giai thich tinh "co chu dich":

1. `RULE_1_RUSH_HOUR`: Pressure Critical => `Energetic`
2. `RULE_2_HEATWAVE`: Stress High va Density Crowded => `Chill`
3. `RULE_3_RETENTION`: Pressure Low va (Density Moderate hoac Crowded) => `Focus`
4. `DEFAULT`: khong match thi `Focus`

Nghia la neu Rule 1 da dung, Rule 2/3 se KHONG duoc xet nua.

### 1.3 BPM band va target duoc suy ra tu mood + bias moi truong

- Band goc theo mood thresholds:
  - Chill: `ChillBpmMin..ChillBpmMax`
  - Focus: `FocusBpmMin..FocusBpmMax`
  - Energetic: `EnergeticBpmMin..EnergeticBpmMax`

- Target BPM trong band duoc bias boi `upperBias`:
  - Cong diem: Critical pressure (+2), High stress (+2), Crowded (+1)
  - Tru diem: Low pressure (-2), Comfortable (-1), Sparse (-1)

- Cach chon target:
  - `upperBias >= 2` => target o khoang 66% ve phia max
  - `upperBias <= -2` => target o khoang 33% ve phia max
  - Con lai => midpoint (50%)

Tom lai: mood quyet dinh "band", moi truong quyet dinh "diem trong band".

---

## 2) Lop 2 - Chon candidate tracks trong StartSpacePlayback

Sau khi co `NewMood` + `RecommendedBpmMin/Max/Target`, handler chon track theo pipeline:

### 2.1 Tao BPM band da pad

Neu co min/max tu Fuzzy:

- `paddedMin = max(1, recommendedMin - BpmCandidateRangePadding)`
- `paddedMax = max(paddedMin, recommendedMax + BpmCandidateRangePadding)`

Muc dich: tranh qua cang, de queue duoc on dinh hon khi thu vien track khong qua day.

### 2.2 Query pass A: Mood-only (de do baseline va de fallback)

Lay danh sach bai theo:

- Brand dung
- Track active
- MoodType dung
- Cooldown playback
- Gioi han `AiQueueTrackLimit`

### 2.3 Query pass B: Mood + BPM

Neu co padded BPM band thi query them dieu kien:

- `Track.Bpm >= paddedMin`
- `Track.Bpm <= paddedMax`

Luu y quan trong:

- Track co `Bpm = null` KHONG match pass B (bi loai bo).
- Day la hanh vi co chu dich de tranh bai khong ro BPM lam sai context.

### 2.4 Fallback de giu do dai queue

Neu pass B ra qua it bai (`count < queueTrackLimit`):

- Gop ket qua pass B voi mood-only
- `Distinct()`
- `Take(queueTrackLimit)`

Nghia la engine uu tien dung BPM truoc, nhung khong de queue bi thieu bai.

### 2.5 Cac lop loc bo sung truoc khi enqueue

Sau candidate selection, he thong loc them:

- Loai bai dang o trang thai `Playing` trong space (tranh requeue bai dang phat)
- Neu van rong thi fallback sang playlist fallback theo mood

Do do, mot bai "khong duoc chon" co the bi loai bo o bat ky lop nao ben tren, khong chi vi fuzzy rule.

---

## 3) Lop 3 - On dinh van hanh va tranh quyet dinh sai thoi diem

StartSpacePlayback co them cac guard de tranh "AI cat ngang" lenh moi hon:

- Stale event guard: neu state da update sau `OccurredAtUtc` cua event, chi refill queue, khong cutover ngay.
- Manual override guard: manager override dang bat thi AI khong duoc cutover.
- Optimistic concurrency guard: state doi version thi bo qua cutover.

Y nghia cho mentor: AI quyet dinh khong chi dung logic, ma con ton trong authority va tinh nhat quan runtime.

---

## 4) Cach giai thich mot quyet dinh cu the (template audit)

Khi can giai trinh "vi sao bai X duoc chon", trinh bay theo 7 dong:

1. Telemetry da smoothed: People/WiFi/Temp la bao nhieu?
2. Fuzzy sets: Pressure/Stress/Density ra gi?
3. Rule fired: `TriggeredRule` nao, `Reason` la gi?
4. BPM recommendation: `RecommendedBpmMin/Max/Target` bao nhieu?
5. Runtime padding: `BpmCandidateRangePadding` bao nhieu, ra padded band nao?
6. Candidate stats: `MoodOnlyCount`, `BpmFilteredCount`, co `BpmFallback` khong?
7. Ket qua cuoi: bai duoc enqueue/phat co vuot qua cooldown, playing-filter, fallback rules khong?

Neu 7 dong nay day du, quyet dinh AI co the audit lai 1-1.

---

## 5) Bang chung tu code va test

### Code neo luong

- `FuzzyLogicEngine.Analyze` tra ve `TriggeredRule`, `Reason`, `RecommendedBpm*`.
- `AnalyzeSpaceContextCommandHandler` load thresholds theo hierarchy, run fuzzy, publish event kem BPM recommendation.
- `MoodChangedDomainEventHandler` la adapter Event -> `StartSpacePlaybackCommand`.
- `StartSpacePlaybackCommandHandler` thuc hien 2-pass candidate selection + BPM fallback + queue guards.
- `SpaceExtensions.ResolveTrackIdsFromMoodAsync` ap predicate BPM (bao gom check `t.Bpm.HasValue`).

### Test neo hanh vi

- Unit tests xac nhan:
  - Rule priority (Rule 1 override Rule 2)
  - Boundary conditions (`<` va `>` tai nguong)
  - Null handling (`WifiDeviceCount`, `Temperature`, `Sensors`)
  - Custom thresholds override
- Background flow tests xac nhan:
  - Luong telemetry -> fuzzy -> domain event -> context history la thong suot

---

## 6) Cac diem mentor thuong hoi va cau tra loi ngan

1. "Tai sao khong filter BPM cung luc voi mood ngay tu dau?"

- Co, pass B da filter BPM. Nhung co pass A + fallback de queue khong bi can do du lieu BPM thieu/cham.

2. "Track BPM null co duoc chon khong?"

- Khong qua pass B. Co the duoc vao queue qua fallback mood-only neu can giu do dai queue.

3. "Neu AI quyet dinh cu den sau manager override thi sao?"

- Guard stale/manual override se chan cutover. AI chi cap nhat queue o muc an toan.

4. "Co giai thich duoc vi sao Rule nay no khong?"

- Co, vi result co `TriggeredRule` + `Reason`, va test da xac nhan rule precedence + boundary.

---

## 7) Ket luan cho buoi review

Quyet dinh "chon bai" cua CAMS khong phai random. No la mot chuoi quyet dinh co thu tu va co guard:

- Fuzzy rule tao y do (`mood + BPM band/target`).
- Selector chuyen y do thanh tap bai cu the (`mood -> BPM -> cooldown -> playing-filter -> fallback`).
- Runtime guards bao toan tinh dung va authority khi he thong co race/manual override.

Vi vay, moi bai duoc phat deu co the truy vet nguoc den telemetry, rule fired, va cac bo loc da ap dung.
