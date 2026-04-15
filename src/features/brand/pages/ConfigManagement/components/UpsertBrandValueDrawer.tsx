import { useState } from 'react';
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
  Space,
  Typography,
  message,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';

import {
  BRAND_OVERRIDE_INTENT_OPTIONS,
  CONFIG_BOOL_VALUE_OPTIONS,
  CONFIG_DOMAIN_OPTIONS,
  CONFIG_VALUE_TYPE_OPTIONS,
} from '@/features/brand/constants/configConstants';
import { useUpsertBrandValue } from '@/features/brand/hooks';
import type {
  BrandOverrideIntentEnum,
  ConfigFlatRowItem,
  ConfigValueTypeEnum,
  UpsertBrandValueRequest,
} from '@/features/brand/types';
import { DRAWER_WIDTHS } from '@/config';
import { SelectAffectedStoresModal } from './SelectAffectedStoresModal';

const { Text } = Typography;

type UpsertBrandValueDrawerProps = {
  open: boolean;
  selectedConfig: ConfigFlatRowItem | null;
  onClose: () => void;
  onSuccess: () => void;
};

type BrandValueFormValues = {
  key: string;
  domain: number;
  valueType: number;
  value: string | number | dayjs.Dayjs;
  overrideIntent?: BrandOverrideIntentEnum;
  overrideReason?: string;
  targetStoreIds?: string[];
};

const parseValueForForm = (
  valueType?: ConfigValueTypeEnum | null,
  value?: string | null,
): BrandValueFormValues['value'] => {
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
  value: BrandValueFormValues['value'],
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

export const UpsertBrandValueDrawer = ({
  open,
  selectedConfig,
  onClose,
  onSuccess,
}: UpsertBrandValueDrawerProps) => {
  const [form] = Form.useForm<BrandValueFormValues>();
  const upsertBrandValue = useUpsertBrandValue();
  const valueType = Form.useWatch('valueType', form);
  const overrideIntent = Form.useWatch('overrideIntent', form);
  const [storeSelectorOpen, setStoreSelectorOpen] = useState(false);
  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  const handleSubmit = (values: BrandValueFormValues) => {
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

    const request: UpsertBrandValueRequest = {
      key: values.key,
      domain: values.domain,
      valueType: values.valueType,
      value: buildValuePayload(values.valueType, values.value),
      overrideIntent: values.overrideIntent,
      overrideReason: values.overrideReason,
      targetStoreIds:
        selectedStoreIds.length > 0 ? selectedStoreIds : undefined,
    };

    upsertBrandValue.mutate(request, {
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
            placeholder='Enter brand number value'
          />
        );
      case 3:
        return (
          <Select
            placeholder='Select brand boolean value'
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
        return <Input placeholder='Enter brand value' />;
    }
  };

  return (
    <Drawer
      closeIcon={null}
      title={
        selectedConfig ? 'Edit Brand Config Value' : 'Create Brand Config Value'
      }
      open={open}
      onClose={handleCancel}
      width={DRAWER_WIDTHS.medium}
      afterOpenChange={(isOpen) => {
        if (!isOpen) {
          return;
        }

        if (!selectedConfig) {
          form.resetFields();
          setSelectedStoreIds([]);
          return;
        }

        form.setFieldsValue({
          key: selectedConfig.key,
          domain: selectedConfig.domain,
          valueType:
            selectedConfig.valueType ??
            selectedConfig.policyDefaultValueType ??
            undefined,
          value: parseValueForForm(
            selectedConfig.valueType,
            selectedConfig.value,
          ),
          overrideIntent: 0,
          overrideReason: undefined,
          targetStoreIds: undefined,
        });
        setSelectedStoreIds([]);
      }}
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
            loading={upsertBrandValue.isPending}
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
        onValuesChange={(changedValues: Partial<BrandValueFormValues>) => {
          if (changedValues.overrideIntent === 0) {
            setSelectedStoreIds([]);
            setStoreSelectorOpen(false);
          }
        }}
        styles={{
          label: {
            height: 22,
          },
        }}
      >
        <Form.Item
          label='Config Key'
          name='key'
          rules={[
            { required: true, message: 'Please input config key!' },
            { max: 150, message: 'Maximum 150 characters!' },
          ]}
        >
          <Input
            placeholder='e.g., cams.aiQueueTrackLimit'
            disabled={!!selectedConfig}
          />
        </Form.Item>

        <Form.Item
          label='Domain'
          name='domain'
          rules={[{ required: true, message: 'Please select domain!' }]}
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

        <Form.Item
          label='Override Intent'
          name='overrideIntent'
          initialValue={0}
        >
          <Select
            placeholder='Select override intent'
            options={BRAND_OVERRIDE_INTENT_OPTIONS}
          />
        </Form.Item>

        <Form.Item
          label='Override Reason'
          name='overrideReason'
        >
          <Input
            placeholder='Optional reason for this override action'
            allowClear
            maxLength={500}
          />
        </Form.Item>

        {overrideIntent !== undefined && overrideIntent !== 0 && (
          <Space
            direction='vertical'
            size='middle'
            style={{ width: '100%' }}
          >
            <Form.Item
              label='Store Impact Selector'
              extra='Leave empty to apply intent to all child stores.'
            >
              <Space
                direction='vertical'
                style={{ width: '100%' }}
              >
                <Button
                  size='large'
                  icon={<PlusOutlined />}
                  onClick={() => setStoreSelectorOpen(true)}
                >
                  Select Affected Stores
                </Button>
                <Text type='secondary'>
                  Selected stores: {selectedStoreIds.length}
                </Text>
              </Space>
            </Form.Item>
          </Space>
        )}
      </Form>

      <SelectAffectedStoresModal
        open={storeSelectorOpen}
        selectedStoreIds={selectedStoreIds}
        onClose={() => setStoreSelectorOpen(false)}
        onApply={(storeIds) => {
          setSelectedStoreIds(storeIds);
          setStoreSelectorOpen(false);
        }}
      />
    </Drawer>
  );
};
