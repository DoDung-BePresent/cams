import { Card, Table, type TableProps } from 'antd';
import type { AnyObject } from 'antd/es/_util/type';

type DataTableProps<T extends AnyObject = any> = TableProps<T> & {
  cardBordered?: boolean;
};

export const DataTable = <T extends AnyObject = any>({
  cardBordered = true,
  pagination,
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
        root: {
          borderColor: cardBordered ? '#E6EBF1' : undefined,
        },
        body: {
          padding: 0,
        },
      }}
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
        }}
        pagination={defaultPagination}
      />
    </Card>
  );
};
