import { useEffect, useState } from 'react';
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
  Spin,
  Skeleton,
} from 'antd';

/**
 * Assets
 */
import filesImage from '@/assets/images/files.png';

/**
 * Hooks
 */
import { useUpdateBrand } from '@/features/admin/hooks/useUpdateBrand';
import { useBrand } from '@/features/admin/hooks/useBrand';

/**
 * Types
 */
import type { UploadFile } from 'antd';
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
import { nullToUndefined } from '@/shared/utils/formHelpers';

const { TextArea } = Input;
const { Dragger } = Upload;
const { Text, Title } = Typography;

type EditBrandDrawerProps = {
  open: boolean;
  brandId: string | null;
  onClose: () => void;
  onSuccess: () => void;
};

export const EditBrandDrawer = ({
  open,
  brandId,
  onClose,
  onSuccess,
}: EditBrandDrawerProps) => {
  const [form] = Form.useForm<BrandRequest>();
  const [logoFile, setLogoFile] = useState<UploadFile | null>(null);
  const [existingLogoUrl, setExistingLogoUrl] = useState<string | null>(null);

  // Fetch brand data
  const { data: brand, isLoading: isFetching } = useBrand(
    brandId || undefined,
    open && !!brandId,
  );

  // Update mutation
  const updateBrand = useUpdateBrand();

  // Populate form when brand data is loaded
  useEffect(() => {
    if (brand && open) {
      form.setFieldsValue({
        name: brand.name,
        industry: nullToUndefined(brand.industry),
        description: nullToUndefined(brand.description),
        website: nullToUndefined(brand.website),
        contactEmail: nullToUndefined(brand.contactEmail),
        contactPhone: nullToUndefined(brand.contactPhone),
        primaryContactName: nullToUndefined(brand.primaryContactName),
        technicalContactEmail: nullToUndefined(brand.technicalContactEmail),
        legalName: nullToUndefined(brand.legalName),
        taxCode: nullToUndefined(brand.taxCode),
        billingAddress: nullToUndefined(brand.billingAddress),
        defaultTimeZone: brand.defaultTimeZone,
      });
      setExistingLogoUrl(brand.logoUrl);
    }
  }, [brand, open, form]);

  const handleSubmit = async (values: BrandRequest) => {
    if (!brandId) return;

    const formData = new FormData();

    // Only append fields that have values
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

    updateBrand.mutate(
      { id: brandId, formData },
      {
        onSuccess: () => {
          handleCancel();
          onSuccess();
        },
      },
    );
  };

  const handleSubmitFailed = () => {
    message.error('Please fill in all required fields correctly!');
  };

  const handleCancel = () => {
    form.resetFields();
    setLogoFile(null);
    setExistingLogoUrl(null);
    onClose();
  };

  const uploadProps = {
    maxCount: 1,
    beforeUpload: (file: File) => {
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

      const maxSize = 5 * 1024 * 1024;
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

  const getLogoPreview = () => {
    if (logoFile?.originFileObj) {
      return URL.createObjectURL(logoFile.originFileObj);
    }
    return existingLogoUrl;
  };

  return (
    <Drawer
      closeIcon={null}
      title='Edit Brand'
      placement='right'
      width={720}
      open={open}
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
            onClick={() => form.submit()}
            loading={updateBrand.isPending}
          >
            Update Brand
          </Button>
        </Flex>
      }
    >
      {isFetching ? (
        <div style={{ padding: '24px 0' }}>
          <Skeleton.Input
            active
            block
            style={{ marginBottom: 24, height: 32 }}
          />
          <Skeleton.Input
            active
            block
            style={{ marginBottom: 24, height: 32 }}
          />
          <Skeleton
            active
            paragraph={{ rows: 3 }}
            style={{ marginBottom: 24 }}
          />
          <Skeleton.Image
            active
            style={{
              width: '100%',
              height: 200,
              marginBottom: 24,
            }}
          />
          <Skeleton
            active
            paragraph={{ rows: 6 }}
          />
        </div>
      ) : (
        <Form
          size='large'
          form={form}
          layout='vertical'
          onFinish={handleSubmit}
          onFinishFailed={handleSubmitFailed}
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

            <Form.Item
              label='Logo'
              name='logo'
              valuePropName='file'
            >
              <Dragger {...uploadProps}>
                <Flex justify='center'>
                  {getLogoPreview() ? (
                    <img
                      src={getLogoPreview() || undefined}
                      height={60}
                      alt='Logo Preview'
                      style={{ objectFit: 'contain' }}
                    />
                  ) : (
                    <img
                      src={filesImage}
                      height={30}
                      alt='Upload'
                    />
                  )}
                </Flex>
                <Flex vertical>
                  <Text>
                    {getLogoPreview()
                      ? 'Click or drag file to replace logo'
                      : 'Click or drag file to this area to upload'}
                  </Text>
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
                  <Input placeholder='+84901234567' />
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
              Legal & Billing
            </Title>

            <Form.Item
              label='Legal Name'
              name='legalName'
              rules={brandValidation.legalName}
            >
              <Input placeholder='Official company name for invoicing' />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label='Tax Code'
                  name='taxCode'
                  rules={brandValidation.taxCode}
                >
                  <Input placeholder='e.g., 0123456789' />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label='Default Timezone'
                  name='defaultTimeZone'
                >
                  <Select
                    placeholder='Select timezone'
                    options={TIMEZONE_OPTIONS}
                  />
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
      )}
    </Drawer>
  );
};
