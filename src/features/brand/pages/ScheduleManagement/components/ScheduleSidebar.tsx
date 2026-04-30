import { Card, Typography, List, Tag, Spin, Empty } from 'antd';
import SimpleBar from 'simplebar-react';

import type { ScheduleBootstrapData } from '../types/schedule.types';
import { MusicIcon } from 'lucide-react';

const { Title, Text } = Typography;

interface ScheduleSidebarProps {
  bootstrap: ScheduleBootstrapData | undefined;
  isLoading: boolean;
  spaceId: string;
}

export const ScheduleSidebar = ({
  bootstrap,
  isLoading,
}: ScheduleSidebarProps) => {
  if (isLoading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: 24 }}>
          <Spin />
        </div>
      </Card>
    );
  }

  const currentSlots = bootstrap?.draftSchedule?.slots || [];
  const librarySources = bootstrap?.librarySources || [];
  const musicCatalog = bootstrap?.musicCatalog || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Current Schedule Slots */}
      <Card size='small'>
        <Title
          level={5}
          style={{ marginBottom: 12 }}
        >
          IN THIS SCHEDULE
        </Title>
        <SimpleBar style={{ maxHeight: 200 }}>
          {currentSlots.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description='No slots yet'
            />
          ) : (
            <List
              size='small'
              dataSource={currentSlots}
              renderItem={(slot) => {
                const music = musicCatalog.find((m) => m.id === slot.musicId);
                const days = slot.daysOfWeek
                  .map(
                    (d) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d],
                  )
                  .join(', ');

                return (
                  <List.Item>
                    <div>
                      <Text strong>{music?.title || 'Unknown'}</Text>
                      <br />
                      <Text
                        type='secondary'
                        style={{ fontSize: 12 }}
                      >
                        {days} • {slot.startTime}-{slot.endTime}
                      </Text>
                    </div>
                  </List.Item>
                );
              }}
            />
          )}
        </SimpleBar>
      </Card>

      {/* Library Templates */}
      <Card size='small'>
        <Title
          level={5}
          style={{ marginBottom: 12 }}
        >
          LIBRARY
        </Title>
        <SimpleBar style={{ maxHeight: 200 }}>
          {librarySources.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description='No saved templates'
            />
          ) : (
            <List
              size='small'
              dataSource={librarySources}
              renderItem={(source) => (
                <List.Item style={{ cursor: 'pointer' }}>
                  <div>
                    <Text strong>{source.title}</Text>
                    <br />
                    <Text
                      type='secondary'
                      style={{ fontSize: 12 }}
                    >
                      {source.schedule.slots.length} slots
                    </Text>
                  </div>
                </List.Item>
              )}
            />
          )}
        </SimpleBar>
      </Card>

      {/* Music Catalog */}
      <Card size='small'>
        <Title
          level={5}
          style={{ marginBottom: 12 }}
        >
          MUSIC CATALOG
        </Title>
        <SimpleBar style={{ maxHeight: 300 }}>
          {musicCatalog.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description='No playlists'
            />
          ) : (
            <List
              size='small'
              dataSource={musicCatalog}
              renderItem={(music) => (
                <List.Item
                  style={{ cursor: 'grab' }}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('playlistId', music.id);
                    e.dataTransfer.setData('playlistName', music.title);
                  }}
                >
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    <MusicIcon />
                    <div>
                      <Text strong>{music.title}</Text>
                      <br />
                      <Tag
                        color='blue'
                        style={{ fontSize: 10 }}
                      >
                        {music.collection}
                      </Tag>
                    </div>
                  </div>
                </List.Item>
              )}
            />
          )}
        </SimpleBar>
      </Card>
    </div>
  );
};
