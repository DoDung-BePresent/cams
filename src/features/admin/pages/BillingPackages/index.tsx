import { useState } from 'react';
import { Card, Tabs } from 'antd';
import { createStyles } from 'antd-style';
import { AppstoreOutlined, DashboardOutlined } from '@ant-design/icons';

import { PageHeader } from '@/shared/components';
import { PackagesTab, WalletDashboardTab } from './components';

const useStyle = createStyles(({ css, prefixCls }) => {
  return {
    customTabs: css`
      .${prefixCls}-tabs-nav {
        margin-bottom: 0;
        .${prefixCls}-tabs-nav-wrap {
          .${prefixCls}-tabs-nav-list {
            width: 100%;
            .${prefixCls}-tabs-tab {
              justify-content: center;
              &:hover {
                background-color: var(--ant-blue-1);
                color: var(--ant-tabs-item-selected-color);
              }
            }
          }
        }
      }
    `,
  };
});

export const AdminBillingPackages = () => {
  const { styles } = useStyle();
  const [activeTab, setActiveTab] = useState<string>('packages');

  const breadcrumbs = [{ title: 'Dashboard' }, { title: 'Token Packages' }];

  const tabItems = [
    {
      key: 'packages',
      label: (
        <span>
          <AppstoreOutlined className='mr-2' />
          Packages
        </span>
      ),
    },
    {
      key: 'wallet-dashboard',
      label: (
        <span>
          <DashboardOutlined className='mr-2' />
          Wallet Dashboard
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title='Token Packages'
        breadcrumbs={breadcrumbs}
        seo={{
          description: 'Configure token bundles for MoMo top-up',
          keywords: 'billing, packages, admin, tokens',
        }}
      />

      <Card>
        <Tabs
          activeKey={activeTab}
          items={tabItems}
          onChange={setActiveTab}
          style={{ marginBottom: 24 }}
          styles={{
            item: {
              width: 'fit-content',
              paddingInline: 20,
            },
          }}
          className={styles.customTabs}
        />

        {activeTab === 'packages' && <PackagesTab />}
        {activeTab === 'wallet-dashboard' && <WalletDashboardTab />}
      </Card>
    </div>
  );
};
