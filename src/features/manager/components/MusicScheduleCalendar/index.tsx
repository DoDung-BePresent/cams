import { useState, useRef } from 'react';
import { Card, Flex, Button, Tag, Typography, Space } from 'antd';
import './styles.css';
import {
  LeftOutlined,
  RightOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventClickArg, DateSelectArg } from '@fullcalendar/core';
import type { MusicScheduleEvent } from '@/features/manager/types/scheduleTypes';

const { Title, Text } = Typography;

export const MusicScheduleCalendar = () => {
  const calendarRef = useRef<FullCalendar>(null);
  const [currentView, setCurrentView] = useState<
    'timeGridWeek' | 'timeGridDay'
  >('timeGridWeek');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Mock data
  const mockEvents: MusicScheduleEvent[] = [
    {
      id: '1',
      title: 'Morning Jazz Playlist',
      start: '2026-02-28T08:00:00',
      end: '2026-02-28T12:00:00',
      backgroundColor: '#52c41a',
      borderColor: '#52c41a',
      extendedProps: {
        playlist: 'Morning Vibes',
        mood: 'Relaxing',
        genre: 'Jazz',
        autoMode: true,
      },
    },
    {
      id: '2',
      title: 'Lunch Lounge Mix',
      start: '2026-02-26T12:00:00',
      end: '2026-02-26T14:00:00',
      backgroundColor: '#1677ff',
      borderColor: '#1677ff',
      extendedProps: {
        playlist: 'Lunch Hour',
        mood: 'Upbeat',
        genre: 'Pop',
        autoMode: false,
      },
    },
    {
      id: '3',
      title: 'Afternoon Classical',
      start: '2026-02-27T14:00:00',
      end: '2026-02-27T17:00:00',
      backgroundColor: '#722ed1',
      borderColor: '#722ed1',
      extendedProps: {
        playlist: 'Classical Afternoon',
        mood: 'Calm',
        genre: 'Classical',
        autoMode: true,
      },
    },
    {
      id: '4',
      title: 'Evening Energy',
      start: '2026-02-28T17:00:00',
      end: '2026-02-28T20:00:00',
      backgroundColor: '#fa8c16',
      borderColor: '#fa8c16',
      extendedProps: {
        playlist: 'High Energy Mix',
        mood: 'Energetic',
        genre: 'Electronic',
        autoMode: false,
      },
    },
    {
      id: '5',
      title: 'Weekend Chill',
      start: '2026-02-29T10:00:00',
      end: '2026-02-29T18:00:00',
      backgroundColor: '#13c2c2',
      borderColor: '#13c2c2',
      extendedProps: {
        playlist: 'Weekend Vibes',
        mood: 'Chill',
        genre: 'Indie',
        autoMode: true,
      },
    },
  ];

  const handlePrevious = () => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      calendarApi.prev();
      setCurrentDate(calendarApi.getDate());
    }
  };

  const handleNext = () => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      calendarApi.next();
      setCurrentDate(calendarApi.getDate());
    }
  };

  const handleToday = () => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      calendarApi.today();
      setCurrentDate(calendarApi.getDate());
    }
  };

  const handleViewChange = (view: 'timeGridWeek' | 'timeGridDay') => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      calendarApi.changeView(view);
      setCurrentView(view);
    }
  };

  const handleEventClick = (info: EventClickArg) => {
    console.log('Event clicked:', info.event.extendedProps);
    // TODO: Mở modal chi tiết lịch
  };

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    console.log('Date selected:', selectInfo);
    // TODO: Mở modal tạo lịch mới
  };

  const getDateRangeText = () => {
    const calendarApi = calendarRef.current?.getApi();
    if (!calendarApi) return '';

    const view = calendarApi.view;
    const start = view.currentStart;
    const end = view.currentEnd;

    if (currentView === 'timeGridDay') {
      return start.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } else {
      const startStr = start.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      const endDate = new Date(end);
      endDate.setDate(endDate.getDate() - 1); // FullCalendar's end is exclusive
      const endStr = endDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      return `${startStr} - ${endStr}`;
    }
  };

  return (
    <Card>
      {/* Header */}
      <Flex
        justify='space-between'
        align='center'
        style={{ marginBottom: 24 }}
      >
        <Flex
          align='center'
          gap={16}
        >
          <Title
            level={4}
            style={{ margin: 0 }}
          >
            Music Schedule
          </Title>
          <Space>
            <Button
              icon={<LeftOutlined />}
              onClick={handlePrevious}
            />
            <Button onClick={handleToday}>Today</Button>
            <Button
              icon={<RightOutlined />}
              onClick={handleNext}
            />
          </Space>
          <Text strong>{getDateRangeText()}</Text>
        </Flex>

        <Space>
          <Button
            type={currentView === 'timeGridWeek' ? 'primary' : 'default'}
            onClick={() => handleViewChange('timeGridWeek')}
          >
            Week
          </Button>
          <Button
            type={currentView === 'timeGridDay' ? 'primary' : 'default'}
            onClick={() => handleViewChange('timeGridDay')}
          >
            Day
          </Button>
        </Space>
      </Flex>

      {/* Legend */}
      <Flex
        gap={16}
        style={{ marginBottom: 16 }}
      >
        <Flex
          align='center'
          gap={8}
        >
          <div
            style={{
              width: 12,
              height: 12,
              backgroundColor: '#52c41a',
              borderRadius: 2,
            }}
          />
          <Text type='secondary'>Auto Mode</Text>
        </Flex>
        <Flex
          align='center'
          gap={8}
        >
          <div
            style={{
              width: 12,
              height: 12,
              backgroundColor: '#1677ff',
              borderRadius: 2,
            }}
          />
          <Text type='secondary'>Manual Mode</Text>
        </Flex>
      </Flex>

      {/* Calendar */}
      <div style={{ minHeight: 600 }}>
        <FullCalendar
          ref={calendarRef}
          plugins={[timeGridPlugin, interactionPlugin]}
          initialView='timeGridWeek'
          headerToolbar={false}
          events={mockEvents}
          editable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={true}
          slotMinTime='06:00:00'
          slotMaxTime='22:00:00'
          slotDuration='01:00:00'
          height='auto'
          eventClick={handleEventClick}
          select={handleDateSelect}
          eventContent={(eventInfo) => {
            const { event } = eventInfo;
            const props = event.extendedProps;
            return (
              <div style={{ padding: '4px 8px', overflow: 'hidden' }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>
                  {event.title}
                </div>
                {props.playlist && (
                  <div style={{ fontSize: 11, opacity: 0.9 }}>
                    <CalendarOutlined style={{ marginRight: 4 }} />
                    {props.playlist}
                  </div>
                )}
                {props.mood && (
                  <Tag
                    color={props.autoMode ? 'green' : 'blue'}
                    style={{ marginTop: 4, fontSize: 10 }}
                  >
                    {props.mood}
                  </Tag>
                )}
              </div>
            );
          }}
          // Prevent viewing past dates
          validRange={{
            start: new Date().toISOString().split('T')[0],
          }}
          nowIndicator={true}
          slotLabelFormat={{
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          }}
          eventTimeFormat={{
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          }}
        />
      </div>
    </Card>
  );
};
