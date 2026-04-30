import { useState } from 'react';
import {
  Modal,
  Typography,
  Table,
  Button,
  Space,
  Tag,
  Empty,
  Flex,
} from 'antd';
import {
  SoundOutlined,
  QrcodeOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PoweroffOutlined,
} from '@ant-design/icons';
import {
  useDeleteSpace,
  useSpaces,
  useToggleSpaceStatus,
} from '@/shared/modules/spaces/hooks';
import {
  CreateSpaceDrawer,
  EditSpaceDrawer,
  SpaceMusicModal,
} from '@/features/store/pages/SpaceManagement/components';
import { PairDeviceModal } from '@/shared/modules/cams/components';
import type {
  SpaceListItem,
  SpaceFilter,
  SpaceTypeEnum,
} from '@/shared/modules/spaces/types';
import { EntityStatusEnum } from '@/shared/types';
import {
  SPACE_TYPE_COLORS,
  SPACE_TYPE_LABELS,
} from '@/features/store/constants';
import { AppModal } from '@/shared/components';

const { Text } = Typography;

interface StoreSpacesDrawerProps {
  open: boolean;
  storeId: string | null;
  storeName?: string;
  onClose: () => void;
}

/**
 * StoreSpacesDrawer - Hiển thị danh sách spaces của store cho Brand role
 * Brand có thể xem spaces và quản lý nhạc cho từng space
 */
export const StoreSpacesDrawer = ({
  open,
  storeId,
  onClose,
}: StoreSpacesDrawerProps) => {
  const [musicDrawerOpen, setMusicDrawerOpen] = useState(false);
  const [createSpaceOpen, setCreateSpaceOpen] = useState(false);
  const [editSpaceOpen, setEditSpaceOpen] = useState(false);
  const [pairDeviceModalOpen, setPairDeviceModalOpen] = useState(false);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);
  const deleteSpace = useDeleteSpace();
  const toggleSpaceStatus = useToggleSpaceStatus();

  // Fetch spaces for this store
  const filter: SpaceFilter = {
    page: 1,
    pageSize: 100,
    storeId: storeId || undefined,
  };

  const {
    data: spacesData,
    isLoading,
    refetch,
  } = useSpaces(filter, open && !!storeId);

  const handleManageMusic = (spaceId: string) => {
    setSelectedSpaceId(spaceId);
    setMusicDrawerOpen(true);
  };

  const handlePairDevice = (spaceId: string) => {
    setSelectedSpaceId(spaceId);
    setPairDeviceModalOpen(true);
  };

  const handleEditSpace = (spaceId: string) => {
    setSelectedSpaceId(spaceId);
    setEditSpaceOpen(true);
  };

  const handleToggleStatus = (record: SpaceListItem) => {
    const isActive = record.status === EntityStatusEnum.Active;
    AppModal.warning({
      title: `${isActive ? 'Deactivate' : 'Activate'} Space`,
      content: `Are you sure you want to ${isActive ? 'deactivate' : 'activate'} "${record.name}"?`,
      okText: isActive ? 'Deactivate' : 'Activate',
      cancelText: 'Cancel',
      okButtonProps: { danger: isActive },
      onOk: () =>
        toggleSpaceStatus.mutate(record.id, { onSuccess: () => refetch() }),
    });
  };

  const handleDeleteSpace = (record: SpaceListItem) => {
    AppModal.confirm({
      title: 'Delete Space',
      content: `Delete "${record.name}"? This action cannot be undone.`,
      okText: 'Delete',
      cancelText: 'Cancel',
      okButtonProps: { danger: true },
      onOk: () => deleteSpace.mutate(record.id, { onSuccess: () => refetch() }),
    });
  };

  const columns = [
    {
      title: 'No.',
      key: 'index',
      width: 60,
      render: (_: unknown, __: SpaceListItem, index: number) => index + 1,
    },
    {
      title: 'Space Name',
      dataIndex: 'name',
      key: 'name',
      width: 220,
      render: (name: string) => (
        <Text
          strong
          style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}
        >
          {name}
        </Text>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 140,
      render: (type: SpaceTypeEnum) => (
        <Tag color={SPACE_TYPE_COLORS[type] ?? 'default'}>
          {SPACE_TYPE_LABELS[type] ?? 'Unknown'}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: EntityStatusEnum) => (
        <Tag color={status === EntityStatusEnum.Active ? 'success' : 'default'}>
          {status === EntityStatusEnum.Active ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 430,
      render: (_: unknown, record: SpaceListItem) => (
        <Space
          wrap
          size={[8, 8]}
        >
          <Button
            type='primary'
            icon={<SoundOutlined />}
            onClick={() => handleManageMusic(record.id)}
          >
            Manage Music
          </Button>
          <Button
            icon={<QrcodeOutlined />}
            onClick={() => handlePairDevice(record.id)}
          >
            Pair Device
          </Button>
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEditSpace(record.id)}
          >
            Edit
          </Button>
          <Button
            icon={<PoweroffOutlined />}
            onClick={() => handleToggleStatus(record)}
          >
            {record.status === EntityStatusEnum.Active
              ? 'Deactivate'
              : 'Activate'}
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteSpace(record)}
          />
        </Space>
      ),
    },
  ];

  return (
    <>
      <Modal
        closeIcon={null}
        title={
          <Flex
            align='center'
            justify='space-between'
            gap={12}
            style={{ paddingRight: 28 }}
          >
            <span>Spaces</span>
            <Button
              type='primary'
              icon={<PlusOutlined />}
              onClick={(event) => {
                event.stopPropagation();
                setCreateSpaceOpen(true);
              }}
            >
              Add Space
            </Button>
          </Flex>
        }
        open={open}
        onCancel={onClose}
        width={1080}
        destroyOnClose
        centered
        footer={null}
        styles={{
          body: { maxHeight: '76vh', overflowY: 'auto', paddingRight: 12 },
        }}
      >
        {!spacesData?.items.length && !isLoading ? (
          <Empty description='No spaces found in this store' />
        ) : (
          <Space
            direction='vertical'
            style={{ width: '100%' }}
            size='large'
          >
            <Text type='secondary'>
              Select a space to manage its music playback
            </Text>
            <Table
              columns={columns}
              dataSource={spacesData?.items || []}
              rowKey='id'
              loading={isLoading}
              pagination={false}
              scroll={{ x: 970 }}
            />
          </Space>
        )}
      </Modal>

      <SpaceMusicModal
        open={musicDrawerOpen}
        spaceId={selectedSpaceId}
        storeId={storeId || ''}
        onClose={() => {
          setMusicDrawerOpen(false);
          setSelectedSpaceId(null);
        }}
      />

      <CreateSpaceDrawer
        open={createSpaceOpen}
        storeId={storeId || undefined}
        onClose={() => setCreateSpaceOpen(false)}
        onSuccess={() => {
          setCreateSpaceOpen(false);
          refetch();
        }}
      />

      <EditSpaceDrawer
        open={editSpaceOpen}
        spaceId={selectedSpaceId}
        onClose={() => {
          setEditSpaceOpen(false);
          setSelectedSpaceId(null);
        }}
        onSuccess={() => {
          setEditSpaceOpen(false);
          setSelectedSpaceId(null);
          refetch();
        }}
      />

      <PairDeviceModal
        open={pairDeviceModalOpen}
        spaceId={selectedSpaceId}
        onClose={() => {
          setPairDeviceModalOpen(false);
          setSelectedSpaceId(null);
        }}
      />
    </>
  );
};
