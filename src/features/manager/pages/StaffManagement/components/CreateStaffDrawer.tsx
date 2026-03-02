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
  Upload,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd';

/**
 * Hooks
 */
import { useCreateStaff } from '@/features/manager/hooks/useCreateStaff';
import { useStores } from '@/features/manager/hooks/useStores';

/**
 * Components
 */
import { PasswordStrengthGenerator } from '@/shared/components//PasswordStrengthGenerator';

/**
 * Types
 */
import type { CreateStaffRequest } from '@/features/manager/types/staffTypes';
import { EntityStatusEnum } from '@/shared/types/commonTypes';

/**
 * Validations
 */
import { createStaffValidation } from '@/features/manager/validations/staffValidation';

/**
 * Utils
 */
import { createImageUploadProps } from '@/shared/utils/uploadHelpers';

const { Title } = Typography;

type CreateStaffDrawerProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export const CreateStaffDrawer = ({
  open,
  onClose,
  onSuccess,
}: CreateStaffDrawerProps) => {
  const [form] = Form.useForm<CreateStaffRequest>();
  const createStaff = useCreateStaff();
  const [avatarFile, setAvatarFile] = useState<UploadFile | null>(null);
  const [password, setPassword] = useState('');

  // Fetch active stores for dropdown
  const { data: storesData } = useStores({
    status: EntityStatusEnum.Active,
    pageSize: 100,
  });

  const storeOptions =
    storesData?.items.map((store) => ({
      label: store.name,
      value: store.id,
    })) || [];

  const handleSubmit = async (values: CreateStaffRequest) => {
    const formData = new FormData();

    // Required fields
    if (values.firstName) formData.append('firstName', values.firstName);
    if (values.lastName) formData.append('lastName', values.lastName);
    if (values.email) formData.append('email', values.email);
    if (values.password) formData.append('password', values.password);
    if (values.storeId) formData.append('storeId', values.storeId);

    // Optional fields
    if (avatarFile?.originFileObj) {
      formData.append('avatar', avatarFile.originFileObj);
    }
    if (values.phoneNumber) formData.append('phoneNumber', values.phoneNumber);

    createStaff.mutate(formData, {
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

  const uploadProps = createImageUploadProps<CreateStaffRequest>(
    setAvatarFile,
    form,
    'avatar',
  );

  return (
    <Drawer
      closeIcon={null}
      title='Add New Staff Member'
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
            loading={createStaff.isPending}
          >
            Create Staff
          </Button>
        </Flex>
      }
    >
      <Form
        size='large'
        form={form}
        layout='vertical'
        onFinish={handleSubmit}
        styles={{
          label: {
            height: 22,
          },
        }}
      >
        {/* Profile Picture */}
        <div style={{ marginBottom: 24 }}>
          <Title
            level={5}
            style={{ marginBottom: 16 }}
          >
            Profile Picture
          </Title>

          <Form.Item
            name='avatar'
            rules={createStaffValidation.avatar}
            valuePropName='fileList'
            getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
          >
            <Upload
              {...uploadProps}
              listType='picture-card'
              maxCount={1}
              accept='image/*'
            >
              {!avatarFile && (
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>Upload Avatar</div>
                </div>
              )}
            </Upload>
          </Form.Item>
        </div>

        {/* Basic Information */}
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
                rules={createStaffValidation.firstName}
              >
                <Input placeholder='e.g., Nguyen' />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label='Last Name'
                name='lastName'
                rules={createStaffValidation.lastName}
              >
                <Input placeholder='e.g., Van A' />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label='Email'
            name='email'
            rules={createStaffValidation.email}
          >
            <Input placeholder='email@example.com' />
          </Form.Item>

          <Form.Item
            label='Phone Number'
            name='phoneNumber'
            rules={createStaffValidation.phoneNumber}
          >
            <Input placeholder='+84901234567 or 0901234567' />
          </Form.Item>
        </div>

        {/* Account Setup */}
        <div style={{ marginBottom: 24 }}>
          <Title
            level={5}
            style={{ marginBottom: 16 }}
          >
            Account Setup
          </Title>

          <Form.Item
            label='Password'
            name='password'
            rules={createStaffValidation.password}
          >
            <PasswordStrengthGenerator
              value={password}
              onChange={handlePasswordChange}
            />
          </Form.Item>

          <Form.Item
            label='Assign Store'
            name='storeId'
            rules={createStaffValidation.storeId}
            extra='This staff member will manage the selected store'
          >
            <Select
              placeholder='Select a store'
              options={storeOptions}
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
