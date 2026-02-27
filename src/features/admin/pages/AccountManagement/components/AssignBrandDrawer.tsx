import { Form, Select, message, Drawer, Button, Flex, Typography } from 'antd';

/**
 * Hooks
 */
import { useAssignAccountBrand } from '@/features/admin/hooks/useAssignAccountBrand';
import { useBrands } from '@/features/admin/hooks/useBrands';
import { useAccount } from '@/features/admin/hooks/useAccount';

/**
 * Types
 */
import type { AssignBrandRequest } from '@/features/admin/types/accountTypes';

/**
 * Validations
 */
import { assignBrandValidation } from '@/features/admin/validations/accountValidation';

const { Text } = Typography;

type AssignBrandDrawerProps = {
  open: boolean;
  accountId: string | null;
  onClose: () => void;
  onSuccess: () => void;
};

export const AssignBrandDrawer = ({
  open,
  accountId,
  onClose,
  onSuccess,
}: AssignBrandDrawerProps) => {
  const [form] = Form.useForm<AssignBrandRequest>();
  const assignBrand = useAssignAccountBrand();

  const { data: account } = useAccount(
    accountId || undefined,
    open && !!accountId,
  );
  const { data: brandsData } = useBrands({ pageSize: 100 });

  const brandOptions =
    brandsData?.items.map((brand) => ({
      label: brand.name,
      value: brand.id,
    })) || [];

  const handleSubmit = async (values: AssignBrandRequest) => {
    if (!accountId) {
      message.error('Account ID is missing!');
      return;
    }

    assignBrand.mutate(
      { id: accountId, data: values },
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
      title='Reassign Brand'
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
            loading={assignBrand.isPending}
            danger
          >
            Reassign Brand
          </Button>
        </Flex>
      }
    >
      {account && (
        <div
          style={{
            marginBottom: 24,
            padding: 16,
            background: '#fff7e6',
            borderRadius: 8,
          }}
        >
          <Text strong>Current Assignment:</Text>
          <div style={{ marginTop: 8 }}>
            <Text>
              Account: {account.fullName} ({account.email})
            </Text>
            <br />
            <Text>Current Brand: {account.brandName || 'None'}</Text>
          </div>
          <div style={{ marginTop: 12, color: '#fa8c16' }}>
            ⚠️ Warning: Reassigning will revoke access to the current brand and
            log out the user.
          </div>
        </div>
      )}

      <Form
        size='large'
        form={form}
        layout='vertical'
        onFinish={handleSubmit}
      >
        <Form.Item
          label='New Brand'
          name='newBrandId'
          rules={assignBrandValidation.newBrandId}
        >
          <Select
            placeholder='Select new brand'
            options={brandOptions}
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
          />
        </Form.Item>
      </Form>
    </Drawer>
  );
};
