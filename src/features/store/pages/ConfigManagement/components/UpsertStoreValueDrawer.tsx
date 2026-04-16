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
  CONFIG_BOOL_VALUE_OPTIONS,
  CONFIG_DOMAIN_OPTIONS,
  CONFIG_VALUE_TYPE_OPTIONS,
  STORE_OVERRIDE_INTENT_OPTIONS,
} from '@/features/store/constants/configConstants';
import { useUpsertStoreValue } from '@/features/store/hooks';
import type {
  ConfigFlatRowItem,
  StoreOverrideIntentEnum,
  UpsertStoreValueRequest,
} from '@/features/store/types';
import { ConfigValueTypeEnum } from '@/features/store/types';
import { DRAWER_WIDTHS } from '@/config';
import { SelectAffectedSpacesModal } from './SelectAffectedSpacesModal';

const { Text } = Typography;

type UpsertStoreValueDrawerProps = {
  open: boolean;
  selectedConfig: ConfigFlatRowItem | null;
  onClose: () => void;
  onSuccess: () => void;
};

type StoreValueFormValues = {
  key: string;
  domain: number;
  valueType: number;
  value: string | number | dayjs.Dayjs;
  overrideIntent?: StoreOverrideIntentEnum;
  overrideReason?: string;
  targetSpaceIds?: string[];
};

const parseValueForForm = (
  valueType?: ConfigValueTypeEnum | null,
  value?: string | null,
): StoreValueFormValues['value'] => {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  switch (valueType) {
    case ConfigValueTypeEnum.Number:
      return Number(value);
    case ConfigValueTypeEnum.Boolean:
      return String(value).toLowerCase() === 'true' ? 'true' : 'false';
    case ConfigValueTypeEnum.DateTime:
      return dayjs(value);
    default:
      return value;
  }
};

const buildValuePayload = (
  valueType: ConfigValueTypeEnum,
  value: StoreValueFormValues['value'],
): string => {
  switch (valueType) {
    case ConfigValueTypeEnum.Number:
      return String(value);
    case ConfigValueTypeEnum.Boolean:
      return String(value).toLowerCase() === 'true' ? 'true' : 'false';
    case ConfigValueTypeEnum.DateTime:
      return dayjs.isDayjs(value)
        ? value.toISOString()
        : dayjs(value).toISOString();
    default:
      return String(value);
  }
};

export const UpsertStoreValueDrawer = ({
  open,
  selectedConfig,
  onClose,
  onSuccess,
}: UpsertStoreValueDrawerProps) => {
  const [form] = Form.useForm<StoreValueFormValues>();
  const upsertStoreValue = useUpsertStoreValue();
  const valueType = Form.useWatch('valueType', form);
  const overrideIntent = Form.useWatch('overrideIntent', form);
  const [spaceSelectorOpen, setSpaceSelectorOpen] = useState(false);
  const [selectedSpaceIds, setSelectedSpaceIds] = useState<string[]>([]);

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  const handleSubmit = (values: StoreValueFormValues) => {
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

    const request: UpsertStoreValueRequest = {
      key: values.key,
      domain: values.domain,
      valueType: values.valueType,
      value: buildValuePayload(values.valueType, values.value),
      overrideIntent: values.overrideIntent,
      overrideReason: values.overrideReason,
      targetSpaceIds:
        selectedSpaceIds.length > 0 ? selectedSpaceIds : undefined,
    };

    upsertStoreValue.mutate(request, {
      onSuccess: () => {
        handleCancel();
        onSuccess();
      },
    });
  };

  const renderValueInput = () => {
    switch (valueType) {
      case ConfigValueTypeEnum.Number:
        return (
          <InputNumber
            style={{ width: '100%' }}
            placeholder='Enter store number value'
          />
        );
      case ConfigValueTypeEnum.Boolean:
        return (
          <Select
            placeholder='Select store boolean value'
            options={CONFIG_BOOL_VALUE_OPTIONS}
            allowClear
          />
        );
      case ConfigValueTypeEnum.DateTime:
        return (
          <DatePicker
            showTime
            format='YYYY-MM-DD HH:mm:ss'
            style={{ width: '100%' }}
          />
        );
      default:
        return <Input placeholder='Enter store value' />;
    }
  };

  return (
    <Drawer
      closeIcon={null}
      title={
        selectedConfig ? 'Edit Store Config Value' : 'Create Store Config Value'
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
          setSelectedSpaceIds([]);
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
          targetSpaceIds: undefined,
        });
        setSelectedSpaceIds([]);
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
            loading={upsertStoreValue.isPending}
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
        onValuesChange={(changedValues: Partial<StoreValueFormValues>) => {
          if (changedValues.overrideIntent === 0) {
            setSelectedSpaceIds([]);
            setSpaceSelectorOpen(false);
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
            placeholder='e.g., cams.playbackFallbackMode'
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
            options={STORE_OVERRIDE_INTENT_OPTIONS}
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
              label='Space Impact Selector'
              extra='Leave empty to apply intent to all child spaces.'
            >
              <Space
                direction='vertical'
                style={{ width: '100%' }}
              >
                <Button
                  size='large'
                  icon={<PlusOutlined />}
                  onClick={() => setSpaceSelectorOpen(true)}
                >
                  Select Affected Spaces
                </Button>
                <Text type='secondary'>
                  Selected spaces: {selectedSpaceIds.length}
                </Text>
              </Space>
            </Form.Item>
          </Space>
        )}
      </Form>

      <SelectAffectedSpacesModal
        open={spaceSelectorOpen}
        selectedSpaceIds={selectedSpaceIds}
        onClose={() => setSpaceSelectorOpen(false)}
        onApply={(spaceIds) => {
          setSelectedSpaceIds(spaceIds);
          setSpaceSelectorOpen(false);
        }}
      />
    </Drawer>
  );
};
