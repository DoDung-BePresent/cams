import { Card, Table, type TableProps } from 'antd';

/**
 * Types
 */
import type { AnyObject } from 'antd/es/_util/type';
import type { ReactNode } from 'react';

type DataTableProps<T extends AnyObject = any> = TableProps<T> & {
  filter?: ReactNode;
};

export const DataTable = <T extends AnyObject = any>({
  pagination,
  className,
  filter,
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
    <>
      {filter && <Card className='rounded-b-none!'>{filter}</Card>}

      <Card
        styles={{
          body: {
            padding: 0,
          },
        }}
        className={filter ? 'rounded-t-none! border-t-0!' : className}
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
    </>
  );
};
