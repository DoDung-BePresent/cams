import { useState } from 'react';
import {
  Button,
  Col,
  Collapse,
  Form,
  Input,
  Row,
  Select,
  Typography,
  Alert,
} from 'antd';
import type { UploadFile } from 'antd';

/**
 * Components
 */
import { ImageDragger } from '@/shared/components';

/**
 * Validations
 */
import { registerValidation } from '../validations';

/**
 * Utils
 */
import { createImageUploadProps } from '@/shared/utils';

const { Title, Text } = Typography;

const INDUSTRY_OPTIONS = [
  { label: 'F&B (Food & Beverage)', value: 'F&B' },
  { label: 'Retail', value: 'Retail' },
  { label: 'Fashion', value: 'Fashion' },
  { label: 'Technology', value: 'Technology' },
  { label: 'Healthcare', value: 'Healthcare' },
  { label: 'Education', value: 'Education' },
  { label: 'Entertainment', value: 'Entertainment' },
  { label: 'Hospitality', value: 'Hospitality' },
  { label: 'Beauty & Spa', value: 'Beauty & Spa' },
  { label: 'Sports & Fitness', value: 'Sports & Fitness' },
  { label: 'Other', value: 'Other' },
];

export type RegisterFormValues = {
  firstName: string;
  lastName: string;
  managerEmail: string;
  phoneNumber?: string;
  brandName: string;
  brandLogo: File;
  industry?: string;
  contactEmail?: string;
  contactPhone?: string;
  primaryContactName?: string;
  website?: string;
  description?: string;
  legalName?: string;
  taxCode?: string;
  billingAddress?: string;
};

type RegisterFormProps = {
  onSubmit: (values: RegisterFormValues, logoFile: File) => Promise<void>;
  isLoading: boolean;
  isSuccess: boolean;
};

export const RegisterForm = ({
  onSubmit,
  isLoading,
  isSuccess,
}: RegisterFormProps) => {
  const [form] = Form.useForm<RegisterFormValues>();
  const [logoFile, setLogoFile] = useState<UploadFile | null>(null);

  const uploadProps = createImageUploadProps<RegisterFormValues>(
    setLogoFile,
    (field, value) => form.setFieldValue(field, value),
  );

  const getLogoPreviewUrl = () => {
    if (logoFile?.originFileObj) {
      return URL.createObjectURL(logoFile.originFileObj);
    }
    return null;
  };

  const handleFinish = async (values: RegisterFormValues) => {
    if (!logoFile?.originFileObj) return;
    await onSubmit(values, logoFile.originFileObj as File);
    form.resetFields();
    setLogoFile(null);
  };

  if (isSuccess) {
    return (
      <div className='flex flex-col items-center justify-center gap-6 py-8 text-center'>
        <div className='flex h-20 w-20 items-center justify-center rounded-full bg-green-50'>
          <span className='text-4xl'>✉️</span>
        </div>
        <div>
          <Title
            level={4}
            className='!mb-1 !text-slate-900'
          >
            Request Submitted!
          </Title>
          <Text className='text-slate-500'>
            Your registration request has been sent to our admin team. We'll
            review your information and get back to you via email within 1–2
            business days.
          </Text>
        </div>
      </div>
    );
  }

  return (
    <Form
      form={form}
      size='large'
      layout='vertical'
      requiredMark={false}
      onFinish={handleFinish}
      autoComplete='off'
      styles={{ label: { height: 20 } }}
      scrollToFirstError
    >
      {/* ── Section 1: Brand Manager ── */}
      <div className='mb-8'>
        <div className='mb-5 flex items-center gap-3'>
          <div className='flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white'>
            1
          </div>
          <Title
            level={5}
            className='!mb-0 !text-slate-800'
          >
            Representative Information
          </Title>
        </div>

        <Row gutter={12}>
          <Col span={12}>
            <Form.Item
              label={
                <span className='text-sm font-medium text-slate-700'>
                  First Name <span className='text-red-500'>*</span>
                </span>
              }
              name='firstName'
              rules={registerValidation.firstName}
            >
              <Input
                placeholder='e.g. John'
                className='h-12 rounded-xl !border-slate-200 !bg-slate-100 px-5 text-base !text-slate-900 transition-all hover:!bg-slate-200 focus:!bg-white focus:ring-2 focus:ring-slate-900/10'
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={
                <span className='text-sm font-medium text-slate-700'>
                  Last Name <span className='text-red-500'>*</span>
                </span>
              }
              name='lastName'
              rules={registerValidation.lastName}
            >
              <Input
                placeholder='e.g. Doe'
                className='h-12 rounded-xl !border-slate-200 !bg-slate-100 px-5 text-base !text-slate-900 transition-all hover:!bg-slate-200 focus:!bg-white focus:ring-2 focus:ring-slate-900/10'
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label={
            <span className='text-sm font-medium text-slate-700'>
              Work Email <span className='text-red-500'>*</span>
            </span>
          }
          name='managerEmail'
          rules={registerValidation.managerEmail}
        >
          <Input
            placeholder='you@company.com'
            type='email'
            className='h-12 rounded-xl !border-slate-200 !bg-slate-100 px-5 text-base !text-slate-900 transition-all hover:!bg-slate-200 focus:!bg-white focus:ring-2 focus:ring-slate-900/10'
          />
        </Form.Item>

        <Form.Item
          label={
            <span className='text-sm font-medium text-slate-700'>
              Phone Number
            </span>
          }
          name='phoneNumber'
          rules={registerValidation.phoneNumber}
        >
          <Input
            placeholder='+84901234567'
            className='h-12 rounded-xl !border-slate-200 !bg-slate-100 px-5 text-base !text-slate-900 transition-all hover:!bg-slate-200 focus:!bg-white focus:ring-2 focus:ring-slate-900/10'
          />
        </Form.Item>
      </div>

      {/* ── Section 2: Brand Information ── */}
      <div className='mb-8'>
        <div className='mb-5 flex items-center gap-3'>
          <div className='flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white'>
            2
          </div>
          <Title
            level={5}
            className='!mb-0 !text-slate-800'
          >
            Brand Information
          </Title>
        </div>

        <Form.Item
          label={
            <span className='text-sm font-medium text-slate-700'>
              Brand Name <span className='text-red-500'>*</span>
            </span>
          }
          name='brandName'
          rules={registerValidation.brandName}
        >
          <Input
            placeholder='e.g. Deer Coffee'
            className='h-12 rounded-xl !border-slate-200 !bg-slate-100 px-5 text-base !text-slate-900 transition-all hover:!bg-slate-200 focus:!bg-white focus:ring-2 focus:ring-slate-900/10'
          />
        </Form.Item>

        <Form.Item
          label={
            <span className='text-sm font-medium text-slate-700'>
              Brand Logo <span className='text-red-500'>*</span>
            </span>
          }
          name='brandLogo'
          valuePropName='file'
          rules={registerValidation.brandLogo}
        >
          <ImageDragger
            previewUrl={getLogoPreviewUrl()}
            uploadProps={uploadProps}
            hintText='Click or drag your brand logo here'
          />
        </Form.Item>

        <Row gutter={12}>
          <Col span={12}>
            <Form.Item
              label={
                <span className='text-sm font-medium text-slate-700'>
                  Industry
                </span>
              }
              name='industry'
              rules={registerValidation.industry}
            >
              <Select
                placeholder='Select industry'
                options={INDUSTRY_OPTIONS}
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? '')
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                className='h-12'
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={
                <span className='text-sm font-medium text-slate-700'>
                  Primary Contact Name
                </span>
              }
              name='primaryContactName'
              rules={registerValidation.primaryContactName}
            >
              <Input
                placeholder='e.g. Jane Smith'
                className='h-12 rounded-xl !border-slate-200 !bg-slate-100 px-5 text-base !text-slate-900 transition-all hover:!bg-slate-200 focus:!bg-white focus:ring-2 focus:ring-slate-900/10'
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={12}>
          <Col span={12}>
            <Form.Item
              label={
                <span className='text-sm font-medium text-slate-700'>
                  Contact Email
                </span>
              }
              name='contactEmail'
              rules={registerValidation.contactEmail}
            >
              <Input
                placeholder='contact@company.com'
                type='email'
                className='h-12 rounded-xl !border-slate-200 !bg-slate-100 px-5 text-base !text-slate-900 transition-all hover:!bg-slate-200 focus:!bg-white focus:ring-2 focus:ring-slate-900/10'
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={
                <span className='text-sm font-medium text-slate-700'>
                  Contact Phone
                </span>
              }
              name='contactPhone'
              rules={registerValidation.contactPhone}
            >
              <Input
                placeholder='+84901234567'
                className='h-12 rounded-xl !border-slate-200 !bg-slate-100 px-5 text-base !text-slate-900 transition-all hover:!bg-slate-200 focus:!bg-white focus:ring-2 focus:ring-slate-900/10'
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label={
            <span className='text-sm font-medium text-slate-700'>Website</span>
          }
          name='website'
          rules={registerValidation.website}
        >
          <Input
            placeholder='https://yourcompany.com'
            className='h-12 rounded-xl !border-slate-200 !bg-slate-100 px-5 text-base !text-slate-900 transition-all hover:!bg-slate-200 focus:!bg-white focus:ring-2 focus:ring-slate-900/10'
          />
        </Form.Item>

        <Form.Item
          label={
            <span className='text-sm font-medium text-slate-700'>
              Brand Description
            </span>
          }
          name='description'
          rules={registerValidation.description}
        >
          <Input.TextArea
            placeholder='Tell us about your brand, your stores, and what you are looking for…'
            autoSize={{ minRows: 3, maxRows: 6 }}
            className='rounded-xl !border-slate-200 !bg-slate-100 px-5 py-3 text-base !text-slate-900 transition-all hover:!bg-slate-200 focus:!bg-white focus:ring-2 focus:ring-slate-900/10'
            maxLength={2000}
            showCount
          />
        </Form.Item>
      </div>

      {/* ── Section 3: Legal (collapsible) ── */}
      <div className='mb-8'>
        <Collapse
          ghost
          className='!rounded-2xl !border !border-slate-200 !bg-white/60'
          items={[
            {
              key: 'legal',
              label: (
                <div className='flex items-center gap-3 py-1'>
                  <div className='flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600'>
                    3
                  </div>
                  <span className='text-sm font-medium text-slate-700'>
                    Legal & Billing{' '}
                    <span className='ml-1 text-xs font-normal text-slate-400'>
                      (optional)
                    </span>
                  </span>
                </div>
              ),
              children: (
                <div className='pt-2'>
                  <Row gutter={12}>
                    <Col span={12}>
                      <Form.Item
                        label={
                          <span className='text-sm font-medium text-slate-700'>
                            Legal Name
                          </span>
                        }
                        name='legalName'
                        rules={registerValidation.legalName}
                      >
                        <Input
                          placeholder='e.g. Deer Coffee JSC'
                          className='h-12 rounded-xl !border-slate-200 !bg-slate-100 px-5 text-base !text-slate-900 transition-all hover:!bg-slate-200 focus:!bg-white focus:ring-2 focus:ring-slate-900/10'
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label={
                          <span className='text-sm font-medium text-slate-700'>
                            Tax Code
                          </span>
                        }
                        name='taxCode'
                        rules={registerValidation.taxCode}
                      >
                        <Input
                          placeholder='e.g. 0123456789'
                          className='h-12 rounded-xl !border-slate-200 !bg-slate-100 px-5 text-base !text-slate-900 transition-all hover:!bg-slate-200 focus:!bg-white focus:ring-2 focus:ring-slate-900/10'
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item
                    label={
                      <span className='text-sm font-medium text-slate-700'>
                        Billing Address
                      </span>
                    }
                    name='billingAddress'
                    rules={registerValidation.billingAddress}
                  >
                    <Input.TextArea
                      placeholder='Full billing address for invoicing'
                      autoSize={{ minRows: 2, maxRows: 4 }}
                      className='rounded-xl !border-slate-200 !bg-slate-100 px-5 py-3 text-base !text-slate-900 transition-all hover:!bg-slate-200 focus:!bg-white focus:ring-2 focus:ring-slate-900/10'
                      maxLength={500}
                      showCount
                    />
                  </Form.Item>
                </div>
              ),
            },
          ]}
        />
      </div>

      <Alert
        type='info'
        showIcon
        className='!mb-6 !rounded-xl !border-blue-100 !bg-blue-50 !text-slate-600'
        message={
          <span className='text-sm'>
            After submitting, our admin team will review your request and create
            your account. You'll receive login credentials via email within{' '}
            <strong>1–2 business days</strong>.
          </span>
        }
      />

      <Button
        type='primary'
        htmlType='submit'
        className='h-12 w-full rounded-full !border-0 !bg-slate-900 text-base font-medium !text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:!bg-slate-800 hover:shadow-lg'
        loading={isLoading}
      >
        Submit Registration Request
      </Button>
    </Form>
  );
};
