import { useState } from 'react';
import { Typography } from 'antd';
import { ThunderboltOutlined, HistoryOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router';

/**
 * Components
 */
import { Seo } from '@/shared/components';
import { SunoGenerationList, GenerateTab } from './components';

const { Title, Text } = Typography;

export const SunoAI = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastGenerationId, setLastGenerationId] = useState<string | undefined>(
    undefined,
  );

  const handleGenerationSuccess = (generationId: string) => {
    setLastGenerationId(generationId);
    setActiveTab('history');
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      <Seo
        title='AI Music Generator'
        description='Generate AI music for your brand'
      />

      {/* Page header */}
      <div style={{ padding: '32px 32px 0' }}>
        <div style={{ fontSize: 13, marginBottom: 8, display: 'flex', gap: 6 }}>
          <span
            style={{ cursor: 'pointer', color: '#9ca3af' }}
            onClick={() => navigate('/brand/dashboard')}
          >
            Home
          </span>
          <span style={{ color: '#4b5563' }}>/</span>
          <span
            className='rainbow-text-animate'
            style={{ fontWeight: 600 }}
          >
            AI music generator
          </span>
        </div>
        <Title
          level={2}
          className='rainbow-text-animate'
          style={{
            margin: 0,
            fontWeight: 800,
            fontSize: 32,
            display: 'block',
            marginBottom: 8,
          }}
        >
          AI music generator
        </Title>
        <Text style={{ color: '#9ca3af', fontSize: 14 }}>
          Let AI write a track for you. Pick a model, tell it the vibe, and we
          will drop the finished track into your library.
        </Text>
      </div>

      {/* Tab bar */}
      <div
        style={{
          padding: '0 32px',
          marginTop: 24,
          borderBottom: '1px solid #2e2e2e',
        }}
      >
        <div style={{ display: 'flex', gap: 4 }}>
          {[
            { key: 'new', icon: <ThunderboltOutlined />, label: 'New track' },
            { key: 'history', icon: <HistoryOutlined />, label: 'History' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as 'new' | 'history')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 16px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
                color: activeTab === tab.key ? '#ef4444' : '#6b7280',
                borderBottom:
                  activeTab === tab.key
                    ? '2px solid #ef4444'
                    : '2px solid transparent',
                marginBottom: -1,
                transition: 'all 0.15s',
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ padding: activeTab === 'new' ? '24px 0' : '28px 32px' }}>
        {activeTab === 'new' ? (
          <GenerateTab onSuccess={handleGenerationSuccess} />
        ) : (
          <SunoGenerationList
            key={refreshKey}
            generationId={lastGenerationId}
          />
        )}
      </div>
    </div>
  );
};
