import { useEffect } from 'react';
import { Modal, Form, Input, message } from 'antd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SaveToLibraryRequest } from '../types/schedule.types';
import { api } from '@/config';

interface SaveToLibraryModalProps {
  open: boolean;
  onClose: () => void;
  spaceId: string;
}

/**
 * Modal to save current space schedule to brand library
 *
 * API: POST /api/cms/schedule/spaces/{spaceId}/save-to-library
 *
 * Requirements:
 * - Caller must be BrandManager or SystemAdmin
 * - Space must have existing schedule with slots
 */
export const SaveToLibraryModal = ({
  open,
  onClose,
  spaceId,
}: SaveToLibraryModalProps) => {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open) {
      form.resetFields();
    }
  }, [open, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: SaveToLibraryRequest) => {
      const response = await api.post(
        `/cms/schedule/spaces/${spaceId}/save-to-library`,
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      message.success('Schedule saved to library successfully');
      queryClient.invalidateQueries({
        queryKey: ['schedule', 'bootstrap', spaceId],
      });
      handleClose();
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      message.error(
        error.response?.data?.message || 'Failed to save schedule to library',
      );
    },
  });

  const handleSubmit = (values: SaveToLibraryRequest) => {
    saveMutation.mutate(values);
  };

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title='Save to Library'
      open={open}
      onCancel={handleClose}
      onOk={() => form.submit()}
      okText='Save'
      cancelText='Cancel'
      confirmLoading={saveMutation.isPending}
      width={480}
    >
      <Form
        form={form}
        layout='vertical'
        onFinish={handleSubmit}
        size='large'
      >
        <Form.Item
          name='title'
          label='Template Name'
          rules={[
            { required: true, message: 'Please enter template name' },
            { max: 200, message: 'Name must be at most 200 characters' },
          ]}
        >
          <Input placeholder='e.g., Weekday Morning Schedule' />
        </Form.Item>

        <Form.Item
          name='subtitle'
          label='Subtitle'
          rules={[
            { max: 300, message: 'Subtitle must be at most 300 characters' },
          ]}
        >
          <Input placeholder='e.g., High energy playlists for morning rush' />
        </Form.Item>
      </Form>
    </Modal>
  );
};
