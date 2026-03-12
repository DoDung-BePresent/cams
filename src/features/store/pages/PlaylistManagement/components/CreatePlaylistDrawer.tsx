import { useEffect } from 'react';
import {
  Drawer,
  Form,
  Input,
  Select,
  Switch,
  Button,
  Flex,
  Typography,
  Alert,
} from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { useCreatePlaylist } from '@/shared/modules/playlists/hooks';
import { useMoods } from '@/shared/modules/moods/hooks';
import { createPlaylistValidation } from '@/shared/modules/playlists/validations';
import type { CreatePlaylistRequest } from '@/shared/modules/playlists/types';

const { Title } = Typography;

interface CreatePlaylistDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CreatePlaylistDrawer = ({
  open,
  onClose,
  onSuccess,
}: CreatePlaylistDrawerProps) => {
  const [form] = Form.useForm<CreatePlaylistRequest>();
  const createPlaylist = useCreatePlaylist();

  const { data: moodsData } = useMoods();

  const isDynamic = Form.useWatch('isDynamic', form);

  useEffect(() => {
    if (open) {
      form.resetFields();
      form.setFieldsValue({
        isDynamic: false,
        isDefault: false,
      });
    }
  }, [open, form]);

  const handleSubmit = async (values: CreatePlaylistRequest) => {
    // StoreManager: storeId will be auto-assigned server-side
    createPlaylist.mutate(values, {
      onSuccess: () => {
        handleCancel();
        onSuccess?.();
      },
    });
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  const moodOptions = (moodsData || []).map((mood) => ({
    label: mood.name || 'Unnamed Mood',
    value: mood.id,
  }));

  return (
    <Drawer
      closeIcon={null}
      title='Create New Playlist'
      placement='right'
      width={720}
      open={open}
      onClose={handleCancel}
      footer={
        <Flex
          justify='end'
          gap='small'
        >
          <Button
            size='large'
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button
            size='large'
            type='primary'
            onClick={() => form.submit()}
            loading={createPlaylist.isPending}
          >
            Create Playlist
          </Button>
        </Flex>
      }
    >
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
          <Title
            level={5}
            style={{ marginBottom: 16 }}
          >
            Basic Information
          </Title>

          <Form.Item
            label='Playlist Name'
            name='name'
            rules={createPlaylistValidation.name}
          >
            <Input
              placeholder='Enter playlist name'
              maxLength={255}
              showCount
            />
          </Form.Item>

          <Alert
            message='Store Assignment'
            description='This playlist will be automatically assigned to your store.'
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
            rules={createPlaylistValidation.description}
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
          <Title
            level={5}
            style={{ marginBottom: 16 }}
          >
            Configuration
          </Title>

          <Form.Item
            label='Playlist Type'
            name='isDynamic'
            valuePropName='checked'
            tooltip='Dynamic playlists automatically manage tracks based on mood'
          >
            <Switch
              checkedChildren='Dynamic'
              unCheckedChildren='Static'
            />
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
            tooltip='Set as the default playlist for your store'
          >
            <Switch
              checkedChildren='Yes'
              unCheckedChildren='No'
            />
          </Form.Item>
        </div>

        {/* Advanced Settings */}
        <div>
          <Title
            level={5}
            style={{ marginBottom: 16 }}
          >
            Advanced Settings
          </Title>

          <Form.Item
            label='HLS URL'
            name='hlsUrl'
            rules={createPlaylistValidation.hlsUrl}
            tooltip='Optional: Provide a custom HLS stream URL'
          >
            <Input placeholder='https://example.com/playlist.m3u8' />
          </Form.Item>

          <Form.Item
            label='Total Duration (seconds)'
            name='totalDurationSeconds'
            rules={createPlaylistValidation.totalDurationSeconds}
            tooltip='Optional: Manually set total duration'
          >
            <Input
              type='number'
              placeholder='e.g., 3600'
              min={1}
            />
          </Form.Item>
        </div>
      </Form>
    </Drawer>
  );
};
