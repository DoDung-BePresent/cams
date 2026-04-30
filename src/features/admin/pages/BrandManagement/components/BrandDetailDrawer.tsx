import { useState } from 'react';
import {
  Drawer,
  Descriptions,
  Tag,
  Spin,
  Alert,
  Space,
  Flex,
  Avatar,
  Typography,
  Tabs,
  Collapse,
  Empty,
} from 'antd';
import { useQuery } from '@tanstack/react-query';

import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  GlobalOutlined,
  MailOutlined,
  PhoneOutlined,
  ShopOutlined,
  ClockCircleOutlined,
  CrownOutlined,
  FileTextOutlined,
  EnvironmentOutlined,
  PartitionOutlined,
  PoweroffOutlined,
} from '@ant-design/icons';

import { useBrand } from '@/features/admin/hooks';
import { storeService } from '@/features/brand/services';
import { spaceService } from '@/shared/modules/spaces/services';
import { ENTITY_STATUS_LABELS, ENTITY_STATUS_COLORS } from '@/shared/constants';
import { EntityStatusEnum } from '@/shared/types';
import { formatDate } from '@/shared/utils';
import { AVATAR_SIZE, DRAWER_WIDTHS } from '@/config';
import {
  GovernanceModeEnum,
  GOVERNANCE_MODE_LABELS,
} from '@/features/brand/types/configTypes';
import { SPACE_TYPE_LABELS } from '@/features/store/constants';

const { Text, Title } = Typography;

const GOVERNANCE_COLORS: Record<GovernanceModeEnum, string> = {
  [GovernanceModeEnum.StrictSync]: '#f97316',
  [GovernanceModeEnum.AIMode]: '#ef4444',
  [GovernanceModeEnum.Freedom]: '#3b82f6',
};

type BrandDetailDrawerProps = {
  open: boolean;
  brandId?: string | null;
  onClose: () => void;
};

const SpacesList = ({
  storeId,
  enabled,
}: {
  storeId: string;
  enabled: boolean;
}) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['brand-detail-spaces', storeId],
    queryFn: async () => {
      const res = await spaceService.getList({ storeId, pageSize: 100 });
      return res.data;
    },
    enabled,
    staleTime: 1000 * 60 * 2,
  });

  if (isLoading) {
    return (
      <Flex
        justify='center'
        style={{ padding: '12px 0' }}
      >
        <Spin size='small' />
      </Flex>
    );
  }

  if (isError) {
    return (
      <Alert
        type='warning'
        showIcon
        message='Could not load spaces'
        description='Spaces may require store-manager access. Try viewing from the Brand role.'
        style={{ margin: '8px 0' }}
      />
    );
  }

  const spaces = data?.items ?? [];
  if (spaces.length === 0) {
    return (
      <Empty
        description='No spaces found'
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: 10,
        marginTop: 8,
      }}
    >
      {spaces.map((space) => {
        const isActive = space.status === EntityStatusEnum.Active;
        return (
          <div
            key={space.id}
            style={{
              background: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: 10,
              padding: '12px 14px',
              borderLeft: `3px solid ${isActive ? '#ef4444' : '#d9d9d9'}`,
            }}
          >
            <Text
              strong
              style={{ fontSize: 13 }}
            >
              {space.name}
            </Text>
            <div
              style={{
                marginTop: 4,
                display: 'flex',
                gap: 6,
                flexWrap: 'wrap',
              }}
            >
              <Tag style={{ margin: 0, fontSize: 11 }}>
                {SPACE_TYPE_LABELS[space.type] ?? 'Unknown'}
              </Tag>
              <Tag
                color={isActive ? 'success' : 'default'}
                style={{ margin: 0, fontSize: 11 }}
              >
                {isActive ? 'Active' : 'Inactive'}
              </Tag>
            </div>
            {space.description && (
              <Text
                type='secondary'
                style={{ fontSize: 11, marginTop: 4, display: 'block' }}
              >
                {space.description}
              </Text>
            )}
          </div>
        );
      })}
    </div>
  );
};

const StoresAndSpaces = ({ brandId }: { brandId: string }) => {
  const [expandedStores, setExpandedStores] = useState<string[]>([]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['brand-detail-stores', brandId],
    queryFn: async () => {
      const res = await storeService.getList({ pageSize: 200 });
      const items = res.data?.items ?? [];
      return items.filter((s) => s.brandId === brandId);
    },
    staleTime: 1000 * 60 * 2,
  });

  if (isLoading) {
    return (
      <Flex
        justify='center'
        style={{ padding: 40 }}
      >
        <Spin size='large' />
      </Flex>
    );
  }

  if (isError) {
    return (
      <Alert
        type='warning'
        showIcon
        message='Could not load stores'
        description='Store listing may require Brand Manager access. This view shows data available to admin.'
      />
    );
  }

  const stores = data ?? [];
  if (stores.length === 0) {
    return (
      <Empty
        description='No stores found for this brand'
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  const collapseItems = stores.map((store) => {
    const isActive = store.status === EntityStatusEnum.Active;
    const govColor = GOVERNANCE_COLORS[store.governanceMode] ?? '#6a6a6a';
    const govLabel = GOVERNANCE_MODE_LABELS[store.governanceMode] ?? 'Unknown';

    return {
      key: store.id,
      label: (
        <Flex
          align='center'
          gap={10}
          wrap='wrap'
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: isActive ? '#ef4444' : '#d9d9d9',
              flexShrink: 0,
            }}
          />
          <Text
            strong
            style={{ fontSize: 14 }}
          >
            {store.name}
          </Text>
          {store.city && (
            <Flex
              align='center'
              gap={4}
            >
              <EnvironmentOutlined style={{ color: '#8c8c8c', fontSize: 12 }} />
              <Text
                type='secondary'
                style={{ fontSize: 12 }}
              >
                {store.city}
                {store.district ? `, ${store.district}` : ''}
              </Text>
            </Flex>
          )}
          <Tag
            style={{
              background: `${govColor}18`,
              color: govColor,
              border: `1px solid ${govColor}30`,
              margin: 0,
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            {govLabel}
          </Tag>
          {!isActive && (
            <Tag
              icon={<PoweroffOutlined />}
              color='default'
              style={{ margin: 0, fontSize: 11 }}
            >
              Inactive
            </Tag>
          )}
        </Flex>
      ),
      children: (
        <div>
          {store.address && (
            <Flex
              align='flex-start'
              gap={6}
              style={{ marginBottom: 12 }}
            >
              <EnvironmentOutlined style={{ color: '#8c8c8c', marginTop: 2 }} />
              <Text
                type='secondary'
                style={{ fontSize: 13 }}
              >
                {store.address}
              </Text>
            </Flex>
          )}
          {store.contactNumber && (
            <Flex
              align='center'
              gap={6}
              style={{ marginBottom: 12 }}
            >
              <PhoneOutlined style={{ color: '#8c8c8c' }} />
              <Text
                type='secondary'
                style={{ fontSize: 13 }}
              >
                {store.contactNumber}
              </Text>
            </Flex>
          )}

          <Flex
            align='center'
            gap={6}
            style={{ marginBottom: 10 }}
          >
            <PartitionOutlined style={{ color: '#f8f7f7' }} />
            <Text
              strong
              style={{ fontSize: 13 }}
            >
              Spaces
            </Text>
          </Flex>
          <SpacesList
            storeId={store.id}
            enabled={expandedStores.includes(store.id)}
          />
        </div>
      ),
    };
  });

  return (
    <Space
      direction='vertical'
      size='middle'
      style={{ width: '100%' }}
    >
      <Flex
        justify='space-between'
        align='center'
      >
        <Text
          type='secondary'
          style={{ fontSize: 13 }}
        >
          {stores.length} {stores.length === 1 ? 'store' : 'stores'} under this
          brand
        </Text>
        <Text
          type='secondary'
          style={{ fontSize: 12 }}
        >
          {stores.filter((s) => s.status === EntityStatusEnum.Active).length}{' '}
          active
        </Text>
      </Flex>
      <Collapse
        items={collapseItems}
        onChange={(keys) =>
          setExpandedStores(
            Array.isArray(keys) ? (keys as string[]) : [keys as string],
          )
        }
        expandIconPosition='end'
        style={{ background: 'transparent' }}
      />
    </Space>
  );
};

export const BrandDetailDrawer = ({
  open,
  brandId,
  onClose,
}: BrandDetailDrawerProps) => {
  const {
    data: brand,
    isLoading,
    error,
  } = useBrand(brandId ?? undefined, open);

  return (
    <Drawer
      closeIcon={null}
      title='Brand Details'
      placement='right'
      width={DRAWER_WIDTHS.large}
      open={open}
      onClose={onClose}
    >
      {isLoading && (
        <Flex
          justify='center'
          align='center'
          style={{ padding: 48 }}
        >
          <Spin size='large' />
        </Flex>
      )}

      {error && !isLoading && (
        <Alert
          message='Error'
          description='Failed to load brand details. Please try again.'
          type='error'
          showIcon
        />
      )}

      {brand && !isLoading && (
        <>
          {/* Brand Header (always visible) */}
          <Flex
            align='center'
            gap='large'
            style={{ marginBottom: 20 }}
          >
            <Avatar
              size={AVATAR_SIZE.extraLarge}
              src={brand.logoUrl}
              icon={<ShopOutlined />}
              shape='square'
            />
            <div>
              <Title
                level={4}
                style={{ margin: 0 }}
              >
                {brand.name}
              </Title>
              {brand.industry && <Text type='secondary'>{brand.industry}</Text>}
              <Flex
                gap='small'
                style={{ marginTop: 8 }}
              >
                <Tag
                  icon={
                    brand.status === EntityStatusEnum.Active ? (
                      <CheckCircleOutlined />
                    ) : (
                      <CloseCircleOutlined />
                    )
                  }
                  color={ENTITY_STATUS_COLORS[brand.status]}
                >
                  {ENTITY_STATUS_LABELS[brand.status]}
                </Tag>
                {brand.currentSubscriptionId && (
                  <Tag color='gold'>Has Subscription</Tag>
                )}
              </Flex>
            </div>
          </Flex>

          <Tabs
            defaultActiveKey='info'
            items={[
              {
                key: 'info',
                label: 'Brand Info',
                children: (
                  <Space
                    direction='vertical'
                    size='large'
                    style={{ width: '100%' }}
                  >
                    <Descriptions
                      title='Basic Information'
                      column={1}
                      bordered
                    >
                      {brand.description && (
                        <Descriptions.Item label='Description'>
                          {brand.description}
                        </Descriptions.Item>
                      )}
                      <Descriptions.Item label='Industry'>
                        {brand.industry ?? '—'}
                      </Descriptions.Item>
                      <Descriptions.Item label='Website'>
                        {brand.website ? (
                          <Flex
                            align='center'
                            gap='small'
                          >
                            <GlobalOutlined />
                            <a
                              href={brand.website}
                              target='_blank'
                              rel='noopener noreferrer'
                            >
                              {brand.website}
                            </a>
                          </Flex>
                        ) : (
                          '—'
                        )}
                      </Descriptions.Item>
                      <Descriptions.Item label='Default Timezone'>
                        <Flex
                          align='center'
                          gap='small'
                        >
                          <ClockCircleOutlined />
                          {brand.defaultTimeZone}
                        </Flex>
                      </Descriptions.Item>
                    </Descriptions>

                    <Descriptions
                      title='Contact Information'
                      column={1}
                      bordered
                    >
                      <Descriptions.Item label='Primary Contact'>
                        {brand.primaryContactName ? (
                          <Flex
                            align='center'
                            gap='small'
                          >
                            <CrownOutlined />
                            {brand.primaryContactName}
                          </Flex>
                        ) : (
                          '—'
                        )}
                      </Descriptions.Item>
                      <Descriptions.Item label='Contact Email'>
                        {brand.contactEmail ? (
                          <Flex
                            align='center'
                            gap='small'
                          >
                            <MailOutlined />
                            {brand.contactEmail}
                          </Flex>
                        ) : (
                          '—'
                        )}
                      </Descriptions.Item>
                      <Descriptions.Item label='Technical Email'>
                        {brand.technicalContactEmail ? (
                          <Flex
                            align='center'
                            gap='small'
                          >
                            <MailOutlined />
                            {brand.technicalContactEmail}
                          </Flex>
                        ) : (
                          '—'
                        )}
                      </Descriptions.Item>
                      <Descriptions.Item label='Contact Phone'>
                        {brand.contactPhone ? (
                          <Flex
                            align='center'
                            gap='small'
                          >
                            <PhoneOutlined />
                            {brand.contactPhone}
                          </Flex>
                        ) : (
                          '—'
                        )}
                      </Descriptions.Item>
                    </Descriptions>

                    {(brand.legalName ||
                      brand.taxCode ||
                      brand.billingAddress) && (
                      <Descriptions
                        title='Legal & Billing'
                        column={1}
                        bordered
                      >
                        <Descriptions.Item label='Legal Name'>
                          {brand.legalName ? (
                            <Flex
                              align='center'
                              gap='small'
                            >
                              <FileTextOutlined />
                              {brand.legalName}
                            </Flex>
                          ) : (
                            '—'
                          )}
                        </Descriptions.Item>
                        <Descriptions.Item label='Tax Code'>
                          {brand.taxCode ?? '—'}
                        </Descriptions.Item>
                        <Descriptions.Item label='Billing Address'>
                          {brand.billingAddress ?? '—'}
                        </Descriptions.Item>
                      </Descriptions>
                    )}

                    <Descriptions
                      title='System Information'
                      column={1}
                      bordered
                    >
                      <Descriptions.Item label='Brand ID'>
                        <Tag>{brand.id}</Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label='Created At'>
                        {formatDate(brand.createdAt)}
                      </Descriptions.Item>
                      <Descriptions.Item label='Updated At'>
                        {brand.updatedAt ? formatDate(brand.updatedAt) : '—'}
                      </Descriptions.Item>
                    </Descriptions>
                  </Space>
                ),
              },
              {
                key: 'stores',
                label: (
                  <Flex
                    align='center'
                    gap={6}
                  >
                    <PartitionOutlined />
                    Stores & Spaces
                  </Flex>
                ),
                children: <StoresAndSpaces brandId={brand.id} />,
              },
            ]}
          />
        </>
      )}
    </Drawer>
  );
};
