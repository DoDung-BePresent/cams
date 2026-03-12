import { Input, Space, Flex, Button, Select, Tag, Row, Col } from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import { ENTITY_STATUS_OPTIONS } from '@/shared/constants';
import { PLAYLIST_TYPE_OPTIONS } from '@/shared/modules/playlists/constants';
import type { PlaylistFilter as PlaylistFilterType } from '@/shared/modules/playlists/types';

interface PlaylistFilterProps {
  filter: PlaylistFilterType;
  showAdvanced: boolean;
  moods: Array<{ label: string; value: string }>;
  onSearch: (value: string) => void;
  onFilterChange: (key: keyof PlaylistFilterType, value: any) => void;
  onToggleAdvanced: () => void;
  onRefresh: () => void;
  onReset: () => void;
}

export const PlaylistFilter = ({
  filter,
  showAdvanced,
  moods,
  onSearch,
  onFilterChange,
  onToggleAdvanced,
  onRefresh,
  onReset,
}: PlaylistFilterProps) => {
  const hasActiveFilters =
    filter.search ||
    filter.moodId ||
    filter.status !== undefined ||
    filter.isDynamic !== undefined ||
    filter.isDefault !== undefined;

  return (
    <Space
      direction='vertical'
      size='middle'
      style={{ width: '100%' }}
    >
      {/* Search Bar & Action Buttons */}
      <Flex
        justify='space-between'
        wrap='wrap'
      >
        <Input
          size='large'
          placeholder='Search by playlist name...'
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

      {/* Advanced Filters */}
      {showAdvanced && (
        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Select
              size='large'
              placeholder='Filter by Mood'
              options={moods}
              value={filter.moodId}
              onChange={(value) => onFilterChange('moodId', value)}
              style={{ width: '100%' }}
              allowClear
              showSearch
              optionFilterProp='label'
            />
          </Col>
          <Col span={6}>
            <Select
              size='large'
              placeholder='Type'
              options={PLAYLIST_TYPE_OPTIONS}
              value={filter.isDynamic}
              onChange={(value) => onFilterChange('isDynamic', value)}
              style={{ width: '100%' }}
              allowClear
            />
          </Col>
          <Col span={6}>
            <Select
              size='large'
              placeholder='Default'
              options={[
                { label: 'All', value: undefined },
                { label: 'Default Only', value: true },
                { label: 'Non-Default', value: false },
              ]}
              value={filter.isDefault}
              onChange={(value) => onFilterChange('isDefault', value)}
              style={{ width: '100%' }}
              allowClear
            />
          </Col>
          <Col span={6}>
            <Select
              size='large'
              placeholder='Status'
              options={ENTITY_STATUS_OPTIONS}
              value={filter.status}
              onChange={(value) => onFilterChange('status', value)}
              style={{ width: '100%' }}
              allowClear
            />
          </Col>
        </Row>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <Space wrap>
          {filter.moodId && (
            <Tag
              closable
              onClose={() => onFilterChange('moodId', undefined)}
            >
              Mood: {moods.find((m) => m.value === filter.moodId)?.label}
            </Tag>
          )}
          {filter.isDynamic !== undefined && (
            <Tag
              closable
              onClose={() => onFilterChange('isDynamic', undefined)}
            >
              Type: {filter.isDynamic ? 'Dynamic' : 'Static'}
            </Tag>
          )}
          {filter.isDefault !== undefined && (
            <Tag
              closable
              onClose={() => onFilterChange('isDefault', undefined)}
            >
              {filter.isDefault ? 'Default Only' : 'Non-Default'}
            </Tag>
          )}
          {filter.status !== undefined && (
            <Tag
              closable
              onClose={() => onFilterChange('status', undefined)}
            >
              Status:{' '}
              {
                ENTITY_STATUS_OPTIONS.find((o) => o.value === filter.status)
                  ?.label
              }
            </Tag>
          )}
        </Space>
      )}
    </Space>
  );
};
