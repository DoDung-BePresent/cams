import { useState } from 'react';
import {
  App,
  Button,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Flex,
  Row,
  Col,
  Segmented,
} from 'antd';

/**
 * Hooks
 */
import { useCreateSpace } from '@/shared/modules/spaces/hooks';
import { spaceService } from '@/shared/modules/spaces/services';

/**
 * Types
 */
import type {
  CreateSpaceRequest,
  SpaceFuzzyOverrideProfileRequest,
} from '@/shared/modules/spaces/types';

/**
 * Constants
 */
import { SPACE_TYPE_OPTIONS } from '@/features/store/constants';

/**
 * Validations
 */
import { createSpaceValidation } from '@/shared/modules/spaces/validations';
import { SpaceFuzzyOverrideFields } from './SpaceFuzzyOverrideFields';
import { pickSpaceFuzzyOverrideBody } from './spaceFuzzyOverrideUtils';

/**
 * Components
 */
import { SettingSwitch } from '@/shared/components';

type CreateSpaceModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

type CreateSpaceFormValues = CreateSpaceRequest & {
  applyFuzzyAfterCreate?: boolean;
  fuzzy?: Partial<SpaceFuzzyOverrideProfileRequest>;
};

export const CreateSpaceModal = ({
  open,
  onClose,
  onSuccess,
}: CreateSpaceModalProps) => {
  const { message } = App.useApp();
  const [form] = Form.useForm<CreateSpaceFormValues>();
  const createSpace = useCreateSpace();
  const [activeTab, setActiveTab] = useState<'basic' | 'fuzzy'>('basic');

  const handleSubmit = async (values: CreateSpaceFormValues) => {
    const { applyFuzzyAfterCreate, fuzzy, ...spaceValues } = values;

    createSpace.mutate(spaceValues, {
      onSuccess: async () => {
        if (applyFuzzyAfterCreate && spaceValues.name?.trim()) {
          const body = pickSpaceFuzzyOverrideBody(fuzzy);
          try {
            const listRes = await spaceService.getList({
              search: spaceValues.name.trim(),
              page: 1,
              pageSize: 25,
              sortBy: 'createdAt',
              isAscending: false,
            });

            const exact = listRes.data?.items?.find(
              (s) => s.name.trim() === spaceValues.name.trim(),
            );

            if (exact) {
              await spaceService.createFuzzyOverrideProfile(exact.id, body);
              message.success('Space fuzzy profile created and activated.');
            } else {
              message.warning(
                'Space was created; fuzzy override was not applied automatically. Use Edit space.',
              );
            }
          } catch {
            message.warning(
              'Space was created but fuzzy override failed. Try Edit space.',
            );
          }
        }

        handleCancel();
        onSuccess?.();
      },
    });
  };

  const handleCancel = () => {
    form.resetFields();
    setActiveTab('basic');
    onClose();
  };

  return (
    <Modal
      title='Create New Space'
      centered
      width={700}
      open={open}
      destroyOnClose
      onCancel={handleCancel}
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
        styles={{
          label: {
            height: 22,
          },
        }}
      >
        <Segmented
          block
          size='large'
          value={activeTab}
          onChange={(value) => setActiveTab(value as 'basic' | 'fuzzy')}
          options={[
            { label: 'Basic Information', value: 'basic' },
            { label: 'Fuzzy Profile', value: 'fuzzy' },
          ]}
          style={{ marginBottom: 24 }}
        />

        <div style={{ display: activeTab === 'basic' ? 'block' : 'none' }}>
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

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label='Max Occupancy'
                name='maxOccupancy'
                rules={createSpaceValidation.maxOccupancy}
              >
                <InputNumber
                  min={1}
                  style={{ width: '100%' }}
                  placeholder='e.g., 50'
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label='Critical Queue Threshold'
                name='criticalQueueThreshold'
                rules={createSpaceValidation.criticalQueueThreshold}
              >
                <InputNumber
                  min={1}
                  style={{ width: '100%' }}
                  placeholder='e.g., 10'
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label='IoT Device ID'
            name='ioTDeviceId'
            tooltip='Device identifier used by CAMS telemetry query for this space'
          >
            <Input placeholder='e.g., esp32-people-counter' />
          </Form.Item>
        </div>
        <div style={{ display: activeTab === 'fuzzy' ? 'block' : 'none' }}>
          <Form.Item
            name='applyFuzzyAfterCreate'
            valuePropName='checked'
            initialValue={false}
            style={{ marginBottom: 16 }}
          >
            <SettingSwitch
              label='Create & Activate Fuzzy Profile'
              description='Automatically create and activate a space fuzzy profile after space creation'
              className='pt-0!'
            />
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prev, cur) =>
              prev.applyFuzzyAfterCreate !== cur.applyFuzzyAfterCreate
            }
          >
            {({ getFieldValue }) =>
              getFieldValue('applyFuzzyAfterCreate') ? (
                <SpaceFuzzyOverrideFields />
              ) : null
            }
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
};
