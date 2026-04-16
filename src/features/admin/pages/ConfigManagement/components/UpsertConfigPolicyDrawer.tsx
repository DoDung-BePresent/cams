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
  CONFIG_TIER_OPTIONS,
  CONFIG_VALUE_TYPE_OPTIONS,
} from '@/features/admin/constants';
import { useUpsertConfigPolicy } from '@/features/admin/hooks';
import type {
  ConfigPolicyRowItem,
  ConfigValueTypeEnum,
  UpsertPolicyRequest,
} from '@/features/admin/types';
import { configValidation } from '@/features/admin/validations';
import { DRAWER_WIDTHS } from '@/config';

type UpsertConfigPolicyDrawerProps = {
  open: boolean;
  selectedPolicy: ConfigPolicyRowItem | null;
  onClose: () => void;
  onSuccess: () => void;
};

type ConfigPolicyFormValues = {
  key: string;
  domain: number;
  tier: number;
  defaultValueType?: number;
  defaultValue?: string | number | dayjs.Dayjs;
};

const parseDefaultValueForForm = (
  valueType?: ConfigValueTypeEnum | null,
  value?: string | null,
): ConfigPolicyFormValues['defaultValue'] => {
  if (value === null || value === undefined || value === '') {
    return undefined;
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

const buildDefaultValuePayload = (
  valueType?: ConfigValueTypeEnum,
  value?: ConfigPolicyFormValues['defaultValue'],
): string | undefined => {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }

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

export const UpsertConfigPolicyDrawer = ({
  open,
  selectedPolicy,
  onClose,
  onSuccess,
}: UpsertConfigPolicyDrawerProps) => {
  const [form] = Form.useForm<ConfigPolicyFormValues>();
  const upsertPolicy = useUpsertConfigPolicy();
  const defaultValueType = Form.useWatch('defaultValueType', form);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (!selectedPolicy) {
      form.resetFields();
      form.setFieldsValue({
        tier: 0,
      });
      return;
    }

    form.setFieldsValue({
      key: selectedPolicy.key,
      domain: selectedPolicy.domain,
      tier: selectedPolicy.tier,
      defaultValueType: selectedPolicy.defaultValueType,
      defaultValue: parseDefaultValueForForm(
        selectedPolicy.defaultValueType,
        selectedPolicy.defaultValue,
      ),
    });
  }, [open, selectedPolicy, form]);

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  const handleSubmit = (values: ConfigPolicyFormValues) => {
    const hasDefaultValue =
      values.defaultValue !== undefined && values.defaultValue !== '';

    if (hasDefaultValue && values.defaultValueType === undefined) {
      message.error(
        'Please select default value type when default value is provided.',
      );
      return;
    }

    const request: UpsertPolicyRequest = {
      key: values.key,
      domain: values.domain,
      tier: values.tier,
      defaultValueType: values.defaultValueType,
      defaultValue: buildDefaultValuePayload(
        values.defaultValueType,
        values.defaultValue,
      ),
    };

    upsertPolicy.mutate(request, {
      onSuccess: () => {
        handleCancel();
        onSuccess();
      },
    });
  };

  const renderDefaultValueInput = () => {
    switch (defaultValueType) {
      case 2:
        return (
          <InputNumber
            style={{ width: '100%' }}
            placeholder='Enter default number'
          />
        );
      case 3:
        return (
          <Select
            placeholder='Select default boolean value'
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
        return <Input placeholder='Enter default value' />;
    }
  };

  return (
    <Drawer
      closeIcon={null}
      title={selectedPolicy ? 'Edit Config Policy' : 'Create Config Policy'}
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
            loading={upsertPolicy.isPending}
            onClick={() => form.submit()}
          >
            Save Policy
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
            disabled={!!selectedPolicy}
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
            disabled={!!selectedPolicy}
          />
        </Form.Item>

        <Form.Item
          label='Policy Tier'
          name='tier'
          rules={configValidation.tier}
        >
          <Select
            placeholder='Select policy tier'
            options={CONFIG_TIER_OPTIONS}
          />
        </Form.Item>

        <Form.Item
          label='Default Value Type'
          name='defaultValueType'
        >
          <Select
            placeholder='Select default value type'
            options={CONFIG_VALUE_TYPE_OPTIONS}
            allowClear
          />
        </Form.Item>

        <Form.Item
          label='Default Value'
          name='defaultValue'
          rules={configValidation.defaultValue}
        >
          {renderDefaultValueInput()}
        </Form.Item>
      </Form>
    </Drawer>
  );
};
