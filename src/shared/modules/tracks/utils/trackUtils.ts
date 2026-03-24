import type { TrackDetailResponse, TrackListItem } from '../types';
import { TrackMetadataStatus } from '../types';

/**
 * Determine metadata extraction status based on track fields
 * See: docs/cams/FE_IMPLEMENTATION_METADATA_TO_FUZZY_AI.md §2.3
 *
 * @param track - Track object (list item or detail)
 * @returns Metadata status enum
 */
export const getTrackMetadataStatus = (
  track: TrackListItem | TrackDetailResponse,
): TrackMetadataStatus => {
  // Check if track has detail fields (bpm, energyLevel, valence)
  const detailTrack = track as TrackDetailResponse;

  const hasBpm =
    detailTrack.bpm !== null &&
    detailTrack.bpm !== undefined &&
    detailTrack.bpm > 0;
  const hasEnergyLevel =
    detailTrack.energyLevel !== null && detailTrack.energyLevel !== undefined;
  const hasValence =
    detailTrack.valence !== null && detailTrack.valence !== undefined;

  // Ready: has all three metadata fields
  if (hasBpm && hasEnergyLevel && hasValence) {
    return TrackMetadataStatus.Ready;
  }

  // Partial: has some but not all metadata
  if (hasBpm || hasEnergyLevel || hasValence) {
    return TrackMetadataStatus.Partial;
  }

  // For newly created tracks (within 2 minutes), consider as Pending
  // Otherwise, consider as Unknown (extraction failed or timed out)
  const createdAt = new Date(track.createdAt);
  const now = new Date();
  const ageInMinutes = (now.getTime() - createdAt.getTime()) / 1000 / 60;

  // Pending if created within last 2 minutes
  if (ageInMinutes < 2) {
    return TrackMetadataStatus.Pending;
  }

  // Unknown if older than 2 minutes and still no metadata
  return TrackMetadataStatus.Unknown;
};

/**
 * Format BPM value for display
 * @param bpm - BPM value
 * @returns Formatted string or fallback
 */
export const formatBpm = (bpm?: number | null): string => {
  if (bpm === null || bpm === undefined || bpm === 0) {
    return '—';
  }
  return `${Math.round(bpm)} BPM`;
};

/**
 * Format energy level for display (0.0 - 1.0)
 * @param energyLevel - Energy level value
 * @returns Formatted string or fallback
 */
export const formatEnergyLevel = (energyLevel?: number | null): string => {
  if (energyLevel === null || energyLevel === undefined) {
    return '—';
  }
  return energyLevel.toFixed(2);
};

/**
 * Format valence for display (0.0 - 1.0)
 * @param valence - Valence value
 * @returns Formatted string or fallback
 */
export const formatValence = (valence?: number | null): string => {
  if (valence === null || valence === undefined) {
    return '—';
  }
  return valence.toFixed(2);
};

/**
 * Get metadata status badge color
 * @param status - Metadata status
 * @returns Ant Design badge status
 */
export const getMetadataStatusBadgeColor = (
  status: TrackMetadataStatus,
): 'success' | 'processing' | 'warning' | 'error' => {
  switch (status) {
    case TrackMetadataStatus.Ready:
      return 'success';
    case TrackMetadataStatus.Pending:
      return 'processing';
    case TrackMetadataStatus.Partial:
      return 'warning';
    case TrackMetadataStatus.Unknown:
      return 'error';
    default:
      return 'error';
  }
};

/**
 * Get metadata status display text
 * @param status - Metadata status
 * @returns Display text
 */
export const getMetadataStatusText = (status: TrackMetadataStatus): string => {
  switch (status) {
    case TrackMetadataStatus.Ready:
      return 'Metadata Ready';
    case TrackMetadataStatus.Pending:
      return 'Extracting Metadata...';
    case TrackMetadataStatus.Partial:
      return 'Partial Metadata';
    case TrackMetadataStatus.Unknown:
      return 'Metadata Unavailable';
    default:
      return 'Unknown';
  }
};
