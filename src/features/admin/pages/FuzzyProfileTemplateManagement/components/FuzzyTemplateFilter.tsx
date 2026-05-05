import { Button, Flex, Input, Space } from 'antd';
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';

type FuzzyTemplateFilterProps = {
  searchValue: string;
  onSearch: (value: string) => void;
  onRefresh: () => void;
  onReset: () => void;
};

export const FuzzyTemplateFilter = ({
  searchValue,
  onSearch,
  onRefresh,
  onReset,
}: FuzzyTemplateFilterProps) => {
  const hasActiveFilters = !!searchValue;

  return (
    <Flex
      justify='space-between'
      wrap='wrap'
      gap='middle'
    >
      <Input
        size='large'
        placeholder='Search by template key or display name...'
        prefix={<SearchOutlined />}
        value={searchValue}
        onChange={(e) => onSearch(e.target.value)}
        style={{ width: 400 }}
        allowClear
      />

      <Space>
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
  );
};
