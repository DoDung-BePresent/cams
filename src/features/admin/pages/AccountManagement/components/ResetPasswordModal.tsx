import { useState } from 'react';
import { Form, Input } from 'antd';

/**
 * Hooks
 */
import { useResetAccountPassword } from '@/features/admin/hooks/useResetAccountPassword';

/**
 * Components
 */
import { AppModal } from '@/shared/components/ui/AppModal';
import { PasswordStrength } from '@/shared/components/ui/PasswordStrength';

/**
 * Types
 */
import type { ResetPasswordRequest } from '@/features/admin/types/accountTypes';

/**
 * Validations
 */
import { resetPasswordValidation } from '@/features/admin/validations/accountValidation';

type ResetPasswordModalProps = {
  open: boolean;
  accountId: string | null;
  onClose: () => void;
  onSuccess: () => void;
};

export const ResetPasswordModal = ({
  open,
  accountId,
  onClose,
  onSuccess,
}: ResetPasswordModalProps) => {
  const [form] = Form.useForm<ResetPasswordRequest>();
  const resetPassword = useResetAccountPassword();
  const [password, setPassword] = useState('');

  const handleSubmit = async (values: ResetPasswordRequest) => {
    if (!accountId) return;

    resetPassword.mutate(
      { id: accountId, data: values },
      {
        onSuccess: () => {
          form.resetFields();
          setPassword('');
          onSuccess();
          onClose();
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
    <AppModal
      size='large'
      title='Reset Password'
      open={open}
      onCancel={handleCancel}
      onOk={() => form.submit()}
      okText='Reset Password'
      okButtonProps={{
        loading: resetPassword.isPending,
        danger: true,
      }}
      width={550}
    >
      <Form
        form={form}
        layout='vertical'
        onFinish={handleSubmit}
        autoComplete='off'
        size='large'
      >
        <Form.Item
          label='New Password'
          name='newPassword'
          rules={resetPasswordValidation.newPassword}
          extra='User will be logged out after password reset.'
        >
          <Input.Password
            placeholder='Enter new password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Form.Item>

        <PasswordStrength
          password={password}
          onPasswordChange={handlePasswordChange}
          showGenerator
          description='This is the password to your account, so it must be strong and hard to guess.'
        />
      </Form>
    </AppModal>
  );
};
