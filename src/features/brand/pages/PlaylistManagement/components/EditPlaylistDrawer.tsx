import { useEffect } from 'react';
import {
  Drawer,
  Form,
  Input,
  Select,
  Switch,
  Button,
  Flex,
  Spin,
  Typography,
  Alert,
} from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import {
  usePlaylist,
  useUpdatePlaylist,
} from '@/shared/modules/playlists/hooks';
import { useMoods } from '@/shared/modules/moods/hooks';
import { updatePlaylistValidation } from '@/shared/modules/playlists/validations';
import type { UpdatePlaylistRequest } from '@/shared/modules/playlists/types';

const { Title, Text } = Typography;

interface EditPlaylistDrawerProps {
  open: boolean;
  playlistId?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export const EditPlaylistDrawer = ({
  open,
  playlistId,
  onClose,
  onSuccess,
}: EditPlaylistDrawerProps) => {
  const [form] = Form.useForm<UpdatePlaylistRequest>();
  const { data: playlist, isLoading } = usePlaylist(playlistId, open);
  const updatePlaylist = useUpdatePlaylist();

  const { data: moodsData } = useMoods({ page: 1, pageSize: 1000, status: 1 });

  const isDynamic = Form.useWatch('isDynamic', form);

  useEffect(() => {
    if (open && playlist) {
      form.setFieldsValue({
        name: playlist.name,
        moodId: playlist.moodId || undefined,
        description: playlist.description || undefined,
        isDynamic: playlist.isDynamic,
        isDefault: playlist.isDefault,
        hlsUrl: playlist.hlsUrl || undefined,
        totalDurationSeconds: playlist.totalDurationSeconds || undefined,
      });
    }
  }, [open, playlist, form]);

  const handleSubmit = async (values: UpdatePlaylistRequest) => {
    if (!playlistId) return;

    updatePlaylist.mutate(
      { id: playlistId, data: values },
      {
        onSuccess: () => {
          handleCancel();
          onSuccess?.();
        },
      }
    );
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  const moodOptions = (moodsData?.items || []).map((mood) => ({
    label: mood.name || 'Unnamed Mood',
    value: mood.id,
  }));

  return (
    <Drawer
      closeIcon={null}
      title='Edit Playlist'
      placement='right'
      width={720}
      open={open}
      onClose={handleCancel}
      footer={
        <Flex justify='end' gap='small'>
          <Button size='large' onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            size='large'
            type='primary'
            onClick={() => form.submit()}
            loading={updatePlaylist.isPending}
            disabled={isLoading}
          >
            Save Changes
          </Button>
        </Flex>
      }
    >
      {isLoading ? (
        <div className='flex h-96 items-center justify-center'>
          <Spin size='large' />
        </div>
      ) : (
        <Form
          size='large'
          form={form}
          layout='vertical'
          onFinish={handleSubmit}
          autoComplete='off'
          styles={{
            label: {
              height: 22,
            },
          }}
        >
          {/* Basic Information */}
          <div style={{ marginBottom: 24 }}>
            <Title level={5} style={{ marginBottom: 16 }}>
              Basic Information
            </Title>

            <Form.Item
              label='Playlist Name'
              name='name'
              rules={updatePlaylistValidation.name}
            >
              <Input
                placeholder='Enter playlist name'
                maxLength={255}
                showCount
              />
            </Form.Item>

            <Alert
              message='Store Cannot Be Changed'
              description='Playlists are permanently assigned to a store and cannot be moved.'
              type='info'
              icon={<InfoCircleOutlined />}
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Form.Item
              label='Mood'
              name='moodId'
              tooltip='Optional: Assign a mood to this playlist'
            >
              <Select
                placeholder='Select mood (optional)'
                options={moodOptions}
                showSearch
                optionFilterProp='label'
                allowClear
                loading={!moodsData}
              />
            </Form.Item>

            <Form.Item
              label='Description'
              name='description'
              rules={updatePlaylistValidation.description}
            >
              <Input.TextArea
                placeholder='Enter playlist description (optional)'
                rows={4}
                maxLength={2000}
                showCount
              />
            </Form.Item>
          </div>

          {/* Configuration */}
          <div style={{ marginBottom: 24 }}>
            <Title level={5} style={{ marginBottom: 16 }}>
              Configuration
            </Title>

            <Form.Item
              label='Playlist Type'
              name='isDynamic'
              valuePropName='checked'
              tooltip='Dynamic playlists automatically manage tracks based on mood'
            >
              <Switch checkedChildren='Dynamic' unCheckedChildren='Static' />
            </Form.Item>

            {isDynamic && (
              <Alert
                message='Dynamic Playlist'
                description='Dynamic playlists automatically select tracks based on the assigned mood. You cannot manually add/remove tracks.'
                type='info'
                icon={<InfoCircleOutlined />}
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}

            <Form.Item
              label='Default Playlist'
              name='isDefault'
              valuePropName='checked'
              tooltip='Set as the default playlist for the store'
            >
              <Switch checkedChildren='Yes' unCheckedChildren='No' />
            </Form.Item>
          </div>

          {/* Advanced Settings */}
          <div style={{ marginBottom: 24 }}>
            <Title level={5} style={{ marginBottom: 16 }}>
              Advanced Settings
            </Title>

            <Form.Item
              label='HLS URL'
              name='hlsUrl'
              rules={updatePlaylistValidation.hlsUrl}
              tooltip='Optional: Provide a custom HLS stream URL'
            >
              <Input placeholder='https://example.com/playlist.m3u8' />
            </Form.Item>

            <Form.Item
              label='Total Duration (seconds)'
              name='totalDurationSeconds'
              rules={updatePlaylistValidation.totalDurationSeconds}
              tooltip='Optional: Manually set total duration'
            >
              <Input
                type='number'
                placeholder='e.g., 3600'
                min={1}
              />
            </Form.Item>
          </div>

          {/* Read-only Info */}
          {playlist && (
            <div style={{ marginTop: 16 }}>
              <Text type='secondary'>
                Store: <strong>{playlist.storeName || 'N/A'}</strong>
              </Text>
              <br />
              <Text type='secondary'>
                Tracks: <strong>{playlist.trackCount}</strong>
              </Text>
            </div>
          )}
        </Form>
      )}
    </Drawer>
  );
};