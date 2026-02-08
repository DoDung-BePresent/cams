import { useState } from 'react';
import { Card, Select, Empty, Flex, Typography, Tag } from 'antd';
import type { Space } from '@/features/manager/types/spaceTypes';
import { VoronoiChart } from '@/shared/components/charts/VoronoiChart';
import type { DeviceCoordinate } from '@/features/manager/types/visualizationTypes';

const { Title, Text } = Typography;

type SpaceVoronoiViewProps = {
  spaces: Space[];
};

export const SpaceVoronoiView = ({ spaces }: SpaceVoronoiViewProps) => {
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>(
    spaces[0]?.id || '',
  );

  // Mock device coordinates - TODO: Fetch from API
  const mockDeviceData: Record<string, DeviceCoordinate[]> = {
    '1': [
      {
        device_id: 'ESP32_001',
        device_name: 'Main Floor Speaker 1',
        device_type: 'esp32',
        x: 200, // Position in pixels
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
  };

  const selectedSpace = spaces.find((s) => s.id === selectedSpaceId);
  const deviceData = mockDeviceData[selectedSpaceId] || [];

  const spaceOptions = spaces.map((space) => ({
    label: `${space.space_name} (${mockDeviceData[space.id]?.length || 0} devices)`,
    value: space.id,
  }));

  return (
    <Card>
      <Flex
        vertical
        gap={16}
      >
        {/* Space Selector */}
        <Flex
          justify='space-between'
          align='center'
        >
          <Title
            level={4}
            className='mb-0!'
          >
            Device Coverage Map
          </Title>
          <Select
            style={{ width: 300 }}
            placeholder='Select space'
            value={selectedSpaceId}
            onChange={setSelectedSpaceId}
            options={spaceOptions}
          />
        </Flex>

        {/* Space Info */}
        {selectedSpace && (
          <Flex gap={16}>
            <Tag color='blue'>Space: {selectedSpace.space_name}</Tag>
            <Tag color='green'>Devices: {deviceData.length}</Tag>
            <Tag color='cyan'>Code: {selectedSpace.space_code}</Tag>
          </Flex>
        )}

        {/* Voronoi Chart */}
        {deviceData.length > 0 ? (
          <VoronoiChart
            devices={deviceData}
            width={800}
            height={600}
          />
        ) : (
          <Empty
            description='No devices in this space'
            style={{ padding: '60px 0' }}
          />
        )}

        {/* Legend */}
        <Flex
          gap={16}
          justify='center'
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
      </Flex>
    </Card>
  );
};
