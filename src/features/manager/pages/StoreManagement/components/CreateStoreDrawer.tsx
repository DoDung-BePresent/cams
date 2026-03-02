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
  InputNumber,
} from 'antd';

/**
 * Hooks
 */
import { useCreateStore } from '@/features/manager/hooks/useCreateStore';

/**
 * Types
 */
import type { StoreRequest } from '@/features/manager/types/storeTypes';

/**
 * Constants
 */
import {
  VIETNAM_CITIES,
  HCMC_DISTRICTS,
  TIMEZONE_OPTIONS,
} from '@/features/manager/constants/storeConstants';

/**
 * Validations
 */
import { createStoreValidation } from '@/features/manager/validations/storeValidation';

const { Title } = Typography;
const { TextArea } = Input;

type CreateStoreDrawerProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export const CreateStoreDrawer = ({
  open,
  onClose,
  onSuccess,
}: CreateStoreDrawerProps) => {
  const [form] = Form.useForm<StoreRequest>();
  const createStore = useCreateStore();

  const handleSubmit = async (values: StoreRequest) => {
    createStore.mutate(values, {
      onSuccess: () => {
        handleCancel();
        onSuccess();
      },
    });
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Drawer
      closeIcon={null}
      title='Add New Store'
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
            loading={createStore.isPending}
          >
            Create Store
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
          timeZone: 'Asia/Ho_Chi_Minh',
        }}
        styles={{
          label: {
            height: 22,
          },
        }}
      >
        {/* Basic Information */}
        <div style={{ marginBottom: 24 }}>
          <Title
            level={5}
            style={{ marginBottom: 16 }}
          >
            Basic Information
          </Title>

          <Form.Item
            label='Store Name'
            name='name'
            rules={createStoreValidation.name}
          >
            <Input placeholder='e.g., DeerCoffee Điện Biên Phủ' />
          </Form.Item>

          <Form.Item
            label='Contact Number'
            name='contactNumber'
            rules={createStoreValidation.contactNumber}
          >
            <Input placeholder='+84283456789 or 0283456789' />
          </Form.Item>
        </div>

        {/* Location Information */}
        <div style={{ marginBottom: 24 }}>
          <Title
            level={5}
            style={{ marginBottom: 16 }}
          >
            Location
          </Title>

          <Form.Item
            label='Address'
            name='address'
            rules={createStoreValidation.address}
          >
            <TextArea
              rows={2}
              placeholder='e.g., 789 Điện Biên Phủ, Phường 25'
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label='City'
                name='city'
                rules={createStoreValidation.city}
              >
                <Select
                  placeholder='Select city'
                  options={VIETNAM_CITIES}
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? '')
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label='District'
                name='district'
                rules={createStoreValidation.district}
              >
                <Select
                  placeholder='Select district'
                  options={HCMC_DISTRICTS}
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? '')
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label='Latitude'
                name='latitude'
                rules={createStoreValidation.latitude}
              >
                <InputNumber
                  className='w-full'
                  placeholder='e.g., 10.8028'
                  step={0.0001}
                  precision={4}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label='Longitude'
                name='longitude'
                rules={createStoreValidation.longitude}
              >
                <InputNumber
                  className='w-full'
                  placeholder='e.g., 106.7154'
                  step={0.0001}
                  precision={4}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label='Map URL'
            name='mapUrl'
            rules={createStoreValidation.mapUrl}
          >
            <Input placeholder='https://maps.google.com/?q=10.8028,106.7154' />
          </Form.Item>
        </div>

        {/* Store Details */}
        <div>
          <Title
            level={5}
            style={{ marginBottom: 16 }}
          >
            Store Details
          </Title>

          <Form.Item
            label='Time Zone'
            name='timeZone'
            rules={createStoreValidation.timeZone}
          >
            <Select
              placeholder='Select timezone'
              options={TIMEZONE_OPTIONS}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label='Area (m²)'
                name='areaSquareMeters'
                rules={createStoreValidation.areaSquareMeters}
              >
                <InputNumber
                  className='w-full'
                  placeholder='e.g., 95.0'
                  min={0.01}
                  step={0.1}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label='Max Capacity'
                name='maxCapacity'
                rules={createStoreValidation.maxCapacity}
              >
                <InputNumber
                  className='w-full'
                  placeholder='e.g., 60'
                  min={1}
                />
              </Form.Item>
            </Col>
          </Row>
        </div>
      </Form>
    </Drawer>
  );
};
