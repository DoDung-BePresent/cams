import { useState } from 'react';
import { Row, Col, Tabs, Space } from 'antd';
import { useNavigate } from 'react-router';
import {
  ThunderboltOutlined,
  SettingOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import { PageHeader } from '@/shared/components';
import {
  SunoConfigForm,
  SunoGenerationForm,
} from '@/shared/modules/suno/components';
import { SunoGenerationList } from './components/SunoGenerationList';

export const SunoAI = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('generate');
  const [refreshKey, setRefreshKey] = useState(0);

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

  const handleGenerationSuccess = () => {
    // Switch to history tab to show the new generation
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
      children: <SunoGenerationList key={refreshKey} />,
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

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        size='large'
      />
    </div>
  );
};
