import { useEffect } from 'react';
import { Form, Select, Spin } from 'antd';
import { useSunoConfig, useUpdateSunoConfig } from '../hooks';
import type { SunoConfigUpdateRequest } from '../types';
import { AiGenerationMode } from '../types';

export const SunoConfigForm = () => {
  const [form] = Form.useForm<SunoConfigUpdateRequest>();
  const { data: config, isLoading } = useSunoConfig();
  const updateConfig = useUpdateSunoConfig();

  // Initialize form with config data
  useEffect(() => {
    if (config) {
      form.setFieldsValue({
        aiGenerationMode: config.aiGenerationMode,
      });
    }
  }, [config, form]);

  const handleSubmit = async (values: SunoConfigUpdateRequest) => {
    await updateConfig.mutateAsync(values);
  };

  const handleModeChange = (value: AiGenerationMode) => {
    form.setFieldsValue({ aiGenerationMode: value });
    form.submit();
  };

  if (isLoading) {
    return <Spin />;
  }

  return (
    <Form
      form={form}
      layout='vertical'
      onFinish={handleSubmit}
      size='large'
      styles={{
        label: {
          height: 22,
        },
      }}
    >
      <Form.Item
        name='aiGenerationMode'
        label='Generation Mode'
        tooltip='Select which AI provider mode this brand will use for generation jobs.'
        initialValue={AiGenerationMode.Suno}
      >
        <Select
          options={[
            { label: 'Suno', value: AiGenerationMode.Suno },
            { label: 'Brand Model URL', value: AiGenerationMode.BrandModel },
          ]}
          onChange={handleModeChange}
          loading={updateConfig.isPending}
        />
      </Form.Item>
    </Form>
  );
};
