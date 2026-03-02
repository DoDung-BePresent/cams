import { useState } from 'react';
import { Button, Drawer, Form, Input, Flex, Typography } from 'antd';

/**
 * Hooks
 */
import { useStaffDetail } from '@/features/manager/hooks/useStaffDetail';
import { useResetStaffPassword } from '@/features/manager/hooks/useResetStaffPassword';

/**
 * Components
 */
import { PasswordStrength } from '@/shared/components/ui/PasswordStrength'; // ✅ Correct component name

/**
 * Types
 */
import type { ResetStaffPasswordRequest } from '@/features/manager/types/staffTypes';

/**
 * Validations
 */
import { resetPasswordValidation } from '@/features/manager/validations/staffValidation';

const { Text } = Typography;

type ResetPasswordDrawerProps = {
  open: boolean;
  staffId: string | null;
  onClose: () => void;
  onSuccess: () => void;
};

export const ResetPasswordDrawer = ({
  open,
  staffId,
  onClose,
  onSuccess,
}: ResetPasswordDrawerProps) => {
  const [form] = Form.useForm<ResetStaffPasswordRequest>();
  const { data: staff } = useStaffDetail(
    staffId || undefined,
    open && !!staffId,
  );
  const resetPassword = useResetStaffPassword();
  const [password, setPassword] = useState('');

  const handleSubmit = async (values: ResetStaffPasswordRequest) => {
    if (!staffId) return;

    resetPassword.mutate(
      { id: staffId, data: values },
      {
        onSuccess: () => {
          handleCancel();
          onSuccess();
        },
      },
    );
  };

  const handleCancel = () => {
    form.resetFields();
    setPassword('');
    onClose();
  };

  const handlePasswordChange = (newPassword: string) => {
    setPassword(newPassword);
    form.setFieldValue('newPassword', newPassword);
  };

  return (
    <Drawer
      closeIcon={null}
      title='Reset Password'
      placement='right'
      width={520}
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
            loading={resetPassword.isPending}
          >
            Reset Password
          </Button>
        </Flex>
      }
    >
      <div style={{ marginBottom: 24 }}>
        <Text strong>Staff Member: </Text>
        <Text>{staff?.fullName}</Text>
        <br />
        <Text strong>Email: </Text>
        <Text>{staff?.email}</Text>
      </div>

      <Form
        size='large'
        form={form}
        layout='vertical'
        onFinish={handleSubmit}
      >
        <Form.Item
          label='New Password'
          name='newPassword'
          rules={resetPasswordValidation.newPassword}
          extra='The staff member will be able to login with this new password'
        >
          <Input.Password
            placeholder='Enter new password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Form.Item>

        {/* ✅ Use shared PasswordStrength with generator */}
        <PasswordStrength
          password={password}
          onPasswordChange={handlePasswordChange}
          showGenerator
          description='This is the password to your account, so it must be strong and hard to guess.'
        />
      </Form>
    </Drawer>
  );
};
