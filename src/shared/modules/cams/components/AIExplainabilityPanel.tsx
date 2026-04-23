import {
  Card,
  Descriptions,
  Tag,
  Alert,
  Space,
  Tooltip,
  Progress,
  Table,
} from 'antd';
import {
  ThunderboltOutlined,
  FireOutlined,
  EyeOutlined,
  InfoCircleOutlined,
  SoundOutlined,
} from '@ant-design/icons';
import type {
  SpaceStateDto,
  SpaceStateResponse,
  FuzzySignalContribution,
} from '../types';

interface AIExplainabilityPanelProps {
  spaceState: SpaceStateDto | SpaceStateResponse;
  compact?: boolean; // Compact mode for smaller displays
}

interface SignalRow {
  key: string;
  signal: string;
  value: string;
  impact: string;
  chillDelta: number | null;
  focusDelta: number | null;
  energeticDelta: number | null;
}

/**
 * AI Explainability Panel
 * Shows fuzzy logic decisions and BPM-based selection transparency
 * See: docs/cams/FE_IMPLEMENTATION_METADATA_TO_FUZZY_AI.md §4
 */
export const AIExplainabilityPanel = ({
  spaceState,
  compact = false,
}: AIExplainabilityPanelProps) => {
  const rawState = spaceState as unknown as Record<string, unknown>;
  const rawConfidence =
    (spaceState as { fuzzyConfidence?: number | null }).fuzzyConfidence ??
    (rawState.fuzzy_confidence as number | null | undefined) ??
    null;
  const rawScoreBreakdown =
    (spaceState as { fuzzyScoreBreakdown?: unknown }).fuzzyScoreBreakdown ??
    rawState.fuzzy_score_breakdown ??
    (() => {
      const jsonValue =
        (rawState.fuzzyScoreJson as string | null | undefined) ??
        (rawState.fuzzy_score_json as string | null | undefined);
      if (!jsonValue || typeof jsonValue !== 'string') return null;
      try {
        return JSON.parse(jsonValue);
      } catch {
        return null;
      }
    })();

  const toPercent = (value?: number | null) =>
    typeof value === 'number'
      ? Math.round(Math.max(0, Math.min(1, value)) * 100)
      : null;

  const inferBpmRangeFromMood = (moodName?: string | null) => {
    const mood = moodName?.toLowerCase() || '';

    if (mood.includes('focus')) {
      return { min: 85, max: 105, target: 95 };
    }

    if (mood.includes('energetic') || mood.includes('uplifting')) {
      return { min: 120, max: 140, target: 130 };
    }

    if (
      mood.includes('calm') ||
      mood.includes('chill') ||
      mood.includes('social') ||
      mood.includes('romantic')
    ) {
      return { min: 60, max: 80, target: 70 };
    }

    return null;
  };

  const fallbackBpmRange = inferBpmRangeFromMood(spaceState.moodName);
  const bpmMin = spaceState.bpmMin ?? fallbackBpmRange?.min ?? null;
  const bpmMax = spaceState.bpmMax ?? fallbackBpmRange?.max ?? null;
  const bpmTarget = spaceState.bpmTarget ?? fallbackBpmRange?.target ?? null;

  const hasBpmRange = bpmMin !== null && bpmMax !== null;
  const hasFuzzyInfo = spaceState.fuzzyRule || spaceState.fuzzyReason;
  const hasScoreBreakdown = !!rawScoreBreakdown;
  const confidencePercent = toPercent(rawConfidence);
  const isFallback = spaceState.isBpmFallback === true;

  // Don't show panel if no AI info available
  if (!hasBpmRange && !hasFuzzyInfo && !isFallback && !hasScoreBreakdown) {
    return null;
  }

  // Get mood icon
  const getMoodIcon = (moodName?: string | null) => {
    const mood = moodName?.toLowerCase();
    if (mood?.includes('energetic')) return <ThunderboltOutlined />;
    if (mood?.includes('chill')) return <FireOutlined />;
    if (mood?.includes('focus')) return <EyeOutlined />;
    return <SoundOutlined />;
  };

  // Format fuzzy rule name for display
  const formatRuleName = (rule?: string | null): string => {
    if (!rule) return '';

    // Remove "RULE_X_" prefix
    const cleaned = rule.replace(/^RULE_\d+_/, '');

    // Convert SNAKE_CASE to Title Case
    return cleaned
      .split('_')
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  const formatSignalLabel = (raw?: string | null) => {
    if (!raw) return { signal: 'Unknown', value: 'N/A' };
    const matched = raw.match(/^([^(]+)\((.*)\)$/);
    if (!matched) return { signal: raw, value: 'N/A' };
    return {
      signal: matched[1].trim(),
      value: matched[2].trim(),
    };
  };

  const prettifySignalName = (name?: string) => {
    if (!name) return 'Unknown';
    const mapped: Record<string, string> = {
      crowdPressure: 'Crowd pressure',
      ambientNoise: 'Ambient noise',
      timeOfDay: 'Time of day',
      dayOfWeek: 'Day of week',
      businessPhase: 'Business phase',
    };
    return mapped[name] ?? name;
  };

  const scoreBreakdown = rawScoreBreakdown as
    | {
        chillScore?: number;
        focusScore?: number;
        energeticScore?: number;
        chill_score?: number;
        focus_score?: number;
        energetic_score?: number;
        signalContributions?: FuzzySignalContribution[] | null;
        signal_contributions?: FuzzySignalContribution[] | null;
        signals?: FuzzySignalContribution[] | string[] | null;
        contributions?: FuzzySignalContribution[] | null;
      }
    | null
    | undefined;

  const normalizeScore = (value?: number) => {
    if (typeof value !== 'number' || Number.isNaN(value)) return 0;
    return value <= 1 ? Math.round(value * 100) : Math.round(value);
  };

  const rawSignals =
    scoreBreakdown?.signalContributions ??
    scoreBreakdown?.signal_contributions ??
    scoreBreakdown?.contributions ??
    scoreBreakdown?.signals ??
    [];

  const signalRows: SignalRow[] =
    rawSignals?.map((item: FuzzySignalContribution | string, idx: number) => {
      if (typeof item === 'string') {
        const parsed = formatSignalLabel(item);
        return {
          key: `${item}-${idx}`,
          signal: prettifySignalName(parsed.signal),
          value: parsed.value,
          impact: 'N/A',
          chillDelta: null,
          focusDelta: null,
          energeticDelta: null,
        };
      }

      const parsed = formatSignalLabel(item.signal);
      const chillDelta =
        typeof item.chillDelta === 'number' ? item.chillDelta : 0;
      const focusDelta =
        typeof item.focusDelta === 'number' ? item.focusDelta : 0;
      const energeticDelta =
        typeof item.energeticDelta === 'number' ? item.energeticDelta : 0;
      const impact = [chillDelta, focusDelta, energeticDelta]
        .map((v) =>
          typeof v === 'number'
            ? `${v >= 0 ? '+' : ''}${v.toFixed(2)}`
            : '0.00',
        )
        .join(' / ');
      return {
        key: `${item.signal}-${idx}`,
        signal: prettifySignalName(parsed.signal),
        value: parsed.value,
        impact,
        chillDelta,
        focusDelta,
        energeticDelta,
      };
    }) ?? [];

  // Compact mode - single line display
  if (compact) {
    return (
      <Alert
        type='info'
        showIcon
        icon={getMoodIcon(spaceState.moodName)}
        message={
          <Space
            size='small'
            wrap
          >
            {spaceState.moodName && (
              <Tag
                color='blue'
                icon={getMoodIcon(spaceState.moodName)}
              >
                {spaceState.moodName}
              </Tag>
            )}
            {hasBpmRange && (
              <Tag color='cyan'>
                BPM: {bpmMin}-{bpmMax}
                {bpmTarget && ` (target: ${bpmTarget})`}
              </Tag>
            )}
            {confidencePercent != null && (
              <Tag color='gold'>Confidence: {confidencePercent}%</Tag>
            )}
            {isFallback && (
              <Tag
                color='warning'
                icon={<InfoCircleOutlined />}
              >
                Mood-only
              </Tag>
            )}
          </Space>
        }
      />
    );
  }

  // Full mode - detailed card
  return (
    <Card
      title={
        <Space>
          <SoundOutlined />
          <span>AI Music Selection</span>
        </Space>
      }
      size='small'
    >
      <Space
        direction='vertical'
        style={{ width: '100%' }}
        size='middle'
      >
        <Descriptions
          column={1}
          size='small'
        >
          {/* Current Mood */}
          {spaceState.moodName && (
            <Descriptions.Item label='Current Mood'>
              <Tag
                color='blue'
                icon={getMoodIcon(spaceState.moodName)}
              >
                {spaceState.moodName}
              </Tag>
            </Descriptions.Item>
          )}

          {/* BPM Range */}
          {hasBpmRange && (
            <Descriptions.Item
              label={
                <Tooltip title='AI selects tracks within this BPM range based on context analysis'>
                  <Space size={4}>
                    <span>BPM Range</span>
                    <InfoCircleOutlined style={{ color: '#999' }} />
                  </Space>
                </Tooltip>
              }
            >
              <Space size='small'>
                <Tag color='cyan'>
                  {bpmMin} - {bpmMax} BPM
                </Tag>
                {bpmTarget && (
                  <Tooltip title='Target BPM within the range'>
                    <Tag color='geekblue'>Target: {bpmTarget}</Tag>
                  </Tooltip>
                )}
              </Space>
            </Descriptions.Item>
          )}

          {/* Fuzzy Rule */}
          {spaceState.fuzzyRule && (
            <Descriptions.Item
              label={
                <Tooltip title='The fuzzy logic rule that determined current mood and BPM'>
                  <Space size={4}>
                    <span>Context Rule</span>
                    <InfoCircleOutlined style={{ color: '#999' }} />
                  </Space>
                </Tooltip>
              }
            >
              <Tag color='purple'>{formatRuleName(spaceState.fuzzyRule)}</Tag>
            </Descriptions.Item>
          )}

          {/* Fuzzy Reason */}
          {spaceState.fuzzyReason && (
            <Descriptions.Item label='Reason'>
              <span style={{ fontSize: 13, color: '#666' }}>
                {spaceState.fuzzyReason}
              </span>
            </Descriptions.Item>
          )}
        </Descriptions>

        {confidencePercent != null && (
          <div>
            <div style={{ marginBottom: 6, fontSize: 12, color: '#666' }}>
              Confidence
            </div>
            <Progress
              percent={confidencePercent}
              size='small'
              status={confidencePercent >= 50 ? 'success' : 'active'}
            />
          </div>
        )}

        {scoreBreakdown && (
          <div>
            <div style={{ marginBottom: 8, fontWeight: 600 }}>
              Mood score breakdown
            </div>
            <Space
              direction='vertical'
              style={{ width: '100%' }}
              size={6}
            >
              <div>
                <div style={{ fontSize: 12, color: '#666' }}>Chill</div>
                <Progress
                  percent={Math.min(
                    100,
                    normalizeScore(
                      scoreBreakdown.chillScore ?? scoreBreakdown.chill_score,
                    ),
                  )}
                  size='small'
                  showInfo
                />
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#666' }}>Focus</div>
                <Progress
                  percent={Math.min(
                    100,
                    normalizeScore(
                      scoreBreakdown.focusScore ?? scoreBreakdown.focus_score,
                    ),
                  )}
                  size='small'
                  showInfo
                />
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#666' }}>Energetic</div>
                <Progress
                  percent={Math.min(
                    100,
                    normalizeScore(
                      scoreBreakdown.energeticScore ??
                        scoreBreakdown.energetic_score,
                    ),
                  )}
                  size='small'
                  showInfo
                />
              </div>
            </Space>
          </div>
        )}

        {signalRows.length > 0 && (
          <div>
            <div style={{ marginBottom: 8, fontWeight: 600 }}>
              Signal contributions
            </div>
            <Table<SignalRow>
              size='small'
              pagination={false}
              rowKey='key'
              dataSource={signalRows}
              columns={[
                {
                  title: 'Signal',
                  dataIndex: 'signal',
                  key: 'signal',
                  width: 180,
                  render: (value: string) => <strong>{value}</strong>,
                },
                {
                  title: 'Live value',
                  dataIndex: 'value',
                  key: 'value',
                  ellipsis: true,
                  render: (value: string) => (
                    <span style={{ color: '#555' }}>{value}</span>
                  ),
                },
                {
                  title: 'Impact',
                  key: 'impact',
                  width: 280,
                  render: (_, record: SignalRow) => {
                    if (record.chillDelta == null) {
                      return <span style={{ color: '#999' }}>N/A</span>;
                    }
                    const chillDelta = record.chillDelta;
                    const focusDelta = record.focusDelta ?? 0;
                    const energeticDelta = record.energeticDelta ?? 0;
                    return (
                      <Space
                        size={4}
                        wrap
                      >
                        <Tag color='blue'>
                          Chill {chillDelta >= 0 ? '+' : ''}
                          {chillDelta.toFixed(2)}
                        </Tag>
                        <Tag color='purple'>
                          Focus {focusDelta >= 0 ? '+' : ''}
                          {focusDelta.toFixed(2)}
                        </Tag>
                        <Tag color='volcano'>
                          Energetic {energeticDelta >= 0 ? '+' : ''}
                          {energeticDelta.toFixed(2)}
                        </Tag>
                      </Space>
                    );
                  },
                },
              ]}
            />
          </div>
        )}

        {/* Fallback Warning */}
        {isFallback && (
          <Alert
            type='info'
            showIcon
            message='Using mood-only selection'
            description='Not enough tracks with BPM metadata in the selected range. AI is using mood-only selection to maintain queue stability.'
            style={{ fontSize: 12 }}
          />
        )}

        {/* Manual Override Notice */}
        {spaceState.isManualOverride && (
          <Alert
            type='warning'
            showIcon
            message='Manual Override Active'
            description='Manager has manually selected music. AI recommendations are paused.'
            style={{ fontSize: 12 }}
          />
        )}
      </Space>
    </Card>
  );
};
