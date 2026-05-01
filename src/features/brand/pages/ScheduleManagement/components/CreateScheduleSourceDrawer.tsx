import { useEffect } from 'react';
import { Alert, Button, Drawer, Flex, Form, Input, Radio } from 'antd';

import { DRAWER_WIDTHS } from '@/config';
import type { CreateBrandScheduleSourceRequest } from '@/features/brand/types';
import type { ScheduleSourceType } from '@/shared/modules/schedules/types';

type CreateScheduleSourceDrawerProps = {
  open: boolean;
  loading?: boolean;
  initialType: ScheduleSourceType;
  onClose: () => void;
  onSubmit: (values: CreateBrandScheduleSourceRequest) => void;
};

type ScheduleSourceFormValues = {
  title: string;
  subtitle?: string;
  description?: string;
  sourceType: ScheduleSourceType;
};

export const CreateScheduleSourceDrawer = ({
  open,
  loading,
  initialType,
  onClose,
  onSubmit,
}: CreateScheduleSourceDrawerProps) => {
  const [form] = Form.useForm<ScheduleSourceFormValues>();
  const sourceType = Form.useWatch('sourceType', form) || initialType;

  useEffect(() => {
    if (!open) {
      return;
    }

    form.resetFields();
    form.setFieldsValue({
      title: '',
      subtitle: undefined,
      description: undefined,
      sourceType: initialType,
    });
  }, [form, initialType, open]);

  return (
    <Drawer
      closeIcon={null}
      title='Create Schedule Source'
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
            Create Source
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
            isTemplate: values.sourceType === 'template',
          });
        }}
        styles={{
          label: {
            height: 22,
          },
        }}
      >
        <Form.Item
          label='Source Type'
          name='sourceType'
          rules={[{ required: true, message: 'Please choose source type' }]}
        >
          <Radio.Group
            optionType='button'
            buttonStyle='solid'
          >
            <Radio.Button value='template'>Template</Radio.Button>
            <Radio.Button value='library'>Library</Radio.Button>
          </Radio.Group>
        </Form.Item>

        {sourceType === 'template' ? (
          <Alert
            type='info'
            showIcon
            style={{ marginBottom: 16 }}
            message='Templates are the canonical brand schedules used by StrictSync stores.'
          />
        ) : (
          <Alert
            type='warning'
            showIcon
            style={{ marginBottom: 16 }}
            message='Library entries are reusable copies for manual rollout and experimentation.'
          />
        )}

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
            placeholder='Explain when this schedule should be applied.'
            rows={5}
            showCount
            maxLength={1000}
          />
        </Form.Item>
      </Form>
    </Drawer>
  );
};
