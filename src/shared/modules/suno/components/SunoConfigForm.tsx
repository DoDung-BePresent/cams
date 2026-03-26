import { useEffect } from 'react';
import { Form, Input, Select, Button, Card, Space, Alert, Spin } from 'antd';
import { SaveOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useSunoConfig, useUpdateSunoConfig } from '../hooks';
import { usePlaylistOptions } from '@/shared/modules/playlists/hooks';
import type { SunoConfigUpdateRequest } from '../types';

const { TextArea } = Input;

export const SunoConfigForm = () => {
  const [form] = Form.useForm<SunoConfigUpdateRequest>();
  const { data: config, isLoading } = useSunoConfig();
  const updateConfig = useUpdateSunoConfig();
  const { data: playlistOptions, isLoading: isLoadingPlaylists } =
    usePlaylistOptions();

  // Initialize form with config data
  useEffect(() => {
    if (config) {
      form.setFieldsValue({
        sunoPromptTemplate: config.sunoPromptTemplate,
        sunoDefaultPlaylistId: config.sunoDefaultPlaylistId,
      });
    }
  }, [config, form]);

  const handleSubmit = async (values: SunoConfigUpdateRequest) => {
    await updateConfig.mutateAsync(values);
  };

  if (isLoading) {
    return (
      <Card>
        <Spin />
      </Card>
    );
  }

  return (
    <Card
      title='Suno AI Configuration'
      extra={
        <Button
          type='primary'
          icon={<SaveOutlined />}
          loading={updateConfig.isPending}
          onClick={() => form.submit()}
        >
          Save Configuration
        </Button>
      }
    >
      <Form
        form={form}
        layout='vertical'
        onFinish={handleSubmit}
      >
        <Alert
          message='Prompt Template Variables'
          description={
            <Space
              direction='vertical'
              size='small'
            >
              <div>You can use these placeholders in your prompt template:</div>
              <div>
                <code>{'{mood}'}</code> - Mood name (e.g., "Energetic", "Calm")
              </div>
              <div>
                <code>{'{genre}'}</code> - Music genre
              </div>
              <div>
                <code>{'{title}'}</code> - Track title
              </div>
              <div>
                <code>{'{artist}'}</code> - Artist name
              </div>
            </Space>
          }
          type='info'
          icon={<InfoCircleOutlined />}
          style={{ marginBottom: 24 }}
        />

        <Form.Item
          name='sunoPromptTemplate'
          label='Prompt Template'
          tooltip='Template for generating AI music prompts. Use placeholders like {mood}, {genre}, etc.'
        >
          <TextArea
            rows={6}
            placeholder='Example: Create a {mood} {genre} track titled "{title}" by {artist}'
            maxLength={4000}
            showCount
          />
        </Form.Item>

        <Form.Item
          name='sunoDefaultPlaylistId'
          label='Default Playlist'
          tooltip='Generated tracks will be automatically added to this playlist'
        >
          <Select
            placeholder='Select default playlist'
            loading={isLoadingPlaylists}
            options={playlistOptions}
            allowClear
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
          />
        </Form.Item>
      </Form>
    </Card>
  );
};
