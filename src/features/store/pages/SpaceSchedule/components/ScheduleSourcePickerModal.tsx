import { useMemo, useState } from 'react';
import { Flex, Input, Segmented, Tag, Radio } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

import { AppModal, DataTable } from '@/shared/components';
import type {
  ScheduleSourceItem,
  ScheduleSourceType,
} from '@/shared/modules/schedules/types';

type ScheduleSourcePickerModalProps = {
  open: boolean;
  loading?: boolean;
  librarySources: ScheduleSourceItem[];
  templateSources: ScheduleSourceItem[];
  showTemplates?: boolean;
  onClose: () => void;
  onSelect: (sourceId: string) => void;
};

export const ScheduleSourcePickerModal = ({
  open,
  loading,
  librarySources,
  templateSources,
  showTemplates = true,
  onClose,
  onSelect,
}: ScheduleSourcePickerModalProps) => {
  const [activeType, setActiveType] = useState<ScheduleSourceType>('library');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
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

  const handleLoad = () => {
    if (selectedSourceId) {
      onSelect(selectedSourceId);
    }
  };

  const columns: ColumnsType<ScheduleSourceItem> = [
    {
      title: '',
      key: 'radio',
      width: 50,
      align: 'center',
      render: (_, record) => (
        <Radio
          checked={selectedSourceId === record.id}
          onChange={() => setSelectedSourceId(record.id)}
        />
      ),
    },
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
        <Flex
          vertical
          gap={0}
        >
          <strong>{record.title}</strong>
          {record.subtitle && (
            <span style={{ fontSize: 13, opacity: 0.85 }}>
              {record.subtitle}
            </span>
          )}
        </Flex>
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
      onOk={handleLoad}
      okText='Load'
      okButtonProps={{ disabled: !selectedSourceId }}
      width={960}
      scrollable={false}
      styles={{
        body: {
          padding: '24px',
        },
      }}
      afterClose={() => {
        setSelectedSourceId(null);
        setSearch('');
        setCurrentPage(1);
      }}
    >
      <Flex
        vertical
        gap='middle'
      >
        {showTemplates && (
          <Segmented<ScheduleSourceType>
            value={activeType}
            size='large'
            onChange={(value) => {
              setActiveType(value);
              setCurrentPage(1);
            }}
            options={[
              { label: 'Library', value: 'library' },
              { label: 'Templates', value: 'template' },
            ]}
            block
          />
        )}

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
        />
      </Flex>
    </AppModal>
  );
};
