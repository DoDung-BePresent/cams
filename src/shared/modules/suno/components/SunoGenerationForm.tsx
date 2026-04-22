import { useState, useEffect, useMemo } from 'react';
import {
  Form,
  Input,
  Select,
  Button,
  Space,
  Alert,
  message,
  Typography,
  Spin,
  Row,
  Col,
  Collapse,
  Divider,
} from 'antd';
import { createStyles } from 'antd-style';

/**
 * Icons
 */
import {
  ThunderboltOutlined,
  CopyOutlined,
  SettingOutlined,
  CheckCircleFilled,
  HomeOutlined,
  AudioOutlined,
} from '@ant-design/icons';

/**
 * Configs
 */
import { MODAL_WIDTHS } from '@/config';

/**
 * Components
 */
import { AppModal } from '@/shared/components';
import { SunoConfigForm } from './SunoConfigForm';

/**
 * Hooks
 */
import { useAuth } from '@/providers';
import { useBrand } from '@/features/admin/hooks';
import { useSunoConfig, useCreateSunoGeneration } from '../hooks';
import { useMoodOptions } from '@/shared/modules/moods/hooks';
import { usePlaylistOptions } from '@/shared/modules/playlists/hooks';

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
import type { SunoGenerationCreateRequest } from '../types';
import { AiGenerationMode } from '../types';
import type { BrandProfileSunoMood } from '../utils/brandProfileSunoPrompt';

const { TextArea } = Input;
const { Text, Title } = Typography;

type PromptMode = 'manual' | 'brandProfile';

interface SunoGenerationFormProps {
  onSuccess?: (generationId: string) => void;
}

type SunoGenerationFormValues = SunoGenerationCreateRequest & {
  genre?: string | null;
  profileMood?: BrandProfileSunoMood;
};

const storeOverrideLabels: Record<number, string> = {
  1: 'Brand lock',
  2: 'Threshold only',
  3: 'Full store override',
};

const VIBE_OPTIONS: {
  value: BrandProfileSunoMood;
  label: string;
  description: string;
}[] = [
  { value: 'chill', label: 'Chill', description: 'Calm, ambient, relaxed' },
  { value: 'focus', label: 'Focus', description: 'Steady, mellow, in the zone' },
  { value: 'energetic', label: 'Energetic', description: 'Upbeat, lively, peak hours' },
];

const useStyle = createStyles(({ css, token }) => ({
  modelCard: css`
    border: 1.5px solid ${token.colorBorder};
    border-radius: ${token.borderRadiusLG}px;
    padding: 16px;
    cursor: pointer;
    height: 100%;
    transition: border-color 0.2s, background 0.2s;
    &:hover {
      border-color: ${token.colorPrimary};
    }
  `,
  modelCardSelected: css`
    border: 2px solid ${token.colorPrimary};
    border-radius: ${token.borderRadiusLG}px;
    padding: 16px;
    cursor: pointer;
    height: 100%;
    background-color: ${token.colorPrimaryBg};
  `,
  modelIcon: css`
    width: 40px;
    height: 40px;
    border-radius: ${token.borderRadius}px;
    background: linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorPrimaryActive} 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 18px;
    flex-shrink: 0;
  `,
  vibeCard: css`
    border: 1.5px solid ${token.colorBorder};
    border-radius: ${token.borderRadiusLG}px;
    padding: 12px 16px;
    cursor: pointer;
    transition: border-color 0.2s, background 0.2s;
    &:hover {
      border-color: ${token.colorPrimary};
    }
  `,
  vibeCardSelected: css`
    border: 2px solid ${token.colorPrimary};
    border-radius: ${token.borderRadiusLG}px;
    padding: 12px 16px;
    cursor: pointer;
    background-color: ${token.colorPrimaryBg};
  `,
  generateButton: css`
    height: 52px;
    border-radius: ${token.borderRadiusLG}px;
    font-size: 16px;
    font-weight: 600;
  `,
  freeText: css`
    color: ${token.colorSuccess};
    font-weight: 600;
  `,
  paidText: css`
    color: ${token.colorWarning};
    font-weight: 600;
  `,
  checkIcon: css`
    color: ${token.colorPrimary};
  `,
  audioIcon: css`
    color: ${token.colorTextSecondary};
  `,
  sectionDivider: css`
    margin: 32px 0 28px !important;
  `,
}));

export const SunoGenerationForm = ({ onSuccess }: SunoGenerationFormProps) => {
  const { styles } = useStyle();
  const [form] = Form.useForm<SunoGenerationFormValues>();
  const [promptMode, setPromptMode] = useState<PromptMode>('brandProfile');
  const [selectedModel, setSelectedModel] = useState<AiGenerationMode>(
    AiGenerationMode.BrandModel,
  );
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { user } = useAuth();
  const brandId = user?.brandId ?? undefined;

  const { data: config, isLoading: isConfigLoading } = useSunoConfig();
  const profileFromConfig = config?.brandMusicProfile;
  const hasFromConfig = hasBrandMusicProfileData(profileFromConfig ?? undefined);
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
  const { options: moodOptions } = useMoodOptions();
  const { data: playlistOptions } = usePlaylistOptions();

  const hasProfile = hasBrandMusicProfileData(musicSnapshot ?? undefined);
  const isResolvingProfile =
    isConfigLoading ||
    (!!brandId && isConfigReady && !hasFromConfig && isBrandLoading);

  const watchedProfileMood = Form.useWatch('profileMood', form);
  const watchedTitle = Form.useWatch('title', form);
  const watchedGenre = Form.useWatch('genre', form);
  const watchedArtist = Form.useWatch('artist', form);

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
      watchedProfileMood ?? 'focus',
      {
        title: watchedTitle ?? undefined,
        genre: watchedGenre ?? undefined,
        artist: watchedArtist ?? undefined,
      },
      config?.sunoPromptTemplate,
    );
  }, [
    promptMode,
    musicSnapshot,
    watchedProfileMood,
    watchedTitle,
    watchedGenre,
    watchedArtist,
    config?.sunoPromptTemplate,
  ]);

  useEffect(() => {
    if (config) {
      form.setFieldsValue({
        targetPlaylistId: config.sunoDefaultPlaylistId,
        autoAddToTargetPlaylist: true,
        profileMood: 'focus',
      });
    }
  }, [config, form]);

  useEffect(() => {
    if (!hasProfile && isConfigReady && !isResolvingProfile) {
      setPromptMode('manual');
    }
  }, [hasProfile, isConfigReady, isResolvingProfile]);

  const handleSubmit = async (values: SunoGenerationFormValues) => {
    const finalPrompt =
      promptMode === 'brandProfile'
        ? generatedPrompt.trim() || null
        : values.prompt;

    if (finalPrompt && finalPrompt.trim().length > 4000) {
      message.error('Prompt too long (max 4000 characters)');
      return;
    }

    const { genre: _genre, profileMood: _profileMood, ...payload } = values;
    void _genre;
    void _profileMood;

    const result = await createGeneration.mutateAsync({
      ...payload,
      prompt: finalPrompt,
    });

    if (result && onSuccess) {
      onSuccess(result.id);
    }

    form.resetFields();
    form.setFieldsValue({
      targetPlaylistId: config?.sunoDefaultPlaylistId,
      autoAddToTargetPlaylist: true,
      profileMood: 'focus',
    });
    setPromptMode(
      hasBrandMusicProfileData(musicSnapshot ?? undefined) ? 'brandProfile' : 'manual',
    );
  };

  const profileSummary =
    musicSnapshot && hasProfile ? (
      <Space direction='vertical' size={4} style={{ width: '100%' }}>
        <Text type='secondary'>
          Template: <Text strong>{musicSnapshot.fuzzyProfileTemplate ?? '—'}</Text>
          {musicSnapshot.storeOverrideLevel != null && (
            <>
              {' '}· Override:{' '}
              {storeOverrideLabels[musicSnapshot.storeOverrideLevel] ??
                `Level ${musicSnapshot.storeOverrideLevel}`}
            </>
          )}
        </Text>
        <Text type='secondary' style={{ fontSize: 12 }}>
          BPM (guide): Chill {musicSnapshot.chillBpmMin}–{musicSnapshot.chillBpmMax} · Focus{' '}
          {musicSnapshot.focusBpmMin}–{musicSnapshot.focusBpmMax} · Energetic{' '}
          {musicSnapshot.energeticBpmMin}–{musicSnapshot.energeticBpmMax}
        </Text>
      </Space>
    ) : null;

  const isFreeModel = selectedModel === AiGenerationMode.BrandModel;
  const generateLabel = isFreeModel ? 'Generate · Free' : 'Generate · 3 coins';

  return (
    <>
      {/* Section 1: Pick a model */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
          <Title level={5} style={{ margin: 0 }}>1. Pick a model</Title>
          <Button
            type='text'
            size='small'
            icon={<SettingOutlined />}
            onClick={() => setSettingsOpen(true)}
          />
        </div>
        <Text type='secondary' style={{ display: 'block', marginBottom: 16 }}>
          The free model is great for most in-store ambient tracks. Pay with coins when you want
          studio vocals.
        </Text>

        <Row gutter={[16, 12]} style={{ alignItems: 'stretch' }}>
          {/* Self-hosted model */}
          <Col xs={24} md={12} style={{ display: 'flex' }}>
            <div
              className={
                selectedModel === AiGenerationMode.BrandModel
                  ? styles.modelCardSelected
                  : styles.modelCard
              }
              style={{ width: '100%' }}
              onClick={() => setSelectedModel(AiGenerationMode.BrandModel)}
            >
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div className={styles.modelIcon}>
                  <HomeOutlined />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text strong>Self-hosted · acestep-1.5</Text>
                    {selectedModel === AiGenerationMode.BrandModel && (
                      <CheckCircleFilled className={styles.checkIcon} style={{ fontSize: 18 }} />
                    )}
                  </div>
                  <Text type='secondary' style={{ fontSize: 13, display: 'block', marginTop: 4 }}>
                    Our own model, runs on your brand server. Great for ambient, instrumental tracks.
                  </Text>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, alignItems: 'center' }}>
                    <Text className={styles.freeText}>Free</Text>
                    <Text type='secondary' style={{ fontSize: 12 }}>~1–2 min</Text>
                  </div>
                </div>
              </div>
            </div>
          </Col>

          {/* Suno v4 */}
          <Col xs={24} md={12} style={{ display: 'flex' }}>
            <div
              className={
                selectedModel === AiGenerationMode.Suno
                  ? styles.modelCardSelected
                  : styles.modelCard
              }
              style={{ width: '100%' }}
              onClick={() => setSelectedModel(AiGenerationMode.Suno)}
            >
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ paddingTop: 4 }}>
                  <AudioOutlined className={styles.audioIcon} style={{ fontSize: 22 }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text strong>Suno v4</Text>
                    {selectedModel === AiGenerationMode.Suno && (
                      <CheckCircleFilled className={styles.checkIcon} style={{ fontSize: 18 }} />
                    )}
                  </div>
                  <Text type='secondary' style={{ fontSize: 13, display: 'block', marginTop: 4 }}>
                    Studio-quality AI with vocals and full mixing. Best for hero tracks.
                  </Text>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, alignItems: 'center' }}>
                    <Text className={styles.paidText}>3 coins per track</Text>
                    <Text type='secondary' style={{ fontSize: 12 }}>~1–2 min</Text>
                  </div>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </div>

      <Divider className={styles.sectionDivider} />

      {/* Section 2: Describe your track */}
      <div>
        <Title level={5} style={{ marginBottom: 4 }}>2. Describe your track</Title>
        <Text type='secondary' style={{ display: 'block', marginBottom: 24 }}>
          Just a title and a vibe is enough to start.
        </Text>

        {isResolvingProfile && (
          <div style={{ marginBottom: 16 }}>
            <Spin size='small' />{' '}
            <Text type='secondary'>Loading CAMS profile...</Text>
          </div>
        )}

        {!hasProfile && isConfigReady && !isResolvingProfile && brandId && (
          <Alert
            type='warning'
            showIcon
            closable
            className='mb-5!'
            message='No brand music profile yet'
            description='Configure Music policy (CAMS fuzzy) under Brand settings, then return here to use brand profile mode.'
          />
        )}

        <Form
          form={form}
          layout='vertical'
          onFinish={handleSubmit}
          size='large'
          styles={{ label: { height: 22 } }}
        >
          {/* Track title — always visible */}
          <Form.Item
            name='title'
            label='Track title'
            rules={[
              { required: true, message: 'Please enter a track title' },
              { max: 300, message: 'Title too long' },
            ]}
          >
            <Input placeholder='e.g. Morning Focus in-store' maxLength={300} />
          </Form.Item>

          {/* Vibe picker — brand profile mode */}
          {promptMode === 'brandProfile' && hasProfile && (
            <>
              {profileSummary && (
                <Alert
                  type='info'
                  showIcon
                  style={{ marginBottom: 16 }}
                  message='Using your brand CAMS profile'
                  description={profileSummary}
                />
              )}

              <Form.Item label='Vibe' name='profileMood' initialValue='focus'>
                <Row gutter={12}>
                  {VIBE_OPTIONS.map((vibe) => (
                    <Col xs={24} sm={8} key={vibe.value}>
                      <div
                        className={
                          watchedProfileMood === vibe.value
                            ? styles.vibeCardSelected
                            : styles.vibeCard
                        }
                        onClick={() => form.setFieldValue('profileMood', vibe.value)}
                      >
                        <Text strong style={{ display: 'block', fontSize: 14 }}>
                          {vibe.label}
                        </Text>
                        <Text type='secondary' style={{ fontSize: 12 }}>
                          {vibe.description}
                        </Text>
                      </div>
                    </Col>
                  ))}
                </Row>
              </Form.Item>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text type='secondary' style={{ fontSize: 13 }}>
                  Using your brand profile — BPM and style come from your music policy.
                </Text>
                <Button
                  type='link'
                  size='small'
                  style={{ padding: 0 }}
                  onClick={() => setPromptMode('manual')}
                >
                  Write a custom prompt instead
                </Button>
              </div>
            </>
          )}

          {/* Custom prompt — manual mode */}
          {promptMode === 'manual' && (
            <>
              <Form.Item
                name='prompt'
                label='Custom prompt'
                rules={[
                  { required: true, message: 'Please enter a generation prompt' },
                  { max: 4000, message: 'Prompt too long' },
                ]}
              >
                <TextArea
                  rows={4}
                  placeholder='Describe the music you want to generate...'
                  maxLength={4000}
                  showCount
                />
              </Form.Item>

              {hasProfile && (
                <div style={{ marginBottom: 16 }}>
                  <Button
                    type='link'
                    size='small'
                    style={{ padding: 0 }}
                    onClick={() => setPromptMode('brandProfile')}
                  >
                    Use brand profile instead
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Add to playlist */}
          <Form.Item name='targetPlaylistId' label='Add to playlist (optional)'>
            <Select
              placeholder='Pick a playlist — or leave empty'
              options={playlistOptions}
              allowClear
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>

          {/* Advanced details */}
          <Collapse
            ghost
            style={{ marginBottom: 16 }}
            items={[
              {
                key: 'advanced',
                label: 'Advanced details',
                children: (
                  <Space direction='vertical' style={{ width: '100%' }} size='middle'>
                    <Form.Item
                      name='genre'
                      label='Genre'
                      rules={[{ max: 120, message: 'Genre too long' }]}
                      style={{ marginBottom: 0 }}
                    >
                      <Input placeholder='e.g. ambient, lo-fi, soft jazz' maxLength={120} />
                    </Form.Item>

                    <Form.Item
                      name='artist'
                      label='Artist / style hint'
                      rules={[{ max: 300, message: 'Too long' }]}
                      style={{ marginBottom: 0 }}
                    >
                      <Input placeholder='e.g. subtle piano, no vocals' maxLength={300} />
                    </Form.Item>

                    <Form.Item
                      name='moodId'
                      label='Catalog mood (optional)'
                      style={{ marginBottom: 0 }}
                    >
                      <Select placeholder='Select mood' options={moodOptions} allowClear />
                    </Form.Item>

                    {promptMode === 'brandProfile' && hasProfile && (
                      <Form.Item
                        label={
                          <Space size={6}>
                            <span>Generated prompt (preview)</span>
                            <Text type='secondary' style={{ fontSize: 12 }}>
                              {generatedPrompt ? `${generatedPrompt.length}/4000` : '0/4000'}
                            </Text>
                          </Space>
                        }
                        style={{ marginBottom: 0 }}
                      >
                        <Space direction='vertical' style={{ width: '100%' }} size='small'>
                          <TextArea
                            value={generatedPrompt}
                            readOnly
                            rows={6}
                            placeholder='Adjust title, genre, zone, or Suno Configuration template to refresh...'
                          />
                          <Button
                            icon={<CopyOutlined />}
                            disabled={!generatedPrompt}
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(generatedPrompt);
                                message.success('Prompt copied');
                              } catch {
                                message.error('Failed to copy prompt');
                              }
                            }}
                          >
                            Copy
                          </Button>
                        </Space>
                      </Form.Item>
                    )}
                  </Space>
                ),
              },
            ]}
          />

          <Form.Item name='autoAddToTargetPlaylist' hidden initialValue={true}>
            <input type='hidden' />
          </Form.Item>

          {/* Generate button */}
          <Form.Item style={{ marginBottom: 8 }}>
            <Button
              type='primary'
              htmlType='submit'
              icon={<ThunderboltOutlined />}
              loading={createGeneration.isPending}
              disabled={
                promptMode === 'brandProfile' &&
                hasProfile &&
                !generatedPrompt.trim()
              }
              block
              className={styles.generateButton}
            >
              {generateLabel}
            </Button>
          </Form.Item>

          <Text
            type='secondary'
            style={{ display: 'block', textAlign: 'center', fontSize: 13 }}
          >
            You will be notified when the track is ready — usually under 2 minutes.
          </Text>
        </Form>
      </div>

      <AppModal
        open={settingsOpen}
        onCancel={() => setSettingsOpen(false)}
        footer={null}
        width={MODAL_WIDTHS.large}
        title='Suno AI Settings'
      >
        <SunoConfigForm />
      </AppModal>
    </>
  );
};
