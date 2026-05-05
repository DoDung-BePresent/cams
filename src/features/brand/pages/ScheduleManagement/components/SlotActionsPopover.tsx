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
  Flex,
} from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { createStyles } from 'antd-style';

import { useBrandSourceSlotMutations } from '../hooks/useBrandSourceSlotMutations';
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

interface SlotActionsPopoverProps {
  open: boolean;
  anchorPosition: { x: number; y: number } | null;
  slot: {
    id: string;
    playlistId: string;
    daysOfWeek: number[];
    startTime: string;
    endTime: string;
  } | null;
  sourceId: string | null;
  brandId?: string;
  musicCatalog: ScheduleMusicItemDto[];
  onClose: () => void;
}

export const SlotActionsPopover = ({
  open,
  anchorPosition,
  slot,
  sourceId,
  brandId,
  musicCatalog,
  onClose,
}: SlotActionsPopoverProps) => {
  const { styles } = useStyles();
  const [form] = Form.useForm();
  const { upsertSlot, deleteSlot } = useBrandSourceSlotMutations(
    sourceId || '',
    brandId,
  );
  const [selectedPlaylist, setSelectedPlaylist] = useState<string>();
  const [startTime, setStartTime] = useState<dayjs.Dayjs | null>(null);
  const [endTime, setEndTime] = useState<dayjs.Dayjs | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);

  // Reset form state when popover opens with slot data
  useEffect(() => {
    if (open && slot) {
      form.resetFields();
      setSelectedPlaylist(slot.playlistId);
      setStartTime(dayjs(slot.startTime, 'HH:mm'));
      setEndTime(dayjs(slot.endTime, 'HH:mm'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, slot?.id]);

  useEffect(() => {
    // Update anchor position when it changes
    if (anchorRef.current && anchorPosition) {
      anchorRef.current.style.left = `${anchorPosition.x}px`;
      anchorRef.current.style.top = `${anchorPosition.y}px`;
    }
  }, [anchorPosition]);

  const handleSubmit = async () => {
    if (!slot || !selectedPlaylist || !startTime || !endTime || !sourceId)
      return;

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

    await upsertSlot.mutateAsync({
      slotId: slot.id,
      data: {
        daysOfWeek: slot.daysOfWeek, // Keep existing days
        startTime: startTime.format('HH:mm'),
        endTime: endTime.format('HH:mm'),
        playlistId: selectedPlaylist,
      },
    });

    onClose();
  };

  const handleDelete = async () => {
    if (!slot) return;
    await deleteSlot.mutateAsync(slot.id);
    onClose();
  };

  if (!slot) return null;

  const content = (
    <div style={{ width: 320 }}>
      <Flex
        vertical
        gap='middle'
      >
        {/* Title */}
        <Text
          strong
          style={{ fontSize: 15 }}
        >
          Edit Time Slot
        </Text>

        {/* Form */}
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
          {/* Time range pickers */}
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
                minuteStep={5}
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
                minuteStep={5}
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
        <Flex
          justify='space-between'
          gap='small'
        >
          <Button
            size='large'
            danger
            icon={<DeleteOutlined />}
            onClick={handleDelete}
            loading={deleteSlot.isPending}
          >
            Delete
          </Button>
          <Flex gap='small'>
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
              disabled={
                !selectedPlaylist || !startTime || !endTime || !sourceId
              }
              loading={upsertSlot.isPending}
            >
              Save
            </Button>
          </Flex>
        </Flex>
      </Flex>
    </div>
  );

  return (
    <>
      <style>
        {`
          .slot-actions-popover .ant-popover-inner {
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
        overlayClassName='slot-actions-popover'
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
