import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Button, Input, Spin, Empty, Typography } from 'antd';

/**
 * Icons
 */
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  PartitionOutlined,
  SettingOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';

/**
 * Types
 */
import type { StoreListItem, StoreFilter } from '@/features/brand/types';
import { EntityStatusEnum } from '@/shared/types';
import {
  GovernanceModeEnum,
  GOVERNANCE_MODE_LABELS,
} from '@/features/brand/types/configTypes';

/**
 * Hooks
 */
import { useDeleteStore, useStores } from '@/features/brand/hooks';

/**
 * Components
 */
import { PageHeader, AppModal } from '@/shared/components';
import {
  CreateStoreDrawer,
  EditStoreDrawer,
  StoreDetailDrawer,
  StoreSpacesDrawer,
  SetGovernanceModeDrawer,
} from './components';

const { Text, Title } = Typography;

const GOVERNANCE_COLORS: Record<GovernanceModeEnum, string> = {
  [GovernanceModeEnum.StrictSync]: '#f97316',
  [GovernanceModeEnum.AIMode]: '#1db954',
  [GovernanceModeEnum.Freedom]: '#3b82f6',
};

const GOVERNANCE_BG: Record<GovernanceModeEnum, string> = {
  [GovernanceModeEnum.StrictSync]: 'rgba(249,115,22,0.12)',
  [GovernanceModeEnum.AIMode]: 'rgba(29,185,84,0.12)',
  [GovernanceModeEnum.Freedom]: 'rgba(59,130,246,0.12)',
};

// ─── Constants ──────────────────────────────────────────────────────────────
const C = {
  bg: '#121212',
  surface: '#181818',
  surfaceHover: '#282828',
  border: '#282828',
  green: '#1db954',
  text: '#ffffff',
  textMuted: '#b3b3b3',
  textSubtle: '#6a6a6a',
};

export const StoreList = () => {
  const navigate = useNavigate();
  const [filter] = useState<StoreFilter>({
    page: 1,
    pageSize: 100, // Load more for grouping
    sortBy: 'createdat',
    isAscending: false,
  });

  const [search, setSearch] = useState('');
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [spacesDrawerOpen, setSpacesDrawerOpen] = useState(false);
  const [governanceModeDrawerOpen, setGovernanceModeDrawerOpen] =
    useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [selectedGovernanceMode, setSelectedGovernanceMode] =
    useState<StoreListItem['governanceMode']>();

  const { data, isLoading, refetch } = useStores(filter);

  const deleteStore = useDeleteStore();

  const handleView = (storeId: string) => {
    setSelectedStoreId(storeId);
    setDetailDrawerOpen(true);
  };

  const handleViewSpaces = (storeId: string) => {
    setSelectedStoreId(storeId);
    setSpacesDrawerOpen(true);
  };

  const handleSetGovernanceMode = (store: StoreListItem) => {
    setSelectedStoreId(store.id);
    setSelectedGovernanceMode(store.governanceMode);
    setGovernanceModeDrawerOpen(true);
  };

  const handleEdit = (store: StoreListItem) => {
    setSelectedStoreId(store.id);
    setEditDrawerOpen(true);
  };

  const handleDelete = (storeId: string) => {
    const store = data?.items.find((s) => s.id === storeId);
    AppModal.confirm({
      title: 'Delete Store',
      content: `Are you sure you want to delete "${store?.name}"? This action cannot be undone.`,
      okText: 'Delete',
      cancelText: 'Cancel',
      okButtonProps: { danger: true },
      onOk: () => {
        deleteStore.mutate(storeId);
      },
    });
  };

  // Group stores by city
  const groupedByCity = useMemo(() => {
    const items = data?.items || [];
    const filtered = search
      ? items.filter(
          (s) =>
            s.name.toLowerCase().includes(search.toLowerCase()) ||
            s.city?.toLowerCase().includes(search.toLowerCase()) ||
            s.district?.toLowerCase().includes(search.toLowerCase()),
        )
      : items;

    const groups: Record<string, StoreListItem[]> = {};
    filtered.forEach((store) => {
      const city = store.city || 'Other';
      if (!groups[city]) groups[city] = [];
      groups[city].push(store);
    });
    return groups;
  }, [data?.items, search]);

  const cities = Object.keys(groupedByCity).sort();

  const breadcrumbs = [
    {
      title: 'Dashboard',
      onClick: () => navigate('/brand/dashboard'),
      className: 'cursor-pointer',
    },
    {
      title: 'Store Management',
      onClick: () => setSelectedCity(null),
      className: 'cursor-pointer',
    },
    ...(selectedCity ? [{ title: selectedCity }] : []),
  ];

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '60vh',
        }}
      >
        <Spin size='large' />
      </div>
    );
  }

  return (
    <div
      style={{ minHeight: '100vh', background: C.bg, padding: '0 32px 40px' }}
    >
      <PageHeader
        title={selectedCity || 'Store Clusters'}
        breadcrumbs={breadcrumbs}
        extra={
          <div style={{ display: 'flex', gap: 12 }}>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => refetch()}
              style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                color: C.textMuted,
              }}
            />
            <Button
              size='large'
              type='primary'
              icon={<PlusOutlined />}
              onClick={() => setCreateDrawerOpen(true)}
              style={{
                background: C.green,
                border: 'none',
                fontWeight: 700,
                color: '#000',
              }}
            >
              Add Store
            </Button>
          </div>
        }
      />

      {/* Global Stats/Search (Only on clusters view) */}
      {!selectedCity && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 32,
            flexWrap: 'wrap',
          }}
        >
          <Input
            placeholder='Search stores, cities...'
            prefix={<SearchOutlined style={{ color: C.textSubtle }} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              maxWidth: 400,
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 10,
              color: '#fff',
              height: 48,
            }}
          />
          <div style={{ display: 'flex', gap: 12 }}>
            <div
              style={{
                color: C.textMuted,
                fontSize: 13,
                background: C.surface,
                padding: '10px 16px',
                borderRadius: 8,
              }}
            >
              Total:{' '}
              <strong style={{ color: C.text }}>{data?.totalItems || 0}</strong>
            </div>
            <div
              style={{
                color: C.textMuted,
                fontSize: 13,
                background: C.surface,
                padding: '10px 16px',
                borderRadius: 8,
              }}
            >
              Cities: <strong style={{ color: C.text }}>{cities.length}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Main View Logic */}
      {selectedCity ? (
        // ─── Detailed Store View for Selected City ───────────────────────────
        <div>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => setSelectedCity(null)}
            style={{
              marginBottom: 24,
              background: 'transparent',
              border: `1px solid ${C.border}`,
              color: C.textMuted,
            }}
          >
            Back to Clusters
          </Button>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 20,
            }}
          >
            {groupedByCity[selectedCity]?.map((store) => {
              const isActive = store.status === EntityStatusEnum.Active;
              const govColor =
                GOVERNANCE_COLORS[store.governanceMode] || C.textSubtle;
              const govBg =
                GOVERNANCE_BG[store.governanceMode] || 'rgba(83,83,83,0.12)';
              const govLabel =
                GOVERNANCE_MODE_LABELS[store.governanceMode] || 'Unknown';

              return (
                <div
                  key={store.id}
                  style={{
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    borderRadius: 16,
                    padding: 24,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor =
                      '#404040';
                    (e.currentTarget as HTMLDivElement).style.background =
                      '#222222';
                    (e.currentTarget as HTMLDivElement).style.transform =
                      'translateY(-4px)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor =
                      C.border;
                    (e.currentTarget as HTMLDivElement).style.background =
                      C.surface;
                    (e.currentTarget as HTMLDivElement).style.transform =
                      'translateY(0)';
                  }}
                  onClick={() => handleView(store.id)}
                >
                  {/* Status indicator bar */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 4,
                      background: isActive ? C.green : C.textSubtle,
                    }}
                  />

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: 12,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Title
                        level={5}
                        style={{ margin: 0, color: C.text, fontSize: 16 }}
                      >
                        {store.name}
                      </Title>
                      <Text style={{ color: C.textSubtle, fontSize: 12 }}>
                        {store.district || 'General Area'}
                      </Text>
                    </div>
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: isActive ? C.green : C.textSubtle,
                        marginTop: 6,
                      }}
                    />
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                      marginBottom: 16,
                    }}
                  >
                    <div style={{ display: 'flex', gap: 8 }}>
                      <EnvironmentOutlined
                        style={{ color: C.textSubtle, marginTop: 4 }}
                      />
                      <Text
                        style={{
                          color: C.textMuted,
                          fontSize: 13,
                          lineHeight: 1.4,
                        }}
                      >
                        {store.address || 'No address'}
                      </Text>
                    </div>
                    {store.contactNumber && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <PhoneOutlined style={{ color: C.textSubtle }} />
                        <Text style={{ color: C.textMuted, fontSize: 13 }}>
                          {store.contactNumber}
                        </Text>
                      </div>
                    )}
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <span
                      style={{
                        background: govBg,
                        color: govColor,
                        border: `1px solid ${govColor}30`,
                        borderRadius: 6,
                        padding: '4px 10px',
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {govLabel}
                    </span>
                  </div>

                  {/* Actions Area */}
                  <div
                    style={{
                      display: 'flex',
                      gap: 8,
                      borderTop: `1px solid ${C.border}`,
                      paddingTop: 16,
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {[
                      {
                        icon: <EyeOutlined />,
                        title: 'View',
                        color: '#fff',
                        onClick: () => handleView(store.id),
                      },
                      {
                        icon: <PartitionOutlined />,
                        title: 'Spaces',
                        color: C.green,
                        onClick: () => handleViewSpaces(store.id),
                      },
                      {
                        icon: <SettingOutlined />,
                        title: 'Mode',
                        color: '#f97316',
                        onClick: () => handleSetGovernanceMode(store),
                      },
                      {
                        icon: <EditOutlined />,
                        title: 'Edit',
                        color: '#3b82f6',
                        onClick: () => handleEdit(store),
                      },
                      {
                        icon: <DeleteOutlined />,
                        title: 'Delete',
                        color: '#ef4444',
                        onClick: () => handleDelete(store.id),
                      },
                    ].map((btn, idx) => (
                      <button
                        key={idx}
                        onClick={btn.onClick}
                        style={{
                          flex: 1,
                          height: 36,
                          borderRadius: 8,
                          border: 'none',
                          background: '#242424',
                          color: C.textMuted,
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.background = '#333';
                          (e.currentTarget as HTMLButtonElement).style.color =
                            btn.color;
                        }}
                        onMouseLeave={(e) => {
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.background = '#242424';
                          (e.currentTarget as HTMLButtonElement).style.color =
                            C.textMuted;
                        }}
                      >
                        {btn.icon}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        // ─── Clusters View (City Cards) ──────────────────────────────────────
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 24,
          }}
        >
          {cities.length === 0 ? (
            <div
              style={{ gridColumn: '1/-1', textAlign: 'center', padding: 80 }}
            >
              <Empty
                description={
                  <Text style={{ color: C.textSubtle }}>No cities found</Text>
                }
              />
            </div>
          ) : (
            cities.map((city) => {
              const cityStores = groupedByCity[city];
              const activeCount = cityStores.filter(
                (s) => s.status === EntityStatusEnum.Active,
              ).length;

              return (
                <div
                  key={city}
                  onClick={() => setSelectedCity(city)}
                  style={{
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    borderRadius: 20,
                    padding: 32,
                    cursor: 'pointer',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    textAlign: 'center',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor =
                      C.green;
                    (e.currentTarget as HTMLDivElement).style.background =
                      '#202020';
                    (e.currentTarget as HTMLDivElement).style.transform =
                      'scale(1.03)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor =
                      C.border;
                    (e.currentTarget as HTMLDivElement).style.background =
                      C.surface;
                    (e.currentTarget as HTMLDivElement).style.transform =
                      'scale(1)';
                  }}
                >
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 20,
                      background: 'rgba(29,185,84,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 20px',
                    }}
                  >
                    <EnvironmentOutlined
                      style={{ color: C.green, fontSize: 32 }}
                    />
                  </div>
                  <Title
                    level={4}
                    style={{ color: C.text, margin: '0 0 8px', fontSize: 20 }}
                  >
                    {city}
                  </Title>
                  <Text style={{ color: C.textMuted, fontSize: 14 }}>
                    {cityStores.length}{' '}
                    {cityStores.length === 1 ? 'Store' : 'Stores'}
                  </Text>
                  <div
                    style={{
                      marginTop: 12,
                      display: 'flex',
                      justifyContent: 'center',
                      gap: 12,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        color: C.green,
                        background: 'rgba(29,185,84,0.1)',
                        padding: '2px 8px',
                        borderRadius: 10,
                      }}
                    >
                      {activeCount} Active
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Drawers/Modals */}
      <CreateStoreDrawer
        open={createDrawerOpen}
        onClose={() => setCreateDrawerOpen(false)}
        onSuccess={() => {
          setCreateDrawerOpen(false);
          refetch();
        }}
      />
      <EditStoreDrawer
        open={editDrawerOpen}
        storeId={selectedStoreId}
        onClose={() => {
          setEditDrawerOpen(false);
          setSelectedStoreId(null);
        }}
        onSuccess={() => {
          setEditDrawerOpen(false);
          setSelectedStoreId(null);
          refetch();
        }}
      />
      <StoreDetailDrawer
        open={detailDrawerOpen}
        storeId={selectedStoreId ?? undefined}
        onClose={() => {
          setDetailDrawerOpen(false);
          setSelectedStoreId(null);
        }}
      />
      <StoreSpacesDrawer
        open={spacesDrawerOpen}
        storeId={selectedStoreId}
        onClose={() => {
          setSpacesDrawerOpen(false);
          setSelectedStoreId(null);
        }}
      />
      <SetGovernanceModeDrawer
        open={governanceModeDrawerOpen}
        storeId={selectedStoreId ?? ''}
        currentMode={selectedGovernanceMode}
        onClose={() => {
          setGovernanceModeDrawerOpen(false);
          setSelectedStoreId(null);
          setSelectedGovernanceMode(undefined);
        }}
      />
    </div>
  );
};

export default StoreList;
