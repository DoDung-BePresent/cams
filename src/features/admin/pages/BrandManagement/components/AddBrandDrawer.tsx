import { useState } from 'react';
import {
  Button,
  Drawer,
  Form,
  Input,
  Select,
  Upload,
  message,
  Row,
  Col,
  Typography,
  Flex,
} from 'antd';

/**
 * Assets
 */
import filesImage from '@/assets/images/files.png';

/**
 * Hooks
 */
import { useCreateBrand } from '@/features/admin/hooks/useCreateBrand';

/**
 * Types
 */
import type { UploadFile, UploadProps } from 'antd';
import type { BrandRequest } from '@/features/admin/types/brandTypes';

/**
 * Constants
 */
import {
  INDUSTRY_OPTIONS,
  TIMEZONE_OPTIONS,
} from '@/features/admin/constants/brandConstants';

/**
 * Validations
 */
import { brandValidation } from '@/features/admin/validations/brandValidation';

const { TextArea } = Input;
const { Dragger } = Upload;
const { Text, Title } = Typography;

type AddBrandDrawerProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export const AddBrandDrawer = ({
  open,
  onClose,
  onSuccess,
}: AddBrandDrawerProps) => {
  const [form] = Form.useForm<BrandRequest>();
  const [logoFile, setLogoFile] = useState<UploadFile | null>(null);

  const createBrand = useCreateBrand();

  const handleSubmit = async (values: BrandRequest) => {
    const formData = new FormData();

    if (values.name) formData.append('name', values.name);
    if (logoFile?.originFileObj) {
      formData.append('logo', logoFile.originFileObj);
    }
    if (values.description) formData.append('description', values.description);
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

    createBrand.mutate(formData, {
      onSuccess: () => {
        form.resetFields();
        setLogoFile(null);
        onSuccess();
        onClose();
      },
    });
  };

  const handleSubmitFailed = () => {
    message.error('Please fill in all required fields correctly!');
  };

  const handleCancel = () => {
    form.resetFields();
    setLogoFile(null);
    onClose();
  };

  const uploadProps: UploadProps = {
    maxCount: 1,
    beforeUpload: (file) => {
      const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/bmp',
        'image/svg+xml',
      ];

      if (!allowedTypes.includes(file.type)) {
        message.error(
          'File must be an image (jpg, jpeg, png, gif, webp, bmp, svg)',
        );
        return Upload.LIST_IGNORE;
      }

      // Validate file size
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        message.error('File size must not exceed 5MB');
        return Upload.LIST_IGNORE;
      }

      setLogoFile({
        uid: file.uid,
        name: file.name,
        originFileObj: file,
      } as UploadFile);

      return false;
    },
    onRemove: () => {
      setLogoFile(null);
      form.setFieldValue('logo', undefined);
    },
    accept:
      'image/jpeg,image/jpg,image/png,image/gif,image/webp,image/bmp,image/svg+xml',
    listType: 'picture',
  };

  return (
    <Drawer
      closeIcon={null}
      title='Add New Brand'
      placement='right'
      width={720}
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
            loading={createBrand.isPending}
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
        onFinishFailed={handleSubmitFailed}
        initialValues={{
          defaultTimeZone: 'SE Asia Standard Time',
        }}
        styles={{
          label: {
            height: 22,
          },
        }}
      >
        {/* Basic Information Section */}
        <div style={{ marginBottom: 24 }}>
          <Title
            level={5}
            style={{ marginBottom: 16 }}
          >
            Basic Information
          </Title>

          <Form.Item
            label='Brand Name'
            name='name'
            rules={brandValidation.name}
          >
            <Input placeholder='e.g., Moonlight Coffee' />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
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
            </Col>
            <Col span={12}>
              <Form.Item
                label='Website'
                name='website'
                rules={brandValidation.website}
              >
                <Input placeholder='https://example.com' />
              </Form.Item>
            </Col>
          </Row>

          {/* ✅ Removed rules from Form.Item, validation in beforeUpload */}
          <Form.Item
            label='Logo'
            name='logo'
            valuePropName='file'
          >
            <Dragger {...uploadProps}>
              <Flex justify='center'>
                <img
                  src={filesImage}
                  height={30}
                  alt='Upload'
                />
              </Flex>
              <Flex vertical>
                <Text>Click or drag file to this area to upload</Text>
                <Text type='secondary'>
                  Support for image files (JPG, PNG, GIF, WEBP, BMP, SVG).
                  Maximum size: 5MB
                </Text>
              </Flex>
            </Dragger>
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
        </div>

        {/* Contact Information Section */}
        <div style={{ marginBottom: 24 }}>
          <Title
            level={5}
            style={{ marginBottom: 16 }}
          >
            Contact Information
          </Title>

          <Form.Item
            label='Primary Contact Name'
            name='primaryContactName'
            rules={brandValidation.primaryContactName}
          >
            <Input placeholder='e.g., John Doe' />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label='Contact Email'
                name='contactEmail'
                rules={brandValidation.contactEmail}
              >
                <Input placeholder='contact@example.com' />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label='Contact Phone'
                name='contactPhone'
                rules={brandValidation.contactPhone}
              >
                <Input placeholder='+84 901 234 567' />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label='Technical Contact Email'
            name='technicalContactEmail'
            rules={brandValidation.technicalContactEmail}
          >
            <Input placeholder='tech@example.com' />
          </Form.Item>
        </div>

        {/* Legal & Billing Section */}
        <div style={{ marginBottom: 24 }}>
          <Title
            level={5}
            style={{ marginBottom: 16 }}
          >
            Legal & Billing Information
          </Title>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label='Legal Name'
                name='legalName'
                rules={brandValidation.legalName}
              >
                <Input placeholder='Official company name' />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label='Tax Code'
                name='taxCode'
                rules={brandValidation.taxCode}
              >
                <Input placeholder='e.g., 0123456789' />
              </Form.Item>
            </Col>
          </Row>

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
        </div>

        {/* Configuration Section */}
        <div>
          <Title
            level={5}
            style={{ marginBottom: 16 }}
          >
            Configuration
          </Title>

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
        </div>
      </Form>
    </Drawer>
  );
};
