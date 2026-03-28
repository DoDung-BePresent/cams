import { useState } from 'react';
import { Row, Col, Tabs, Space, Card } from 'antd';
import { createStyles } from 'antd-style';
import { useNavigate } from 'react-router';

/**
 * Icons
 */
import {
  ThunderboltOutlined,
  SettingOutlined,
  HistoryOutlined,
} from '@ant-design/icons';

/**
 * Components
 */
import { PageHeader } from '@/shared/components';
import {
  SunoConfigForm,
  SunoGenerationForm,
  SunoPromptHistory,
} from '@/shared/modules/suno/components';
import { SunoGenerationList } from './components/SunoGenerationList';

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

export const SunoAI = () => {
  const { styles } = useStyle();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('generate');
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastGenerationId, setLastGenerationId] = useState<string | undefined>(
    undefined,
  );

  const breadcrumbs = [
    {
      title: 'Dashboard',
      onClick: () => navigate('/brand/dashboard'),
      className: 'cursor-pointer',
    },
    {
      title: 'Suno AI Music Generator',
    },
  ];

  const handleGenerationSuccess = (generationId: string) => {
    // Switch to history tab to show the new generation
    setLastGenerationId(generationId);
    setActiveTab('history');
    setRefreshKey((prev) => prev + 1);
  };

  const tabItems = [
    {
      key: 'generate',
      label: (
        <Space>
          <ThunderboltOutlined />
          Generate Music
        </Space>
      ),
      children: (
        <Row gutter={[24, 24]}>
          <Col
            xs={24}
            lg={16}
          >
            <SunoGenerationForm onSuccess={handleGenerationSuccess} />
          </Col>
          <Col
            xs={24}
            lg={8}
          >
            <SunoPromptHistory pageSize={10} />
          </Col>
        </Row>
      ),
    },
    {
      key: 'history',
      label: (
        <Space>
          <HistoryOutlined />
          Generation History
        </Space>
      ),
      children: (
        <SunoGenerationList
          key={refreshKey}
          generationId={lastGenerationId}
        />
      ),
    },
    {
      key: 'config',
      label: (
        <Space>
          <SettingOutlined />
          Configuration
        </Space>
      ),
      children: (
        <Row gutter={[24, 24]}>
          <Col
            xs={24}
            lg={16}
          >
            <SunoConfigForm />
          </Col>
        </Row>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title='Suno AI Music Generator'
        breadcrumbs={breadcrumbs}
      />

      <Card>
        <Tabs
          className={styles.customTabs}
          styles={{
            item: {
              width: 'fit-content',
              paddingInline: 20,
            },
            content: {
              paddingTop: 20,
            },
          }}
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
        />
      </Card>
    </div>
  );
};
