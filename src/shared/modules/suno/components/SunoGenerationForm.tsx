import { useState, useEffect } from 'react';
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
import { useSunoConfig, useCreateSunoGeneration } from '../hooks';
import { useMoodOptions } from '@/shared/modules/moods/hooks';
import { usePlaylistOptions } from '@/shared/modules/playlists/hooks';

/**
 * Utils
 */
import { buildPromptFromTemplate } from '../utils';

/**
 * Types
 */
import type { SunoGenerationCreateRequest } from '../types';

const { TextArea } = Input;
const { Text } = Typography;

interface SunoGenerationFormProps {
  onSuccess?: (generationId: string) => void;
}

export const SunoGenerationForm = ({ onSuccess }: SunoGenerationFormProps) => {
  type SunoGenerationFormValues = SunoGenerationCreateRequest & {
    // FE-only helper field to fill {genre} in the prompt template
    genre?: string | null;
  };

  const [form] = Form.useForm<SunoGenerationFormValues>();
  const [useTemplate, setUseTemplate] = useState(true);
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');

  const { data: config } = useSunoConfig();
  const createGeneration = useCreateSunoGeneration();
  const { options: moodOptions } = useMoodOptions();
  const { data: playlistOptions } = usePlaylistOptions();

  // Initialize form with config defaults
  useEffect(() => {
    if (config) {
      form.setFieldsValue({
        targetPlaylistId: config.sunoDefaultPlaylistId,
        autoAddToTargetPlaylist: true,
      });
    }
  }, [config, form]);

  // Generate prompt from template when fields change
  const handleFieldsChange = () => {
    if (!useTemplate || !config?.sunoPromptTemplate) return;

    const values = form.getFieldsValue();
    const moodName =
      moodOptions?.find(
        (m: { value: string; label: string }) => m.value === values.moodId,
      )?.label || '';

    const variables: Record<string, string> = {
      mood: moodName,
      genre: (values.genre || values.artist || '') as string,
      title: values.title || '',
      artist: values.artist || '',
    };

    const prompt = buildPromptFromTemplate(
      config.sunoPromptTemplate,
      variables,
    );
    setGeneratedPrompt(prompt);
  };

  const handleSubmit = async (values: SunoGenerationFormValues) => {
    const finalPrompt =
      useTemplate && typeof generatedPrompt === 'string'
        ? generatedPrompt.trim()
          ? generatedPrompt
          : null
        : values.prompt;

    if (finalPrompt && finalPrompt.trim().length > 4000) {
      message.error('Prompt too long (max 4000 characters)');
      return;
    }

    // Strip FE-only helper field before calling backend.
    const { genre: _genre, ...payload } = values;
    void _genre; // ensure eslint no-unused-vars is satisfied
    const result = await createGeneration.mutateAsync({
      ...payload,
      prompt: finalPrompt,
    });

    if (result && onSuccess) {
      onSuccess(result.id);
    }

    // Reset form
    form.resetFields();
    setGeneratedPrompt('');
  };

  const hasTemplate = !!config?.sunoPromptTemplate;

  return (
    <Card title='Generate AI Music'>
      <Form
        form={form}
        layout='vertical'
        onFinish={handleSubmit}
        onValuesChange={handleFieldsChange}
        size='large'
        styles={{
          label: {
            height: 22,
          },
        }}
      >
        {hasTemplate && (
          <>
            <SettingSwitch
              label='Prompt Mode'
              description={
                useTemplate
                  ? 'Using configured template - fill fields to generate prompt'
                  : 'Write custom prompt manually'
              }
              value={useTemplate}
              onChange={setUseTemplate}
              className='pt-0!'
            />
          </>
        )}
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
          label='Target Playlist'
          tooltip='Generated track will be added to this playlist'
        >
          <Select
            placeholder='Select playlist (optional)'
            options={playlistOptions}
            allowClear
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
          />
        </Form.Item>

        {useTemplate && hasTemplate ? (
          <>
            <Form.Item
              name='title'
              label='Track Title'
              rules={[
                { required: true, message: 'Please enter track title' },
                { max: 300, message: 'Title too long' },
              ]}
            >
              <Input
                placeholder='e.g., Summer Vibes'
                maxLength={300}
              />
            </Form.Item>

            <Form.Item
              name='genre'
              label='Genre'
              tooltip='Dùng để fill placeholder {genre} trong prompt template'
              rules={[{ max: 120, message: 'Genre too long' }]}
            >
              <Input
                placeholder='e.g., Pop, Jazz, Lo-fi, EDM'
                maxLength={120}
              />
            </Form.Item>

            <Form.Item
              name='artist'
              label='Artist Name'
              rules={[{ max: 300, message: 'Artist name too long' }]}
            >
              <Input
                placeholder='e.g., Studio One'
                maxLength={300}
              />
            </Form.Item>

            <Form.Item
              name='moodId'
              label='Mood'
            >
              <Select
                placeholder='Select mood'
                options={moodOptions}
                allowClear
              />
            </Form.Item>

            <Form.Item
              label={
                <Space size={6}>
                  <span>Generated Prompt (preview)</span>
                  <Text
                    type='secondary'
                    style={{ fontSize: 12 }}
                  >
                    {generatedPrompt
                      ? `${generatedPrompt.length}/4000`
                      : '0/4000'}
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
                  rows={5}
                  placeholder='Fill Title/Genre/Artist/Mood to generate prompt from template...'
                />
                <Space>
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
                  <Text
                    type='secondary'
                    style={{ fontSize: 12 }}
                  >
                    Tip: switch to “Manual Prompt” if you want to edit the
                    prompt.
                  </Text>
                </Space>
              </Space>
            </Form.Item>

            {generatedPrompt && generatedPrompt.length > 3900 && (
              <Alert
                message='Prompt is near the limit'
                description='Backend max length is 4000 characters. Consider shortening your template or inputs.'
                type='warning'
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}
          </>
        ) : (
          <Form.Item
            name='prompt'
            label='Custom Prompt'
            rules={[
              { required: true, message: 'Please enter generation prompt' },
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
        )}

        <Form.Item
          name='autoAddToTargetPlaylist'
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
            block
            size='large'
          >
            Generate Music
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};
