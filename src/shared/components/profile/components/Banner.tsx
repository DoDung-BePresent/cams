import { Flex, Progress, Space, Typography } from 'antd';

/**
 * Shared
 */
import { cn } from '@/shared/lib';

/**
 * Assets
 */
import LeftWave from '../assets/left-wave.svg?react';
import RightWave from '../assets/right-wave.svg?react';

const { Title, Text } = Typography;

export const Banner = ({
  className,
  ...props
}: React.ComponentProps<'div'>) => {
  return (
    <div
      className={cn('relative rounded-sm p-4 px-7', className)}
      style={{
        background: 'linear-gradient(135deg, #18181b 0%, #242126 100%)',
        border: '1px solid #2d2528',
      }}
      {...props}
    >
      <LeftWave
        className='absolute bottom-0 left-0 opacity-10'
        style={{ color: '#ef4444' }}
      />
      <RightWave
        className='absolute top-0 right-0 opacity-10'
        style={{ color: '#ef4444' }}
      />
      <Flex
        gap={20}
        align='center'
      >
        <Progress
          type='circle'
          percent={30}
          size={85}
          format={(value) => (
            <span
              className='text-sm font-medium'
              style={{ color: '#f8f7f7' }}
            >
              {value}%
            </span>
          )}
          strokeLinecap='square'
          strokeColor='#ef4444'
          trailColor='rgba(239,68,68,0.15)'
        />
        <Space
          vertical
          size={0}
        >
          <Title
            level={5}
            style={{ color: '#f8f7f7', margin: 0 }}
          >
            Edit Your Profile
          </Title>
          <Text style={{ fontSize: 13, color: '#b7adb0' }}>
            Complete your profile to unlock all features
          </Text>
        </Space>
      </Flex>
    </div>
  );
};
