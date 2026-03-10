import { useState } from 'react';
import { Button, Drawer, Form, Input, Select, message } from 'antd';
import type { CreateSpacePayload } from '@/features/brand/types/spaceTypes';
import { spaceValidation } from '@/features/brand/validations/spaceValidation';
import { useBranchStore } from '@/features/brand/stores/useBranchStore';

const { TextArea } = Input;

type AddSpaceDrawerProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: (space: CreateSpacePayload) => void;
};

export const AddSpaceDrawer = ({
  open,
  onClose,
  onSuccess,
}: AddSpaceDrawerProps) => {
  const [form] = Form.useForm<Omit<CreateSpacePayload, 'branch_id'>>();
  const [loading, setLoading] = useState(false);
  const currentBranch = useBranchStore((state) => state.currentBranch);

  // TODO: Fetch available devices from API
  const devices = [
    { label: 'ESP32 Device #001', value: 'ESP32_001' },
    { label: 'ESP32 Device #002', value: 'ESP32_002' },
    { label: 'Android Tablet #001', value: 'ANDROID_001' },
  ];

  const handleSubmit = async (
    values: Omit<CreateSpacePayload, 'branch_id'>,
  ) => {
    if (!currentBranch) {
      message.error('No branch selected!');
      return;
    }

    try {
      setLoading(true);

      const payload: CreateSpacePayload = {
        ...values,
        branch_id: currentBranch.id,
        space_code: values.space_code.toUpperCase(),
      };

      // TODO: Call API to create space
      console.log('Create space:', payload);

      await new Promise((resolve) => setTimeout(resolve, 1000));

      message.success('Space created successfully!');
      onSuccess(payload);
      form.resetFields();
      onClose();
    } catch (error) {
      message.error('Failed to create space!');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  const handleSpaceCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/\s/g, '_');
    form.setFieldValue('space_code', value);
  };

  return (
    <Drawer
      closeIcon={null}
      title='Add Space'
      placement='right'
      width={520}
      open={open}
      onClose={handleCancel}
      footer={
        <div className='flex justify-end gap-2'>
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
            loading={loading}
          >
            Create Space
          </Button>
        </div>
      }
    >
      <Form
        size='large'
        form={form}
        layout='vertical'
        onFinish={handleSubmit}
        styles={{
          label: {
            height: 22,
          },
        }}
      >
        <Form.Item
          label='Space Name'
          name='space_name'
          rules={spaceValidation.space_name}
        >
          <Input placeholder='e.g., Main Floor' />
        </Form.Item>

        <Form.Item
          label='Space Code'
          name='space_code'
          rules={spaceValidation.space_code}
          extra='Uppercase letters, numbers, and underscores only'
        >
          <Input
            placeholder='e.g., FLOOR_1'
            onChange={handleSpaceCodeChange}
          />
        </Form.Item>

        <Form.Item
          label='Description'
          name='description'
          rules={spaceValidation.description}
        >
          <TextArea
            rows={3}
            placeholder='Optional description'
            maxLength={255}
            showCount
            styles={{
              count: {
                fontSize: 14,
              },
            }}
          />
        </Form.Item>

        <Form.Item
          label='Playback Device'
          name='device_id'
          rules={spaceValidation.device_id}
          extra='Select a device or configure later'
        >
          <Select
            placeholder='Select device (optional)'
            options={devices}
            allowClear
          />
        </Form.Item>
      </Form>
    </Drawer>
  );
};
