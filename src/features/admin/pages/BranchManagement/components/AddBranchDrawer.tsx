import { useState } from 'react';
import { Button, Drawer, Form, Input, message } from 'antd';
import type { CreateBranchPayload } from '@/features/admin/types/branchTypes';
import { branchValidation } from '@/features/admin/validations/branchValidation';

const { TextArea } = Input;

type AddBranchDrawerProps = {
  open: boolean;
  storeId: string;
  onClose: () => void;
  onSuccess: (branch: CreateBranchPayload) => void;
};

export const AddBranchDrawer = ({
  open,
  storeId,
  onClose,
  onSuccess,
}: AddBranchDrawerProps) => {
  const [form] = Form.useForm<CreateBranchPayload>();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (
    values: Omit<CreateBranchPayload, 'store_id'>,
  ) => {
    try {
      setLoading(true);

      const payload: CreateBranchPayload = {
        ...values,
        store_id: storeId,
        branch_code: values.branch_code.toUpperCase(),
      };

      // TODO: Call API to create branch
      console.log('Create branch:', payload);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      message.success('Branch created successfully!');
      onSuccess(payload);
      form.resetFields();
      onClose();
    } catch (error) {
      message.error('Failed to create branch!');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  const handleBranchCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/\s/g, '_');
    form.setFieldValue('branch_code', value);
  };

  return (
    <Drawer
      closeIcon={null}
      title='Add Branch'
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
            Create Branch
          </Button>
        </div>
      }
    >
      <Form
        form={form}
        size='large'
        layout='vertical'
        onFinish={handleSubmit}
        initialValues={{
          status: 'active',
        }}
        styles={{
          label: {
            height: 22,
          },
        }}
      >
        <Form.Item
          label='Branch Name'
          name='branch_name'
          rules={branchValidation.branch_name}
        >
          <Input placeholder='e.g., Highlands Coffee - District 1' />
        </Form.Item>

        <Form.Item
          label='Branch Code'
          name='branch_code'
          rules={branchValidation.branch_code}
          extra='Uppercase letters, numbers, and underscores only. No spaces.'
        >
          <Input
            placeholder='e.g., HLC_Q1'
            onChange={handleBranchCodeChange}
          />
        </Form.Item>

        <Form.Item
          label='Address'
          name='address'
          rules={branchValidation.address}
        >
          <TextArea
            rows={4}
            placeholder='Full physical address of the branch'
            maxLength={255}
            showCount
            styles={{
              count: {
                fontSize: 14,
              },
            }}
          />
        </Form.Item>
      </Form>
    </Drawer>
  );
};
