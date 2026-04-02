# SDD: BPM-Based AI Queue Selection (CAMS Phase 2+)

## 1. Objective

Change CAMS “what to play” from mood-only/playlist-based selection to metadata-based track selection:

- fuzzy logic analyzes IoT context
- fuzzy outputs `mood + BPM band/target`
- backend selects candidate tracks whose `Track.Bpm` fits the band
- queue refill inserts up to the configured number of tracks (e.g. `15`)

## 2. Fuzzy Output Extension

`FuzzyLogicEngine` now returns a `FuzzyAnalysisResult` with:

- `TargetMood` (CamsMood)
- `RecommendedBpmMin`, `RecommendedBpmMax`, `RecommendedBpmTarget`

`FuzzyThresholds` adds default BPM bands per mood:

- Chill (60..80)
- Focus (85..105)
- Energetic (120..140)

StoreConfig can optionally override any of these via:

- `Fuzzy:ChillBpmMin`, `Fuzzy:ChillBpmMax`
- `Fuzzy:FocusBpmMin`, `Fuzzy:FocusBpmMax`
- `Fuzzy:EnergeticBpmMin`, `Fuzzy:EnergeticBpmMax`

## 3. BPM Candidate Filtering

During queue refill:

1. Candidates must match target mood:
   - `Track.Mood.MoodType == moodType`
2. When BPM bounds exist, filter by:
   - `Track.Bpm >= bpmMin - padding`
   - `Track.Bpm <= bpmMax + padding`

Padding config:

- `Cams__BpmCandidateRangePadding` (default: `5`)

## 4. Stable Queue Fill Rule

If the BPM-filtered set is smaller than the queue limit:

- do a second pass without BPM constraints (keep mood constraint)
- deduplicate and take up to `queueTrackLimit`

Playback must never block due to missing/empty BPM metadata.

## 5. Missing BPM / Async Metadata Staleness

Because `Track.Bpm` is filled asynchronously by Hangfire:

- some tracks may temporarily have `Track.Bpm=null`
- the BPM filter should treat null as non-match
- but the fallback second pass ensures the queue size stays stable

## 6. Debug & Observability Checklist

For each AI refill cycle log:

- fuzzy: `TargetMood` + `RecommendedBpmMin/Max/Target`
- number of candidates pre-filter (mood-only)
- number of candidates post-filter (mood + bpm)
- whether fallback second pass was used

**_ End of SDD _**
