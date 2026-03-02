import { useEffect } from 'react';
import { Button, Drawer, Form, Select, Flex, Spin, Typography } from 'antd';

/**
 * Hooks
 */
import { useStaffDetail } from '@/features/manager/hooks/useStaffDetail';
import { useAssignStaffStore } from '@/features/manager/hooks/useAssignStaffStore';
import { useStores } from '@/features/manager/hooks/useStores';

/**
 * Types
 */
import type { AssignStaffStoreRequest } from '@/features/manager/types/staffTypes';
import { EntityStatusEnum } from '@/shared/types/commonTypes';

/**
 * Validations
 */
import { assignStoreValidation } from '@/features/manager/validations/staffValidation';

const { Text } = Typography;

type AssignStaffStoreDrawerProps = {
  open: boolean;
  staffId: string | null;
  onClose: () => void;
  onSuccess: () => void;
};

export const AssignStaffStoreDrawer = ({
  open,
  staffId,
  onClose,
  onSuccess,
}: AssignStaffStoreDrawerProps) => {
  const [form] = Form.useForm<AssignStaffStoreRequest>();
  const { data: staff, isLoading: isLoadingStaff } = useStaffDetail(
    staffId || undefined,
    open && !!staffId,
  );
  const { data: storesData } = useStores({
    status: EntityStatusEnum.Active,
    pageSize: 100,
  });
  const assignStore = useAssignStaffStore();

  const storeOptions = [
    { label: 'Unassign (No Store)', value: null },
    ...(storesData?.items.map((store) => ({
      label: store.name,
      value: store.id,
    })) || []),
  ];

  useEffect(() => {
    if (staff && open) {
      form.setFieldValue('newStoreId', staff.storeId);
    }
  }, [staff, open, form]);

  const handleSubmit = async (values: AssignStaffStoreRequest) => {
    if (!staffId) return;

    assignStore.mutate(
      { id: staffId, data: values },
      {
        onSuccess: () => {
          form.resetFields();
          onSuccess();
          onClose();
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
      title='Assign Store'
      placement='right'
      width={520}
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
            loading={assignStore.isPending}
            disabled={isLoadingStaff}
          >
            Assign Store
          </Button>
        </Flex>
      }
    >
      {isLoadingStaff ? (
        <div className='flex h-96 items-center justify-center'>
          <Spin size='large' />
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 24 }}>
            <Text strong>Staff Member: </Text>
            <Text>{staff?.fullName}</Text>
            <br />
            <Text strong>Email: </Text>
            <Text>{staff?.email}</Text>
            <br />
            <Text strong>Current Store: </Text>
            <Text type={staff?.storeName ? 'success' : 'secondary'}>
              {staff?.storeName || 'Not Assigned'}
            </Text>
          </div>

          <Form
            size='large'
            form={form}
            layout='vertical'
            onFinish={handleSubmit}
          >
            <Form.Item
              label='New Store'
              name='newStoreId'
              rules={assignStoreValidation.newStoreId}
              extra='Select a store to assign or "Unassign" to remove assignment'
            >
              <Select
                placeholder='Select a store'
                options={storeOptions}
                showSearch
                filterOption={(input, option) =>
                  option?.label
                    ? option.label.toLowerCase().includes(input.toLowerCase())
                    : false
                }
              />
            </Form.Item>
          </Form>
        </>
      )}
    </Drawer>
  );
};
