import { Button, Col, Flex, Input, Row, Select, Space, Tag } from 'antd';
import {
  FilterOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';

import {
  CONFIG_DOMAIN_LABELS,
  CONFIG_DOMAIN_OPTIONS,
} from '@/features/store/constants/configConstants';
import type {
  ConfigDomainEnum,
  ConfigStoreFilter,
} from '@/features/store/types';
import {
  TENANT_CONFIG_KEY_SELECT_OPTIONS,
  getConfigKeyLabel,
} from '@/features/admin/constants';

type ConfigFilterProps = {
  filter: ConfigStoreFilter;
  showAdvanced: boolean;
  onSearch: (value: string) => void;
  onFilterChange: (key: keyof ConfigStoreFilter, value: unknown) => void;
  onToggleAdvanced: () => void;
  onRefresh: () => void;
  onReset: () => void;
};

export const ConfigFilter = ({
  filter,
  showAdvanced,
  onSearch,
  onFilterChange,
  onToggleAdvanced,
  onRefresh,
  onReset,
}: ConfigFilterProps) => {
  const hasActiveFilters =
    filter.search || filter.domain !== undefined || filter.key;

  return (
    <Space
      direction='vertical'
      size='middle'
      style={{ width: '100%' }}
    >
      <Flex
        justify='space-between'
        wrap='wrap'
      >
        <Input
          size='large'
          placeholder='Search store config by key or value...'
          prefix={<SearchOutlined />}
          value={filter.search}
          onChange={(e) => onSearch(e.target.value)}
          style={{ width: 300 }}
          allowClear
        />

        <Space>
          <Button
            size='large'
            icon={<FilterOutlined />}
            onClick={onToggleAdvanced}
          >
            {showAdvanced ? 'Hide' : 'Show'} Filters
          </Button>
          <Button
            size='large'
            icon={<ReloadOutlined />}
            onClick={onRefresh}
          >
            Refresh
          </Button>
          {hasActiveFilters && (
            <Button
              size='large'
              onClick={onReset}
            >
              Reset Filters
            </Button>
          )}
        </Space>
      </Flex>

      {showAdvanced && (
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Select
              size='large'
              placeholder='Filter by Domain'
              options={CONFIG_DOMAIN_OPTIONS}
              value={filter.domain}
              onChange={(value) => onFilterChange('domain', value)}
              style={{ width: '100%' }}
              allowClear
              showSearch
              optionFilterProp='label'
            />
          </Col>
          <Col span={8}>
            <Select
              size='large'
              placeholder='Filter by key'
              options={TENANT_CONFIG_KEY_SELECT_OPTIONS}
              value={filter.key}
              onChange={(value) => onFilterChange('key', value)}
              style={{ width: '100%' }}
              allowClear
              showSearch
              optionFilterProp='label'
            />
          </Col>
        </Row>
      )}

      {hasActiveFilters && (
        <Space wrap>
          {filter.domain !== undefined && (
            <Tag
              closable
              onClose={() => onFilterChange('domain', undefined)}
            >
              Domain: {CONFIG_DOMAIN_LABELS[filter.domain as ConfigDomainEnum]}
            </Tag>
          )}
          {filter.key && (
            <Tag
              closable
              onClose={() => onFilterChange('key', undefined)}
            >
              Key: {getConfigKeyLabel(filter.key)}
            </Tag>
          )}
        </Space>
      )}
    </Space>
  );
};
