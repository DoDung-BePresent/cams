import { useEffect } from 'react';
import {
  Drawer,
  Form,
  Select,
  TimePicker,
  Button,
  Flex,
  Checkbox,
  Space,
  Typography,
} from 'antd';
import dayjs from 'dayjs';

import type { ScheduleMusicItemDto } from '../types/schedule.types';
import { useSlotMutations } from '../hooks';

const { Text } = Typography;

const WEEKDAYS = [
  { label: 'Sunday', value: 0 },
  { label: 'Monday', value: 1 },
  { label: 'Tuesday', value: 2 },
  { label: 'Wednesday', value: 3 },
  { label: 'Thursday', value: 4 },
  { label: 'Friday', value: 5 },
  { label: 'Saturday', value: 6 },
];

interface CreateSlotDrawerProps {
  open: boolean;
  onClose: () => void;
  spaceId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  slot: any | null;
  prefilledTime?: {
    startTime: string;
    endTime: string;
    daysOfWeek: number[];
  } | null;
  musicCatalog: ScheduleMusicItemDto[];
}

export const CreateSlotDrawer = ({
  open,
  onClose,
  spaceId,
  slot,
  prefilledTime,
  musicCatalog,
}: CreateSlotDrawerProps) => {
  const [form] = Form.useForm();
  const { createSlot, updateSlot } = useSlotMutations(spaceId);

  const isEdit = !!slot;

  useEffect(() => {
    if (open && slot) {
      // Editing existing slot
      form.setFieldsValue({
        playlistId: slot.musicId,
        daysOfWeek: slot.daysOfWeek,
        timeRange: [
          dayjs(slot.startTime, 'HH:mm'),
          dayjs(slot.endTime, 'HH:mm'),
        ],
      });
    } else if (open && prefilledTime) {
      // Creating new slot with prefilled time from calendar selection
      form.setFieldsValue({
        daysOfWeek: prefilledTime.daysOfWeek,
        timeRange: [
          dayjs(prefilledTime.startTime, 'HH:mm'),
          dayjs(prefilledTime.endTime, 'HH:mm'),
        ],
      });
    } else if (open) {
      // Creating new slot without prefilled time
      form.resetFields();
    }
  }, [open, slot, prefilledTime, form]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSubmit = async (values: any) => {
    const [startTime, endTime] = values.timeRange;

    const payload = {
      playlistId: values.playlistId,
      daysOfWeek: values.daysOfWeek.sort((a: number, b: number) => a - b),
      startTime: startTime.format('HH:mm'),
      endTime: endTime.format('HH:mm'),
    };

    // TODO: Client-side overlap validation
    // Waiting for BE to add overlap validation

    if (isEdit) {
      await updateSlot.mutateAsync({ slotId: slot.id, data: payload });
    } else {
      // Generate new GUID for slot
      const newSlotId = crypto.randomUUID();
      await createSlot.mutateAsync({ slotId: newSlotId, data: payload });
    }

    handleClose();
  };

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Drawer
      title={isEdit ? 'Edit Time Slot' : 'Add Time Slot'}
      open={open}
      onClose={handleClose}
      width={480}
      closeIcon={null}
      footer={
        <Flex
          justify='end'
          gap='small'
        >
          <Button
            size='large'
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            size='large'
            type='primary'
            onClick={() => form.submit()}
            loading={createSlot.isPending || updateSlot.isPending}
          >
            {isEdit ? 'Update' : 'Create'}
          </Button>
        </Flex>
      }
    >
      <Form
        form={form}
        layout='vertical'
        onFinish={handleSubmit}
        size='large'
        initialValues={{
          daysOfWeek: [1, 2, 3, 4, 5], // Weekdays by default
        }}
      >
        <Form.Item
          name='playlistId'
          label='Playlist'
          rules={[{ required: true, message: 'Please select a playlist' }]}
        >
          <Select
            placeholder='Select playlist'
            showSearch
            optionFilterProp='label'
            options={musicCatalog.map((m) => ({
              label: m.title,
              value: m.id,
            }))}
          />
        </Form.Item>

        <Form.Item
          name='daysOfWeek'
          label='Days of Week'
          rules={[
            { required: true, message: 'Please select at least one day' },
          ]}
        >
          <Checkbox.Group>
            <Space direction='vertical'>
              {WEEKDAYS.map((day) => (
                <Checkbox
                  key={day.value}
                  value={day.value}
                >
                  {day.label}
                </Checkbox>
              ))}
            </Space>
          </Checkbox.Group>
        </Form.Item>

        <Form.Item
          name='timeRange'
          label='Time Range'
          rules={[
            { required: true, message: 'Please select time range' },
            {
              validator: (_, value) => {
                if (!value || value.length !== 2) {
                  return Promise.resolve();
                }
                const [start, end] = value;
                if (end.isBefore(start) || end.isSame(start)) {
                  return Promise.reject('End time must be after start time');
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <TimePicker.RangePicker
            format='HH:mm'
            minuteStep={15}
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Text
          type='secondary'
          style={{ fontSize: 12 }}
        >
          Note: Overlapping slots may cause unexpected behavior. Make sure your
          time slots don't overlap.
        </Text>
      </Form>
    </Drawer>
  );
};
