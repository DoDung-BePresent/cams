import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import {
  Button,
  Input,
  Modal,
  Select,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  ApiOutlined,
  BankOutlined,
  CheckCircleOutlined,
  CloudServerOutlined,
  CloseCircleOutlined,
  DisconnectOutlined,
  EnvironmentOutlined,
  HomeOutlined,
  ReloadOutlined,
  SearchOutlined,
  WarningOutlined,
} from '@ant-design/icons';

import {
  IotCommandAction,
  IotCommandStatus,
  IotHealthStatus,
  type AdminIotSpaceListItem,
  type BrandListItem,
} from '@/features/admin/types';
import {
  useAdminIotRealtime,
  useAdminIotSpaces,
  useAdminIotSummary,
  useSendAdminIotCommand,
} from '@/features/admin/hooks';
import { brandService } from '@/features/admin/services';
import { storeService } from '@/features/brand/services';
import type { StoreListItem } from '@/features/brand/types';
import { DataTable, PageHeader } from '@/shared/components';
import { PAGINATION_SIZES } from '@/shared/constants';
import { spaceService } from '@/shared/modules/spaces/services';
import type { SpaceListItem } from '@/shared/modules/spaces/types';

const { Text } = Typography;
const DEFAULT_PAGE_SIZE = 10;

const C = {
  surface: '#18181b',
  border: '#2d2528',
  red: '#ef4444',
  green: '#22c55e',
  amber: '#f59e0b',
  blue: '#3b82f6',
  text: '#f8f7f7',
  muted: '#b7adb0',
  subtle: '#857b80',
};

const healthMeta: Record<
  IotHealthStatus,
  { label: string; color: string; icon: ReactNode }
> = {
  [IotHealthStatus.NoDevice]: {
    label: 'No device',
    color: 'default',
    icon: <DisconnectOutlined />,
  },
  [IotHealthStatus.Online]: {
    label: 'Online',
    color: 'green',
    icon: <CheckCircleOutlined />,
  },
  [IotHealthStatus.Offline]: {
    label: 'Offline',
    color: 'red',
    icon: <WarningOutlined />,
  },
  [IotHealthStatus.Stale]: {
    label: 'Stale',
    color: 'gold',
    icon: <WarningOutlined />,
  },
  [IotHealthStatus.Unknown]: {
    label: 'Unknown',
    color: 'default',
    icon: <CloudServerOutlined />,
  },
};

const actionOptions = [
  { label: 'Get info', value: IotCommandAction.GetInfo },
  { label: 'Status', value: IotCommandAction.Status },
  { label: 'Restart', value: IotCommandAction.Restart },
  { label: 'Factory reset', value: IotCommandAction.FactoryReset },
  { label: 'Stop BLE', value: IotCommandAction.StopBle },
  { label: 'Disable device', value: IotCommandAction.DisableDevice },
  { label: 'Enable device', value: IotCommandAction.EnableDevice },
];

const commandStatusLabel = (status?: IotCommandStatus | null) => {
  if (!status) return 'No command';
  return IotCommandStatus[status] ?? 'Unknown';
};

const formatAge = (seconds?: number | null) => {
  if (seconds == null) return 'No telemetry';
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m ago`;
  return `${Math.round(seconds / 3600)}h ago`;
};

type PickerScope = 'brand' | 'store' | 'space';
type SelectedOption = { id: string; name: string };

export const AdminIotManagementPage = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = useState('');
  const [selectedBrandId, setSelectedBrandId] = useState<string | undefined>();
  const [selectedStoreId, setSelectedStoreId] = useState<string | undefined>();
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | undefined>();
  const [selectedBrand, setSelectedBrand] = useState<SelectedOption | null>(
    null,
  );
  const [selectedStore, setSelectedStore] = useState<SelectedOption | null>(
    null,
  );
  const [selectedSpaceOption, setSelectedSpaceOption] =
    useState<SelectedOption | null>(null);
  const [healthStatus, setHealthStatus] = useState<
    IotHealthStatus | undefined
  >();
  const [selectedSpace, setSelectedSpace] =
    useState<AdminIotSpaceListItem | null>(null);
  const [selectedAction, setSelectedAction] = useState<IotCommandAction>(
    IotCommandAction.Status,
  );
  const [reason, setReason] = useState('');
  const [pickerScope, setPickerScope] = useState<PickerScope | null>(null);
  const [pickerSearch, setPickerSearch] = useState('');
  const [brandPickerPage, setBrandPickerPage] = useState(1);
  const [brandPickerPageSize, setBrandPickerPageSize] =
    useState(DEFAULT_PAGE_SIZE);
  const [storePickerPage, setStorePickerPage] = useState(1);
  const [storePickerPageSize, setStorePickerPageSize] =
    useState(DEFAULT_PAGE_SIZE);
  const [spacePickerPage, setSpacePickerPage] = useState(1);
  const [spacePickerPageSize, setSpacePickerPageSize] =
    useState(DEFAULT_PAGE_SIZE);

  const pickerSearchValue = pickerSearch.trim();
  const { data: brandsData, isLoading: brandsLoading } = useQuery({
    queryKey: [
      'admin-iot-brand-picker',
      brandPickerPage,
      brandPickerPageSize,
      pickerSearchValue,
    ],
    queryFn: async () => {
      const response = await brandService.getList({
        page: brandPickerPage,
        pageSize: brandPickerPageSize,
        search: pickerSearchValue || undefined,
        sortBy: 'name',
        isAscending: true,
      });
      return response.data;
    },
    enabled: pickerScope === 'brand',
    placeholderData: (previousData) => previousData,
  });
  const { data: storesData, isLoading: storesLoading } = useQuery({
    queryKey: [
      'admin-iot-store-picker',
      selectedBrandId,
      storePickerPage,
      storePickerPageSize,
      pickerSearchValue,
    ],
    queryFn: async () => {
      const response = await storeService.getList({
        page: storePickerPage,
        pageSize: storePickerPageSize,
        brandId: selectedBrandId,
        search: pickerSearchValue || undefined,
        sortBy: 'name',
        isAscending: true,
      });
      return response.data;
    },
    enabled: pickerScope === 'store' && Boolean(selectedBrandId),
    placeholderData: (previousData) => previousData,
  });
  const { data: spacesData, isLoading: spacesLoading } = useQuery({
    queryKey: [
      'admin-iot-space-picker',
      selectedStoreId,
      spacePickerPage,
      spacePickerPageSize,
      pickerSearchValue,
    ],
    queryFn: async () => {
      const response = await spaceService.getList({
        page: spacePickerPage,
        pageSize: spacePickerPageSize,
        storeId: selectedStoreId,
        search: pickerSearchValue || undefined,
        sortBy: 'name',
        isAscending: true,
      });
      return response.data;
    },
    enabled: pickerScope === 'space' && Boolean(selectedStoreId),
    placeholderData: (previousData) => previousData,
  });

  const filter = useMemo(
    () => ({
      page,
      pageSize,
      search: search.trim() || undefined,
      brandId: selectedBrandId,
      storeId: selectedStoreId,
      spaceId: selectedSpaceId,
      healthStatus,
    }),
    [
      healthStatus,
      page,
      pageSize,
      search,
      selectedBrandId,
      selectedSpaceId,
      selectedStoreId,
    ],
  );
  useAdminIotRealtime();

  const { data: summaryResult, isLoading: summaryLoading } =
    useAdminIotSummary();
  const {
    data: spaces,
    isLoading,
    refetch: refetchSpaces,
  } = useAdminIotSpaces(filter);
  const sendCommand = useSendAdminIotCommand();
  const summary = summaryResult?.data;
  const hasActiveFilters =
    search.trim() ||
    selectedBrandId ||
    selectedStoreId ||
    selectedSpaceId ||
    healthStatus !== undefined;
  const pickerTitle =
    pickerScope === 'brand'
      ? 'Select brand'
      : pickerScope === 'store'
        ? 'Select store'
        : 'Select space';

  const openPicker = (scope: PickerScope) => {
    if (scope === 'store' && !selectedBrandId) {
      message.info('Select a brand first.');
      return;
    }

    if (scope === 'space' && !selectedStoreId) {
      message.info('Select a store first.');
      return;
    }

    setPickerScope(scope);
    setPickerSearch('');
    setBrandPickerPage(1);
    setStorePickerPage(1);
    setSpacePickerPage(1);
  };

  const clearBrand = () => {
    setSelectedBrandId(undefined);
    setSelectedBrand(null);
    setSelectedStoreId(undefined);
    setSelectedStore(null);
    setSelectedSpaceId(undefined);
    setSelectedSpaceOption(null);
    setPage(1);
  };

  const clearStore = () => {
    setSelectedStoreId(undefined);
    setSelectedStore(null);
    setSelectedSpaceId(undefined);
    setSelectedSpaceOption(null);
    setPage(1);
  };

  const clearSpace = () => {
    setSelectedSpaceId(undefined);
    setSelectedSpaceOption(null);
    setPage(1);
  };

  const resetFilters = () => {
    setSearch('');
    setHealthStatus(undefined);
    clearBrand();
  };

  const selectBrand = (brand: BrandListItem) => {
    setSelectedBrandId(brand.id);
    setSelectedBrand({ id: brand.id, name: brand.name });
    setSelectedStoreId(undefined);
    setSelectedStore(null);
    setSelectedSpaceId(undefined);
    setSelectedSpaceOption(null);
    setPage(1);
    setPickerScope(null);
  };

  const selectStore = (store: StoreListItem) => {
    setSelectedStoreId(store.id);
    setSelectedStore({ id: store.id, name: store.name });
    setSelectedSpaceId(undefined);
    setSelectedSpaceOption(null);
    setPage(1);
    setPickerScope(null);
  };

  const selectSpace = (space: SpaceListItem) => {
    setSelectedSpaceId(space.id);
    setSelectedSpaceOption({ id: space.id, name: space.name });
    setPage(1);
    setPickerScope(null);
  };

  const columns = [
    {
      title: 'Space / Device',
      dataIndex: 'spaceName',
      render: (_: string, row: AdminIotSpaceListItem) => (
        <div>
          <Text style={{ color: C.text, fontWeight: 900 }}>
            {row.spaceName}
          </Text>
          <Text style={{ display: 'block', color: C.subtle, fontSize: 12 }}>
            {row.brandName} / {row.storeName}
          </Text>
          <Text
            style={{ color: row.deviceId ? C.blue : C.subtle, fontSize: 12 }}
          >
            {row.deviceId || 'No assigned device'}
          </Text>
        </div>
      ),
    },
    {
      title: 'Health',
      dataIndex: 'healthStatus',
      width: 132,
      render: (value: IotHealthStatus) => {
        const meta = healthMeta[value];
        return (
          <Tag
            icon={meta.icon}
            color={meta.color}
          >
            {meta.label}
          </Tag>
        );
      },
    },
    {
      title: 'Telemetry',
      width: 180,
      render: (_: unknown, row: AdminIotSpaceListItem) => (
        <div>
          <Text style={{ color: C.text, fontWeight: 800 }}>
            {row.peopleCount ?? '-'} people / {row.noiseDecibel ?? '-'} dB
          </Text>
          <Text style={{ display: 'block', color: C.subtle, fontSize: 12 }}>
            {formatAge(row.telemetryAgeSeconds)}
          </Text>
        </div>
      ),
    },
    {
      title: 'Latest Command',
      width: 155,
      render: (_: unknown, row: AdminIotSpaceListItem) => (
        <div>
          <Tag
            color={
              row.latestCommandStatus === IotCommandStatus.Ok
                ? 'green'
                : 'default'
            }
          >
            {commandStatusLabel(row.latestCommandStatus)}
          </Tag>
          {row.latestCommandAtUtc && (
            <Text style={{ display: 'block', color: C.subtle, fontSize: 12 }}>
              {new Date(row.latestCommandAtUtc).toLocaleString()}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: 'Command',
      width: 122,
      render: (_: unknown, row: AdminIotSpaceListItem) => (
        <Button
          icon={<ApiOutlined />}
          disabled={!row.isAssigned}
          onClick={() => {
            setSelectedSpace(row);
            setSelectedAction(IotCommandAction.Status);
            setReason('');
          }}
        >
          Send
        </Button>
      ),
    },
  ];

  const confirmSend = async () => {
    if (!selectedSpace) return;

    try {
      await sendCommand.mutateAsync({
        spaceId: selectedSpace.spaceId,
        payload: {
          action: selectedAction,
          reason: reason.trim() || undefined,
        },
      });
      message.success('Command published. Waiting for device response.');
      setSelectedSpace(null);
    } catch {
      message.error('Failed to publish IoT command.');
    }
  };

  const renderPickerButton = ({
    label,
    value,
    placeholder,
    icon,
    disabled,
    onOpen,
    onClear,
  }: {
    label: string;
    value?: string | null;
    placeholder: string;
    icon: ReactNode;
    disabled?: boolean;
    onOpen: () => void;
    onClear: () => void;
  }) => (
    <div
      style={{
        minWidth: 0,
        display: 'flex',
        alignItems: 'stretch',
        gap: 6,
      }}
    >
      <Button
        disabled={disabled}
        onClick={onOpen}
        style={{
          width: '100%',
          minWidth: 0,
          height: 56,
          padding: '8px 12px',
          textAlign: 'left',
          background: value
            ? 'linear-gradient(135deg, rgba(239,68,68,0.16), rgba(59,130,246,0.08))'
            : 'rgba(18,18,20,0.86)',
          borderColor: value
            ? 'rgba(239,68,68,0.36)'
            : 'rgba(148,163,184,0.16)',
          boxShadow: value ? 'inset 0 0 0 1px rgba(239,68,68,0.08)' : 'none',
        }}
      >
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            minWidth: 0,
          }}
        >
          <span
            style={{
              width: 34,
              height: 34,
              flex: '0 0 34px',
              borderRadius: 8,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: value ? C.red : C.muted,
              background: value
                ? 'rgba(239,68,68,0.16)'
                : 'rgba(255,255,255,0.04)',
            }}
          >
            {icon}
          </span>
          <span style={{ display: 'grid', gap: 2, minWidth: 0, flex: 1 }}>
            <Text
              style={{
                color: C.subtle,
                fontSize: 11,
                fontWeight: 800,
                lineHeight: 1,
              }}
            >
              {label}
            </Text>
            <Text
              style={{
                color: value ? C.text : C.muted,
                fontWeight: value ? 850 : 650,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                lineHeight: 1.2,
              }}
            >
              {value || placeholder}
            </Text>
          </span>
        </span>
      </Button>
      {value && (
        <Button
          aria-label={`Clear ${label}`}
          icon={<CloseCircleOutlined />}
          onClick={onClear}
          style={{
            height: 56,
            width: 38,
            flex: '0 0 38px',
            background: 'rgba(18,18,20,0.86)',
            borderColor: 'rgba(148,163,184,0.16)',
          }}
        />
      )}
    </div>
  );

  const renderPickerTable = () => {
    if (pickerScope === 'brand') {
      return (
        <Table<BrandListItem>
          rowKey='id'
          size='middle'
          loading={brandsLoading}
          dataSource={brandsData?.items ?? []}
          pagination={{
            current: brandsData?.currentPage ?? brandPickerPage,
            pageSize: brandsData?.pageSize ?? brandPickerPageSize,
            total: brandsData?.totalItems ?? 0,
            showSizeChanger: true,
            pageSizeOptions: PAGINATION_SIZES,
            showTotal: (total) => `Total ${total} brands`,
            onChange: (nextPage, nextPageSize) => {
              setBrandPickerPage(nextPage);
              setBrandPickerPageSize(nextPageSize);
            },
          }}
          onRow={(record) => ({ onClick: () => selectBrand(record) })}
          columns={[
            {
              title: 'Brand',
              dataIndex: 'name',
              render: (_: string, record) => (
                <div>
                  <Text style={{ color: C.text, fontWeight: 900 }}>
                    {record.name}
                  </Text>
                  <Text
                    style={{ display: 'block', color: C.subtle, fontSize: 12 }}
                  >
                    {record.industry || 'No industry'}
                    {record.contactEmail ? ` / ${record.contactEmail}` : ''}
                  </Text>
                </div>
              ),
            },
            {
              title: 'Contact',
              dataIndex: 'primaryContactName',
              width: 180,
              render: (value: string | null) => (
                <Text style={{ color: C.muted }}>{value || '-'}</Text>
              ),
            },
          ]}
        />
      );
    }

    if (pickerScope === 'store') {
      return (
        <Table<StoreListItem>
          rowKey='id'
          size='middle'
          loading={storesLoading}
          dataSource={storesData?.items ?? []}
          pagination={{
            current: storesData?.currentPage ?? storePickerPage,
            pageSize: storesData?.pageSize ?? storePickerPageSize,
            total: storesData?.totalItems ?? 0,
            showSizeChanger: true,
            pageSizeOptions: PAGINATION_SIZES,
            showTotal: (total) => `Total ${total} stores`,
            onChange: (nextPage, nextPageSize) => {
              setStorePickerPage(nextPage);
              setStorePickerPageSize(nextPageSize);
            },
          }}
          onRow={(record) => ({ onClick: () => selectStore(record) })}
          columns={[
            {
              title: 'Store',
              dataIndex: 'name',
              render: (_: string, record) => (
                <div>
                  <Text style={{ color: C.text, fontWeight: 900 }}>
                    {record.name}
                  </Text>
                  <Text
                    style={{ display: 'block', color: C.subtle, fontSize: 12 }}
                  >
                    {record.address || 'No address'}
                  </Text>
                </div>
              ),
            },
            {
              title: 'Area',
              width: 180,
              render: (_: unknown, record) => (
                <Text style={{ color: C.muted }}>
                  {[record.city, record.district].filter(Boolean).join(' / ') ||
                    '-'}
                </Text>
              ),
            },
          ]}
        />
      );
    }

    return (
      <Table<SpaceListItem>
        rowKey='id'
        size='middle'
        loading={spacesLoading}
        dataSource={spacesData?.items ?? []}
        pagination={{
          current: spacesData?.currentPage ?? spacePickerPage,
          pageSize: spacesData?.pageSize ?? spacePickerPageSize,
          total: spacesData?.totalItems ?? 0,
          showSizeChanger: true,
          pageSizeOptions: PAGINATION_SIZES,
          showTotal: (total) => `Total ${total} spaces`,
          onChange: (nextPage, nextPageSize) => {
            setSpacePickerPage(nextPage);
            setSpacePickerPageSize(nextPageSize);
          },
        }}
        onRow={(record) => ({ onClick: () => selectSpace(record) })}
        columns={[
          {
            title: 'Space',
            dataIndex: 'name',
            render: (_: string, record) => (
              <div>
                <Text style={{ color: C.text, fontWeight: 900 }}>
                  {record.name}
                </Text>
                <Text
                  style={{ display: 'block', color: C.subtle, fontSize: 12 }}
                >
                  Store: {selectedStore?.name || '-'}
                </Text>
              </div>
            ),
          },
          {
            title: 'Type',
            dataIndex: 'type',
            width: 120,
            render: (value: number) => <Tag color='blue'>Type {value}</Tag>,
          },
        ]}
      />
    );
  };

  const filterContent = (
    <div style={{ display: 'grid', gap: 14 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <Input
          size='large'
          allowClear
          prefix={<SearchOutlined />}
          placeholder='Search by brand, store, space, or device id'
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          style={{ width: 360, maxWidth: '100%' }}
        />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Select
            size='large'
            allowClear
            placeholder='Health status'
            value={healthStatus}
            onChange={(value) => {
              setHealthStatus(value);
              setPage(1);
            }}
            options={Object.entries(healthMeta).map(([value, meta]) => ({
              value: Number(value),
              label: meta.label,
            }))}
            style={{ width: 180 }}
          />
          <Button
            size='large'
            icon={<ReloadOutlined />}
            onClick={() => void refetchSpaces()}
          >
            Refresh
          </Button>
          {hasActiveFilters && (
            <Button
              size='large'
              onClick={resetFilters}
            >
              Reset Filters
            </Button>
          )}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(210px, 1fr))',
          gap: 10,
        }}
      >
        {renderPickerButton({
          label: 'Brand',
          value: selectedBrand?.name,
          placeholder: 'All brands',
          icon: <BankOutlined />,
          onOpen: () => openPicker('brand'),
          onClear: clearBrand,
        })}
        {renderPickerButton({
          label: 'Store',
          value: selectedStore?.name,
          placeholder: selectedBrandId ? 'All stores' : 'Select brand first',
          icon: <HomeOutlined />,
          disabled: !selectedBrandId,
          onOpen: () => openPicker('store'),
          onClear: clearStore,
        })}
        {renderPickerButton({
          label: 'Space',
          value: selectedSpaceOption?.name,
          placeholder: selectedStoreId ? 'All spaces' : 'Select store first',
          icon: <EnvironmentOutlined />,
          disabled: !selectedStoreId,
          onOpen: () => openPicker('space'),
          onClear: clearSpace,
        })}
      </div>

      {hasActiveFilters && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {selectedBrand && (
            <Tag
              closable
              onClose={clearBrand}
            >
              Brand: {selectedBrand.name}
            </Tag>
          )}
          {selectedStore && (
            <Tag
              closable
              onClose={clearStore}
            >
              Store: {selectedStore.name}
            </Tag>
          )}
          {selectedSpaceOption && (
            <Tag
              closable
              onClose={clearSpace}
            >
              Space: {selectedSpaceOption.name}
            </Tag>
          )}
          {healthStatus !== undefined && (
            <Tag
              closable
              onClose={() => setHealthStatus(undefined)}
            >
              Health: {healthMeta[healthStatus].label}
            </Tag>
          )}
          {search.trim() && (
            <Tag
              closable
              onClose={() => setSearch('')}
            >
              Search: {search.trim()}
            </Tag>
          )}
        </div>
      )}
    </div>
  );

  const breadcrumbs = [
    {
      title: 'Dashboard',
      onClick: () => navigate('/admin/dashboard'),
      className: 'cursor-pointer',
    },
    {
      title: 'IoT Management',
    },
  ];

  return (
    <div style={{ paddingBottom: 36 }}>
      <PageHeader
        title='IoT Management'
        breadcrumbs={breadcrumbs}
        seo={{
          description:
            'Manage IoT devices, telemetry freshness, command publishing, and device responses',
          keywords: 'iot, devices, telemetry, admin, cams',
        }}
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
          gap: 10,
          marginBottom: 16,
        }}
      >
        {[
          ['Total spaces', summary?.totalSpaces, C.blue],
          ['Assigned', summary?.assignedDevices, C.blue],
          ['Online', summary?.onlineDevices, C.green],
          ['Offline', summary?.offlineDevices, C.red],
          ['Stale', summary?.staleDevices, C.amber],
          ['Pending', summary?.pendingCommands, C.amber],
        ].map(([label, value, color]) => (
          <div
            key={label as string}
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              padding: 14,
            }}
          >
            <Text style={{ color: C.subtle, fontSize: 12 }}>{label}</Text>
            <div
              style={{ color: color as string, fontSize: 26, fontWeight: 900 }}
            >
              {summaryLoading ? (
                <ReloadOutlined spin />
              ) : (
                ((value as number | undefined) ?? 0)
              )}
            </div>
          </div>
        ))}
      </div>

      <DataTable<AdminIotSpaceListItem>
        filter={filterContent}
        rowKey='spaceId'
        loading={isLoading}
        columns={columns}
        dataSource={spaces?.items ?? []}
        pagination={{
          current: spaces?.currentPage ?? page,
          pageSize: spaces?.pageSize ?? pageSize,
          total: spaces?.totalItems ?? 0,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} spaces`,
          pageSizeOptions: PAGINATION_SIZES,
          onChange: (nextPage, nextPageSize) => {
            setPage(nextPage);
            setPageSize(nextPageSize);
          },
        }}
      />

      <Modal
        open={!!pickerScope}
        title={pickerTitle}
        footer={null}
        width={760}
        destroyOnHidden
        onCancel={() => setPickerScope(null)}
      >
        <div style={{ display: 'grid', gap: 12 }}>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder={`Search ${pickerScope ?? ''}...`}
            value={pickerSearch}
            onChange={(event) => {
              setPickerSearch(event.target.value);
              setBrandPickerPage(1);
              setStorePickerPage(1);
              setSpacePickerPage(1);
            }}
          />
          <div
            style={{
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              overflow: 'hidden',
            }}
          >
            {renderPickerTable()}
          </div>
        </div>
      </Modal>

      <Modal
        open={!!selectedSpace}
        title={`Send command${selectedSpace ? ` to ${selectedSpace.spaceName}` : ''}`}
        okText='Publish command'
        confirmLoading={sendCommand.isPending}
        onOk={confirmSend}
        onCancel={() => setSelectedSpace(null)}
      >
        <div style={{ display: 'grid', gap: 12 }}>
          <Text style={{ color: C.muted }}>
            Device: <b>{selectedSpace?.deviceId}</b>
          </Text>
          <Select
            value={selectedAction}
            options={actionOptions}
            onChange={setSelectedAction}
          />
          <Input.TextArea
            rows={3}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder='Optional reason for audit trail'
          />
        </div>
      </Modal>
    </div>
  );
};

export default AdminIotManagementPage;
