import {
  Card,
  Slider,
  Switch,
  Select,
  Space,
  Typography,
  Row,
  Col,
} from 'antd';
import {
  SoundOutlined,
  MutedOutlined,
  RetweetOutlined,
} from '@ant-design/icons';
import { QueueEndBehavior } from '../types';

const { Text } = Typography;

interface AudioMixerControlsProps {
  volumePercent: number;
  isMuted: boolean;
  queueEndBehavior: QueueEndBehavior;
  loading?: boolean;
  onVolumeChange: (volume: number) => void;
  onMuteToggle: (muted: boolean) => void;
  onQueueEndBehaviorChange: (behavior: QueueEndBehavior) => void;
}

const queueEndBehaviorOptions = [
  { label: 'Stop', value: QueueEndBehavior.Stop },
  { label: 'Repeat Queue', value: QueueEndBehavior.RepeatQueue },
  { label: 'Return to Schedule', value: QueueEndBehavior.ReturnToSchedule },
];

export const AudioMixerControls = ({
  volumePercent,
  isMuted,
  queueEndBehavior,
  loading,
  onVolumeChange,
  onMuteToggle,
  onQueueEndBehaviorChange,
}: AudioMixerControlsProps) => {
  return (
    <Card
      title='Audio Mixer'
      size='small'
    >
      <Space
        direction='vertical'
        style={{ width: '100%' }}
        size='middle'
      >
        {/* Volume Control */}
        <div>
          <Row
            align='middle'
            gutter={16}
          >
            <Col flex='auto'>
              <Space
                align='center'
                style={{ width: '100%' }}
              >
                {isMuted ? (
                  <MutedOutlined style={{ fontSize: 16, color: '#ff4d4f' }} />
                ) : (
                  <SoundOutlined style={{ fontSize: 16 }} />
                )}
                <Slider
                  min={0}
                  max={100}
                  value={isMuted ? 0 : volumePercent}
                  onChange={onVolumeChange}
                  disabled={loading || isMuted}
                  style={{ flex: 1, margin: 0 }}
                  tooltip={{ formatter: (value) => `${value}%` }}
                />
                <Text
                  type='secondary'
                  style={{ minWidth: 40, textAlign: 'right' }}
                >
                  {isMuted ? '0%' : `${volumePercent}%`}
                </Text>
              </Space>
            </Col>
          </Row>
        </div>

        {/* Mute Toggle */}
        <Row
          align='middle'
          justify='space-between'
        >
          <Text>Mute</Text>
          <Switch
            checked={isMuted}
            onChange={onMuteToggle}
            disabled={loading}
            checkedChildren={<MutedOutlined />}
            unCheckedChildren={<SoundOutlined />}
          />
        </Row>

        {/* Queue End Behavior */}
        <div>
          <Space
            direction='vertical'
            size='small'
            style={{ width: '100%' }}
          >
            <Text>
              <RetweetOutlined /> Queue End Behavior
            </Text>
            <Select
              value={queueEndBehavior}
              onChange={onQueueEndBehaviorChange}
              options={queueEndBehaviorOptions}
              disabled={loading}
              style={{ width: '100%' }}
            />
          </Space>
        </div>
      </Space>
    </Card>
  );
};
