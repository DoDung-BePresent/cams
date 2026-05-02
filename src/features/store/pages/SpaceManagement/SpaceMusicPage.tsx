import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Spin, Button, Result } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Components
 */
import { SpacePlayerCard } from './components/SpacePlayerCard';

/**
 * Hooks
 */
import { useStoreHub } from '@/shared/modules/cams/hooks';
import { useSpace } from '@/shared/modules/spaces/hooks';
import { useAuth } from '@/providers';
import { useStoreContext } from '@/features/store/hooks';

/**
 * Services
 */
import { storeHubService } from '@/shared/modules/cams/services';

export const SpaceMusicPage = () => {
  const { spaceId } = useParams<{ spaceId: string }>();
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const storeId = useStoreContext() || '';
  const queryClient = useQueryClient();
  const [isJoinedSpace, setIsJoinedSpace] = useState(false);

  const {
    data: space,
    isLoading: isLoadingSpace,
    error,
  } = useSpace(spaceId || undefined, !!spaceId);

  const { isConnected } = useStoreHub(storeId, accessToken, {
    onSpaceStateSync: (syncedSpaceId: string, state) => {
      if (syncedSpaceId === spaceId) {
        queryClient.setQueryData(['cams-space-state', spaceId], state);
      }
    },
    onReconnected: () => {
      if (spaceId) {
        queryClient.invalidateQueries({
          queryKey: ['cams-space-state', spaceId],
        });
      }
    },
  });

  useEffect(() => {
    if (!spaceId || !isConnected) {
      return;
    }

    let joined = false;

    storeHubService
      .joinSpace(spaceId)
      .then(() => {
        joined = true;
        setIsJoinedSpace(true);
        queryClient.invalidateQueries({
          queryKey: ['cams-space-state', spaceId],
        });
      })
      .catch((error) => {
        console.error('❌ Failed to join space group:', error);
      });

    return () => {
      if (joined) {
        setIsJoinedSpace(false);
      }
      storeHubService
        .leaveSpace(spaceId)
        .then(() => {
          console.log('✅ Left space group successfully:', spaceId);
        })
        .catch((error) => {
          console.error('❌ Failed to leave space group:', error);
        });
    };
  }, [spaceId, isConnected, queryClient]);

  if (error) {
    return (
      <Result
        status='error'
        title='Failed to load space'
        subTitle="The space you are looking for might not exist or you don't have access."
        extra={[
          <Button
            type='primary'
            key='back'
            onClick={() => navigate('/store/spaces')}
          >
            Back to Spaces
          </Button>,
        ]}
      />
    );
  }

  return (
    <div
      style={{
        height: 'calc(100vh - 252px)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          flexShrink: 0,
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/store/spaces')}
          size='large'
          style={{
            background: '#18181b',
            border: '1px solid rgba(80,45,50,0.75)',
            color: '#f8f7f7',
          }}
        >
          Back
        </Button>
        <h1
          style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#f8f7f7' }}
        >
          {space?.name
            ? `Music Management — ${space.name}`
            : 'Music Management'}
        </h1>
      </div>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          background:
            'radial-gradient(circle at top left, rgba(239,68,68,0.16), transparent 34%), #0f0f11',
          borderRadius: 18,
          overflow: 'hidden',
          boxShadow: '0 24px 60px rgba(0,0,0,0.42)',
          border: '1px solid rgba(80,45,50,0.75)',
        }}
      >
        {isLoadingSpace ? (
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <Spin
              size='large'
              tip='Loading space details...'
            />
          </div>
        ) : !isJoinedSpace ? (
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <Spin
              size='large'
              tip='Connecting to real-time audio service...'
            />
          </div>
        ) : spaceId && space ? (
          <SpacePlayerCard
            space={space}
            storeId={storeId}
            layout='full'
          />
        ) : (
          <Result
            status='warning'
            title='Space not found'
            extra={
              <Button
                type='primary'
                onClick={() => navigate('/store/spaces')}
              >
                Back to Spaces
              </Button>
            }
          />
        )}
      </div>
    </div>
  );
};
