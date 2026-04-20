import { Alert, Descriptions, Drawer, Space, Tag, Typography } from 'antd';

import {
  CONFIG_DOMAIN_LABELS,
  CONFIG_KEY_META,
  CONFIG_TIER_LABELS,
  CONFIG_VALUE_TYPE_LABELS,
  getConfigKeyLabel,
} from '@/features/admin/constants';
import type {
  ConfigDomainEnum,
  ConfigPolicyRowItem,
  ConfigTierEnum,
  ConfigValueTypeEnum,
} from '@/features/admin/types';
import { DRAWER_WIDTHS } from '@/config';

const { Text } = Typography;

type PolicyDetailDrawerProps = {
  open: boolean;
  data: ConfigPolicyRowItem | null;
  onClose: () => void;
};

const renderValueType = (valueType: ConfigValueTypeEnum) => {
  return CONFIG_VALUE_TYPE_LABELS[valueType];
};

const renderTier = (tier: ConfigTierEnum) => {
  return (
    <Tag color={tier === 0 ? 'red' : 'gold'}>{CONFIG_TIER_LABELS[tier]}</Tag>
  );
};

export const PolicyDetailDrawer = ({
  open,
  data,
  onClose,
}: PolicyDetailDrawerProps) => {
  return (
    <Drawer
      closeIcon={null}
      title='Policy Template Details'
      open={open}
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
                type='info'
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

          {/* Policy Information */}
          <Descriptions
            title='Policy Information'
            column={1}
            bordered
          >
            <Descriptions.Item label='Key'>{data.key}</Descriptions.Item>
            <Descriptions.Item label='Domain'>
              {CONFIG_DOMAIN_LABELS[data.domain as ConfigDomainEnum]}
            </Descriptions.Item>
            <Descriptions.Item label='Tier'>
              {renderTier(data.tier)}
            </Descriptions.Item>
            <Descriptions.Item label='Default Value Type'>
              {renderValueType(data.defaultValueType)}
            </Descriptions.Item>
            <Descriptions.Item label='Default Value'>
              {data.defaultValue || '—'}
            </Descriptions.Item>
          </Descriptions>
        </Space>
      )}
    </Drawer>
  );
};
