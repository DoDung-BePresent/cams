import { Card, Empty, Flex, Typography, Tag } from 'antd';
import type { Space } from '@/features/manager/types/spaceTypes';
import { VoronoiChart } from '@/shared/components/charts/VoronoiChart';
import type { DeviceCoordinate } from '@/features/manager/types/visualizationTypes';

/**
 * Assets
 */
import spaceBackgroundUrl from '../../../assets/space-background.png';

const { Title, Text } = Typography;

type SpaceVoronoiViewProps = {
  spaces: Space[];
};

export const SpaceVoronoiView = ({ spaces }: SpaceVoronoiViewProps) => {
  // Mock device coordinates - TODO: Fetch from API
  const mockDeviceData: Record<string, DeviceCoordinate[]> = {
    '1': [
      {
        device_id: 'ESP32_001',
        device_name: 'Main Floor Speaker 1',
        device_type: 'esp32',
        x: 200,
        y: 180,
        status: 'active',
        space_id: '1',
        space_name: 'Main Floor',
        signal_strength: 85,
        value: 85,
      },
      {
        device_id: 'ESP32_002',
        device_name: 'Main Floor Speaker 2',
        device_type: 'esp32',
        x: 600,
        y: 240,
        status: 'active',
        space_id: '1',
        space_name: 'Main Floor',
        signal_strength: 90,
        value: 90,
      },
      {
        device_id: 'ANDROID_001',
        device_name: 'Main Floor Tablet',
        device_type: 'android',
        x: 400,
        y: 420,
        status: 'offline',
        space_id: '1',
        space_name: 'Main Floor',
        signal_strength: 0,
        value: 0,
      },
      {
        device_id: 'ESP32_003',
        device_name: 'Main Floor Speaker 3',
        device_type: 'esp32',
        x: 150,
        y: 450,
        status: 'active',
        space_id: '1',
        space_name: 'Main Floor',
        signal_strength: 88,
        value: 88,
      },
      {
        device_id: 'ANDROID_002',
        device_name: 'Main Floor Tablet 2',
        device_type: 'android',
        x: 650,
        y: 100,
        status: 'active',
        space_id: '1',
        space_name: 'Main Floor',
        signal_strength: 92,
        value: 92,
      },
    ],
    '2': [
      {
        device_id: 'ESP32_004',
        device_name: 'VIP Speaker',
        device_type: 'esp32',
        x: 400,
        y: 300,
        status: 'active',
        space_id: '2',
        space_name: 'VIP Area',
        signal_strength: 95,
        value: 95,
      },
      {
        device_id: 'ANDROID_003',
        device_name: 'VIP Tablet',
        device_type: 'android',
        x: 200,
        y: 200,
        status: 'active',
        space_id: '2',
        space_name: 'VIP Area',
        signal_strength: 88,
        value: 88,
      },
    ],
    // Add more mock data for other spaces if needed
  };

  return (
    <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
      {spaces.map((space) => {
        const deviceData = mockDeviceData[space.id] || [];
        return (
          <Card
            key={space.id}
            title={
              <Title
                level={5}
                className='mb-0!'
              >
                {space.space_name}
              </Title>
            }
            extra={
              <Flex gap={8}>
                <Tag color='green'>Devices: {deviceData.length}</Tag>
                <Tag color='cyan'>Code: {space.space_code}</Tag>
              </Flex>
            }
            styles={{
              body: {
                padding: 7,
                paddingBottom: 25,
              },
            }}
            style={{ minWidth: 400 }}
          >
            {deviceData.length > 0 ? (
              <div className='relative'>
                <img
                  src={spaceBackgroundUrl}
                  className='p-4.5 opacity-90'
                />
                <VoronoiChart
                  devices={deviceData}
                  className='absolute! top-0'
                />
              </div>
            ) : (
              <Empty
                description='No devices in this space'
                style={{ padding: '40px 0' }}
              />
            )}

            {/* Legend */}
            <Flex
              gap={16}
              justify='center'
              className='mt-4'
            >
              <Flex
                gap={8}
                align='center'
              >
                <div className='h-4 w-4 rounded-full bg-green-500' />
                <Text>ESP32 Device</Text>
              </Flex>
              <Flex
                gap={8}
                align='center'
              >
                <div className='h-4 w-4 rounded-full bg-blue-500' />
                <Text>Android Device</Text>
              </Flex>
              <Flex
                gap={8}
                align='center'
              >
                <div className='h-4 w-4 rounded-full bg-gray-400' />
                <Text>Offline</Text>
              </Flex>
            </Flex>
          </Card>
        );
      })}
    </div>
  );
};
