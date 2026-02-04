import { useState } from 'react';
import { Button, Drawer, Form, Select, message } from 'antd';
import type { AssignBranchDto } from '@/features/admin/types/userTypes';
import { assignBranchValidation } from '@/features/admin/validations/userValidation';

type AssignBranchDrawerProps = {
  open: boolean;
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
};

export const AssignBranchDrawer = ({
  open,
  userId,
  onClose,
  onSuccess,
}: AssignBranchDrawerProps) => {
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

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Drawer
      closeIcon={null}
      title='Assign Branch'
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
    </Drawer>
  );
};