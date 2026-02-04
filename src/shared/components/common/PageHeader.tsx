import { Breadcrumb, Flex, Typography } from 'antd';
import type { BreadcrumbItemType } from 'antd/es/breadcrumb/Breadcrumb';
import type { ReactNode } from 'react';

const { Title } = Typography;

type PageHeaderProps = {
  title: string;
  breadcrumbs?: BreadcrumbItemType[];
  extra?: ReactNode;
};

export const PageHeader = ({ title, breadcrumbs, extra }: PageHeaderProps) => {
  return (
    <>
      {breadcrumbs && (
        <Breadcrumb
          className='mb-3! custom-breadcrumb'
          items={breadcrumbs}
        />
      )}
      <Flex
        justify='space-between'
        align='center'
        className='mb-6!'
      >
        <Title level={2}>{title}</Title>
        {extra}
      </Flex>
    </>
  );
};
