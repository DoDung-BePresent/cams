import { useState } from 'react';
import { Tabs, Space } from 'antd';
import { useNavigate } from 'react-router';

/**
 * Icons
 */
import { ThunderboltOutlined, HistoryOutlined } from '@ant-design/icons';

/**
 * Components
 */
import { PageHeader } from '@/shared/components';
import { SunoGenerationList, GenerateTab } from './components';

export const SunoAI = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('generate');
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastGenerationId, setLastGenerationId] = useState<string | undefined>(
    undefined,
  );

  const breadcrumbs = [
    {
      title: 'Home',
      onClick: () => navigate('/brand/dashboard'),
      className: 'cursor-pointer',
    },
    {
      title: 'AI music',
    },
  ];

  const handleGenerationSuccess = (generationId: string) => {
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
          New track
        </Space>
      ),
      children: <GenerateTab onSuccess={handleGenerationSuccess} />,
    },
    {
      key: 'history',
      label: (
        <Space>
          <HistoryOutlined />
          History
        </Space>
      ),
      children: (
        <SunoGenerationList
          key={refreshKey}
          generationId={lastGenerationId}
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title='AI music'
        description='Let AI write a track for you. Pick a model, tell it the vibe, and we will drop the finished track into your library.'
        breadcrumbs={breadcrumbs}
        seo={{ description: 'AI Music Generator' }}
      />

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        tabBarGutter={32}
      />
    </div>
  );
};
