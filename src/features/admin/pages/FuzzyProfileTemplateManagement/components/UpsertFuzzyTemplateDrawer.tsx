import { useEffect, useState } from 'react';
import {
  Button,
  Drawer,
  Flex,
  Form,
  Input,
  InputNumber,
  Segmented,
} from 'antd';

import type { FuzzyProfileTemplateDetail } from '@/features/admin/types';
import { DRAWER_WIDTHS } from '@/config';
import { SettingSwitch } from '@/shared/components';

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
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic');

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

  const handleCancel = () => {
    form.resetFields();
    setActiveTab('basic');
    onClose();
  };

  const handleFinish = async (values: Record<string, unknown>) => {
    await onSubmit(values);
  };

  return (
    <Drawer
      closeIcon={null}
      title={mode === 'create' ? 'Create Template' : 'Edit Template'}
      width={DRAWER_WIDTHS.medium}
      open={open}
      destroyOnClose
      onClose={handleCancel}
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
            loading={loading}
            onClick={() => form.submit()}
          >
            Save Template
          </Button>
        </Flex>
      }
    >
      <Form
        size='large'
        form={form}
        layout='vertical'
        onFinish={handleFinish}
        disabled={loading}
        styles={{
          label: {
            height: 22,
          },
        }}
      >
        <Segmented
          block
          size='large'
          value={activeTab}
          onChange={(value) => setActiveTab(value as 'basic' | 'advanced')}
          options={[
            { label: 'Basic Information', value: 'basic' },
            { label: 'Advanced Settings', value: 'advanced' },
          ]}
          style={{ marginBottom: 24 }}
        />

        <div style={{ display: activeTab === 'basic' ? 'block' : 'none' }}>
          {mode === 'edit' && (
            <Form.Item
              name='isActive'
              valuePropName='checked'
              className='mb-0!'
            >
              <SettingSwitch
                label='Active'
                description='Enable or disable this template'
              />
            </Form.Item>
          )}

          <Form.Item
            name='templateKey'
            label='Template Key'
            rules={[
              { required: true, message: 'Required' },
              { max: 64, message: 'Max 64 characters' },
            ]}
          >
            <Input placeholder='e.g., LuxuryRestaurant' />
          </Form.Item>

          <Form.Item
            name='displayName'
            label='Display Name'
            rules={[{ required: true, message: 'Required' }]}
          >
            <Input placeholder='e.g., Luxury Restaurant' />
          </Form.Item>

          <Form.Item
            name='profileDescription'
            label='Profile Description'
            rules={[{ max: 1000, message: 'Max 1000 characters' }]}
          >
            <Input.TextArea
              rows={3}
              showCount
              maxLength={1000}
              placeholder='Describe the business intent of this template'
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
                placeholder='Describe chill mode'
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
                placeholder='Describe focus mode'
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
              placeholder='Describe energetic mode'
            />
          </Form.Item>
        </div>

        <div style={{ display: activeTab === 'advanced' ? 'block' : 'none' }}>
          <div style={gridStyle}>
            <Form.Item
              name='chillBpmMin'
              label='Chill BPM Min'
              rules={[{ required: true, message: 'Required' }]}
            >
              <InputNumber
                className='w-full!'
                min={1}
              />
            </Form.Item>

            <Form.Item
              name='chillBpmMax'
              label='Chill BPM Max'
              rules={[{ required: true, message: 'Required' }]}
            >
              <InputNumber
                className='w-full!'
                min={1}
              />
            </Form.Item>

            <Form.Item
              name='focusBpmMin'
              label='Focus BPM Min'
              rules={[{ required: true, message: 'Required' }]}
            >
              <InputNumber
                className='w-full!'
                min={1}
              />
            </Form.Item>

            <Form.Item
              name='focusBpmMax'
              label='Focus BPM Max'
              rules={[{ required: true, message: 'Required' }]}
            >
              <InputNumber
                className='w-full!'
                min={1}
              />
            </Form.Item>

            <Form.Item
              name='energeticBpmMin'
              label='Energetic BPM Min'
              rules={[{ required: true, message: 'Required' }]}
            >
              <InputNumber
                className='w-full!'
                min={1}
              />
            </Form.Item>

            <Form.Item
              name='energeticBpmMax'
              label='Energetic BPM Max'
              rules={[{ required: true, message: 'Required' }]}
            >
              <InputNumber
                className='w-full!'
                min={1}
              />
            </Form.Item>

            <Form.Item
              name='pressureLowMax'
              label='People Count: Low Max'
              rules={[{ required: true, message: 'Required' }]}
            >
              <InputNumber
                className='w-full!'
                min={0}
              />
            </Form.Item>

            <Form.Item
              name='pressureCriticalMin'
              label='People Count: Critical Min'
              rules={[{ required: true, message: 'Required' }]}
            >
              <InputNumber
                className='w-full!'
                min={0}
              />
            </Form.Item>

            <Form.Item
              name='noiseQuietMaxDb'
              label='Noise: Quiet Max (dB)'
              rules={[{ required: true, message: 'Required' }]}
            >
              <InputNumber
                className='w-full!'
                min={0}
                step={0.01}
              />
            </Form.Item>

            <Form.Item
              name='noiseLoudMinDb'
              label='Noise: Loud Min (dB)'
              rules={[{ required: true, message: 'Required' }]}
            >
              <InputNumber
                className='w-full!'
                min={0}
                step={0.01}
              />
            </Form.Item>

            <Form.Item
              name='spaceCapacity'
              label='Space Capacity'
              rules={[{ required: true, message: 'Required' }]}
            >
              <InputNumber
                className='w-full!'
                min={0}
              />
            </Form.Item>

            <Form.Item
              name='defaultDecibelWhenNull'
              label='Fallback Decibel (dB)'
              rules={[{ required: true, message: 'Required' }]}
            >
              <InputNumber
                className='w-full!'
                min={0}
                step={0.01}
              />
            </Form.Item>
          </div>
        </div>
      </Form>
    </Drawer>
  );
};
