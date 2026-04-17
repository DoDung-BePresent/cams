import { Button, Col, Flex, Input, Row, Select, Space, Tag } from 'antd';
import {
  FilterOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';

import {
  CONFIG_DOMAIN_LABELS,
  CONFIG_DOMAIN_OPTIONS,
  CONFIG_KEY_SELECT_OPTIONS,
  getConfigKeyLabel,
} from '@/features/admin/constants';
import type { ConfigDomainEnum } from '@/features/admin/types';

type ConfigFilterState = {
  search?: string;
  domain?: number;
  key?: string;
  keyPrefix?: string;
};

type ConfigFilterProps = {
  filter: ConfigFilterState;
  mode?: 'system' | 'policy';
  showAdvanced: boolean;
  onSearch: (value: string) => void;
  onFilterChange: (key: keyof ConfigFilterState, value: unknown) => void;
  onToggleAdvanced: () => void;
  onRefresh: () => void;
  onReset: () => void;
};

export const ConfigFilter = ({
  filter,
  mode = 'system',
  showAdvanced,
  onSearch,
  onFilterChange,
  onToggleAdvanced,
  onRefresh,
  onReset,
}: ConfigFilterProps) => {
  const hasActiveFilters =
    filter.search ||
    filter.domain !== undefined ||
    filter.key ||
    filter.keyPrefix;
  const searchPlaceholder =
    mode === 'policy'
      ? 'Search policy by key...'
      : 'Search system value by key or value...';

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
          placeholder={searchPlaceholder}
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
              placeholder='Filter by key prefix (e.g., cams.)'
              options={CONFIG_KEY_SELECT_OPTIONS}
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
