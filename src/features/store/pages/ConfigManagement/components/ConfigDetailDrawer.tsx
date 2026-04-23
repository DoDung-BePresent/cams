import { useState } from 'react';
import {
  Alert,
  Descriptions,
  Drawer,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
} from 'antd';
import { LockOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

import {
  CONFIG_DOMAIN_LABELS,
  CONFIG_SCOPE_LABELS,
  CONFIG_TIER_LABELS,
  CONFIG_VALUE_TYPE_LABELS,
} from '@/features/store/constants/configConstants';
import type {
  ConfigDomainEnum,
  ConfigFlatRowItem,
  ConfigScopeTypeEnum,
  ConfigTierEnum,
  ConfigValueTypeEnum,
} from '@/features/store/types';
import { DRAWER_WIDTHS } from '@/config';
import { CONFIG_KEY_META, getConfigKeyLabel } from '@/features/admin/constants';
import { useConfigDetailByStore } from '@/features/admin/hooks/config';
import { useSpaces } from '@/shared/modules/spaces/hooks';
import type {
  SpaceListItem,
  SpaceTypeEnum,
} from '@/shared/modules/spaces/types';
import { SPACE_TYPE_LABELS } from '@/shared/modules/spaces/constants';
import { EntityStatusEnum } from '@/shared/types';

const { Text } = Typography;

type ConfigDetailDrawerProps = {
  open: boolean;
  data: ConfigFlatRowItem | null;
  onClose: () => void;
};

const renderOptionalValueType = (valueType?: ConfigValueTypeEnum | null) => {
  if (valueType === null || valueType === undefined) {
    return '—';
  }

  return CONFIG_VALUE_TYPE_LABELS[valueType];
};

const renderOptionalTier = (tier?: ConfigTierEnum | null) => {
  if (tier === null || tier === undefined) {
    return '—';
  }

  return (
    <Tag color={tier === 0 ? 'red' : 'gold'}>{CONFIG_TIER_LABELS[tier]}</Tag>
  );
};

export const ConfigDetailDrawer = ({
  open,
  data,
  onClose,
}: ConfigDetailDrawerProps) => {
  const [spaceListPage, setSpaceListPage] = useState(1);
  const spaceListPageSize = 5;

  const storeId = data?.scopeType === 2 ? data?.scopeId : undefined;

  const { data: detail, isLoading: isDetailLoading } = useConfigDetailByStore(
    data?.key,
    storeId,
    open,
  );

  const spaceListEnabled = !!detail?.allowedSpaceIds?.length;
  const { data: spacesData, isLoading: isSpacesLoading } = useSpaces(
    spaceListEnabled
      ? {
          spaceIds: detail!.allowedSpaceIds,
          page: spaceListPage,
          pageSize: spaceListPageSize,
        }
      : {},
    spaceListEnabled,
  );

  const spaceColumns: ColumnsType<SpaceListItem> = [
    {
      title: 'Space Name',
      dataIndex: 'name',
      render: (_, record) => (
        <Space
          direction='vertical'
          size={0}
        >
          <Typography.Text strong>{record.name}</Typography.Text>
          <Typography.Text
            type='secondary'
            style={{ fontSize: 12 }}
          >
            {record.description || '-'}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      width: 140,
      render: (value: SpaceTypeEnum) => SPACE_TYPE_LABELS[value] || '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 100,
      render: (value: EntityStatusEnum) => (
        <Tag color={value === EntityStatusEnum.Active ? 'green' : 'default'}>
          {value === EntityStatusEnum.Active ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
  ];

  return (
    <Drawer
      closeIcon={null}
      title='Store Config Details'
      open={open}
      destroyOnHidden
      width={DRAWER_WIDTHS.medium}
      onClose={onClose}
    >
      {!data ? (
        <Text type='secondary'>No data selected.</Text>
      ) : (
        <Space
          direction='vertical'
          size='large'
          style={{ width: '100%' }}
        >
          {/* Key meta card */}
          {(() => {
            const meta = CONFIG_KEY_META[data.key];
            const label = getConfigKeyLabel(data.key);
            const badges: React.ReactNode[] = [];
            if (meta?.hardLocked)
              badges.push(
                <Tag
                  key='hard'
                  icon={<LockOutlined />}
                  color='error'
                >
                  Hard Locked
                </Tag>,
              );
            if (meta?.storeBlocked)
              badges.push(
                <Tag
                  key='store'
                  color='warning'
                >
                  Store Write Blocked
                </Tag>,
              );
            if (meta?.spaceBlocked)
              badges.push(
                <Tag
                  key='space'
                  color='default'
                >
                  Space Blocked
                </Tag>,
              );
            return (
              <Alert
                type={meta?.hardLocked ? 'error' : 'info'}
                message={
                  <Space>
                    <Text strong>{label}</Text>
                    <Text
                      type='secondary'
                      style={{ fontSize: 12 }}
                    >
                      {data.key}
                    </Text>
                    {badges}
                  </Space>
                }
              />
            );
          })()}

          <Descriptions
            column={1}
            bordered
            title='Store Config Snapshot'
          >
            <Descriptions.Item label='Key'>{data.key}</Descriptions.Item>
            <Descriptions.Item label='Domain'>
              {CONFIG_DOMAIN_LABELS[data.domain as ConfigDomainEnum]}
            </Descriptions.Item>
            <Descriptions.Item label='Scope'>
              <Tag color='blue'>
                {CONFIG_SCOPE_LABELS[data.scopeType as ConfigScopeTypeEnum]}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label='Scope Id'>
              {data.scopeId}
            </Descriptions.Item>
            <Descriptions.Item label='Current Value'>
              {data.value || '—'}
            </Descriptions.Item>
            <Descriptions.Item label='Current Value Type'>
              {renderOptionalValueType(data.valueType)}
            </Descriptions.Item>
          </Descriptions>

          <Descriptions
            column={1}
            bordered
            title='Policy Metadata'
          >
            <Descriptions.Item label='Policy Tier'>
              {renderOptionalTier(data.policyTier)}
            </Descriptions.Item>
            <Descriptions.Item label='Policy Default Type'>
              {renderOptionalValueType(data.policyDefaultValueType)}
            </Descriptions.Item>
            <Descriptions.Item label='Policy Default Value'>
              {data.policyDefaultValue || '—'}
            </Descriptions.Item>
            <Descriptions.Item label='Allow Store Override'>
              {data.allowStoreOverride === null ||
              data.allowStoreOverride === undefined
                ? '—'
                : data.allowStoreOverride
                  ? 'Yes'
                  : 'No'}
            </Descriptions.Item>
            <Descriptions.Item label='Allow Space Override'>
              {data.allowSpaceOverride === null ||
              data.allowSpaceOverride === undefined
                ? '—'
                : data.allowSpaceOverride
                  ? 'Yes'
                  : 'No'}
            </Descriptions.Item>
            <Descriptions.Item label='Brand Lock Reason'>
              {data.brandLockReason || '—'}
            </Descriptions.Item>
          </Descriptions>

          {/* Space override detail from store detail endpoint */}
          {isDetailLoading ? (
            <Spin />
          ) : detail ? (
            <Descriptions
              column={1}
              bordered
              title='Space Override Grants'
            >
              <Descriptions.Item label='Brand Granted Override'>
                {detail.allowStoreOverride ? 'Yes' : 'No'}
              </Descriptions.Item>
              <Descriptions.Item label='Spaces Allowed to Override'>
                {detail.allowedSpaceIds.length === 0 ? (
                  <Typography.Text type='secondary'>None</Typography.Text>
                ) : (
                  <Table<SpaceListItem>
                    rowKey='id'
                    size='small'
                    columns={spaceColumns}
                    dataSource={spacesData?.items || []}
                    loading={isSpacesLoading}
                    pagination={{
                      current: spaceListPage,
                      pageSize: spaceListPageSize,
                      total:
                        spacesData?.totalItems ?? detail.allowedSpaceIds.length,
                      showSizeChanger: false,
                      showTotal: (total) => `${total} spaces`,
                      onChange: (page) => setSpaceListPage(page),
                    }}
                    style={{ marginTop: 8 }}
                  />
                )}
              </Descriptions.Item>
              {detail.lockReason && (
                <Descriptions.Item label='Lock Reason'>
                  {detail.lockReason}
                </Descriptions.Item>
              )}
            </Descriptions>
          ) : null}
        </Space>
      )}
    </Drawer>
  );
};
