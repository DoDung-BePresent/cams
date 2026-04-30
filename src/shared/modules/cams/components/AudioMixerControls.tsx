import { Collapse, Slider, Radio, Space, Typography, Row, Col } from 'antd';
import {
  SoundOutlined,
  MutedOutlined,
  RetweetOutlined,
  ControlOutlined,
  DownOutlined,
} from '@ant-design/icons';
import { QueueEndBehavior } from '../types';
import { SettingSwitch } from '@/shared/components';
import { createStyles } from 'antd-style';

const { Text } = Typography;

const useStyle = createStyles(({ css, prefixCls }) => {
  return {
    queueBehaviorRadio: css`
      display: flex;
      flex-wrap: wrap;
      gap: 8px;

      .${prefixCls}-radio-button-wrapper {
        background: #151518;
        border-color: rgba(255, 255, 255, 0.1);
        color: #d1d5db;
        flex: 1;
        min-width: 160px;
        min-height: 44px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 10px;
        margin-inline-start: 0;
      }

      .${prefixCls}-radio-button-wrapper-checked {
        background: rgba(248, 64, 72, 0.16);
        border-color: #f84048;
        color: #fff;
        .${prefixCls}-typography {
          color: #fff !important;
        }
        .anticon {
          color: #fff !important;
        }
      }

      .${prefixCls}-radio-button-wrapper:not(.${prefixCls}-radio-button-wrapper-checked):hover {
        border-color: rgba(248, 64, 72, 0.45);
        color: #fff;
      }
    `,
  };
});

interface AudioMixerControlsProps {
  volumePercent: number;
  isMuted: boolean;
  queueEndBehavior: QueueEndBehavior;
  loading?: boolean;
  onVolumeChange: (volume: number) => void;
  onVolumeChangeComplete: (volume: number) => void;
  onMuteToggle: (muted: boolean) => void;
  onQueueEndBehaviorChange: (behavior: QueueEndBehavior) => void;
}

const queueEndBehaviorOptions = [
  {
    label: 'Stop',
    value: QueueEndBehavior.Stop,
    icon: (
      <MutedOutlined
        style={{
          fontSize: 16,
        }}
      />
    ),
  },
  {
    label: 'Repeat Queue',
    value: QueueEndBehavior.RepeatQueue,
    icon: (
      <RetweetOutlined
        style={{
          fontSize: 16,
        }}
      />
    ),
  },
  {
    label: 'Return to Schedule',
    value: QueueEndBehavior.ReturnToSchedule,
    icon: (
      <ControlOutlined
        style={{
          fontSize: 16,
        }}
      />
    ),
  },
];

export const AudioMixerControls = ({
  volumePercent,
  isMuted,
  queueEndBehavior,
  loading,
  onVolumeChange,
  onVolumeChangeComplete,
  onMuteToggle,
  onQueueEndBehaviorChange,
}: AudioMixerControlsProps) => {
  const { styles } = useStyle();

  return (
    <Collapse
      items={[
        {
          key: 'audio',
          label: (
            <Space size={10}>
              <SoundOutlined style={{ color: '#f84048' }} />
              <span style={{ color: '#f8f7f7', fontWeight: 800 }}>
                Audio Mixer
              </span>
              <Text style={{ color: '#9ca3af', fontSize: 12 }}>
                {isMuted ? 'Muted' : `${volumePercent}%`}
              </Text>
            </Space>
          ),
          children: (
            <Space
              vertical
              style={{ width: '100%' }}
              size={2}
            >
              {/* Volume Control with Mute */}
              <div>
                <Row
                  align='middle'
                  gutter={12}
                  style={{ marginBottom: 12 }}
                >
                  <Col flex='none'>
                    <Text
                      strong
                      style={{ color: '#f8f7f7' }}
                    >
                      Volume
                    </Text>
                  </Col>
                  <Col flex='auto'>
                    {isMuted ? (
                      <MutedOutlined
                        style={{
                          fontSize: 16,
                          color: '#ff4d4f',
                          paddingTop: 4,
                        }}
                      />
                    ) : (
                      <SoundOutlined
                        style={{
                          fontSize: 16,
                          paddingTop: 4,
                          color: '#9ca3af',
                        }}
                      />
                    )}
                  </Col>
                  <Col flex='none'>
                    <Text
                      type='secondary'
                      style={{
                        minWidth: 45,
                        display: 'inline-block',
                        textAlign: 'right',
                        fontSize: 13,
                        color: '#d1d5db',
                      }}
                    >
                      {isMuted ? '0%' : `${volumePercent}%`}
                    </Text>
                  </Col>
                </Row>

                <Row
                  align='middle'
                  gutter={12}
                >
                  <Col flex='auto'>
                    <Slider
                      min={0}
                      max={100}
                      value={isMuted ? 0 : volumePercent}
                      onChange={onVolumeChange}
                      onChangeComplete={onVolumeChangeComplete}
                      disabled={loading || isMuted}
                      style={{ margin: 0 }}
                      tooltip={{ formatter: (value) => `${value}%` }}
                      styles={{
                        rail: { background: 'rgba(255,255,255,0.12)' },
                        track: { background: '#f84048' },
                        handle: {
                          borderColor: '#f84048',
                          boxShadow: '0 0 0 4px rgba(248,64,72,0.16)',
                        },
                      }}
                    />
                  </Col>
                </Row>

                <SettingSwitch
                  label='Mute'
                  description='Temporarily silence audio output'
                  value={isMuted}
                  onChange={onMuteToggle}
                  disabled={loading}
                  checkedChildren={<MutedOutlined />}
                  unCheckedChildren={<SoundOutlined />}
                />
              </div>

              {/* Queue End Behavior */}
              <div>
                <Text
                  strong
                  style={{ color: '#f8f7f7' }}
                >
                  Queue End Behavior
                </Text>
                <Radio.Group
                  className={styles.queueBehaviorRadio}
                  style={{ marginTop: 10 }}
                  value={queueEndBehavior}
                  onChange={(e) => onQueueEndBehaviorChange(e.target.value)}
                  disabled={loading}
                  options={queueEndBehaviorOptions.map((option) => ({
                    label: (
                      <Space size={6}>
                        {option.icon}
                        <Text>{option.label}</Text>
                      </Space>
                    ),
                    value: option.value,
                  }))}
                  optionType='button'
                  buttonStyle='solid'
                />
              </div>
            </Space>
          ),
        },
      ]}
      styles={{
        root: {
          background: '#121215',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12,
          overflow: 'hidden',
        },
        header: {
          backgroundColor: 'rgba(255,255,255,0.035)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          padding: '14px 16px',
        },
        body: {
          backgroundColor: '#121215',
          padding: 16,
        },
      }}
      expandIcon={({ isActive }) => (
        <DownOutlined
          rotate={isActive ? 180 : 0}
          style={{ color: '#9ca3af' }}
        />
      )}
    />
  );
};
