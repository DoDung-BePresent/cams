import { useState, useEffect } from 'react';
import { Button, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router';
import type { Device } from '@/features/manager/types/deviceTypes';
import { PairDeviceModal } from './components/PairDeviceModal';
import { getDeviceColumns } from './components/DeviceTableColumns';
import { PageHeader } from '@/shared/components/common/PageHeader';
import { DataTable } from '@/shared/components/common/DataTable';
import { useBranchStore } from '@/features/manager/stores/useBranchStore';
import { showDeleteConfirm } from '@/shared/components/ui/DeleteConfirmModal'; // ✅ Import
import { CustomModal } from '@/shared/utils/customModal'; // ✅ Import

export const DeviceList = () => {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const currentBranch = useBranchStore((state) => state.currentBranch);

  const [devices, setDevices] = useState<Device[]>([
    {
      id: '1',
      device_id: 'ESP32_AA:BB:CC:DD:EE:FF',
      device_type: 'esp32',
      space_id: '1',
      space_name: 'Main Floor',
      status: 'active',
      last_connected_at: '2024-01-20T14:30:00Z',
      device_info: {
        firmware_version: '1.2.0',
        ip_address: '192.168.1.100',
      },
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-20T14:30:00Z',
    },
    {
      id: '2',
      device_id: 'ANDROID_123456789ABCDEF',
      device_type: 'android',
      space_id: '2',
      space_name: 'VIP Area',
      status: 'offline',
      last_connected_at: '2024-01-19T18:00:00Z',
      device_info: {
        os_version: 'Android 14',
        ip_address: '192.168.1.101',
      },
      created_at: '2024-01-16T10:00:00Z',
      updated_at: '2024-01-19T18:00:00Z',
    },
    {
      id: '3',
      device_id: 'ESP32_11:22:33:44:55:66',
      device_type: 'esp32',
      status: 'unpaired',
      created_at: '2024-01-18T10:00:00Z',
      updated_at: '2024-01-18T10:00:00Z',
    },
  ]);

  const handleUnpair = (deviceId: string) => {
    const device = devices.find((d) => d.id === deviceId);

    CustomModal.confirm({
      title: 'Are you sure you want to unpair this device?',
      content: `Device "${device?.device_id}" will no longer be associated with any space.`,
      okText: 'Yes, Unpair',
      okButtonProps: {
        danger: true,
      },
      onOk: async () => {
        setDevices(
          devices.map((d) =>
            d.id === deviceId
              ? {
                  ...d,
                  space_id: undefined,
                  space_name: undefined,
                  status: 'unpaired',
                }
              : d,
          ),
        );
        message.success('Device unpaired successfully!');
        // TODO: Call API to unpair device
      },
    });
  };

  const handleDelete = (deviceId: string) => {
    const device = devices.find((d) => d.id === deviceId);

    showDeleteConfirm({
      title: 'Are you sure you want to delete this device?',
      itemName: device?.device_id,
      content: 'This action cannot be undone.',
      onConfirm: async () => {
        setDevices(devices.filter((d) => d.id !== deviceId));
        message.success('Device deleted successfully!');
        // TODO: Call API to delete device
      },
    });
  };

  const breadcrumbs = [
    {
      title: 'Dashboard',
      onClick: () => navigate('/manager/dashboard'),
      className: 'cursor-pointer',
    },
    {
      title: 'Device Management',
    },
  ];

  const columns = getDeviceColumns({
    onUnpair: handleUnpair,
    onDelete: handleDelete,
  });

  // Redirect if no branch selected
  useEffect(() => {
    if (!currentBranch) {
      message.warning('No branch selected. Redirecting to dashboard...');
      navigate('/manager/dashboard');
    }
  }, [currentBranch, navigate]);

  if (!currentBranch) return null;

  return (
    <div>
      <PageHeader
        title={`Device Management - ${currentBranch.branch_name}`}
        breadcrumbs={breadcrumbs}
        extra={
          <Button
            size='large'
            type='primary'
            icon={<PlusOutlined />}
            onClick={() => setModalOpen(true)}
          >
            Pair Device
          </Button>
        }
      />

      <DataTable
        columns={columns}
        dataSource={devices}
        rowKey='id'
      />

      <PairDeviceModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          // TODO: Refresh devices list
          setModalOpen(false);
        }}
      />
    </div>
  );
};
