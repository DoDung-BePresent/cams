import {
  Alert,
  Descriptions,
  Divider,
  Drawer,
  Space,
  Tag,
  Typography,
} from 'antd';
import { LockOutlined } from '@ant-design/icons';

import {
  CONFIG_DOMAIN_LABELS,
  CONFIG_KEY_META,
  CONFIG_SCOPE_LABELS,
  CONFIG_TIER_LABELS,
  CONFIG_VALUE_TYPE_LABELS,
  getConfigKeyLabel,
} from '@/features/admin/constants';
import type {
  ConfigDomainEnum,
  ConfigFlatRowItem,
  ConfigScopeTypeEnum,
  ConfigTierEnum,
  ConfigValueTypeEnum,
} from '@/features/admin/types';
import { DRAWER_WIDTHS } from '@/config';

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
  return (
    <Drawer
      closeIcon={null}
      title='Config Details'
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
            if (meta?.brandBlocked)
              badges.push(
                <Tag
                  key='brand'
                  color='warning'
                >
                  Brand Blocked
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
            title='System Config Snapshot'
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
        </>
      )}
    </Drawer>
  );
};
