import { useEffect } from 'react';
import { Modal, Form, Input, Select, Button, Flex, Typography } from 'antd';

/**
 * Hooks
 */
import { useMoods } from '@/shared/modules/moods/hooks';
import { useCreatePlaylist } from '@/shared/modules/playlists/hooks';

/**
 * Validations
 */
import { createPlaylistValidation } from '@/shared/modules/playlists/validations';

/**
 * Types
 */
import type { CreatePlaylistRequest } from '@/shared/modules/playlists/types';

/**
 * Configs
 */
import { DRAWER_WIDTHS } from '@/config';

/**
 * Components
 */
import { SettingSwitch } from '@/shared/components';

const { Title } = Typography;

interface CreatePlaylistModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CreatePlaylistModal = ({
  open,
  onClose,
  onSuccess,
}: CreatePlaylistModalProps) => {
  const [form] = Form.useForm<CreatePlaylistRequest>();
  const createPlaylist = useCreatePlaylist();

  const { data: moodsData } = useMoods();

  useEffect(() => {
    if (open) {
      form.resetFields();
      form.setFieldsValue({
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
    <Modal
      title='Create New Playlist'
      centered
      destroyOnClose
      width={DRAWER_WIDTHS.medium}
      open={open}
      onCancel={handleCancel}
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
        <div>
          <Title
            level={5}
            style={{ marginBottom: 16 }}
          >
            Configuration
          </Title>

          <Form.Item
            name='isDefault'
            valuePropName='checked'
            style={{ marginBottom: 0 }}
          >
            <SettingSwitch
              label='Default Playlist'
              description='Set this playlist as the default for the store'
              className='pt-0!'
            />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
};
