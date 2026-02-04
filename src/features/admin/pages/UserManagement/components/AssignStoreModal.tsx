import { useState } from 'react';
import { Button, Form, Modal, Select, message } from 'antd';
import type { AssignStoreDto } from '@/features/admin/types/userTypes';
import { assignStoreValidation } from '@/features/admin/validations/userValidation';

type AssignStoreModalProps = {
  open: boolean;
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
};

export const AssignStoreModal = ({
  open,
  userId,
  onClose,
  onSuccess,
}: AssignStoreModalProps) => {
  const [form] = Form.useForm<AssignStoreDto>();
  const [loading, setLoading] = useState(false);

  // TODO: Fetch stores from API
  const stores = [
    { label: 'Moonlight Coffee', value: '1' },
    { label: 'Highlands Coffee', value: '2' },
  ];

  const handleSubmit = async (values: AssignStoreDto) => {
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

  return (
    <Modal
      title='Assign Store'
      open={open}
      onCancel={onClose}
      footer={
        <div className='flex justify-end gap-2'>
          <Button onClick={onClose}>Cancel</Button>
          <Button
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
        form={form}
        layout='vertical'
        onFinish={handleSubmit}
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
    </Modal>
  );
};
