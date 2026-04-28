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

/**
 * Services
 */
import { storeHubService } from '@/shared/modules/cams/services';

export const SpaceMusicPage = () => {
  const { spaceId } = useParams<{ spaceId: string }>();
  const navigate = useNavigate();
  const { accessToken, user } = useAuth();
  const storeId = user?.storeId || '';
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
        padding: 24,
        maxWidth: 1200,
        margin: '0 auto',
        minHeight: 'calc(100vh - 64px)',
      }}
    >
      <div
        style={{
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/store/spaces')}
          size='large'
        >
          Back
        </Button>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>
          {space?.name
            ? `Music Management — ${space.name}`
            : 'Music Management'}
        </h1>
      </div>

      <div
        style={{
          background: '#0a0a0a',
          borderRadius: 24,
          overflow: 'hidden',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          border: '1px solid #2a2a2a',
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
