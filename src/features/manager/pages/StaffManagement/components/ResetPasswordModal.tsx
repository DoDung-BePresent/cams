import { useState } from 'react';
import { Form, Input, Typography } from 'antd';

/**
 * Hooks
 */
import { useStaffDetail } from '@/features/manager/hooks/useStaffDetail';
import { useResetStaffPassword } from '@/features/manager/hooks/useResetStaffPassword';

/**
 * Components
 */
import { AppModal } from '@/shared/components/ui/AppModal';
import { PasswordStrength } from '@/shared/components/ui/PasswordStrength';

/**
 * Types
 */
import type { ResetStaffPasswordRequest } from '@/features/manager/types/staffTypes';

/**
 * Validations
 */
import { resetPasswordValidation } from '@/features/manager/validations/staffValidation';

const { Text } = Typography;

type ResetPasswordModalProps = {
  open: boolean;
  staffId: string | null;
  onClose: () => void;
  onSuccess: () => void;
};

export const ResetPasswordModal = ({
  open,
  staffId,
  onClose,
  onSuccess,
}: ResetPasswordModalProps) => {
  const [form] = Form.useForm<ResetStaffPasswordRequest>();
  const resetPassword = useResetStaffPassword();
  const [password, setPassword] = useState('');

  const handleSubmit = async (values: ResetStaffPasswordRequest) => {
    if (!staffId) return;

    resetPassword.mutate(
      { id: staffId, data: values },
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
        styles={{
          label: {
            height: 22,
          },
        }}
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
