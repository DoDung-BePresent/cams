import { useState, useEffect, useMemo } from 'react';
import {
  Form,
  Input,
  Select,
  Button,
  Alert,
  message,
  Typography,
  Spin,
  Collapse,
  Modal,
} from 'antd';
import {
  ThunderboltOutlined,
  CopyOutlined,
  RightOutlined,
} from '@ant-design/icons';
import type { TablePaginationConfig } from 'antd';
import type { SorterResult } from 'antd/es/table/interface';

/**
 * Assets
 */
import AcestepImg from '@/assets/images/acestep.jpeg';
import SunoImg from '@/assets/images/suno AI.png';

/**
 * Hooks
 */
import { useAuth } from '@/providers';
import { useBrand } from '@/features/admin/hooks';
import {
  useSunoConfig,
  useCreateSunoGeneration,
  useUpdateSunoConfig,
} from '../hooks';
import { useMoodOptions } from '@/shared/modules/moods/hooks';
import { usePlaylists } from '@/shared/modules/playlists/hooks';
import {
  OverrideMusicSourceSelector,
  type OverrideSourceTab,
} from '@/shared/modules/cams/components/OverrideMusicSourceSelector';

/**
 * Utils
 */
import {
  buildBrandProfileSunoPrompt,
  hasBrandMusicProfileData,
} from '../utils';

/**
 * Types
 */
import { AiGenerationMode, type SunoGenerationCreateRequest } from '../types';
import type { BrandProfileSunoMood } from '../utils/brandProfileSunoPrompt';
import type {
  PlaylistFilter,
  PlaylistListItem,
} from '@/shared/modules/playlists/types';
import type { TrackFilter, TrackListItem } from '@/shared/modules/tracks/types';

const { TextArea } = Input;
const { Text } = Typography;

type PromptMode = 'manual' | 'brandProfile';
type VocalMode = 'instrumental' | 'withLyrics';
type ModelChoice = 'brandModel' | 'suno';

interface SunoGenerationFormProps {
  onSuccess?: (generationId: string) => void;
}

type SunoGenerationFormValues = SunoGenerationCreateRequest & {
  genre?: string | null;
  profileMood?: BrandProfileSunoMood;
  vocalMode?: VocalMode;
};

const storeOverrideLabels: Record<number, string> = {
  1: 'Brand lock',
  2: 'Threshold only',
  3: 'Full store override',
};

const VIBE_OPTIONS: {
  value: BrandProfileSunoMood;
  label: string;
  desc: string;
}[] = [
  { value: 'chill', label: 'Chill', desc: 'Calm, ambient, relaxed' },
  { value: 'focus', label: 'Focus', desc: 'Steady, mellow, in the zone' },
  {
    value: 'energetic',
    label: 'Energetic',
    desc: 'Upbeat, lively, peak hours',
  },
];

// ─── Dark theme tokens ────────────────────────────────────────────────────────
const C = {
  bg: '#0f0f11',
  surface: '#18181b',
  surfaceHover: '#ef4444',
  border: '#2d2528',
  borderActive: '#ef4444',
  green: '#ef4444',
  greenDim: '#f87171',
  text: '#f8f7f7',
  textMuted: '#9ca3af',
  textSubtle: '#6b7280',
  inputBg: '#18181b',
  sectionTitle: '#e5e7eb',
};

export const SunoGenerationForm = ({ onSuccess }: SunoGenerationFormProps) => {
  const [form] = Form.useForm<SunoGenerationFormValues>();
  const [promptMode, setPromptMode] = useState<PromptMode>('manual');
  const [selectedVibe, setSelectedVibe] =
    useState<BrandProfileSunoMood>('focus');
  const [selectedModel, setSelectedModel] = useState<ModelChoice>('brandModel');

  const { user } = useAuth();
  const brandId = user?.brandId ?? undefined;

  const { data: config, isLoading: isConfigLoading } = useSunoConfig();
  const profileFromConfig = config?.brandMusicProfile;
  const hasFromConfig = hasBrandMusicProfileData(
    profileFromConfig ?? undefined,
  );
  const isConfigReady = !isConfigLoading;

  const { data: brand, isLoading: isBrandLoading } = useBrand(
    brandId,
    !!brandId && isConfigReady && !hasFromConfig,
  );

  const musicSnapshot = useMemo(() => {
    if (hasBrandMusicProfileData(profileFromConfig ?? undefined)) {
      return profileFromConfig ?? undefined;
    }
    if (brand && hasBrandMusicProfileData(brand)) {
      return brand;
    }
    return undefined;
  }, [profileFromConfig, brand]);

  const createGeneration = useCreateSunoGeneration();
  const updateConfig = useUpdateSunoConfig();
  const { options: moodOptions } = useMoodOptions();

  const defaultPlaylistFilter = useMemo<PlaylistFilter>(
    () => ({
      page: 1,
      pageSize: 10,
      status: 1,
      includeShared: false,
      sortBy: 'updatedAt',
      isAscending: false,
    }),
    [],
  );
  const defaultTrackFilter = useMemo<TrackFilter>(
    () => ({ page: 1, pageSize: 10, status: 1 }),
    [],
  );
  const [playlistFilter, setPlaylistFilter] = useState<PlaylistFilter>(
    defaultPlaylistFilter,
  );
  const [showPlaylistFilters, setShowPlaylistFilters] = useState(false);
  const [playlistSelectorOpen, setPlaylistSelectorOpen] = useState(false);
  const [playlistSelectorTab, setPlaylistSelectorTab] =
    useState<OverrideSourceTab>('playlist');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<
    string | undefined
  >();
  const [trackFilter, setTrackFilter] =
    useState<TrackFilter>(defaultTrackFilter);
  const [showTrackFilters, setShowTrackFilters] = useState(false);
  const [selectedTrackIds, setSelectedTrackIds] = useState<string[]>([]);

  const {
    data: playlistData,
    isLoading: isPlaylistLoading,
    refetch: refetchPlaylists,
  } = usePlaylists(playlistFilter);
  const playlistItems = useMemo(
    () => playlistData?.items ?? [],
    [playlistData?.items],
  );
  const hasPlaylistFilters = Boolean(
    playlistFilter.search ||
    playlistFilter.moodId ||
    playlistFilter.isDefault !== undefined,
  );

  const hasProfile = hasBrandMusicProfileData(musicSnapshot ?? undefined);

  // Use locally selected model instead of config to give user control
  const isBrandModelMode = selectedModel === 'brandModel';
  const promptMaxLength = isBrandModelMode ? 4000 : 500;
  const isResolvingProfile =
    isConfigLoading ||
    (!!brandId && isConfigReady && !hasFromConfig && isBrandLoading);

  // Init selectedModel from config on first load
  useEffect(() => {
    if (config) {
      const timer = setTimeout(() => {
        setSelectedModel(
          config.aiGenerationMode === AiGenerationMode.BrandModel
            ? 'brandModel'
            : 'suno',
        );
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [config]);

  const watchedTitle = Form.useWatch('title', form);
  const watchedGenre = Form.useWatch('genre', form);
  const watchedArtist = Form.useWatch('artist', form);
  const watchedVocalMode = Form.useWatch('vocalMode', form) ?? 'instrumental';
  const watchedTargetPlaylistId = Form.useWatch('targetPlaylistId', form) as
    | string
    | undefined;
  const effectiveSelectedPlaylistId =
    selectedPlaylistId ?? watchedTargetPlaylistId;
  const selectedPlaylist = useMemo(
    () => playlistItems.find((x) => x.id === effectiveSelectedPlaylistId),
    [playlistItems, effectiveSelectedPlaylistId],
  );

  useEffect(() => {
    form.setFieldValue('profileMood', selectedVibe);
  }, [selectedVibe, form]);

  useEffect(() => {
    if (hasProfile) {
      const timer = setTimeout(() => setPromptMode('brandProfile'), 0);
      return () => clearTimeout(timer);
    }
  }, [hasProfile]);

  const generatedPrompt = useMemo(() => {
    if (
      promptMode !== 'brandProfile' ||
      !musicSnapshot ||
      !hasBrandMusicProfileData(musicSnapshot)
    ) {
      return '';
    }
    return buildBrandProfileSunoPrompt(
      musicSnapshot,
      selectedVibe,
      {
        title: watchedTitle ?? undefined,
        genre: watchedGenre ?? undefined,
        artist: watchedArtist ?? undefined,
      },
      config?.sunoPromptTemplate,
      promptMaxLength,
    );
  }, [
    promptMode,
    musicSnapshot,
    selectedVibe,
    watchedTitle,
    watchedGenre,
    watchedArtist,
    config?.sunoPromptTemplate,
    promptMaxLength,
  ]);

  useEffect(() => {
    form.setFieldValue('targetPlaylistId', selectedPlaylistId);
  }, [form, selectedPlaylistId]);

  const handlePlaylistTableChange = (
    pagination: TablePaginationConfig,
    _filters: Record<string, unknown>,
    sorter: SorterResult<PlaylistListItem> | SorterResult<PlaylistListItem>[],
  ) => {
    const nextSorter = Array.isArray(sorter) ? sorter[0] : sorter;
    setPlaylistFilter((prev) => ({
      ...prev,
      page: pagination.current ?? prev.page,
      pageSize: pagination.pageSize ?? prev.pageSize,
      sortBy:
        typeof nextSorter?.field === 'string' ? nextSorter.field : prev.sortBy,
      isAscending: nextSorter?.order
        ? nextSorter.order === 'ascend'
        : prev.isAscending,
    }));
  };

  const handleTrackTableChange = (
    pagination: TablePaginationConfig,
    _filters: Record<string, unknown>,
    sorter: SorterResult<TrackListItem> | SorterResult<TrackListItem>[],
  ) => {
    const nextSorter = Array.isArray(sorter) ? sorter[0] : sorter;
    setTrackFilter((prev) => ({
      ...prev,
      page: pagination.current ?? prev.page,
      pageSize: pagination.pageSize ?? prev.pageSize,
      sortBy:
        typeof nextSorter?.field === 'string' ? nextSorter.field : prev.sortBy,
      isAscending: nextSorter?.order
        ? nextSorter.order === 'ascend'
        : prev.isAscending,
    }));
  };
  useEffect(() => {
    if (config) {
      form.setFieldsValue({
        targetPlaylistId: config.sunoDefaultPlaylistId,
        autoAddToTargetPlaylist: true,
        profileMood: 'focus',
        vocalMode: 'instrumental',
        instrumental: true,
      });
    }
  }, [config, form]);

  const handleSubmit = async (values: SunoGenerationFormValues) => {
    const rawPrompt =
      promptMode === 'brandProfile'
        ? generatedPrompt.trim() || null
        : values.prompt;

    const finalPrompt = rawPrompt
      ? rawPrompt.trim().slice(0, promptMaxLength)
      : rawPrompt;

    if (
      promptMode === 'brandProfile' &&
      rawPrompt &&
      rawPrompt.trim().length > promptMaxLength
    ) {
      message.warning(
        `Generated profile prompt is too long. Auto-trimmed to ${promptMaxLength} characters.`,
      );
    } else if (rawPrompt && rawPrompt.trim().length > promptMaxLength) {
      message.error(`Prompt too long (max ${promptMaxLength} characters)`);
      return;
    }

    const { genre: _genre, profileMood: _profileMood, ...payload } = values;
    void _genre;
    void _profileMood;
    const vocalMode = values.vocalMode ?? 'instrumental';
    const instrumental = vocalMode === 'instrumental';
    const normalizedLyrics = instrumental
      ? null
      : values.lyrics?.trim() || null;
    const customMode = !instrumental;
    const generationMode = isBrandModelMode
      ? AiGenerationMode.BrandModel
      : AiGenerationMode.Suno;

    if (config?.aiGenerationMode !== generationMode) {
      await updateConfig.mutateAsync({
        sunoPromptTemplate: config?.sunoPromptTemplate ?? null,
        sunoDefaultPlaylistId: config?.sunoDefaultPlaylistId ?? null,
        aiGenerationMode: generationMode,
      });
    }

    const result = await createGeneration.mutateAsync({
      ...payload,
      generationMode,
      aiGenerationMode: generationMode,
      prompt: finalPrompt,
      ...(isBrandModelMode
        ? { customMode, instrumental, lyrics: normalizedLyrics }
        : {}),
    });

    if (result && onSuccess) {
      onSuccess(result.id);
    }

    form.resetFields();
    form.setFieldsValue({
      targetPlaylistId: config?.sunoDefaultPlaylistId,
      autoAddToTargetPlaylist: true,
      profileMood: 'focus',
      vocalMode: 'instrumental',
      instrumental: true,
    });
    setSelectedPlaylistId(config?.sunoDefaultPlaylistId ?? undefined);
    setSelectedVibe('focus');
    setPromptMode(
      hasBrandMusicProfileData(musicSnapshot ?? undefined)
        ? 'brandProfile'
        : 'manual',
    );
  };

  // ─── Shared styles ────────────────────────────────────────────────────────
  const modelCard = (active: boolean): React.CSSProperties => ({
    background: active ? 'rgba(239,68,68,0.08)' : C.surface,
    border: `1.5px solid ${active ? C.borderActive : C.border}`,
    borderRadius: 12,
    padding: '16px',
    cursor: 'pointer',
    transition: 'all 0.18s',
    boxShadow: active ? `0 0 0 3px rgba(239,68,68,0.15)` : undefined,
    flex: 1,
  });

  const vibeCard = (active: boolean): React.CSSProperties => ({
    border: `1.5px solid ${active ? C.borderActive : C.border}`,
    borderRadius: 10,
    padding: '12px 14px',
    cursor: 'pointer',
    background: active ? 'rgba(239,68,68,0.08)' : C.surface,
    transition: 'all 0.15s',
    flex: 1,
  });

  const inputStyle: React.CSSProperties = {
    background: C.inputBg,
    border: '1px solid rgba(248,113,113,0.28)',
    color: C.text,
    borderRadius: 8,
    boxShadow: 'none',
  };

  const labelStyle: React.CSSProperties = {
    fontWeight: 500,
    fontSize: 13,
    color: C.textMuted,
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        background: C.bg,
        borderRadius: 0,
        padding: '24px 32px',
        border: 'none',
      }}
    >
      <Form
        form={form}
        layout='vertical'
        onFinish={handleSubmit}
        size='large'
        styles={{ label: { height: 22 } }}
      >
        {/* Loading */}
        {isResolvingProfile && (
          <div
            style={{
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Spin size='small' />
            <Text style={{ color: C.textMuted }}>Loading CAMS profile…</Text>
          </div>
        )}

        {/* No profile warning */}
        {!hasProfile && isConfigReady && !isResolvingProfile && brandId && (
          <Alert
            type='warning'
            showIcon
            closable
            style={{
              marginBottom: 20,
              background: '#2a1f00',
              border: '1px solid #78350f',
            }}
            message={
              <span style={{ color: '#fbbf24' }}>
                No brand music profile yet
              </span>
            }
            description={
              <span style={{ color: '#9ca3af' }}>
                Configure Music policy (CAMS fuzzy) under Brand settings to use
                brand profile mode.
              </span>
            }
          />
        )}

        {/* ── Step 1: Pick a model ─────────────────────────────────────────── */}
        <div style={{ marginBottom: 28 }}>
          <Text
            style={{
              fontWeight: 700,
              fontSize: 15,
              color: C.sectionTitle,
              display: 'block',
              marginBottom: 4,
            }}
          >
            1. Pick a model
          </Text>
          <Text
            style={{
              color: C.textSubtle,
              fontSize: 13,
              display: 'block',
              marginBottom: 16,
            }}
          >
            The free model is great for most in-store ambient tracks.
          </Text>

          <div style={{ display: 'flex', gap: 12 }}>
            {/* Self-hosted card */}
            <div
              style={modelCard(selectedModel === 'brandModel')}
              onClick={() => setSelectedModel('brandModel')}
              role='button'
              aria-pressed={selectedModel === 'brandModel'}
            >
              <div
                style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 10,
                    overflow: 'hidden',
                    flexShrink: 0,
                    border: `1px solid ${C.border}`,
                  }}
                >
                  <img
                    src={AcestepImg}
                    alt='Acestep'
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontWeight: 600,
                      fontSize: 13,
                      color: C.text,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    Self-hosted · acestep-1.5
                    {selectedModel === 'brandModel' && (
                      <span
                        style={{
                          background: C.green,
                          color: '#fff',
                          borderRadius: 4,
                          padding: '1px 6px',
                          fontSize: 10,
                          fontWeight: 700,
                        }}
                      >
                        ✓
                      </span>
                    )}
                  </Text>
                  <div
                    style={{
                      fontSize: 12,
                      color: C.textMuted,
                      marginTop: 4,
                      lineHeight: 1.5,
                    }}
                  >
                    Our own model, runs on your brand server. Great for ambient,
                    instrumental tracks.
                  </div>
                  <div
                    style={{
                      marginTop: 8,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span
                      style={{
                        color: '#f59e0b',
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      1 token per track
                    </span>
                    <span style={{ color: C.textSubtle, fontSize: 11 }}>
                      ~1–2 min
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Suno card */}
            <div
              style={modelCard(selectedModel === 'suno')}
              onClick={() => setSelectedModel('suno')}
              role='button'
              aria-pressed={selectedModel === 'suno'}
            >
              <div
                style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 10,
                    overflow: 'hidden',
                    flexShrink: 0,
                    border: `1px solid ${C.border}`,
                  }}
                >
                  <img
                    src={SunoImg}
                    alt='Suno AI'
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontWeight: 600,
                      fontSize: 13,
                      color: C.text,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    Suno v4
                    {selectedModel === 'suno' && (
                      <span
                        style={{
                          background: C.green,
                          color: '#fff',
                          borderRadius: 4,
                          padding: '1px 6px',
                          fontSize: 10,
                          fontWeight: 700,
                        }}
                      >
                        ✓
                      </span>
                    )}
                  </Text>
                  <div
                    style={{
                      fontSize: 12,
                      color: C.textMuted,
                      marginTop: 4,
                      lineHeight: 1.5,
                    }}
                  >
                    Studio-quality AI with vocals and full mixing. Best for hero
                    tracks.
                  </div>
                  <div
                    style={{
                      marginTop: 8,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span
                      style={{
                        color: '#f59e0b',
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      3 tokens per track
                    </span>
                    <span style={{ color: C.textSubtle, fontSize: 11 }}>
                      ~1–2 min
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Step 2: Describe your track ──────────────────────────────────── */}
        <div style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontWeight: 700,
              fontSize: 15,
              color: C.sectionTitle,
              display: 'block',
              marginBottom: 4,
            }}
          >
            2. Describe your track
          </Text>
          <Text
            style={{
              color: C.textSubtle,
              fontSize: 13,
              display: 'block',
              marginBottom: 16,
            }}
          >
            Just a title and a vibe is enough to start.
          </Text>

          {/* Track title */}
          <Form.Item
            name='title'
            label={
              <span style={labelStyle}>
                Track title <span style={{ color: '#ef4444' }}>*</span>
              </span>
            }
            rules={[
              { required: true, message: 'Please enter track title' },
              { max: 300, message: 'Title too long' },
            ]}
          >
            <Input
              placeholder='e.g. Morning Focus in-store'
              maxLength={300}
              style={inputStyle}
            />
          </Form.Item>

          {/* Vibe — brand profile mode */}
          {promptMode === 'brandProfile' && hasProfile && (
            <>
              <Form.Item
                name='profileMood'
                hidden
                initialValue='focus'
              >
                <Input />
              </Form.Item>
              <div style={{ marginBottom: 16 }}>
                <Text
                  style={{ ...labelStyle, display: 'block', marginBottom: 10 }}
                >
                  Vibe
                </Text>
                <div style={{ display: 'flex', gap: 10 }}>
                  {VIBE_OPTIONS.map((vibe) => (
                    <div
                      key={vibe.value}
                      onClick={() => setSelectedVibe(vibe.value)}
                      style={vibeCard(selectedVibe === vibe.value)}
                      role='button'
                    >
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: 13,
                          color: selectedVibe === vibe.value ? C.green : C.text,
                        }}
                      >
                        {vibe.label}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: C.textMuted,
                          marginTop: 2,
                        }}
                      >
                        {vibe.desc}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Text style={{ fontSize: 12, color: C.textSubtle }}>
                Using your brand profile — BPM and style come from your music
                policy.{' '}
                <span
                  style={{ color: C.green, cursor: 'pointer', fontWeight: 500 }}
                  onClick={() => setPromptMode('manual')}
                >
                  Write a custom prompt instead
                </span>
              </Text>
            </>
          )}

          {/* Manual prompt */}
          {promptMode === 'manual' && (
            <>
              <Form.Item
                name='prompt'
                label={<span style={labelStyle}>Custom prompt</span>}
                rules={[
                  {
                    required: true,
                    message: 'Please enter a generation prompt',
                  },
                  {
                    max: promptMaxLength,
                    message: `Prompt too long (max ${promptMaxLength} chars)`,
                  },
                ]}
              >
                <TextArea
                  rows={4}
                  placeholder='Describe the music you want to generate…'
                  maxLength={promptMaxLength}
                  showCount
                  style={{ ...inputStyle, resize: 'none' }}
                />
              </Form.Item>
              {hasProfile && (
                <Text style={{ fontSize: 12, color: C.textSubtle }}>
                  <span
                    style={{
                      color: C.green,
                      cursor: 'pointer',
                      fontWeight: 500,
                    }}
                    onClick={() => setPromptMode('brandProfile')}
                  >
                    Use brand music profile instead
                  </span>
                </Text>
              )}
            </>
          )}
        </div>

        {/* ── Playlist ─────────────────────────────────────────────────────── */}
        <Form.Item
          name='targetPlaylistId'
          hidden
        >
          <input type='hidden' />
        </Form.Item>

        <div style={{ marginBottom: 16 }}>
          <Text style={{ ...labelStyle, display: 'block', marginBottom: 8 }}>
            Add to playlist (optional)
          </Text>
          <div
            style={{
              ...inputStyle,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              padding: '12px 14px',
            }}
          >
            <div style={{ minWidth: 0 }}>
              <Text style={{ color: C.text, fontWeight: 600 }}>
                {selectedPlaylist?.name ??
                  (effectiveSelectedPlaylistId
                    ? 'Selected playlist'
                    : 'No playlist selected')}
              </Text>
              <div style={{ color: C.textSubtle, fontSize: 12, marginTop: 2 }}>
                Only brand-owned playlists are available for AI generated
                tracks.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              {effectiveSelectedPlaylistId && (
                <Button
                  onClick={() => {
                    setSelectedPlaylistId(undefined);
                    form.setFieldValue('targetPlaylistId', undefined);
                  }}
                  style={{ borderRadius: 8 }}
                >
                  Clear
                </Button>
              )}
              <Button
                type='primary'
                onClick={() => setPlaylistSelectorOpen(true)}
                style={{ borderRadius: 8 }}
              >
                Choose playlist
              </Button>
            </div>
          </div>
        </div>

        <Modal
          title='Choose brand playlist'
          open={playlistSelectorOpen}
          width={980}
          onCancel={() => setPlaylistSelectorOpen(false)}
          footer={[
            <Button
              key='cancel'
              onClick={() => setPlaylistSelectorOpen(false)}
            >
              Cancel
            </Button>,
            <Button
              key='select'
              type='primary'
              onClick={() => setPlaylistSelectorOpen(false)}
            >
              Select playlist
            </Button>,
          ]}
        >
          <OverrideMusicSourceSelector
            activeTab={playlistSelectorTab}
            onTabChange={setPlaylistSelectorTab}
            enabledTabs={['playlist']}
            track={{
              filter: trackFilter,
              setFilter: setTrackFilter,
              showFilters: showTrackFilters,
              setShowFilters: setShowTrackFilters,
              hasActiveFilters: false,
              data: [],
              total: 0,
              isLoading: false,
              refetch: () => undefined,
              selectedTrackIds,
              setSelectedTrackIds,
              defaultFilter: defaultTrackFilter,
              onTableChange: handleTrackTableChange,
            }}
            playlist={{
              filter: playlistFilter,
              setFilter: setPlaylistFilter,
              showFilters: showPlaylistFilters,
              setShowFilters: setShowPlaylistFilters,
              hasActiveFilters: hasPlaylistFilters,
              data: playlistItems,
              total: playlistData?.totalItems ?? 0,
              isLoading: isPlaylistLoading,
              refetch: refetchPlaylists,
              selectedPlaylistId: effectiveSelectedPlaylistId,
              setSelectedPlaylistId,
              defaultFilter: defaultPlaylistFilter,
              moodOptions,
              onTableChange: handlePlaylistTableChange,
            }}
          />
        </Modal>
        <Form.Item
          name='autoAddToTargetPlaylist'
          hidden
          initialValue={true}
        >
          <input type='hidden' />
        </Form.Item>
        <Form.Item
          name='instrumental'
          hidden
          initialValue={true}
        >
          <input type='hidden' />
        </Form.Item>

        {/* ── Advanced details ──────────────────────────────────────────────── */}
        <Collapse
          ghost
          style={{ marginBottom: 16 }}
          expandIcon={({ isActive }) => (
            <RightOutlined
              style={{
                fontSize: 11,
                color: C.textMuted,
                transform: isActive ? 'rotate(90deg)' : 'none',
                transition: '0.2s',
              }}
            />
          )}
          items={[
            {
              key: 'advanced',
              label: (
                <Text
                  style={{
                    fontWeight: 600,
                    fontSize: 13,
                    color: C.sectionTitle,
                  }}
                >
                  Advanced details
                </Text>
              ),
              children: (
                <div style={{ paddingTop: 8 }}>
                  {promptMode === 'brandProfile' && hasProfile && (
                    <>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: 12,
                        }}
                      >
                        <Form.Item
                          name='genre'
                          label={
                            <span style={{ fontSize: 12, color: C.textMuted }}>
                              Genre
                            </span>
                          }
                          rules={[{ max: 120, message: 'Genre too long' }]}
                        >
                          <Input
                            placeholder='e.g., ambient, lo-fi'
                            maxLength={120}
                            style={inputStyle}
                          />
                        </Form.Item>
                        <Form.Item
                          name='artist'
                          label={
                            <span style={{ fontSize: 12, color: C.textMuted }}>
                              Artist / style hint
                            </span>
                          }
                          rules={[{ max: 300, message: 'Too long' }]}
                        >
                          <Input
                            placeholder='e.g., subtle piano, no vocals'
                            maxLength={300}
                            style={inputStyle}
                          />
                        </Form.Item>
                      </div>
                      <Form.Item
                        name='moodId'
                        label={
                          <span style={{ fontSize: 12, color: C.textMuted }}>
                            Catalog mood (optional)
                          </span>
                        }
                      >
                        <Select
                          placeholder='Select mood'
                          options={moodOptions}
                          allowClear
                        />
                      </Form.Item>
                      {generatedPrompt && (
                        <Form.Item
                          label={
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                width: '100%',
                              }}
                            >
                              <span
                                style={{ fontSize: 12, color: C.textMuted }}
                              >
                                Generated prompt (preview)
                              </span>
                              <span
                                style={{ fontSize: 11, color: C.textSubtle }}
                              >
                                {generatedPrompt.length}/{promptMaxLength}
                              </span>
                            </div>
                          }
                        >
                          <TextArea
                            value={generatedPrompt}
                            readOnly
                            rows={5}
                            style={{
                              ...inputStyle,
                              fontSize: 12,
                              resize: 'none',
                            }}
                          />
                          <Button
                            size='small'
                            icon={<CopyOutlined />}
                            style={{
                              marginTop: 6,
                              background: C.surface,
                              color: C.text,
                              border: `1px solid ${C.border}`,
                            }}
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(
                                  generatedPrompt,
                                );
                                message.success('Prompt copied');
                              } catch {
                                message.error('Failed to copy prompt');
                              }
                            }}
                          >
                            Copy
                          </Button>
                        </Form.Item>
                      )}
                    </>
                  )}

                  {isBrandModelMode && (
                    <>
                      <Form.Item
                        label={
                          <span style={{ fontSize: 12, color: C.textMuted }}>
                            Vocal mode
                          </span>
                        }
                        name='vocalMode'
                        initialValue='instrumental'
                      >
                        <Select
                          options={[
                            {
                              label: 'Instrumental (no lyrics)',
                              value: 'instrumental',
                            },
                            { label: 'Music with lyrics', value: 'withLyrics' },
                          ]}
                          onChange={(value) => {
                            const nextInstrumental = value === 'instrumental';
                            form.setFieldValue(
                              'instrumental',
                              nextInstrumental,
                            );
                            if (nextInstrumental)
                              form.setFieldValue('lyrics', null);
                          }}
                        />
                      </Form.Item>
                      {watchedVocalMode === 'withLyrics' && (
                        <Form.Item
                          name='lyrics'
                          label={
                            <span style={{ fontSize: 12, color: C.textMuted }}>
                              Lyrics
                            </span>
                          }
                          rules={[{ max: 8000, message: 'Lyrics too long' }]}
                        >
                          <TextArea
                            rows={5}
                            placeholder='Optional: enter lyrics…'
                            maxLength={8000}
                            showCount
                            style={{ ...inputStyle, resize: 'none' }}
                          />
                        </Form.Item>
                      )}
                    </>
                  )}

                  {musicSnapshot && hasProfile && (
                    <Alert
                      type='info'
                      showIcon
                      style={{
                        marginTop: 8,
                        background: '#0a1628',
                        border: '1px solid #1e3a5f',
                      }}
                      message={
                        <span style={{ color: '#60a5fa', fontWeight: 600 }}>
                          Using your brand CAMS profile
                        </span>
                      }
                      description={
                        <div style={{ fontSize: 12, color: C.textMuted }}>
                          <div>
                            Template:{' '}
                            <strong style={{ color: C.text }}>
                              {musicSnapshot.fuzzyProfileTemplate ?? '—'}
                            </strong>
                            {musicSnapshot.storeOverrideLevel != null && (
                              <>
                                {' '}
                                · Override:{' '}
                                {storeOverrideLabels[
                                  musicSnapshot.storeOverrideLevel
                                ] ??
                                  `Level ${musicSnapshot.storeOverrideLevel}`}
                              </>
                            )}
                          </div>
                          <div style={{ marginTop: 2 }}>
                            BPM: Chill {musicSnapshot.chillBpmMin}–
                            {musicSnapshot.chillBpmMax} · Focus{' '}
                            {musicSnapshot.focusBpmMin}–
                            {musicSnapshot.focusBpmMax} · Energetic{' '}
                            {musicSnapshot.energeticBpmMin}–
                            {musicSnapshot.energeticBpmMax}
                          </div>
                        </div>
                      }
                    />
                  )}
                </div>
              ),
            },
          ]}
        />

        {/* ── Generate button ────────────────────────────────────────────────── */}
        <Form.Item style={{ marginTop: 12, marginBottom: 4 }}>
          <Button
            type='primary'
            htmlType='submit'
            icon={<ThunderboltOutlined />}
            loading={createGeneration.isPending || updateConfig.isPending}
            disabled={
              promptMode === 'brandProfile' &&
              hasProfile &&
              !generatedPrompt.trim()
            }
            block
            size='large'
            style={{
              height: 52,
              borderRadius: 10,
              background: C.green,
              border: 'none',
              fontSize: 15,
              fontWeight: 700,
              color: '#fff',
              letterSpacing: 0.3,
            }}
          >
            Generate
          </Button>
        </Form.Item>
        <Text
          style={{
            display: 'block',
            textAlign: 'center',
            fontSize: 12,
            color: C.textSubtle,
          }}
        >
          You will be notified when the track is ready — usually under 2
          minutes.
        </Text>
      </Form>
    </div>
  );
};
