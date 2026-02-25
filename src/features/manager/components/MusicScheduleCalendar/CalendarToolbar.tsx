import { Button, Flex, Select, Space } from 'antd';
import { ZoomInOutlined, ZoomOutOutlined } from '@ant-design/icons';

type CalendarToolbarProps = {
  currentView: 'timeGridWeek' | 'timeGridDay';
  slotHeight: number;
  onViewChange: (view: 'timeGridWeek' | 'timeGridDay') => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
};

export const CalendarToolbar = ({
  currentView,
  slotHeight,
  onViewChange,
  onZoomIn,
  onZoomOut,
}: CalendarToolbarProps) => {
  return (
    <Flex
      align='center'
      gap={12}
    >
      {/* Zoom Controls */}
      <Space.Compact>
        <Button
          icon={<ZoomOutOutlined />}
          onClick={onZoomOut}
          disabled={slotHeight <= 40}
        />
        <Button
          icon={<ZoomInOutlined />}
          onClick={onZoomIn}
          disabled={slotHeight >= 100}
        />
      </Space.Compact>

      {/* View Switcher */}
      <Space>
        <Button
          type={currentView === 'timeGridWeek' ? 'primary' : 'default'}
          onClick={() => onViewChange('timeGridWeek')}
        >
          Week
        </Button>
        <Button
          type={currentView === 'timeGridDay' ? 'primary' : 'default'}
          onClick={() => onViewChange('timeGridDay')}
        >
          Day
        </Button>
      </Space>
    </Flex>
  );
};
