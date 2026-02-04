import { useState } from 'react';
import { Button, Drawer, Form, Input, Select, message } from 'antd';
import type { CreateUserDto } from '@/features/admin/types/userTypes';
import { USER_ROLES } from '@/features/admin/constants/userConstants';
import { createUserValidation } from '@/features/admin/validations/userValidation';

type AddUserDrawerProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: (user: CreateUserDto) => void;
};

export const AddUserDrawer = ({
  open,
  onClose,
  onSuccess,
}: AddUserDrawerProps) => {
  const [form] = Form.useForm<CreateUserDto>();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: CreateUserDto) => {
    try {
      setLoading(true);

      // TODO: Call API to create user
      console.log('Create user:', values);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      message.success('User added successfully! Invitation email sent.');
      onSuccess(values);
      form.resetFields();
      onClose();
    } catch (error) {
      message.error('Failed to add user!');
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
      title='Add User'
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
            Add User
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
          label='Email'
          name='email'
          rules={createUserValidation.email}
          extra='An invitation email will be sent to this address'
        >
          <Input
            placeholder='user@example.com'
            type='email'
          />
        </Form.Item>

        <Form.Item
          label='Role'
          name='role'
          rules={createUserValidation.role}
        >
          <Select
            placeholder='Select role'
            options={USER_ROLES}
          />
        </Form.Item>
      </Form>
    </Drawer>
  );
};
