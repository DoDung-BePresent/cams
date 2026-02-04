import { useState } from 'react';
import { Button, Drawer, Form, Select, message } from 'antd';
import type { AssignStorePayload } from '@/features/admin/types/userTypes';
import { assignStoreValidation } from '@/features/admin/validations/userValidation';

type AssignStoreDrawerProps = {
  open: boolean;
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
};

export const AssignStoreDrawer = ({
  open,
  userId,
  onClose,
  onSuccess,
}: AssignStoreDrawerProps) => {
  const [form] = Form.useForm<AssignStorePayload>();
  const [loading, setLoading] = useState(false);

  // TODO: Fetch stores from API
  const stores = [
    { label: 'Moonlight Coffee', value: '1' },
    { label: 'Highlands Coffee', value: '2' },
  ];

  const handleSubmit = async (values: AssignStorePayload) => {
    try {
      setLoading(true);

      // TODO: Call API to assign store
      console.log('Assign store to user:', userId, values);

      await new Promise((resolve) => setTimeout(resolve, 1000));

      message.success('Store assigned successfully!');
      onSuccess();
      form.resetFields();
      onClose();
    } catch (error) {
      message.error('Failed to assign store!');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Drawer
      closeIcon={null}
      title='Assign Store'
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
            Assign
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
          label='Select Store'
          name='store_id'
          rules={assignStoreValidation.store_id}
        >
          <Select
            placeholder='Select a store'
            options={stores}
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
          />
        </Form.Item>
      </Form>
    </Drawer>
  );
};
