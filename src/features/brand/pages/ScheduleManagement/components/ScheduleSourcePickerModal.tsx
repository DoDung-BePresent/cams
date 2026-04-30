import { useMemo, useState } from 'react';
import { Flex, Input, Segmented, Space, Tag } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

import { AppModal, DataTable } from '@/shared/components';
import type { ScheduleSourceItem } from '@/shared/modules/schedules/types';

type ScheduleSourcePickerModalProps = {
  open: boolean;
  loading?: boolean;
  librarySources: ScheduleSourceItem[];
  templateSources: ScheduleSourceItem[];
  onClose: () => void;
  onSelect: (sourceId: string) => void;
};

export const ScheduleSourcePickerModal = ({
  open,
  loading,
  librarySources,
  templateSources,
  onClose,
  onSelect,
}: ScheduleSourcePickerModalProps) => {
  const [activeType, setActiveType] = useState<'template' | 'library'>(
    'template',
  );
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const dataSource =
    activeType === 'library' ? librarySources : templateSources;

  const filteredData = useMemo(() => {
    if (!search.trim()) {
      return dataSource;
    }

    const keyword = search.trim().toLowerCase();
    return dataSource.filter((item) => {
      const title = item.title?.toLowerCase() || '';
      const subtitle = item.subtitle?.toLowerCase() || '';
      return title.includes(keyword) || subtitle.includes(keyword);
    });
  }, [dataSource, search]);

  const columns: ColumnsType<ScheduleSourceItem> = [
    {
      title: 'No.',
      key: 'no',
      width: 60,
      render: (_, __, index) => (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: 'Source',
      dataIndex: 'title',
      sorter: (a, b) => a.title.localeCompare(b.title),
      render: (_, record) => (
        <Space
          direction='vertical'
          size={0}
        >
          <strong>{record.title}</strong>
          {record.subtitle && <span>{record.subtitle}</span>}
        </Space>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      width: 120,
      render: (type: string) => (
        <Tag color={type === 'template' ? 'blue' : 'green'}>
          {type === 'template' ? 'Template' : 'Library'}
        </Tag>
      ),
    },
    {
      title: 'Slots',
      key: 'slots',
      width: 100,
      align: 'center',
      render: (_, record) => record.schedule?.slots?.length || 0,
    },
  ];

  return (
    <AppModal
      title='Load schedule source'
      open={open}
      onCancel={onClose}
      onOk={onClose}
      okText='Close'
      cancelButtonProps={{ style: { display: 'none' } }}
      width={960}
      scrollable={false}
      styles={{
        body: {
          padding: '24px',
        },
      }}
    >
      <Flex
        vertical
        gap='middle'
      >
        <Segmented<'template' | 'library'>
          value={activeType}
          onChange={(value) => {
            setActiveType(value);
            setCurrentPage(1);
          }}
          options={[
            { label: 'Templates', value: 'template' },
            { label: 'Library', value: 'library' },
          ]}
          block
        />

        <Input
          size='large'
          placeholder='Search source by title or subtitle'
          prefix={<SearchOutlined />}
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setCurrentPage(1);
          }}
          allowClear
        />

        <DataTable<ScheduleSourceItem>
          rowKey='id'
          columns={columns}
          dataSource={filteredData}
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize,
            onChange: setCurrentPage,
            showSizeChanger: false,
          }}
          onRow={(record) => ({
            onClick: () => onSelect(record.id),
            style: { cursor: 'pointer' },
          })}
        />
      </Flex>
    </AppModal>
  );
};
