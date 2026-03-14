import { useEffect } from 'react';
import {
  Button,
  Drawer,
  Form,
  Input,
  Select,
  InputNumber,
  Flex,
  Spin,
} from 'antd';

/**
 * Hooks
 */
import { useSpace, useUpdateSpace } from '@/features/store/hooks';

/**
 * Types
 */
import type { UpdateSpaceRequest } from '@/features/store/types';

/**
 * Constants
 */
import { SPACE_TYPE_OPTIONS } from '@/features/store/constants';

/**
 * Validations
 */
import { updateSpaceValidation } from '@/features/store/validations';

/**
 * Utils
 */
import { nullToUndefined } from '@/shared/utils/formHelpers';

/**
 * Configs
 */
import { DRAWER_WIDTHS } from '@/config';

type EditSpaceDrawerProps = {
  open: boolean;
  spaceId: string | null;
  onClose: () => void;
  onSuccess: () => void;
};

export const EditSpaceDrawer = ({
  open,
  spaceId,
  onClose,
  onSuccess,
}: EditSpaceDrawerProps) => {
  const [form] = Form.useForm<UpdateSpaceRequest>();
  const { data: space, isLoading } = useSpace(spaceId || undefined, open);
  const updateSpace = useUpdateSpace();

  // Pre-fill form when space data is loaded
  useEffect(() => {
    if (space && open) {
      form.setFieldsValue({
        name: space.name,
        type: space.type,
        description: nullToUndefined(space.description),
        maxOccupancy: nullToUndefined(space.maxOccupancy),
        criticalQueueThreshold: nullToUndefined(space.criticalQueueThreshold),
        cameraId: nullToUndefined(space.cameraId),
        roiCoordinates: nullToUndefined(space.roiCoordinates),
        wiFiSensorId: nullToUndefined(space.wiFiSensorId),
      });
    }
  }, [space, open, form]);

  const handleSubmit = async (values: UpdateSpaceRequest) => {
    if (!spaceId) return;

    updateSpace.mutate(
      { id: spaceId, data: values },
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
      title='Edit Space'
      placement='right'
      width={DRAWER_WIDTHS.medium}
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
            loading={updateSpace.isPending}
            disabled={isLoading}
          >
            Update Space
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
          autoComplete='off'
          styles={{
            label: {
              height: 22,
            },
          }}
        >
          <Form.Item
            label='Space Name'
            name='name'
            rules={updateSpaceValidation.name}
          >
            <Input placeholder='e.g., Main Counter, VIP Hall' />
          </Form.Item>

          <Form.Item
            label='Space Type'
            name='type'
          >
            <Select
              placeholder='Select space type'
              options={SPACE_TYPE_OPTIONS}
            />
          </Form.Item>

          <Form.Item
            label='Description'
            name='description'
            rules={updateSpaceValidation.description}
          >
            <Input.TextArea
              rows={3}
              placeholder='Brief description of this space...'
            />
          </Form.Item>

          <Form.Item
            label='Max Occupancy'
            name='maxOccupancy'
            rules={updateSpaceValidation.maxOccupancy}
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
            rules={updateSpaceValidation.criticalQueueThreshold}
            extra='Trigger alert when queue exceeds this number'
          >
            <InputNumber
              min={1}
              style={{ width: '100%' }}
              placeholder='e.g., 10'
            />
          </Form.Item>

          {/* Read-only info */}
          {space?.currentPlaylistId && (
            <div style={{ marginTop: 16 }}>
              <Flex justify='space-between'>
                <span>Current Playlist ID:</span>
                <strong>{space.currentPlaylistId}</strong>
              </Flex>
            </div>
          )}
        </Form>
      )}
    </Drawer>
  );
};
