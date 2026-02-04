import { useState } from 'react';
import { Button, Form, Modal, Select, message } from 'antd';
import type { AssignBranchDto } from '@/features/admin/types/userTypes';
import { assignBranchValidation } from '@/features/admin/validations/userValidation';

type AssignBranchModalProps = {
  open: boolean;
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
};

export const AssignBranchModal = ({
  open,
  userId,
  onClose,
  onSuccess,
}: AssignBranchModalProps) => {
  const [form] = Form.useForm<AssignBranchDto>();
  const [loading, setLoading] = useState(false);

  // TODO: Fetch branches from API (grouped by store)
  const branches = [
    { label: 'Moonlight Coffee - District 1', value: '1', storeId: '1' },
    { label: 'Moonlight Coffee - District 3', value: '2', storeId: '1' },
    { label: 'Highlands Coffee - Tan Binh', value: '3', storeId: '2' },
  ];

  const handleSubmit = async (values: AssignBranchDto) => {
    try {
      setLoading(true);

      // TODO: Call API to assign branch
      console.log('Assign branch to user:', userId, values);

      await new Promise((resolve) => setTimeout(resolve, 1000));

      message.success('Branch assigned successfully!');
      onSuccess();
      form.resetFields();
      onClose();
    } catch (error) {
      message.error('Failed to assign branch!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title='Assign Branch'
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
          label='Select Branch'
          name='branch_id'
          rules={assignBranchValidation.branch_id}
        >
          <Select
            placeholder='Select a branch'
            options={branches}
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
