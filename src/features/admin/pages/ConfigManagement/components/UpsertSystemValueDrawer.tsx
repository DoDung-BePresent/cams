import { useEffect } from 'react';
import dayjs from 'dayjs';
import {
  Button,
  DatePicker,
  Drawer,
  Flex,
  Form,
  Input,
  InputNumber,
  Select,
  message,
} from 'antd';

import {
  CONFIG_BOOL_VALUE_OPTIONS,
  CONFIG_DOMAIN_OPTIONS,
  CONFIG_VALUE_TYPE_OPTIONS,
} from '@/features/admin/constants';
import { useUpsertSystemValue } from '@/features/admin/hooks';
import type {
  ConfigFlatRowItem,
  ConfigValueTypeEnum,
  UpsertSystemValueRequest,
} from '@/features/admin/types';
import { configValidation } from '@/features/admin/validations';
import { DRAWER_WIDTHS } from '@/config';

type UpsertSystemValueDrawerProps = {
  open: boolean;
  selectedConfig: ConfigFlatRowItem | null;
  onClose: () => void;
  onSuccess: () => void;
};

type SystemValueFormValues = {
  key: string;
  domain: number;
  valueType: number;
  value: string | number | dayjs.Dayjs;
};

const parseValueForForm = (
  valueType?: ConfigValueTypeEnum | null,
  value?: string | null,
): SystemValueFormValues['value'] => {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  switch (valueType) {
    case 2:
      return Number(value);
    case 3:
      return String(value).toLowerCase() === 'true' ? 'true' : 'false';
    case 4:
      return dayjs(value);
    default:
      return value;
  }
};

const buildValuePayload = (
  valueType: ConfigValueTypeEnum,
  value: SystemValueFormValues['value'],
): string => {
  switch (valueType) {
    case 2:
      return String(value);
    case 3:
      return String(value).toLowerCase() === 'true' ? 'true' : 'false';
    case 4:
      return dayjs.isDayjs(value)
        ? value.toISOString()
        : dayjs(value).toISOString();
    default:
      return String(value);
  }
};

export const UpsertSystemValueDrawer = ({
  open,
  selectedConfig,
  onClose,
  onSuccess,
}: UpsertSystemValueDrawerProps) => {
  const [form] = Form.useForm<SystemValueFormValues>();
  const upsertSystemValue = useUpsertSystemValue();
  const valueType = Form.useWatch('valueType', form);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (!selectedConfig) {
      form.resetFields();
      return;
    }

    form.setFieldsValue({
      key: selectedConfig.key,
      domain: selectedConfig.domain,
      valueType:
        selectedConfig.valueType ??
        selectedConfig.policyDefaultValueType ??
        undefined,
      value: parseValueForForm(selectedConfig.valueType, selectedConfig.value),
    });
  }, [open, selectedConfig, form]);

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  const handleSubmit = (values: SystemValueFormValues) => {
    if (values.valueType === undefined || values.valueType === null) {
      message.error('Please select value type.');
      return;
    }

    if (
      values.value === undefined ||
      values.value === null ||
      values.value === ''
    ) {
      message.error('Please input value.');
      return;
    }

    const request: UpsertSystemValueRequest = {
      key: values.key,
      domain: values.domain,
      valueType: values.valueType,
      value: buildValuePayload(values.valueType, values.value),
    };

    upsertSystemValue.mutate(request, {
      onSuccess: () => {
        handleCancel();
        onSuccess();
      },
    });
  };

  const renderValueInput = () => {
    switch (valueType) {
      case 2:
        return (
          <InputNumber
            style={{ width: '100%' }}
            placeholder='Enter system number value'
          />
        );
      case 3:
        return (
          <Select
            placeholder='Select system boolean value'
            options={CONFIG_BOOL_VALUE_OPTIONS}
            allowClear
          />
        );
      case 4:
        return (
          <DatePicker
            showTime
            format='YYYY-MM-DD HH:mm:ss'
            style={{ width: '100%' }}
          />
        );
      default:
        return <Input placeholder='Enter system value' />;
    }
  };

  return (
    <Drawer
      closeIcon={null}
      title={
        selectedConfig
          ? 'Edit System Config Value'
          : 'Create System Config Value'
      }
      open={open}
      onClose={handleCancel}
      width={DRAWER_WIDTHS.medium}
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
            loading={upsertSystemValue.isPending}
            onClick={() => form.submit()}
          >
            Save Value
          </Button>
        </Flex>
      }
    >
      <Form
        size='large'
        form={form}
        layout='vertical'
        onFinish={handleSubmit}
        styles={{
          label: {
            height: 22,
          },
        }}
      >
        <Form.Item
          label='Config Key'
          name='key'
          rules={configValidation.key}
        >
          <Input
            placeholder='e.g., cams.aiQueueTrackLimit'
            disabled={!!selectedConfig}
          />
        </Form.Item>

        <Form.Item
          label='Domain'
          name='domain'
          rules={configValidation.domain}
        >
          <Select
            placeholder='Select config domain'
            options={CONFIG_DOMAIN_OPTIONS}
            disabled={!!selectedConfig}
          />
        </Form.Item>

        <Form.Item
          label='Value Type'
          name='valueType'
          rules={[{ required: true, message: 'Please select value type!' }]}
        >
          <Select
            placeholder='Select value type'
            options={CONFIG_VALUE_TYPE_OPTIONS}
          />
        </Form.Item>

        <Form.Item
          label='Value'
          name='value'
          rules={[{ required: true, message: 'Please input value!' }]}
        >
          {renderValueInput()}
        </Form.Item>
      </Form>
    </Drawer>
  );
};
