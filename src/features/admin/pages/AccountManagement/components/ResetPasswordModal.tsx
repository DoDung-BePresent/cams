import { Form, Input } from 'antd';

/**
 * Hooks
 */
import { useResetAccountPassword } from '@/features/admin/hooks/useResetAccountPassword';

/**
 * Components
 */
import { AppModal } from '@/shared/components/ui/AppModal';

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

  const handleSubmit = async (values: ResetPasswordRequest) => {
    if (!accountId) return;

    resetPassword.mutate(
      { id: accountId, data: values },
      {
        onSuccess: () => {
          form.resetFields();
          onSuccess();
          onClose();
        },
      },
    );
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <AppModal
      title='Reset Password'
      open={open}
      onCancel={handleCancel}
      onOk={() => form.submit()}
      okText='Reset Password'
      okButtonProps={{
        loading: resetPassword.isPending,
        danger: true,
      }}
      width={500}
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
          extra='Minimum 6 characters. User will be logged out after password reset.'
        >
          <Input.Password placeholder='Enter new password' />
        </Form.Item>
      </Form>
    </AppModal>
  );
};
