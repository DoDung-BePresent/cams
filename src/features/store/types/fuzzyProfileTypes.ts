export type FuzzyMusicProfileDto = {
  id: string;
  brandId: string;
  storeId?: string | null;
  name: string;
  templateKey?: string | null;

  // BPM bands
  chillBpmMin: number;
  chillBpmMax: number;
  focusBpmMin: number;
  focusBpmMax: number;
  energeticBpmMin: number;
  energeticBpmMax: number;

  // Noise thresholds
  noiseQuietMaxDb: number;
  noiseLoudMinDb: number;
  defaultDecibelWhenNull: number;

  // Auto Volume
  autoVolumeEnabled: boolean;
  autoVolumeQuietPercent: number;
  autoVolumeModeratePercent: number;
  autoVolumeLoudPercent: number;
  autoVolumeMinPercent: number;
  autoVolumeMaxPercent: number;
  autoVolumeDeadbandPercent: number;

  // Mood bridge
  chillMoodCandidates?: string | null;
  focusMoodCandidates?: string | null;
  energeticMoodCandidates?: string | null;
};
