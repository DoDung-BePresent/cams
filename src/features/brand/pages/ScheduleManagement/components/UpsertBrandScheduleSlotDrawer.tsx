import { useEffect } from 'react';
import { Button, Drawer, Flex, Form, Select, TimePicker } from 'antd';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';

import { DRAWER_WIDTHS } from '@/config';
import type { ScheduleSlotItem } from '@/shared/modules/schedules/types';

type UpsertBrandScheduleSlotDrawerProps = {
  open: boolean;
  slot: ScheduleSlotItem | null;
  selectedDay: number;
  playlistOptions: Array<{ label: string | undefined; value: string }>;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    id: string;
    daysOfWeek: number[];
    startTime: string;
    endTime: string;
    playlistId: string;
  }) => void;
};

type ScheduleSlotFormValues = {
  day: number;
  from: Dayjs;
  to: Dayjs;
  playlistId: string;
};

const dayOptions = [
  { label: 'Sunday', value: 0 },
  { label: 'Monday', value: 1 },
  { label: 'Tuesday', value: 2 },
  { label: 'Wednesday', value: 3 },
  { label: 'Thursday', value: 4 },
  { label: 'Friday', value: 5 },
  { label: 'Saturday', value: 6 },
];

const toDayjs = (value: string) => dayjs(value, 'HH:mm');

const toTimeString = (value: Dayjs) => value.format('HH:mm');

export const UpsertBrandScheduleSlotDrawer = ({
  open,
  slot,
  selectedDay,
  playlistOptions,
  loading,
  onClose,
  onSubmit,
}: UpsertBrandScheduleSlotDrawerProps) => {
  const [form] = Form.useForm<ScheduleSlotFormValues>();

  useEffect(() => {
    if (!open) {
      return;
    }

    if (!slot) {
      form.setFieldsValue({
        day: selectedDay,
        from: toDayjs('09:00'),
        to: toDayjs('11:00'),
        playlistId: undefined,
      } as unknown as ScheduleSlotFormValues);
      return;
    }

    form.setFieldsValue({
      day: slot.daysOfWeek?.[0] ?? selectedDay,
      from: toDayjs(slot.startTime),
      to: toDayjs(slot.endTime),
      playlistId: slot.playlistId,
    });
  }, [form, open, selectedDay, slot]);

  return (
    <Drawer
      closeIcon={null}
      title={slot ? 'Edit Schedule Slot' : 'Create Schedule Slot'}
      open={open}
      width={DRAWER_WIDTHS.medium}
      onClose={onClose}
      footer={
        <Flex
          justify='end'
          gap='small'
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
            loading={loading}
            onClick={() => form.submit()}
          >
            Save Slot
          </Button>
        </Flex>
      }
    >
      <Form
        size='large'
        form={form}
        layout='vertical'
        onFinish={(values) => {
          onSubmit({
            id: slot?.id || '',
            daysOfWeek: [values.day],
            startTime: toTimeString(values.from),
            endTime: toTimeString(values.to),
            playlistId: values.playlistId,
          });
        }}
      >
        <Form.Item
          label='Day'
          name='day'
          rules={[{ required: true, message: 'Please select day' }]}
        >
          <Select
            options={dayOptions}
            showSearch
            optionFilterProp='label'
          />
        </Form.Item>

        <Form.Item
          label='From'
          name='from'
          rules={[{ required: true, message: 'Please select start time' }]}
        >
          <TimePicker
            format='HH:mm'
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item
          label='To'
          name='to'
          dependencies={['from']}
          rules={[
            { required: true, message: 'Please select end time' },
            ({ getFieldValue }) => ({
              validator(_, value: Dayjs | undefined) {
                const from = getFieldValue('from') as Dayjs | undefined;
                if (!from || !value || value.isAfter(from)) {
                  return Promise.resolve();
                }
                return Promise.reject(
                  new Error('End time must be later than start time'),
                );
              },
            }),
          ]}
        >
          <TimePicker
            format='HH:mm'
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item
          label='Playlist'
          name='playlistId'
          rules={[{ required: true, message: 'Please select playlist' }]}
        >
          <Select
            placeholder='Select playlist'
            options={playlistOptions}
            showSearch
            optionFilterProp='label'
            allowClear
          />
        </Form.Item>
      </Form>
    </Drawer>
  );
};
