import { useEffect } from 'react';
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
  Spin,
} from 'antd';

/**
 * Hooks
 */
import { useStore } from '@/features/manager/hooks/useStore';
import { useUpdateStore } from '@/features/manager/hooks/useUpdateStore';

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
import { updateStoreValidation } from '@/features/manager/validations/storeValidation';

const { Title } = Typography;
const { TextArea } = Input;

type EditStoreDrawerProps = {
  open: boolean;
  storeId: string | null;
  onClose: () => void;
  onSuccess: () => void;
};

export const EditStoreDrawer = ({
  open,
  storeId,
  onClose,
  onSuccess,
}: EditStoreDrawerProps) => {
  const [form] = Form.useForm<StoreRequest>();
  const { data: store, isLoading } = useStore(storeId || undefined, open);
  const updateStore = useUpdateStore();

  // Populate form when store data is loaded
  useEffect(() => {
    if (store && open) {
      form.setFieldsValue({
        name: store.name,
        contactNumber: store.contactNumber || undefined,
        address: store.address || undefined,
        city: store.city || undefined,
        district: store.district || undefined,
        latitude: store.latitude || undefined,
        longitude: store.longitude || undefined,
        mapUrl: store.mapUrl || undefined,
        timeZone: store.timeZone || 'Asia/Ho_Chi_Minh',
        areaSquareMeters: store.areaSquareMeters || undefined,
        maxCapacity: store.maxCapacity || undefined,
      });
    }
  }, [store, open, form]);

  const handleSubmit = async (values: StoreRequest) => {
    if (!storeId) return;

    updateStore.mutate(
      { id: storeId, data: values },
      {
        onSuccess: () => {
          handleCancel();
          onSuccess();
        },
      },
    );
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Drawer
      closeIcon={null}
      title='Edit Store'
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
            loading={updateStore.isPending}
            disabled={isLoading}
          >
            Update Store
          </Button>
        </Flex>
      }
    >
      {isLoading ? (
        <div className='flex h-96 items-center justify-center'>
          <Spin size='large' />
        </div>
      ) : (
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
              rules={updateStoreValidation.name}
            >
              <Input placeholder='e.g., DeerCoffee Điện Biên Phủ' />
            </Form.Item>

            <Form.Item
              label='Contact Number'
              name='contactNumber'
              rules={updateStoreValidation.contactNumber}
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
              rules={updateStoreValidation.address}
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
                  rules={updateStoreValidation.city}
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
                  rules={updateStoreValidation.district}
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
                  rules={updateStoreValidation.latitude}
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
                  rules={updateStoreValidation.longitude}
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
              rules={updateStoreValidation.mapUrl}
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
              rules={updateStoreValidation.timeZone}
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
                  rules={updateStoreValidation.areaSquareMeters}
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
                  rules={updateStoreValidation.maxCapacity}
                >
                  <InputNumber
                    className='w-full'
                    placeholder='e.g., 60'
                    min={1}
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* Read-only fields from API */}
            {store?.currentMood && (
              <div style={{ marginTop: 16 }}>
                <Typography.Text type='secondary'>
                  Current Mood: <strong>{store.currentMood}</strong>
                  {store.lastMoodUpdateAt && (
                    <span>
                      {' '}
                      (Updated:{' '}
                      {new Date(store.lastMoodUpdateAt).toLocaleString()})
                    </span>
                  )}
                </Typography.Text>
              </div>
            )}
          </div>
        </Form>
      )}
    </Drawer>
  );
};
