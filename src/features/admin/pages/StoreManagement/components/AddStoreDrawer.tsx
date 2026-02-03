import { useState } from 'react';
import { Button, Drawer, Form, Input, Select, Switch, message } from 'antd';
import type { CreateStoreDto } from '@/features/admin/types/storeTypes';
import { BUSINESS_TYPES } from '@/features/admin/constants/storeConstants';
import { storeValidation } from '@/features/admin/validations/storeValidation';

const { TextArea } = Input;

type AddStoreDrawerProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: (store: CreateStoreDto) => void;
};

export const AddStoreDrawer = ({
  open,
  onClose,
  onSuccess,
}: AddStoreDrawerProps) => {
  const [form] = Form.useForm<CreateStoreDto>();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: CreateStoreDto) => {
    try {
      setLoading(true);
      // TODO: Call API to create store
      console.log('Create store:', values);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      message.success('Store created successfully!');
      onSuccess(values);
      form.resetFields();
      onClose();
    } catch (error) {
      message.error('Failed to create store!');
    } finally {
      setLoading(false);
    }
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
      width={520}
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
            loading={loading}
          >
            Create Store
          </Button>
        </div>
      }
    >
      <Form
        size='large'
        form={form}
        layout='vertical'
        onFinish={handleSubmit}
        initialValues={{
          status: 'active',
          manager_emails: [],
        }}
        styles={{
          label: {
            height: 22,
          },
        }}
      >
        <Form.Item
          label='Store Name'
          name='store_name'
          rules={storeValidation.store_name}
        >
          <Input placeholder='e.g., Moonlight Coffee' />
        </Form.Item>

        <Form.Item
          label='Business Type'
          name='business_type'
          rules={storeValidation.business_type}
        >
          <Select
            placeholder='Select business type'
            options={BUSINESS_TYPES}
          />
        </Form.Item>

        <Form.Item
          label='Description'
          name='description'
          rules={storeValidation.description}
        >
          <TextArea
            rows={4}
            placeholder='Short description of the store'
            maxLength={500}
            showCount
            styles={{
              count: {
                fontSize: 14,
              },
            }}
          />
        </Form.Item>

        <Form.Item
          label='Manager Emails'
          name='manager_emails'
          rules={storeValidation.manager_emails}
          extra='Managers can be invited now or later.'
        >
          <Select
            mode='tags'
            placeholder='Enter manager emails and press Enter'
            tokenSeparators={[',']}
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item
          label='Store Status'
          name='status'
          valuePropName='checked'
          getValueFromEvent={(checked) => (checked ? 'active' : 'inactive')}
          getValueProps={(value) => ({ checked: value === 'active' })}
        >
          <Switch />
        </Form.Item>
      </Form>
    </Drawer>
  );
};
