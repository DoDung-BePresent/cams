import { useState, useMemo } from 'react';
import { Button, Input, Avatar, Tag, Spin, Empty, Typography } from 'antd';
import { useNavigate } from 'react-router';

/**
 * Icons
 */
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  ShopOutlined,
  UserOutlined,
  CrownOutlined,
  EyeOutlined,
  EditOutlined,
  PoweroffOutlined,
  CheckCircleOutlined,
  SwapOutlined,
  LockOutlined,
  ArrowLeftOutlined,
  PhoneOutlined,
} from '@ant-design/icons';

/**
 * Types
 */
import type { StaffFilter } from '@/features/brand/types';
import { EntityStatusEnum } from '@/shared/types';

/**
 * Hooks
 */
import { useStaff, useToggleStaffStatus } from '@/features/brand/hooks';

/**
 * Components
 */
import { PageHeader, AppModal } from '@/shared/components';
import {
  CreateStaffModal,
  EditStaffModal,
  AssignStaffStoreModal,
  ResetPasswordModal,
  StaffDetailModal,
} from './components';

/**
 * Utils
 */
import { groupStaffByStore } from '@/features/brand/utils';
import { AVATAR_SIZE } from '@/config';

const { Text, Title } = Typography;

// ─── Constants ──────────────────────────────────────────────────────────────
const C = {
  bg: '#0f0f11',
  surface: '#18181b',
  surfaceHover: '#242126',
  border: '#2d2528',
  green: '#ef4444',
  text: '#f8f7f7',
  textMuted: '#b7adb0',
  textSubtle: '#857b80',
};

export const StaffList = () => {
  const navigate = useNavigate();
  const [filter] = useState<StaffFilter>({
    page: 1,
    pageSize: 200,
    sortBy: 'createdAt',
    isAscending: false,
  });

  const [search, setSearch] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [assignStoreModalOpen, setAssignStoreModalOpen] = useState(false);
  const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false);
  const [selectedActionStaffId, setSelectedActionStaffId] = useState<
    string | null
  >(null);

  const { data, isLoading, refetch } = useStaff(filter);

  const toggleStatus = useToggleStaffStatus();

  const handleEdit = (staffId: string) => {
    setSelectedActionStaffId(staffId);
    setEditModalOpen(true);
  };

  const handleAssignStore = (staffId: string) => {
    setSelectedActionStaffId(staffId);
    setAssignStoreModalOpen(true);
  };

  const handleResetPassword = (staffId: string) => {
    setSelectedActionStaffId(staffId);
    setResetPasswordModalOpen(true);
  };

  const handleToggleStatus = (staffId: string) => {
    const staff = data?.items.find((s) => s.id === staffId);
    const action = staff?.status === 1 ? 'deactivate' : 'activate';

    AppModal.warning({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} Staff`,
      content: `Are you sure you want to ${action} "${staff?.fullName}"?`,
      okText: action.charAt(0).toUpperCase() + action.slice(1),
      cancelText: 'Cancel',
      okButtonProps: { danger: staff?.status === 1 },
      onOk: () => {
        toggleStatus.mutate(staffId, { onSuccess: () => refetch() });
      },
    });
  };

  const handleView = (staffId: string) => {
    setSelectedActionStaffId(staffId);
    setDetailModalOpen(true);
  };

  // Group staff by store
  const groupedData = useMemo(
    () => groupStaffByStore(data?.items || []),
    [data?.items],
  );

  // Filter groups by search
  const filteredGroups = useMemo(() => {
    if (!search) return groupedData;
    const q = search.toLowerCase();
    return groupedData
      .map((group) => ({
        ...group,
        children: (group.children || []).filter(
          (s) =>
            s.fullName?.toLowerCase().includes(q) ||
            s.email?.toLowerCase().includes(q) ||
            s.phoneNumber?.includes(q),
        ),
      }))
      .filter(
        (group) =>
          (group.storeName || '').toLowerCase().includes(q) ||
          (group.children?.length || 0) > 0,
      );
  }, [groupedData, search]);

  // Find the selected group
  const selectedGroup = useMemo(
    () => filteredGroups.find((g) => g.id === selectedStoreId) ?? null,
    [filteredGroups, selectedStoreId],
  );

  const breadcrumbs = [
    {
      title: 'Dashboard',
      onClick: () => navigate('/brand/dashboard'),
      className: 'cursor-pointer',
    },
    {
      title: 'Staff Management',
      onClick: () => setSelectedStoreId(null),
      className: 'cursor-pointer',
    },
    ...(selectedGroup
      ? [{ title: selectedGroup.storeName || 'Unassigned' }]
      : []),
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
      style={{
        minHeight: '100vh',
        background: 'transparent',
        padding: '0 0 40px',
      }}
    >
      <PageHeader
        title={
          selectedGroup
            ? selectedGroup.storeName || 'Unassigned Staff'
            : 'Staff Clusters'
        }
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
              onClick={() => setCreateModalOpen(true)}
              style={{
                background: C.green,
                border: 'none',
                fontWeight: 700,
                color: '#fff',
              }}
            >
              Add Staff
            </Button>
          </div>
        }
        seo={{
          description: 'Manage store staff members and assignments',
          keywords: 'staff, management, store, employees',
        }}
      />

      {/* Search bar — always shown */}
      {!selectedStoreId && (
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
            placeholder='Search staff, stores...'
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
              Stores:{' '}
              <strong style={{ color: C.text }}>{filteredGroups.length}</strong>
            </div>
          </div>
        </div>
      )}

      {/* ─── Detail view: Staff cards inside a store ─────────────────── */}
      {selectedStoreId && selectedGroup ? (
        <div>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => setSelectedStoreId(null)}
            style={{
              marginBottom: 24,
              background: 'transparent',
              border: `1px solid ${C.border}`,
              color: C.textMuted,
            }}
          >
            Back to Clusters
          </Button>

          {/* Staff count summary */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
            <div
              style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                padding: '10px 20px',
                color: C.textMuted,
                fontSize: 13,
              }}
            >
              Total:{' '}
              <strong style={{ color: C.text }}>
                {selectedGroup.children?.length || 0}
              </strong>
            </div>
            <div
              style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                padding: '10px 20px',
                color: C.textMuted,
                fontSize: 13,
              }}
            >
              Active:{' '}
              <strong style={{ color: C.green }}>
                {
                  (selectedGroup.children || []).filter(
                    (s) => s.status === EntityStatusEnum.Active,
                  ).length
                }
              </strong>
            </div>
          </div>

          {!selectedGroup.children || selectedGroup.children.length === 0 ? (
            <Empty
              description={
                <Text style={{ color: C.textSubtle }}>
                  No staff in this store
                </Text>
              }
            />
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: 20,
              }}
            >
              {selectedGroup.children.map((staff) => {
                const isActive = staff.status === EntityStatusEnum.Active;

                return (
                  <div
                    key={staff.id}
                    style={{
                      background: C.surface,
                      border: `1px solid ${C.border}`,
                      borderRadius: 16,
                      padding: 20,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.borderColor =
                        'rgba(248,113,113,0.34)';
                      (e.currentTarget as HTMLDivElement).style.background =
                        C.surfaceHover;
                      (e.currentTarget as HTMLDivElement).style.transform =
                        'translateY(-3px)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.borderColor =
                        C.border;
                      (e.currentTarget as HTMLDivElement).style.background =
                        C.surface;
                      (e.currentTarget as HTMLDivElement).style.transform =
                        'translateY(0)';
                    }}
                    onClick={() => handleView(staff.id)}
                  >
                    {/* Status bar */}
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 3,
                        background: isActive ? C.green : C.textSubtle,
                      }}
                    />

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 14,
                        marginBottom: 14,
                      }}
                    >
                      <Avatar
                        src={staff.avatarUrl}
                        size={AVATAR_SIZE.large}
                        icon={<UserOutlined />}
                        style={{
                          flexShrink: 0,
                          border: `2px solid ${isActive ? C.green : C.textSubtle}`,
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            marginBottom: 2,
                          }}
                        >
                          <Title
                            level={5}
                            style={{
                              margin: 0,
                              color: C.text,
                              fontSize: 15,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {staff.fullName}
                          </Title>
                          {staff.isPrimaryOwner && (
                            <CrownOutlined
                              style={{
                                color: '#faad14',
                                fontSize: 14,
                                flexShrink: 0,
                              }}
                              title='Primary Owner'
                            />
                          )}
                        </div>
                        <Text
                          style={{
                            color: C.textSubtle,
                            fontSize: 12,
                            display: 'block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {staff.email}
                        </Text>
                        {staff.phoneNumber && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              marginTop: 4,
                            }}
                          >
                            <PhoneOutlined
                              style={{ color: C.textSubtle, fontSize: 11 }}
                            />
                            <Text style={{ color: C.textMuted, fontSize: 12 }}>
                              {staff.phoneNumber}
                            </Text>
                          </div>
                        )}
                      </div>
                      <Tag
                        color={isActive ? 'success' : 'default'}
                        style={{ flexShrink: 0 }}
                      >
                        {isActive ? 'Active' : 'Inactive'}
                      </Tag>
                    </div>

                    {/* Action buttons */}
                    <div
                      style={{
                        display: 'flex',
                        gap: 8,
                        borderTop: `1px solid ${C.border}`,
                        paddingTop: 14,
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {[
                        {
                          icon: <EyeOutlined />,
                          title: 'View',
                          color: '#fff',
                          onClick: () => handleView(staff.id),
                        },
                        {
                          icon: <EditOutlined />,
                          title: 'Edit',
                          color: '#3b82f6',
                          onClick: () => handleEdit(staff.id),
                        },
                        {
                          icon: <SwapOutlined />,
                          title: 'Assign',
                          color: C.green,
                          onClick: () => handleAssignStore(staff.id),
                        },
                        {
                          icon: <LockOutlined />,
                          title: 'Password',
                          color: '#f97316',
                          onClick: () => handleResetPassword(staff.id),
                        },
                        {
                          icon: isActive ? (
                            <PoweroffOutlined />
                          ) : (
                            <CheckCircleOutlined />
                          ),
                          title: isActive ? 'Deactivate' : 'Activate',
                          color: isActive ? '#ef4444' : '#ef4444',
                          onClick: () => handleToggleStatus(staff.id),
                        },
                      ].map((btn, idx) => (
                        <button
                          key={idx}
                          title={btn.title}
                          onClick={btn.onClick}
                          style={{
                            flex: 1,
                            height: 34,
                            borderRadius: 8,
                            border: 'none',
                            background: '#202024',
                            color: C.textMuted,
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          onMouseEnter={(e) => {
                            (
                              e.currentTarget as HTMLButtonElement
                            ).style.background = '#2d2528';
                            (e.currentTarget as HTMLButtonElement).style.color =
                              btn.color;
                          }}
                          onMouseLeave={(e) => {
                            (
                              e.currentTarget as HTMLButtonElement
                            ).style.background = '#202024';
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
          )}
        </div>
      ) : (
        // ─── Clusters view (Store group cards) ───────────────────────────
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 24,
          }}
        >
          {filteredGroups.length === 0 ? (
            <div
              style={{ gridColumn: '1/-1', textAlign: 'center', padding: 80 }}
            >
              <Empty
                description={
                  <Text style={{ color: C.textSubtle }}>No stores found</Text>
                }
              />
            </div>
          ) : (
            filteredGroups.map((group) => {
              const staff = group.children || [];
              const activeCount = staff.filter(
                (s) => s.status === EntityStatusEnum.Active,
              ).length;
              const isUnassigned = !group.storeId;

              return (
                <div
                  key={group.id}
                  onClick={() => setSelectedStoreId(group.id)}
                  style={{
                    background: C.surface,
                    border: `1px solid ${isUnassigned ? '#444' : C.border}`,
                    borderRadius: 20,
                    padding: 28,
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
                      isUnassigned ? '#444' : C.border;
                    (e.currentTarget as HTMLDivElement).style.background =
                      C.surface;
                    (e.currentTarget as HTMLDivElement).style.transform =
                      'scale(1)';
                  }}
                >
                  <div
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 18,
                      background: isUnassigned
                        ? 'rgba(83,83,83,0.15)'
                        : 'rgba(239,68,68,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px',
                    }}
                  >
                    <ShopOutlined
                      style={{
                        color: isUnassigned ? C.textSubtle : C.green,
                        fontSize: 28,
                      }}
                    />
                  </div>

                  <Title
                    level={4}
                    style={{ color: C.text, margin: '0 0 6px', fontSize: 18 }}
                  >
                    {group.storeName || 'Unassigned Staff'}
                  </Title>
                  <Text style={{ color: C.textMuted, fontSize: 14 }}>
                    {staff.length} {staff.length === 1 ? 'member' : 'members'}
                  </Text>

                  <div
                    style={{
                      marginTop: 12,
                      display: 'flex',
                      justifyContent: 'center',
                      gap: 10,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        color: C.green,
                        background: 'rgba(239,68,68,0.1)',
                        padding: '2px 8px',
                        borderRadius: 10,
                      }}
                    >
                      {activeCount} Active
                    </span>
                    {staff.length - activeCount > 0 && (
                      <span
                        style={{
                          fontSize: 11,
                          color: C.textSubtle,
                          background: 'rgba(83,83,83,0.15)',
                          padding: '2px 8px',
                          borderRadius: 10,
                        }}
                      >
                        {staff.length - activeCount} Inactive
                      </span>
                    )}
                  </div>

                  {/* Avatar preview strip */}
                  {staff.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        marginTop: 16,
                      }}
                    >
                      <Avatar.Group
                        maxCount={5}
                        size='small'
                      >
                        {staff.map((s) => (
                          <Avatar
                            key={s.id}
                            src={s.avatarUrl}
                            icon={<UserOutlined />}
                          />
                        ))}
                      </Avatar.Group>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Modals & Drawers */}
      <CreateStaffModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => {
          setCreateModalOpen(false);
          refetch();
        }}
      />

      <EditStaffModal
        open={editModalOpen}
        staffId={selectedActionStaffId}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedActionStaffId(null);
        }}
        onSuccess={() => {
          setEditModalOpen(false);
          setSelectedActionStaffId(null);
          refetch();
        }}
      />

      <AssignStaffStoreModal
        open={assignStoreModalOpen}
        staffId={selectedActionStaffId}
        onClose={() => {
          setAssignStoreModalOpen(false);
          setSelectedActionStaffId(null);
        }}
        onSuccess={() => {
          setAssignStoreModalOpen(false);
          setSelectedActionStaffId(null);
          refetch();
        }}
      />

      <ResetPasswordModal
        open={resetPasswordModalOpen}
        staffId={selectedActionStaffId}
        onClose={() => {
          setResetPasswordModalOpen(false);
          setSelectedActionStaffId(null);
        }}
        onSuccess={() => {
          setResetPasswordModalOpen(false);
          setSelectedActionStaffId(null);
        }}
      />

      <StaffDetailModal
        open={detailModalOpen}
        staffId={selectedActionStaffId}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedActionStaffId(null);
        }}
      />
    </div>
  );
};

export default StaffList;
