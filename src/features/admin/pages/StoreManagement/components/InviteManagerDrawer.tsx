import { useState } from 'react';
import { Button, Drawer, Form, Input, Select, message } from 'antd';
import type { InviteUserDto } from '@/features/admin/types/userTypes';
import { USER_ROLES } from '@/features/admin/constants/userConstants';
import { inviteUserValidation } from '@/features/admin/validations/userValidation';

type InviteManagerDrawerProps = {
  open: boolean;
  storeId: string;
  existingEmails: string[];
  onClose: () => void;
  onSuccess: (user: InviteUserDto) => void;
};

export const InviteManagerDrawer = ({
  open,
  storeId,
  existingEmails,
  onClose,
  onSuccess,
}: InviteManagerDrawerProps) => {
  const [form] = Form.useForm<InviteUserDto>();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: InviteUserDto) => {
    try {
      // Check duplicate email
      if (existingEmails.includes(values.email.toLowerCase())) {
        message.error('This email is already invited to this store!');
        return;
      }

      setLoading(true);

      const payload: InviteUserDto = {
        email: values.email,
        role: values.role,
      };

      // TODO: Call API to invite user
      console.log('Invite user to store:', storeId, payload);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      message.success('Invitation sent successfully!');
      onSuccess(payload);
      form.resetFields();
      onClose();
    } catch (error) {
      message.error('Failed to send invitation!');
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
      title='Invite Manager'
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
            Send Invitation
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
          rules={inviteUserValidation.email}
          extra='An invitation email will be sent to this address'
        >
          <Input
            placeholder='manager@example.com'
            type='email'
          />
        </Form.Item>

        <Form.Item
          label='Role'
          name='role'
          rules={inviteUserValidation.role}
          extra="This defines the user's access level within the store"
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
