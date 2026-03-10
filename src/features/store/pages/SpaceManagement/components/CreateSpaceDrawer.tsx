import { Button, Drawer, Form, Input, Select, InputNumber, Flex } from 'antd';

/**
 * Hooks
 */
import { useCreateSpace } from '@/features/store/hooks';

/**
 * Types
 */
import type { CreateSpaceRequest } from '@/features/store/types';

/**
 * Constants
 */
import { SPACE_TYPE_OPTIONS } from '@/features/store/constants';

/**
 * Validations
 */
import { createSpaceValidation } from '@/features/store/validations';

type CreateSpaceDrawerProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export const CreateSpaceDrawer = ({
  open,
  onClose,
  onSuccess,
}: CreateSpaceDrawerProps) => {
  const [form] = Form.useForm<CreateSpaceRequest>();
  const createSpace = useCreateSpace();

  const handleSubmit = async (values: CreateSpaceRequest) => {
    createSpace.mutate(values, {
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
      title='Create New Space'
      placement='right'
      width={600}
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
            loading={createSpace.isPending}
          >
            Create Space
          </Button>
        </Flex>
      }
    >
      <Form
        size='large'
        form={form}
        layout='vertical'
        onFinish={handleSubmit}
        autoComplete='off'
      >
        <Form.Item
          label='Space Name'
          name='name'
          rules={createSpaceValidation.name}
        >
          <Input placeholder='e.g., Main Counter, VIP Hall' />
        </Form.Item>

        <Form.Item
          label='Space Type'
          name='type'
          rules={createSpaceValidation.type}
        >
          <Select
            placeholder='Select space type'
            options={SPACE_TYPE_OPTIONS}
          />
        </Form.Item>

        <Form.Item
          label='Description'
          name='description'
          rules={createSpaceValidation.description}
        >
          <Input.TextArea
            rows={3}
            placeholder='Brief description of this space...'
          />
        </Form.Item>

        <Form.Item
          label='Max Occupancy'
          name='maxOccupancy'
          rules={createSpaceValidation.maxOccupancy}
          extra='Maximum number of people allowed in this space'
        >
          <InputNumber
            min={1}
            style={{ width: '100%' }}
            placeholder='e.g., 50'
          />
        </Form.Item>

        <Form.Item
          label='Critical Queue Threshold'
          name='criticalQueueThreshold'
          rules={createSpaceValidation.criticalQueueThreshold}
          extra='Trigger alert when queue exceeds this number'
        >
          <InputNumber
            min={1}
            style={{ width: '100%' }}
            placeholder='e.g., 10'
          />
        </Form.Item>

        <Form.Item
          label='Camera ID'
          name='cameraId'
          extra='Optional: Link a camera device to monitor this space'
        >
          <Input placeholder='e.g., CAM-001' />
        </Form.Item>

        <Form.Item
          label='ROI Coordinates'
          name='roiCoordinates'
          extra='Optional: Region of Interest for camera tracking'
        >
          <Input placeholder='e.g., 100,200,300,400' />
        </Form.Item>

        <Form.Item
          label='WiFi Sensor ID'
          name='wiFiSensorId'
          extra='Optional: Link WiFi sensor for occupancy tracking'
        >
          <Input placeholder='e.g., WIFI-001' />
        </Form.Item>
      </Form>
    </Drawer>
  );
};
