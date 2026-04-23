import { useState, useEffect, useMemo } from 'react';
import {
  Form,
  Input,
  Select,
  Button,
  Card,
  Space,
  Alert,
  message,
  Typography,
  Segmented,
  Spin,
  Flex,
} from 'antd';

/**
 * Icons
 */
import { ThunderboltOutlined, CopyOutlined } from '@ant-design/icons';

/**
 * Components
 */
import { SettingSwitch } from '@/shared/components';

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
import { AiGenerationMode, type SunoGenerationCreateRequest } from '../types';
import type { BrandProfileSunoMood } from '../utils/brandProfileSunoPrompt';

const { TextArea } = Input;
const { Text } = Typography;

type PromptMode = 'manual' | 'brandProfile';
type VocalMode = 'instrumental' | 'withLyrics';

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

export const SunoGenerationForm = ({ onSuccess }: SunoGenerationFormProps) => {
  const [form] = Form.useForm<SunoGenerationFormValues>();
  const [promptMode, setPromptMode] = useState<PromptMode>('manual');

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
  const { options: moodOptions } = useMoodOptions();
  const { data: playlistOptions } = usePlaylistOptions();

  const hasProfile = hasBrandMusicProfileData(musicSnapshot ?? undefined);
  const isBrandModelMode =
    config?.aiGenerationMode === AiGenerationMode.BrandModel;
  const promptMaxLength = isBrandModelMode ? 4000 : 500;
  const isResolvingProfile =
    isConfigLoading ||
    (!!brandId && isConfigReady && !hasFromConfig && isBrandLoading);

  const watchedProfileMood = Form.useWatch('profileMood', form);
  const watchedTitle = Form.useWatch('title', form);
  const watchedGenre = Form.useWatch('genre', form);
  const watchedArtist = Form.useWatch('artist', form);
  const watchedVocalMode = Form.useWatch('vocalMode', form) ?? 'instrumental';

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
      promptMaxLength,
    );
  }, [
    promptMode,
    musicSnapshot,
    watchedProfileMood,
    watchedTitle,
    watchedGenre,
    watchedArtist,
    config?.sunoPromptTemplate,
    promptMaxLength,
  ]);

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
        `Generated profile prompt is too long for current mode. Auto-trimmed to ${promptMaxLength} characters.`,
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

    const result = await createGeneration.mutateAsync({
      ...payload,
      prompt: finalPrompt,
      ...(isBrandModelMode
        ? {
            customMode,
            instrumental,
            lyrics: normalizedLyrics,
          }
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
    setPromptMode(
      hasBrandMusicProfileData(musicSnapshot ?? undefined)
        ? 'brandProfile'
        : 'manual',
    );
  };

  const profileSummary =
    musicSnapshot && hasProfile ? (
      <Space
        direction='vertical'
        size={4}
        style={{ width: '100%' }}
      >
        <Text type='secondary'>
          Template:{' '}
          <Text strong>{musicSnapshot.fuzzyProfileTemplate ?? '—'}</Text>
          {musicSnapshot.storeOverrideLevel != null && (
            <>
              {' '}
              · Override:{' '}
              {storeOverrideLabels[musicSnapshot.storeOverrideLevel] ??
                `Level ${musicSnapshot.storeOverrideLevel}`}
            </>
          )}
        </Text>
        <Text
          type='secondary'
          style={{ fontSize: 12 }}
        >
          BPM (guide): Chill {musicSnapshot.chillBpmMin}–
          {musicSnapshot.chillBpmMax} · Focus {musicSnapshot.focusBpmMin}–
          {musicSnapshot.focusBpmMax} · Energetic{' '}
          {musicSnapshot.energeticBpmMin}–{musicSnapshot.energeticBpmMax}
        </Text>
      </Space>
    ) : null;

  return (
    <>
      <Card title='Generate AI Music'>
        {isResolvingProfile && (
          <div style={{ marginBottom: 16 }}>
            <Spin size='small' />{' '}
            <Text type='secondary'>Loading CAMS profile for Suno...</Text>
          </div>
        )}

        {!hasProfile && isConfigReady && !isResolvingProfile && brandId && (
          <Alert
            type='warning'
            showIcon
            closable
            className='mb-5!'
            message='No brand music profile yet'
            description='Configure Music policy (CAMS fuzzy) under Brand settings, then return here to use this mode.'
          />
        )}

        <Form
          form={form}
          layout='vertical'
          onFinish={handleSubmit}
          size='large'
          styles={{
            label: {
              height: 22,
            },
          }}
        >
          <Form.Item
            label='Prompt mode'
            className='mb-0!'
          >
            <Segmented
              value={promptMode}
              onChange={(v) => setPromptMode(v as PromptMode)}
              options={[
                { label: 'Manual prompt', value: 'manual' },
                {
                  label: 'Brand music profile',
                  value: 'brandProfile',
                  disabled: !hasProfile,
                },
              ]}
            />
          </Form.Item>

          <SettingSwitch
            label='Auto-add to Playlist'
            description='Automatically add generated track to the selected playlist'
            value={form.getFieldValue('autoAddToTargetPlaylist') ?? true}
            onChange={(checked) =>
              form.setFieldValue('autoAddToTargetPlaylist', checked)
            }
            className='pb-5!'
          />

          <Form.Item
            name='targetPlaylistId'
            label='Target playlist'
          >
            <Select
              placeholder='Select playlist (optional)'
              options={playlistOptions}
              allowClear
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
          </Form.Item>

          {promptMode === 'brandProfile' && hasProfile ? (
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

              <Form.Item
                name='profileMood'
                label='Primary music zone'
                initialValue='focus'
                rules={[{ required: true, message: 'Select a zone' }]}
              >
                <Select<BrandProfileSunoMood>
                  options={[
                    {
                      value: 'chill',
                      label: 'Chill / calm (BPM band from profile)',
                    },
                    {
                      value: 'focus',
                      label: 'Focus / steady (BPM band from profile)',
                    },
                    {
                      value: 'energetic',
                      label: 'Energetic / peak (BPM band from profile)',
                    },
                  ]}
                />
              </Form.Item>

              <Flex
                gap={16}
                justify='space-between'
              >
                <Form.Item
                  name='title'
                  label='Track title'
                  rules={[
                    { required: true, message: 'Please enter track title' },
                    { max: 300, message: 'Title too long' },
                  ]}
                  className='w-full!'
                >
                  <Input
                    placeholder='e.g., Morning Focus In-Store'
                    maxLength={300}
                  />
                </Form.Item>

                <Form.Item
                  name='genre'
                  label='Genre'
                  rules={[{ max: 120, message: 'Genre too long' }]}
                  className='w-full!'
                >
                  <Input
                    placeholder='e.g., ambient, lo-fi, soft jazz'
                    maxLength={120}
                  />
                </Form.Item>
              </Flex>

              <Flex
                gap={16}
                justify='space-between'
              >
                <Form.Item
                  name='artist'
                  label='Artist / style hint'
                  rules={[{ max: 300, message: 'Too long' }]}
                  className='w-full!'
                >
                  <Input
                    placeholder='e.g., subtle piano, no vocals'
                    maxLength={300}
                  />
                </Form.Item>

                <Form.Item
                  name='moodId'
                  label='Catalog mood (optional)'
                  className='w-full!'
                >
                  <Select
                    placeholder='Select mood'
                    options={moodOptions}
                    allowClear
                  />
                </Form.Item>
              </Flex>

              <Form.Item
                label={
                  <Space size={6}>
                    <span>Generated prompt (preview)</span>
                    <Text
                      type='secondary'
                      style={{ fontSize: 12 }}
                    >
                      {generatedPrompt
                        ? `${generatedPrompt.length}/${promptMaxLength}`
                        : `0/${promptMaxLength}`}
                    </Text>
                  </Space>
                }
              >
                <Space
                  direction='vertical'
                  style={{ width: '100%' }}
                  size='small'
                >
                  <TextArea
                    value={generatedPrompt}
                    readOnly
                    rows={6}
                    placeholder='Adjust title, genre, zone, or Suno Configuration template to refresh...'
                  />
                  {!isBrandModelMode &&
                    generatedPrompt.length > promptMaxLength && (
                      <Alert
                        type='warning'
                        showIcon
                        message={`This generated prompt exceeds Suno limit (${promptMaxLength} chars). It will be auto-trimmed when submitting.`}
                      />
                    )}
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
            </>
          ) : (
            <Form.Item
              name='prompt'
              label='Custom prompt'
              rules={[
                { required: true, message: 'Please enter generation prompt' },
                {
                  max: promptMaxLength,
                  message: `Prompt too long (max ${promptMaxLength} characters)`,
                },
              ]}
            >
              <TextArea
                rows={4}
                placeholder='Describe the music you want to generate...'
                maxLength={promptMaxLength}
                showCount
              />
            </Form.Item>
          )}

          <Form.Item
            name='autoAddToTargetPlaylist'
            hidden
            initialValue={true}
          >
            <input type='hidden' />
          </Form.Item>

          {isBrandModelMode && (
            <>
              <Form.Item
                label='Vocal mode'
                name='vocalMode'
                initialValue='instrumental'
                className='mb-3!'
              >
                <Segmented<VocalMode>
                  options={[
                    {
                      label: 'Instrumental (no lyrics)',
                      value: 'instrumental',
                    },
                    { label: 'Music with lyrics', value: 'withLyrics' },
                  ]}
                  onChange={(value) => {
                    const nextInstrumental = value === 'instrumental';
                    form.setFieldValue('instrumental', nextInstrumental);
                    if (nextInstrumental) {
                      form.setFieldValue('lyrics', null);
                    }
                  }}
                />
              </Form.Item>

              {watchedVocalMode === 'withLyrics' && (
                <Form.Item
                  name='lyrics'
                  label='Lyrics'
                  rules={[{ max: 8000, message: 'Lyrics too long' }]}
                >
                  <TextArea
                    rows={5}
                    placeholder='Optional: enter lyrics for this track...'
                    maxLength={8000}
                    showCount
                  />
                </Form.Item>
              )}
            </>
          )}

          <Form.Item
            name='instrumental'
            hidden
            initialValue={true}
          >
            <input type='hidden' />
          </Form.Item>

          <Form.Item>
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
              size='large'
              className='mt-5'
            >
              Generate music
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </>
  );
};
