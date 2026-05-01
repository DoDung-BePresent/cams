import { useMemo, useState } from 'react';
import { Flex, Input, Segmented, Tag, Dropdown, Button, Radio } from 'antd';
import {
  SearchOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';

import { AppModal, DataTable } from '@/shared/components';
import type { ScheduleSourceItem } from '@/shared/modules/schedules/types';

type ScheduleSourcePickerModalProps = {
  open: boolean;
  loading?: boolean;
  librarySources: ScheduleSourceItem[];
  templateSources: ScheduleSourceItem[];
  onClose: () => void;
  onSelect: (sourceId: string) => void;
  onEdit: (source: ScheduleSourceItem) => void;
  onDelete: (sourceId: string) => void;
};

export const ScheduleSourcePickerModal = ({
  open,
  loading,
  librarySources,
  templateSources,
  onClose,
  onSelect,
  onEdit,
  onDelete,
}: ScheduleSourcePickerModalProps) => {
  const [activeType, setActiveType] = useState<'template' | 'library'>(
    'template',
  );
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
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      align: 'center',
      render: (_, record) => {
        const items: MenuProps['items'] = [
          {
            key: 'edit',
            label: 'Edit',
            icon: <EditOutlined />,
            onClick: () => onEdit(record),
          },
          {
            key: 'delete',
            label: 'Delete',
            icon: <DeleteOutlined />,
            danger: true,
            onClick: () => {
              AppModal.confirm({
                title: 'Delete Schedule Source',
                content: `Are you sure you want to delete "${record.title}"? This action cannot be undone.`,
                okText: 'Delete',
                type: 'warning',
                okButtonProps: { danger: true },
                onOk: () => onDelete(record.id),
              });
            },
          },
        ];

        return (
          <Dropdown
            menu={{ items }}
            trigger={['click']}
          >
            <Button
              variant='text'
              icon={<MoreOutlined />}
            />
          </Dropdown>
        );
      },
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
        <Segmented<'template' | 'library'>
          value={activeType}
          size='large'
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
        />
      </Flex>
    </AppModal>
  );
};
