import { Button, Col, Flex, Input, Row, Select, Space, Tag } from 'antd';
import {
  FilterOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';

import {
  CONFIG_DOMAIN_LABELS,
  CONFIG_DOMAIN_OPTIONS,
} from '@/features/brand/constants/configConstants';
import type {
  ConfigBrandFilter,
  ConfigDomainEnum,
} from '@/features/brand/types';

type ConfigFilterProps = {
  filter: ConfigBrandFilter;
  showAdvanced: boolean;
  onSearch: (value: string) => void;
  onFilterChange: (key: keyof ConfigBrandFilter, value: unknown) => void;
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
    filter.search || filter.domain !== undefined || filter.keyPrefix;

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
          placeholder='Search brand config by key or value...'
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
            <Input
              size='large'
              placeholder='Filter by key prefix (e.g., cams.)'
              value={filter.keyPrefix}
              onChange={(e) =>
                onFilterChange('keyPrefix', e.target.value || undefined)
              }
              allowClear
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
          {filter.keyPrefix && (
            <Tag
              closable
              onClose={() => onFilterChange('keyPrefix', undefined)}
            >
              Key Prefix: {filter.keyPrefix}
            </Tag>
          )}
        </Space>
      )}
    </Space>
  );
};
