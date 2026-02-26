import { useState } from 'react';
import { Button, Drawer, Form, Input, Select, Upload, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd';
import type { BrandRequest } from '@/features/admin/types/brandTypes';
import {
  INDUSTRY_OPTIONS,
  TIMEZONE_OPTIONS,
} from '@/features/admin/constants/brandConstants';
import { brandValidation } from '@/features/admin/validations/brandValidation';

const { TextArea } = Input;

type AddBrandDrawerProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: (formData: FormData) => void;
};

export const AddBrandDrawer = ({
  open,
  onClose,
  onSuccess,
}: AddBrandDrawerProps) => {
  const [form] = Form.useForm<BrandRequest>();
  const [loading, setLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<UploadFile | null>(null);

  const handleSubmit = async (values: BrandRequest) => {
    try {
      setLoading(true);

      // Build FormData for multipart/form-data
      const formData = new FormData();

      // Required fields
      if (values.name) formData.append('name', values.name);

      // Optional fields
      if (logoFile?.originFileObj) {
        formData.append('logo', logoFile.originFileObj);
      }
      if (values.description)
        formData.append('description', values.description);
      if (values.website) formData.append('website', values.website);
      if (values.industry) formData.append('industry', values.industry);
      if (values.contactEmail)
        formData.append('contactEmail', values.contactEmail);
      if (values.contactPhone)
        formData.append('contactPhone', values.contactPhone);
      if (values.primaryContactName)
        formData.append('primaryContactName', values.primaryContactName);
      if (values.technicalContactEmail)
        formData.append('technicalContactEmail', values.technicalContactEmail);
      if (values.legalName) formData.append('legalName', values.legalName);
      if (values.taxCode) formData.append('taxCode', values.taxCode);
      if (values.billingAddress)
        formData.append('billingAddress', values.billingAddress);
      if (values.defaultTimeZone)
        formData.append('defaultTimeZone', values.defaultTimeZone);

      // TODO: Call API to create brand
      console.log('Create brand:', Object.fromEntries(formData));

      await new Promise((resolve) => setTimeout(resolve, 1000));

      message.success('Brand created successfully!');
      onSuccess(formData);
      form.resetFields();
      setLogoFile(null);
      onClose();
    } catch (error) {
      message.error('Failed to create brand!');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setLogoFile(null);
    onClose();
  };

  return (
    <Drawer
      closeIcon={null}
      title='Add New Brand'
      placement='right'
      width={620}
      open={open}
      onClose={handleCancel}
      footer={
        <div className='flex justify-end gap-2'>
          <Button
            size='large'
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button
            size='large'
            type='primary'
            onClick={() => form.submit()}
            loading={loading}
          >
            Create Brand
          </Button>
        </div>
      }
    >
      <Form
        size='large'
        form={form}
        layout='vertical'
        onFinish={handleSubmit}
        initialValues={{
          defaultTimeZone: 'SE Asia Standard Time',
        }}
        styles={{
          label: {
            height: 22,
          },
        }}
      >
        {/* Basic Information */}
        <Form.Item
          label='Brand Name'
          name='name'
          rules={brandValidation.name}
        >
          <Input placeholder='e.g., Moonlight Coffee' />
        </Form.Item>

        <Form.Item
          label='Logo'
          name='logo'
          rules={brandValidation.logo}
          valuePropName='file'
        >
          <Upload
            maxCount={1}
            beforeUpload={(file) => {
              setLogoFile({
                uid: file.uid,
                name: file.name,
                originFileObj: file,
              } as UploadFile);
              return false; // Prevent auto upload
            }}
            onRemove={() => setLogoFile(null)}
            accept='image/*'
          >
            <Button icon={<UploadOutlined />}>Upload Logo (Max 5MB)</Button>
          </Upload>
        </Form.Item>

        <Form.Item
          label='Industry'
          name='industry'
          rules={brandValidation.industry}
        >
          <Select
            placeholder='Select industry'
            options={INDUSTRY_OPTIONS}
          />
        </Form.Item>

        <Form.Item
          label='Description'
          name='description'
          rules={brandValidation.description}
        >
          <TextArea
            rows={3}
            placeholder='Brief description of the brand'
            maxLength={2000}
            showCount
          />
        </Form.Item>

        <Form.Item
          label='Website'
          name='website'
          rules={brandValidation.website}
        >
          <Input placeholder='https://example.com' />
        </Form.Item>

        {/* Contact Information */}
        <Form.Item
          label='Primary Contact Name'
          name='primaryContactName'
          rules={brandValidation.primaryContactName}
        >
          <Input placeholder='e.g., John Doe' />
        </Form.Item>

        <Form.Item
          label='Contact Email'
          name='contactEmail'
          rules={brandValidation.contactEmail}
        >
          <Input placeholder='contact@example.com' />
        </Form.Item>

        <Form.Item
          label='Contact Phone'
          name='contactPhone'
          rules={brandValidation.contactPhone}
        >
          <Input placeholder='+84901234567 or 0901234567' />
        </Form.Item>

        <Form.Item
          label='Technical Contact Email'
          name='technicalContactEmail'
          rules={brandValidation.technicalContactEmail}
        >
          <Input placeholder='tech@example.com' />
        </Form.Item>

        {/* Legal & Billing */}
        <Form.Item
          label='Legal Name'
          name='legalName'
          rules={brandValidation.legalName}
        >
          <Input placeholder='Official company name for invoicing' />
        </Form.Item>

        <Form.Item
          label='Tax Code'
          name='taxCode'
          rules={brandValidation.taxCode}
        >
          <Input placeholder='e.g., 0123456789' />
        </Form.Item>

        <Form.Item
          label='Billing Address'
          name='billingAddress'
          rules={brandValidation.billingAddress}
        >
          <TextArea
            rows={2}
            placeholder='Full billing address'
            maxLength={500}
            showCount
          />
        </Form.Item>

        {/* Configuration */}
        <Form.Item
          label='Default Timezone'
          name='defaultTimeZone'
          rules={brandValidation.defaultTimeZone}
        >
          <Select
            placeholder='Select timezone'
            options={TIMEZONE_OPTIONS}
          />
        </Form.Item>
      </Form>
    </Drawer>
  );
};
