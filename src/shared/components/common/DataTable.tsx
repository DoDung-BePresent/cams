import { Card, Table, type TableProps } from 'antd';
import type { AnyObject } from 'antd/es/_util/type';

type DataTableProps<T extends AnyObject = any> = TableProps<T>;

export const DataTable = <T extends AnyObject = any>({
  pagination,
  className,
  ...tableProps
}: DataTableProps<T>) => {
  const defaultPagination = {
    pageSize: 10,
    showSizeChanger: true,
    showTotal: (total: number) => `Total ${total} items`,
    className: 'mb-0!',
    ...pagination,
  };

  return (
    <Card
      styles={{
        body: {
          padding: 0,
        },
      }}
      className={className}
    >
      <Table
        {...tableProps}
        styles={{
          pagination: {
            root: {
              paddingInline: 16,
              paddingBottom: 16,
            },
          },
          content: {
            scrollbarWidth: 'thin',
            scrollbarColor: '#eaeaea transparent',
          },
        }}
        pagination={defaultPagination}
      />
    </Card>
  );
};
