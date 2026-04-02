# BPM Tuning Keys (CAMS)

## 1. Runtime Settings (C# Options / env)

1. `Cams__BpmCandidateRangePadding`
   - Type: int
   - Default: 5
   - Meaning: widen `[RecommendedBpmMin..RecommendedBpmMax]` during candidate filtering.

## 2. StoreConfig/SystemConfig Overrides (DB key-value)

These keys are read hierarchically:
Space override → StoreConfig → SystemConfig → fallback defaults.

### Chill

- `Fuzzy:ChillBpmMin` (default: 60)
- `Fuzzy:ChillBpmMax` (default: 80)

### Focus

- `Fuzzy:FocusBpmMin` (default: 85)
- `Fuzzy:FocusBpmMax` (default: 105)

### Energetic

- `Fuzzy:EnergeticBpmMin` (default: 120)
- `Fuzzy:EnergeticBpmMax` (default: 140)

## 3. Notes

1. Candidate filtering is performed only when `RecommendedBpmMin` and `RecommendedBpmMax` are available.
2. Track with `Track.Bpm=null` will not match the BPM predicate, but a fallback second pass exists to keep queue length stable.
