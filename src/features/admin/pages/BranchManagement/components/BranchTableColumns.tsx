import { Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { Branch } from '@/features/admin/types/branchTypes';


export const getBranchColumns = (): ColumnsType<Branch> => [
  {
    title: 'No.',
    key: 'index',
    width: 70,
    render: (_text, _record, index) => index + 1,
  },
  {
    title: 'Branch Name',
    dataIndex: 'branch_name',
    key: 'branch_name',
    sorter: (a, b) => a.branch_name.localeCompare(b.branch_name),
  },
  {
    title: 'Branch Code',
    dataIndex: 'branch_code',
    key: 'branch_code',
    render: (code: string) => <Tag color='geekblue'>{code}</Tag>,
  },
  {
    title: 'Address',
    dataIndex: 'address',
    key: 'address',
    ellipsis: true,
  },
  {
    title: 'Created At',
    dataIndex: 'created_at',
    key: 'created_at',
    render: (date: string) => new Date(date).toLocaleDateString(),
  },
];
