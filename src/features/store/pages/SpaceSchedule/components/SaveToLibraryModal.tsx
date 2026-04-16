import { useEffect } from 'react';
import { Form, Input } from 'antd';

import { AppModal } from '@/shared/components';

type SaveToLibraryFormValues = {
  title: string;
  subtitle?: string;
};

type SaveToLibraryModalProps = {
  open: boolean;
  initialTitle: string;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (values: SaveToLibraryFormValues) => void;
};

export const SaveToLibraryModal = ({
  open,
  initialTitle,
  loading,
  onClose,
  onSubmit,
}: SaveToLibraryModalProps) => {
  const [form] = Form.useForm<SaveToLibraryFormValues>();

  useEffect(() => {
    if (!open) {
      return;
    }

    form.setFieldsValue({
      title: initialTitle,
      subtitle: undefined,
    });
  }, [open, initialTitle, form]);

  return (
    <AppModal
      title='Save schedule to library'
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText='Save'
      okButtonProps={{ loading }}
    >
      <Form
        size='large'
        form={form}
        layout='vertical'
        onFinish={onSubmit}
      >
        <Form.Item
          label='Title'
          name='title'
          rules={[
            { required: true, message: 'Please enter title' },
            { max: 255, message: 'Maximum 255 characters' },
          ]}
        >
          <Input placeholder='Lunch Rush Copy' />
        </Form.Item>

        <Form.Item
          label='Subtitle'
          name='subtitle'
          rules={[{ max: 255, message: 'Maximum 255 characters' }]}
        >
          <Input placeholder='Optional note for your team' />
        </Form.Item>
      </Form>
    </AppModal>
  );
};
