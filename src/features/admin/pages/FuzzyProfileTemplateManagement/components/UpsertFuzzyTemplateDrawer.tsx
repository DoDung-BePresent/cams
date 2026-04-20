import { useEffect } from 'react';
import {
  Button,
  Drawer,
  Form,
  Input,
  InputNumber,
  Space,
  Switch,
  Typography,
} from 'antd';

import type { FuzzyProfileTemplateDetail } from '@/features/admin/types';
import { DRAWER_WIDTHS } from '@/config';

const { Title } = Typography;

type UpsertFuzzyTemplateDrawerProps = {
  open: boolean;
  mode: 'create' | 'edit';
  selectedTemplate: FuzzyProfileTemplateDetail | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: (values: Record<string, unknown>) => Promise<void>;
};

const DEFAULT_CREATE_VALUES: Partial<FuzzyProfileTemplateDetail> = {
  templateKey: '',
  displayName: '',
  profileDescription: '',
  chillMoodDescription: '',
  focusMoodDescription: '',
  energeticMoodDescription: '',
  sortOrder: 0,
  chillBpmMin: 60,
  chillBpmMax: 80,
  focusBpmMin: 85,
  focusBpmMax: 105,
  energeticBpmMin: 120,
  energeticBpmMax: 140,
  pressureLowMax: 2,
  pressureCriticalMin: 5,
  noiseQuietMaxDb: 50,
  noiseLoudMinDb: 75,
  spaceCapacity: 30,
  defaultDecibelWhenNull: 60,
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '0 16px',
};

export const UpsertFuzzyTemplateDrawer = ({
  open,
  mode,
  selectedTemplate,
  loading,
  onClose,
  onSubmit,
}: UpsertFuzzyTemplateDrawerProps) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (!open) return;

    if (mode === 'create') {
      form.resetFields();
      form.setFieldsValue(DEFAULT_CREATE_VALUES);
    } else if (mode === 'edit' && selectedTemplate) {
      form.setFieldsValue({
        ...selectedTemplate,
        noiseQuietMaxDb:
          selectedTemplate.noiseQuietMaxDb ??
          selectedTemplate.stressComfortableMax ??
          selectedTemplate.densitySparseMax ??
          undefined,
        noiseLoudMinDb:
          selectedTemplate.noiseLoudMinDb ??
          selectedTemplate.stressHighMin ??
          selectedTemplate.densityCrowdedMin ??
          undefined,
        defaultDecibelWhenNull:
          selectedTemplate.defaultDecibelWhenNull ??
          selectedTemplate.defaultDensityRatioWhenNull ??
          undefined,
        isActive: selectedTemplate.isActive,
      });
    }
  }, [open, mode, selectedTemplate, form]);

  const handleSubmit = async () => {
    const values = await form.validateFields();
    await onSubmit(values);
  };

  return (
    <Drawer
      title={mode === 'create' ? 'Create Template' : 'Edit Template'}
      width={DRAWER_WIDTHS.large}
      open={open}
      onClose={onClose}
      destroyOnClose
      extra={
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type='primary'
            loading={loading}
            onClick={handleSubmit}
          >
            Save
          </Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout='vertical'
        disabled={loading}
      >
        <Form.Item
          name='templateKey'
          label='Template Key'
          rules={[
            { required: true, message: 'Required' },
            { max: 64, message: 'Max 64 characters' },
          ]}
          extra='Stable identifier stored on brands (e.g. LuxuryRestaurant). Changing the key does not update existing brands.'
        >
          <Input placeholder='Unique key' />
        </Form.Item>

        <Form.Item
          name='displayName'
          label='Display Name'
          rules={[{ required: true, message: 'Required' }]}
        >
          <Input placeholder='Shown in dropdowns' />
        </Form.Item>

        <Form.Item
          name='profileDescription'
          label='Profile Description'
          rules={[{ max: 1000, message: 'Max 1000 characters' }]}
          extra='Explain the business intent of this template so non-technical users understand when to use it.'
        >
          <Input.TextArea
            rows={3}
            showCount
            maxLength={1000}
            placeholder='Example: Balanced coffee-shop profile for calm mornings, focused work sessions, and gentle peak-hour acceleration.'
          />
        </Form.Item>

        <Form.Item
          name='sortOrder'
          label='Sort Order'
          rules={[{ required: true, message: 'Required' }]}
        >
          <InputNumber
            className='w-full!'
            min={0}
          />
        </Form.Item>

        {mode === 'edit' && (
          <Form.Item
            name='isActive'
            label='Active'
            valuePropName='checked'
          >
            <Switch />
          </Form.Item>
        )}

        <Title level={5}>Mood Descriptions</Title>

        <div style={gridStyle}>
          <Form.Item
            name='chillMoodDescription'
            label='Chill Mood Description'
            rules={[{ max: 1000, message: 'Max 1000 characters' }]}
          >
            <Input.TextArea
              rows={3}
              showCount
              maxLength={1000}
              placeholder='Describe the sonic character and purpose of chill mode.'
            />
          </Form.Item>

          <Form.Item
            name='focusMoodDescription'
            label='Focus Mood Description'
            rules={[{ max: 1000, message: 'Max 1000 characters' }]}
          >
            <Input.TextArea
              rows={3}
              showCount
              maxLength={1000}
              placeholder='Describe how focus mode should feel in-store.'
            />
          </Form.Item>
        </div>

        <Form.Item
          name='energeticMoodDescription'
          label='Energetic Mood Description'
          rules={[{ max: 1000, message: 'Max 1000 characters' }]}
        >
          <Input.TextArea
            rows={3}
            showCount
            maxLength={1000}
            placeholder='Describe energetic mode for rush/promotions while preserving brand identity.'
          />
        </Form.Item>

        <Title level={5}>BPM Ranges</Title>

        <div style={gridStyle}>
          <Form.Item
            name='chillBpmMin'
            label='Chill BPM Min'
            rules={[{ required: true }]}
          >
            <InputNumber
              className='w-full!'
              min={1}
            />
          </Form.Item>

          <Form.Item
            name='chillBpmMax'
            label='Chill BPM Max'
            rules={[{ required: true }]}
          >
            <InputNumber
              className='w-full!'
              min={1}
            />
          </Form.Item>

          <Form.Item
            name='focusBpmMin'
            label='Focus BPM Min'
            rules={[{ required: true }]}
          >
            <InputNumber
              className='w-full!'
              min={1}
            />
          </Form.Item>

          <Form.Item
            name='focusBpmMax'
            label='Focus BPM Max'
            rules={[{ required: true }]}
          >
            <InputNumber
              className='w-full!'
              min={1}
            />
          </Form.Item>

          <Form.Item
            name='energeticBpmMin'
            label='Energetic BPM Min'
            rules={[{ required: true }]}
          >
            <InputNumber
              className='w-full!'
              min={1}
            />
          </Form.Item>

          <Form.Item
            name='energeticBpmMax'
            label='Energetic BPM Max'
            rules={[{ required: true }]}
          >
            <InputNumber
              className='w-full!'
              min={1}
            />
          </Form.Item>
        </div>

        <Title level={5}>Thresholds & Capacity</Title>

        <div style={gridStyle}>
          <Form.Item
            name='pressureLowMax'
            label='People Count: Low Level Max'
            tooltip='If people count is below this value, CAMS treats crowd pressure as Low.'
            rules={[{ required: true }]}
          >
            <InputNumber
              className='w-full!'
              min={0}
            />
          </Form.Item>

          <Form.Item
            name='pressureCriticalMin'
            label='People Count: Energetic Trigger Min'
            tooltip='If people count is above this value, CAMS treats crowd pressure as Critical and prioritizes Energetic.'
            rules={[{ required: true }]}
          >
            <InputNumber
              className='w-full!'
              min={0}
            />
          </Form.Item>

          <Form.Item
            name='noiseQuietMaxDb'
            label='Noise Threshold: Quiet Max (dB)'
            tooltip='If decibel is below this value, CAMS classifies ambient noise as Quiet.'
            rules={[{ required: true }]}
          >
            <InputNumber
              className='w-full!'
              min={0}
              step={0.01}
            />
          </Form.Item>

          <Form.Item
            name='noiseLoudMinDb'
            label='Noise Threshold: Loud Min (dB)'
            tooltip='If decibel is above this value, CAMS classifies ambient noise as Loud.'
            rules={[{ required: true }]}
          >
            <InputNumber
              className='w-full!'
              min={0}
              step={0.01}
            />
          </Form.Item>

          <Form.Item
            name='spaceCapacity'
            label='Space Capacity (Reference)'
            tooltip='Reference capacity for this template profile.'
            rules={[{ required: true }]}
          >
            <InputNumber
              className='w-full!'
              min={0}
            />
          </Form.Item>

          <Form.Item
            name='defaultDecibelWhenNull'
            label='Fallback Decibel When Missing (dB)'
            tooltip='Used only when telemetry payload does not include decibel.'
            rules={[{ required: true }]}
          >
            <InputNumber
              className='w-full!'
              min={0}
              step={0.01}
            />
          </Form.Item>
        </div>
      </Form>
    </Drawer>
  );
};
