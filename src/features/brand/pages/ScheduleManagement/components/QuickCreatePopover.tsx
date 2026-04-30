import { useState, useEffect, useRef } from 'react';
import {
  Popover,
  Form,
  Select,
  Button,
  Space,
  Typography,
  Divider,
  TimePicker,
} from 'antd';
import dayjs from 'dayjs';
import { createStyles } from 'antd-style';

import { useSlotMutations } from '../hooks/useSlotMutations';
import type { ScheduleMusicItemDto } from '../types/schedule.types';

const { Text } = Typography;

const useStyles = createStyles(({ css, token }) => ({
  timePicker: css`
    .ant-picker-input > input {
      color: ${token.colorText} !important;
      font-weight: 500;
    }

    .ant-picker-suffix,
    .ant-picker-clear {
      color: ${token.colorTextSecondary} !important;
    }

    &.ant-picker-focused {
      .ant-picker-input > input {
        color: ${token.colorText} !important;
      }
    }

    &:hover {
      .ant-picker-input > input {
        color: ${token.colorText} !important;
      }
    }
  `,
}));

interface QuickCreatePopoverProps {
  open: boolean;
  anchorPosition: { x: number; y: number } | null;
  timeInfo: {
    startTime: string;
    endTime: string;
    dayOfWeek: number;
    dayName: string;
  } | null;
  spaceId: string;
  musicCatalog: ScheduleMusicItemDto[];
  onClose: () => void;
}

export const QuickCreatePopover = ({
  open,
  anchorPosition,
  timeInfo,
  spaceId,
  musicCatalog,
  onClose,
}: QuickCreatePopoverProps) => {
  const { styles } = useStyles();
  const [form] = Form.useForm();
  const { createSlot } = useSlotMutations(spaceId);
  const [selectedPlaylist, setSelectedPlaylist] = useState<string>();
  const [startTime, setStartTime] = useState<dayjs.Dayjs | null>(null);
  const [endTime, setEndTime] = useState<dayjs.Dayjs | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);

  // Reset form state when popover opens with new timeInfo
  useEffect(() => {
    if (open && timeInfo) {
      form.resetFields();
      setSelectedPlaylist(undefined);
      setStartTime(dayjs(timeInfo.startTime, 'HH:mm'));
      setEndTime(dayjs(timeInfo.endTime, 'HH:mm'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, timeInfo?.startTime, timeInfo?.endTime, timeInfo?.dayOfWeek]);

  useEffect(() => {
    // Update anchor position when it changes
    if (anchorRef.current && anchorPosition) {
      anchorRef.current.style.left = `${anchorPosition.x}px`;
      anchorRef.current.style.top = `${anchorPosition.y}px`;
    }
  }, [anchorPosition]);

  const handleSubmit = async () => {
    if (!timeInfo || !selectedPlaylist || !startTime || !endTime) return;

    // Validate time range
    if (endTime.isBefore(startTime) || endTime.isSame(startTime)) {
      form.setFields([
        {
          name: 'timeRange',
          errors: ['End time must be after start time'],
        },
      ]);
      return;
    }

    const newSlotId = crypto.randomUUID();

    await createSlot.mutateAsync({
      slotId: newSlotId,
      data: {
        daysOfWeek: [timeInfo.dayOfWeek],
        startTime: startTime.format('HH:mm'),
        endTime: endTime.format('HH:mm'),
        playlistId: selectedPlaylist,
      },
    });

    onClose();
  };

  if (!timeInfo) return null;

  const content = (
    <div style={{ width: 320 }}>
      <Space
        size='middle'
        style={{ width: '100%', display: 'flex', flexDirection: 'column' }}
      >
        {/* Day name */}
        <Text
          strong
          style={{ fontSize: 15 }}
        >
          {timeInfo.dayName}
        </Text>

        {/* Time range pickers */}
        <Form
          form={form}
          layout='vertical'
          size='large'
          styles={{
            label: {
              height: 22,
            },
          }}
        >
          <Space
            style={{ width: '100%' }}
            align='start'
          >
            <Form.Item
              label='Start'
              style={{ marginBottom: 0, flex: 1 }}
            >
              <TimePicker
                className={styles.timePicker}
                value={startTime}
                onChange={setStartTime}
                format='HH:mm'
                minuteStep={15}
                style={{ width: '100%' }}
              />
            </Form.Item>

            <div style={{ paddingTop: 37 }}>
              <Text type='secondary'>—</Text>
            </div>

            <Form.Item
              label='End'
              style={{ marginBottom: 0, flex: 1 }}
            >
              <TimePicker
                className={styles.timePicker}
                value={endTime}
                onChange={setEndTime}
                format='HH:mm'
                minuteStep={15}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Space>

          <Divider style={{ margin: '12px 0' }} />

          {/* Playlist selector */}
          <Form.Item
            label='Playlist'
            style={{ marginBottom: 0 }}
          >
            <Select
              placeholder='Select playlist'
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              value={selectedPlaylist}
              onChange={setSelectedPlaylist}
              options={musicCatalog.map((m) => ({
                label: m.title,
                value: m.id,
              }))}
            />
          </Form.Item>
        </Form>

        {/* Actions */}
        <Space
          style={{ width: '100%', justifyContent: 'flex-end' }}
          size='small'
        >
          <Button
            size='large'
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            size='large'
            type='primary'
            onClick={handleSubmit}
            disabled={!selectedPlaylist || !startTime || !endTime}
            loading={createSlot.isPending}
          >
            Save
          </Button>
        </Space>
      </Space>
    </div>
  );

  return (
    <>
      <style>
        {`
          .quick-create-popover .ant-popover-inner {
            padding: 16px;
          }
        `}
      </style>
      <Popover
        content={content}
        open={open}
        onOpenChange={(visible) => {
          if (!visible) onClose();
        }}
        trigger='click'
        placement='rightTop'
        arrow={false}
        overlayClassName='quick-create-popover'
      >
        {/* Anchor element */}
        <div
          ref={anchorRef}
          style={{
            position: 'fixed',
            width: 1,
            height: 1,
            pointerEvents: 'none',
            zIndex: -1,
          }}
        />
      </Popover>
    </>
  );
};
