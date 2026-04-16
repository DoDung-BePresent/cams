import { useState } from 'react';
import {
  Alert,
  Descriptions,
  Divider,
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
} from '@/features/brand/constants/configConstants';
import type {
  ConfigDomainEnum,
  ConfigFlatRowItem,
  ConfigScopeTypeEnum,
  ConfigTierEnum,
  ConfigValueTypeEnum,
  StoreListItem,
} from '@/features/brand/types';
import { DRAWER_WIDTHS } from '@/config';
import { CONFIG_KEY_META, getConfigKeyLabel } from '@/features/admin/constants';
import { useConfigDetailByBrand } from '@/features/admin/hooks/config';
import { useStores } from '@/features/brand/hooks/store';
import { EntityStatusEnum } from '@/shared/types';

const { Text } = Typography;

type ConfigDetailDrawerProps = {
  open: boolean;
  data: ConfigFlatRowItem | null;
  onClose: () => void;
};

const renderOptionalValueType = (valueType?: ConfigValueTypeEnum | null) => {
  if (valueType === null || valueType === undefined) {
    return '-';
  }

  return CONFIG_VALUE_TYPE_LABELS[valueType];
};

const renderOptionalTier = (tier?: ConfigTierEnum | null) => {
  if (tier === null || tier === undefined) {
    return '-';
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
  const [storeListPage, setStoreListPage] = useState(1);
  const storeListPageSize = 5;

  const { data: detail, isLoading: isDetailLoading } = useConfigDetailByBrand(
    data?.key,
    open,
  );

  const storeListEnabled = !!detail?.allowedStoreIds?.length;
  const { data: storesData, isLoading: isStoresLoading } = useStores(
    storeListEnabled
      ? {
          storeIds: detail!.allowedStoreIds,
          page: storeListPage,
          pageSize: storeListPageSize,
        }
      : {},
  );

  const storeColumns: ColumnsType<StoreListItem> = [
    {
      title: 'Store Name',
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
            {record.address || '-'}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: 'City',
      dataIndex: 'city',
      width: 120,
      render: (value: string | null) => value || '-',
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
      title='Brand Config Details'
      open={open}
      width={DRAWER_WIDTHS.large}
      onClose={onClose}
    >
      {!data ? (
        <Text type='secondary'>No data selected.</Text>
      ) : (
        <>
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
                  Store Blocked
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
                style={{ marginBottom: 16 }}
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
            size='small'
            title='Brand Config Snapshot'
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
              {data.value || '-'}
            </Descriptions.Item>
            <Descriptions.Item label='Current Value Type'>
              {renderOptionalValueType(data.valueType)}
            </Descriptions.Item>
          </Descriptions>

          <Divider />

          <Descriptions
            column={1}
            bordered
            size='small'
            title='Policy Metadata'
          >
            <Descriptions.Item label='Policy Tier'>
              {renderOptionalTier(data.policyTier)}
            </Descriptions.Item>
            <Descriptions.Item label='Policy Default Type'>
              {renderOptionalValueType(data.policyDefaultValueType)}
            </Descriptions.Item>
            <Descriptions.Item label='Policy Default Value'>
              {data.policyDefaultValue || '-'}
            </Descriptions.Item>
            <Descriptions.Item label='Allow Store Override'>
              {data.allowStoreOverride === null ||
              data.allowStoreOverride === undefined
                ? '-'
                : data.allowStoreOverride
                  ? 'Yes'
                  : 'No'}
            </Descriptions.Item>
            <Descriptions.Item label='Allow Space Override'>
              {data.allowSpaceOverride === null ||
              data.allowSpaceOverride === undefined
                ? '-'
                : data.allowSpaceOverride
                  ? 'Yes'
                  : 'No'}
            </Descriptions.Item>
            <Descriptions.Item label='Brand Lock Reason'>
              {data.brandLockReason || '-'}
            </Descriptions.Item>
          </Descriptions>

          {/* Store override detail from brand detail endpoint */}
          {isDetailLoading ? (
            <Spin style={{ marginTop: 16 }} />
          ) : detail ? (
            <>
              <Divider />
              <Descriptions
                column={1}
                bordered
                size='small'
                title='Store Override Grants'
              >
                <Descriptions.Item label='Stores Allowed to Override'>
                  {detail.allowedStoreIds.length === 0 ? (
                    <Typography.Text type='secondary'>None</Typography.Text>
                  ) : (
                    <Table<StoreListItem>
                      rowKey='id'
                      size='small'
                      columns={storeColumns}
                      dataSource={storesData?.items || []}
                      loading={isStoresLoading}
                      pagination={{
                        current: storeListPage,
                        pageSize: storeListPageSize,
                        total:
                          storesData?.totalItems ??
                          detail.allowedStoreIds.length,
                        showSizeChanger: false,
                        showTotal: (total) => `${total} stores`,
                        onChange: (page) => setStoreListPage(page),
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
            </>
          ) : null}
        </>
      )}
    </Drawer>
  );
};
