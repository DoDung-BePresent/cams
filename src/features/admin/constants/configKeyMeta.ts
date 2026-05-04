/**
 * Human-readable metadata for every known config key.
 * Mirrors the key catalog in backend ConfigKeys.cs.
 *
 * Restriction flags match the backend set constants:
 *   hardLocked     → ConfigKeys.HardLockedKeys
 *   brandBlocked   → ConfigKeys.BrandNotAllowedKeys
 *   storeBlocked   → ConfigKeys.StoreWriteBlockedKeys
 *   spaceBlocked   → ConfigKeys.SpaceNotAllowedKeys
 */

export type ConfigKeyMeta = {
  /** Friendly display name shown in the UI. */
  label: string;
  /** Ant Design icon component name (string) for dynamic lookup, or a fixed icon class. */
  iconName: string;
  /** Key is permanently locked — no scope can write it except System Admin via policy. */
  hardLocked?: boolean;
  /** Key cannot be written at Brand scope via generic upsert. */
  brandBlocked?: boolean;
  /** Key cannot be written at Store scope via generic upsert. */
  storeBlocked?: boolean;
  /** Key cannot be overridden at Space scope regardless of override rules. */
  spaceBlocked?: boolean;
};

/** Full metadata catalog indexed by the exact backend key string. */
export const CONFIG_KEY_META: Record<string, ConfigKeyMeta> = {
  // ── A. Ops ────────────────────────────────────────────────────────────────
  'ops.openTime': {
    label: 'Opening Time',
    iconName: 'ClockCircleOutlined',
    spaceBlocked: true,
  },
  'ops.closeTime': {
    label: 'Closing Time',
    iconName: 'ClockCircleOutlined',
    spaceBlocked: true,
  },

  // ── B. Playback ───────────────────────────────────────────────────────────
  'playback.maxVolume': {
    label: 'Max Volume',
    iconName: 'SoundOutlined',
  },
  'playback.minVolume': {
    label: 'Min Volume',
    iconName: 'SoundOutlined',
  },
  'playback.baseVolume': {
    label: 'Base Volume',
    iconName: 'SoundOutlined',
  },
  'playback.crossfadeSec': {
    label: 'Crossfade Duration (s)',
    iconName: 'RetweetOutlined',
  },

  // ── C. Fuzzy ──────────────────────────────────────────────────────────────
  'fuzzy.profileRef': {
    label: 'Fuzzy Profile Reference',
    iconName: 'RobotOutlined',
  },

  // ── D. Content ────────────────────────────────────────────────────────────
  'content.enableAudioAds': {
    label: 'Enable Audio Ads',
    iconName: 'NotificationOutlined',
  },

  // ── E. Governance ─────────────────────────────────────────────────────────
  'governance.mode': {
    label: 'Governance Mode',
    iconName: 'SafetyCertificateOutlined',
    brandBlocked: true,
    storeBlocked: true,
    spaceBlocked: true,
  },
  // ── F. Scheduling ─────────────────────────────────────────────────────────
  // ── G. CAMS Runtime ───────────────────────────────────────────────────────
  'cams.slidingWindowMinutes': {
    label: 'Sliding Window (min)',
    iconName: 'FieldTimeOutlined',
  },
  'cams.aiQueueTrackLimit': {
    label: 'AI Queue Track Limit',
    iconName: 'RobotOutlined',
  },
  'cams.recentPlaybackCooldown': {
    label: 'Recent Playback Cooldown',
    iconName: 'PauseCircleOutlined',
  },
  'cams.moodTrackLimit': {
    label: 'Mood Track Limit',
    iconName: 'FilterOutlined',
  },
  'cams.isAiClearManagerTracks': {
    label: 'AI Clears Manager Tracks',
    iconName: 'ClearOutlined',
  },
  'cams.isAiPriorityInsert': {
    label: 'AI Priority Insert',
    iconName: 'VerticalAlignTopOutlined',
  },
  'cams.enableAutoMoodTransition': {
    label: 'Enable Auto Mood Transition',
    iconName: 'ThunderboltOutlined',
  },

  // ── H. System ─────────────────────────────────────────────────────────────
  'sys.aiServiceApiKey': {
    label: 'AI Service API Key',
    iconName: 'KeyOutlined',
  },
  'sys.workerIntervalSeconds': {
    label: 'Worker Interval (s)',
    iconName: 'SettingOutlined',
  },
  'sys.bpmCandidateRangePadding': {
    label: 'BPM Candidate Range Padding',
    iconName: 'SettingOutlined',
  },
  'sys.transcodeStateBatchSize': {
    label: 'Transcode State Batch Size',
    iconName: 'SettingOutlined',
  },
};

/**
 * Returns the friendly label for a key, falling back to the raw key string
 * if no metadata entry exists.
 */
export const getConfigKeyLabel = (key: string): string =>
  CONFIG_KEY_META[key]?.label ?? key;

/**
 * Returns the icon name for a key (Ant Design icon component name),
 * falling back to 'SettingOutlined'.
 */
export const getConfigKeyIconName = (key: string): string =>
  CONFIG_KEY_META[key]?.iconName ?? 'SettingOutlined';

/** Grouped Select options for filter dropdowns, organised by domain prefix. */
export const CONFIG_KEY_SELECT_OPTIONS = Object.entries(CONFIG_KEY_META).map(
  ([key, meta]) => ({
    label: `${meta.label} (${key})`,
    value: key,
  }),
);

export const TENANT_CONFIG_KEY_SELECT_OPTIONS = Object.entries(CONFIG_KEY_META)
  .filter(([key]) => !key.startsWith('sys.'))
  .map(([key, meta]) => ({
    label: `${meta.label} (${key})`,
    value: key,
  }));
