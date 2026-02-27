import { useState } from 'react';
import {
  Button,
  Drawer,
  Form,
  Input,
  Select,
  Row,
  Col,
  Typography,
  Flex,
} from 'antd';

/**
 * Hooks
 */
import { useCreateAccount } from '@/features/admin/hooks/useCreateAccount';
import { useBrands } from '@/features/admin/hooks/useBrands';

/**
 * Components
 */
import { ImageDragger } from '@/shared/components/common/ImageDragger';
import { PasswordStrength } from '@/shared/components/ui/PasswordStrength';

/**
 * Types
 */
import type { UploadFile } from 'antd';
import type { CreateAccountRequest } from '@/features/admin/types/accountTypes';
import { RoleEnum } from '@/features/admin/types/accountTypes';

/**
 * Constants
 */
import { ROLE_OPTIONS_FOR_ADMIN } from '@/features/admin/constants/accountConstants';

/**
 * Validations
 */
import { createAccountValidation } from '@/features/admin/validations/accountValidation';

/**
 * Utils
 */
import { createImageUploadProps } from '@/shared/utils/uploadHelpers';

const { Title } = Typography;

type CreateAccountDrawerProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export const CreateAccountDrawer = ({
  open,
  onClose,
  onSuccess,
}: CreateAccountDrawerProps) => {
  const [form] = Form.useForm<CreateAccountRequest>();
  const [avatarFile, setAvatarFile] = useState<UploadFile | null>(null);
  const [password, setPassword] = useState('');

  const createAccount = useCreateAccount();

  const { data: brandsData } = useBrands({ pageSize: 100 });

  const brandOptions =
    brandsData?.items.map((brand) => ({
      label: brand.name,
      value: brand.id,
    })) || [];

  const handleSubmit = async (values: CreateAccountRequest) => {
    const formData = new FormData();

    // Required fields
    if (values.firstName) formData.append('firstName', values.firstName);
    if (values.lastName) formData.append('lastName', values.lastName);
    if (values.email) formData.append('email', values.email);
    if (values.password) formData.append('password', values.password);
    formData.append('role', String(RoleEnum.BrandManager)); // Admin chỉ tạo BrandManager

    // Optional fields
    if (avatarFile?.originFileObj) {
      formData.append('avatar', avatarFile.originFileObj);
    }
    if (values.phoneNumber) formData.append('phoneNumber', values.phoneNumber);
    if (values.brandId) formData.append('brandId', values.brandId);

    createAccount.mutate(formData, {
      onSuccess: () => {
        handleCancel();
        onSuccess();
      },
    });
  };

  const handleCancel = () => {
    form.resetFields();
    setAvatarFile(null);
    setPassword('');
    onClose();
  };

  const handlePasswordChange = (newPassword: string) => {
    setPassword(newPassword);
    form.setFieldValue('password', newPassword);
  };

  const uploadProps = createImageUploadProps<CreateAccountRequest>(
    setAvatarFile,
    (field, value) => form.setFieldValue(field, value),
  );

  const getPreviewUrl = () => {
    if (avatarFile?.originFileObj) {
      return URL.createObjectURL(avatarFile.originFileObj);
    }
    return null;
  };

  return (
    <Drawer
      closeIcon={null}
      title='Create Brand Manager Account'
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
            loading={createAccount.isPending}
          >
            Create Account
          </Button>
        </Flex>
      }
    >
      <Form
        size='large'
        form={form}
        layout='vertical'
        onFinish={handleSubmit}
        initialValues={{
          role: RoleEnum.BrandManager,
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

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label='First Name'
                name='firstName'
                rules={createAccountValidation.firstName}
              >
                <Input placeholder='e.g., John' />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label='Last Name'
                name='lastName'
                rules={createAccountValidation.lastName}
              >
                <Input placeholder='e.g., Doe' />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label='Email'
            name='email'
            rules={createAccountValidation.email}
          >
            <Input
              placeholder='email@example.com'
              type='email'
            />
          </Form.Item>

          <Form.Item
            label='Password'
            name='password'
            rules={createAccountValidation.password}
          >
            <Input.Password
              placeholder='Enter password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Form.Item>

          <PasswordStrength
            password={password}
            onPasswordChange={handlePasswordChange}
            showGenerator
            description='This is the password to your account, so it must be strong and hard to guess.'
          />

          <Form.Item
            label='Phone Number'
            name='phoneNumber'
            rules={createAccountValidation.phoneNumber}
            style={{ marginTop: 16 }}
          >
            <Input placeholder='+84901234567 or 0901234567' />
          </Form.Item>

          {/* ✅ Use shared ImageDragger */}
          <Form.Item
            label='Avatar'
            name='avatar'
            valuePropName='file'
          >
            <ImageDragger
              previewUrl={getPreviewUrl()}
              uploadProps={uploadProps}
            />
          </Form.Item>
        </div>

        {/* Assignment Section */}
        <div>
          <Title
            level={5}
            style={{ marginBottom: 16 }}
          >
            Brand Assignment
          </Title>

          <Form.Item
            label='Role'
            name='role'
            rules={createAccountValidation.role}
          >
            <Select
              placeholder='Select role'
              options={ROLE_OPTIONS_FOR_ADMIN}
              disabled
            />
          </Form.Item>

          <Form.Item
            label='Brand'
            name='brandId'
            rules={createAccountValidation.brandId}
          >
            <Select
              placeholder='Select brand'
              options={brandOptions}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
          </Form.Item>
        </div>
      </Form>
    </Drawer>
  );
};
