export type CamsMoodTone = 'chill' | 'focus' | 'energetic' | 'neutral';

export type CamsMoodTheme = {
  tone: CamsMoodTone;
  label: string;
  color: string;
  colorSoft: string;
  glow: string;
  bg: string;
  shadow: string;
};

export const CAMS_MOOD_THEMES: Record<CamsMoodTone, CamsMoodTheme> = {
  chill: {
    tone: 'chill',
    label: 'Chill',
    color: '#10b981',
    colorSoft: '#22d3ee',
    glow: 'rgba(16,185,129,0.4)',
    bg: 'rgba(16,185,129,0.15)',
    shadow: 'rgba(16,185,129,0.15)',
  },
  focus: {
    tone: 'focus',
    label: 'Focus',
    color: '#3b82f6',
    colorSoft: '#818cf8',
    glow: 'rgba(59,130,246,0.4)',
    bg: 'rgba(59,130,246,0.15)',
    shadow: 'rgba(59,130,246,0.15)',
  },
  energetic: {
    tone: 'energetic',
    label: 'Energetic',
    color: '#f59e0b',
    colorSoft: '#fb7185',
    glow: 'rgba(245,158,11,0.4)',
    bg: 'rgba(245,158,11,0.15)',
    shadow: 'rgba(245,158,11,0.15)',
  },
  neutral: {
    tone: 'neutral',
    label: 'Mood',
    color: '#818cf8',
    colorSoft: '#93c5fd',
    glow: 'rgba(129,140,248,0.4)',
    bg: 'rgba(129,140,248,0.15)',
    shadow: 'rgba(129,140,248,0.15)',
  },
};

export const getCamsMoodTheme = (moodName?: string | null): CamsMoodTheme => {
  const mood = moodName?.trim().toLowerCase() ?? '';

  if (mood.includes('chill') || mood.includes('calm')) {
    return CAMS_MOOD_THEMES.chill;
  }

  if (mood.includes('focus')) {
    return CAMS_MOOD_THEMES.focus;
  }

  if (
    mood.includes('energetic') ||
    mood.includes('uplifting') ||
    mood.includes('social')
  ) {
    return CAMS_MOOD_THEMES.energetic;
  }

  return {
    ...CAMS_MOOD_THEMES.neutral,
    label: moodName || CAMS_MOOD_THEMES.neutral.label,
  };
};
