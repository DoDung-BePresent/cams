import { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  Button,
  Card,
  Space,
  Switch,
  Alert,
  Divider,
} from 'antd';
import {
  ThunderboltOutlined,
  InfoCircleOutlined,
  StarOutlined,
} from '@ant-design/icons';
import { useSunoConfig, useCreateSunoGeneration } from '../hooks';
import { useMoodOptions } from '@/shared/modules/moods/hooks';
import { usePlaylistOptions } from '@/shared/modules/playlists/hooks';
import { buildPromptFromTemplate } from '../utils';
import type { SunoGenerationCreateRequest } from '../types';

const { TextArea } = Input;

interface SunoGenerationFormProps {
  onSuccess?: (generationId: string) => void;
}

export const SunoGenerationForm = ({ onSuccess }: SunoGenerationFormProps) => {
  const [form] = Form.useForm<SunoGenerationCreateRequest>();
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
      genre: values.artist || '',
      title: values.title || '',
      artist: values.artist || '',
    };

    const prompt = buildPromptFromTemplate(
      config.sunoPromptTemplate,
      variables,
    );
    setGeneratedPrompt(prompt);
  };

  const handleSubmit = async (values: SunoGenerationCreateRequest) => {
    const finalPrompt = useTemplate ? generatedPrompt : values.prompt;

    const result = await createGeneration.mutateAsync({
      ...values,
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
    <Card
      title={
        <Space>
          <StarOutlined />
          Generate AI Music
        </Space>
      }
    >
      <Form
        form={form}
        layout='vertical'
        onFinish={handleSubmit}
        onValuesChange={handleFieldsChange}
      >
        {hasTemplate && (
          <>
            <Form.Item label='Prompt Mode'>
              <Space>
                <Switch
                  checked={useTemplate}
                  onChange={setUseTemplate}
                  checkedChildren='Use Template'
                  unCheckedChildren='Manual Prompt'
                />
                <span style={{ color: '#999', fontSize: 12 }}>
                  {useTemplate
                    ? 'Using configured template'
                    : 'Write custom prompt'}
                </span>
              </Space>
            </Form.Item>
            <Divider style={{ margin: '12px 0' }} />
          </>
        )}

        {useTemplate && hasTemplate ? (
          <>
            <Form.Item
              name='title'
              label='Track Title'
              rules={[
                { required: true, message: 'Please enter track title' },
                { max: 255, message: 'Title too long' },
              ]}
            >
              <Input
                placeholder='e.g., Summer Vibes'
                maxLength={255}
              />
            </Form.Item>

            <Form.Item
              name='artist'
              label='Artist Name'
              rules={[{ max: 255, message: 'Artist name too long' }]}
            >
              <Input
                placeholder='e.g., Studio One'
                maxLength={255}
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

            {generatedPrompt && (
              <Alert
                message='Generated Prompt'
                description={generatedPrompt}
                type='info'
                icon={<InfoCircleOutlined />}
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
              { max: 1000, message: 'Prompt too long' },
            ]}
          >
            <TextArea
              rows={4}
              placeholder='Describe the music you want to generate...'
              maxLength={1000}
              showCount
            />
          </Form.Item>
        )}

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

        <Form.Item
          name='autoAddToTargetPlaylist'
          label='Auto-add to Playlist'
          valuePropName='checked'
          initialValue={true}
        >
          <Switch />
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

        <Alert
          message='Generation takes 1-2 minutes'
          description='You will be notified when the music is ready. You can continue working while generation is in progress.'
          type='info'
          showIcon
        />
      </Form>
    </Card>
  );
};
