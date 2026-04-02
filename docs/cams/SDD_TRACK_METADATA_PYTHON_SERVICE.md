# SDD: Track Metadata Python Service (librosa)

## 1. Purpose

Provide a Python-based metadata extractor (librosa) that computes music characteristics from the uploaded raw audio file, and asynchronously writes results to `Track`:

- `Track.Bpm`
- `Track.EnergyLevel`
- `Track.Valence`

This enables CAMS fuzzy logic (Phase 2+) to select tracks by metadata (BPM) rather than relying purely on playlists.

## 2. Runtime Components

1. C# API + Hangfire job:
   - Enqueues metadata extraction after track upload/create/update
2. Python container (`metadata-python`):
   - `POST /metadata/extract` receives `audio_url`
   - downloads audio, runs librosa computations, returns JSON
3. PostgreSQL:
   - `Track` entity is overwritten with extracted values

## 3. Data Flow (async)

1. Manager calls `POST /api/tracks` or `PUT /api/tracks/{id}`
2. `CreateTrackCommandHandler` / `UpdateTrackCommandHandler`:
   - uploads audio to file storage
   - creates `Track.AudioUrl`
   - enqueues Hangfire job: `ExtractTrackMetadataJob`
3. `ExtractTrackMetadataJob`:
   - re-loads `Track` by `trackId`
   - stale guard:
     - allow only if `track.TranscodeVersion == expectedTranscodeVersion` OR `track.AudioUrl == expectedAudioUrl`
   - builds presigned URL from `Track.AudioUrl`
   - calls Python endpoint on the Docker network
4. Python returns extracted values
5. C# job overwrites `Track.Bpm`, `Track.EnergyLevel`, `Track.Valence` and saves

## 4. Python Endpoint Contract

### Request

`POST /metadata/extract`

```json
{ "audio_url": "https://...presigned..." }
```

### Response

```json
{ "bpm": 120, "energy": 0.73, "valence": 0.61 }
```

If extraction fails:

- `bpm=null`
- `energy=null`
- `valence=null`

## 5. Security / Network

- Endpoint is internal-only (called from C# over the Docker network).
- No auth is required for this endpoint in current design.

## 6. Operational Notes

1. The service must always return JSON (never HTML/text errors).
2. Extraction should be bounded by a server timeout (recommended ~120s).
3. Python must have audio decoding support:
   - `ffmpeg`
   - `libsndfile1`

## 7. Rollout / Debug Checklist

1. Verify Docker compose container `metadata-python` is up.
2. Confirm C# job is enqueued in queue `cams`.
3. Confirm the job can reach Python via:
   - `http://metadata-python:5000/metadata/extract`
4. Confirm `Track` fields are updated after job completion.
