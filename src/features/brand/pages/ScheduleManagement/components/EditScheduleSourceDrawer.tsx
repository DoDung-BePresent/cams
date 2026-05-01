import { useEffect } from 'react';
import { Button, Drawer, Flex, Form, Input } from 'antd';

import { DRAWER_WIDTHS } from '@/config';
import type { UpdateBrandScheduleSourceRequest } from '@/features/brand/types';
import type { ScheduleSourceItem } from '@/shared/modules/schedules/types';

type EditScheduleSourceDrawerProps = {
  open: boolean;
  loading?: boolean;
  source?: ScheduleSourceItem;
  onClose: () => void;
  onSubmit: (values: UpdateBrandScheduleSourceRequest) => void;
};

type ScheduleSourceFormValues = {
  title: string;
  subtitle?: string;
  description?: string;
};

export const EditScheduleSourceDrawer = ({
  open,
  loading,
  source,
  onClose,
  onSubmit,
}: EditScheduleSourceDrawerProps) => {
  const [form] = Form.useForm<ScheduleSourceFormValues>();

  useEffect(() => {
    if (!open || !source) {
      return;
    }

    form.setFieldsValue({
      title: source.title,
      subtitle: source.subtitle || undefined,
      description: source.description || undefined,
    });
  }, [form, open, source]);

  return (
    <Drawer
      closeIcon={null}
      title='Edit Schedule Source'
      open={open}
      width={DRAWER_WIDTHS.medium}
      onClose={onClose}
      footer={
        <Flex
          justify='end'
          gap='small'
        >
          <Button
            size='large'
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            size='large'
            type='primary'
            loading={loading}
            onClick={() => form.submit()}
          >
            Save Changes
          </Button>
        </Flex>
      }
    >
      <Form
        size='large'
        form={form}
        layout='vertical'
        onFinish={(values) => {
          onSubmit({
            title: values.title.trim(),
            subtitle: values.subtitle?.trim() || undefined,
            description: values.description?.trim() || undefined,
          });
        }}
        styles={{
          label: {
            height: 22,
          },
        }}
      >
        <Form.Item
          label='Title'
          name='title'
          rules={[
            { required: true, message: 'Please enter source title' },
            { max: 255, message: 'Maximum 255 characters' },
          ]}
        >
          <Input placeholder='Morning Retail Template' />
        </Form.Item>

        <Form.Item
          label='Subtitle'
          name='subtitle'
          rules={[{ max: 255, message: 'Maximum 255 characters' }]}
        >
          <Input placeholder='Optional note for your scheduling team' />
        </Form.Item>

        <Form.Item
          label='Description'
          name='description'
          rules={[{ max: 1000, message: 'Maximum 1000 characters' }]}
        >
          <Input.TextArea
            placeholder='Describe when and why this schedule should be used.'
            rows={4}
            showCount
            maxLength={1000}
          />
        </Form.Item>
      </Form>
    </Drawer>
  );
};
