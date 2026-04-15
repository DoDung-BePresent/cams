import { useMemo, useState } from 'react';
import { Input, Segmented, Space } from 'antd';
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
  const [activeType, setActiveType] = useState<ScheduleSourceType>('library');
  const [search, setSearch] = useState('');

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
  }, [search, dataSource]);

  const columns: ColumnsType<ScheduleSourceItem> = [
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
          <span>{record.subtitle}</span>
        </Space>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      width: 120,
      render: (type: string) => (type === 'template' ? 'Template' : 'Library'),
    },
    {
      title: 'Slots',
      key: 'slots',
      width: 120,
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
    >
      <Space
        direction='vertical'
        size='middle'
        style={{ width: '100%' }}
      >
        <Segmented<ScheduleSourceType>
          value={activeType}
          onChange={(value) => setActiveType(value)}
          options={[
            { label: 'Library', value: 'library' },
            { label: 'Templates', value: 'template' },
          ]}
        />

        <Input
          size='large'
          placeholder='Search source by title or subtitle'
          prefix={<SearchOutlined />}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          allowClear
        />

        <DataTable<ScheduleSourceItem>
          rowKey='id'
          columns={columns}
          dataSource={filteredData}
          loading={loading}
          pagination={false}
          onRow={(record) => ({
            onClick: () => onSelect(record.id),
            style: { cursor: 'pointer' },
          })}
        />
      </Space>
    </AppModal>
  );
};
