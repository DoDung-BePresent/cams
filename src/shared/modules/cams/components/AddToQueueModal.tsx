import { useState } from 'react';
import {
  Tabs,
  Select,
  Radio,
  Space,
  Typography,
  Form,
  Input,
  message,
} from 'antd';
import {
  PlayCircleOutlined,
  OrderedListOutlined,
  PlusOutlined,
  ThunderboltOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import { AppModal } from '@/shared/components/ui';
import { SettingSwitch } from '@/shared/components';
import { usePlaylists } from '@/shared/modules/playlists/hooks';
import { useTracks } from '@/shared/modules/tracks/hooks';
import { useAddTracksToQueue, useAddPlaylistToQueue } from '../hooks';
import { QueueInsertMode } from '../types';
import { MODAL_WIDTHS } from '@/config';
import { createStyles } from 'antd-style';

const { Text } = Typography;
const { TextArea } = Input;

interface AddToQueueModalProps {
  open: boolean;
  spaceId: string;
  storeId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const useStyle = createStyles(({ css, prefixCls }) => {
  return {
    customTabs: css`
      .${prefixCls}-tabs-nav {
        margin-bottom: 0;
        .${prefixCls}-tabs-nav-wrap {
          .${prefixCls}-tabs-nav-list {
            width: 100%;
            .${prefixCls}-tabs-tab {
              justify-content: center;
              &:hover {
                background-color: var(--ant-blue-1);
                color: var(--ant-tabs-item-selected-color);
              }
            }
          }
        }
      }
    `,
    queueModeRadio: css`
      .${prefixCls}-radio-button-wrapper-checked {
        .${prefixCls}-typography {
          color: #fff !important;
        }
        .anticon {
          color: #fff !important;
        }
      }
    `,
  };
});

const queueModeOptions = [
  {
    label: 'Play Now',
    value: QueueInsertMode.PlayNow,
    icon: <PlayCircleOutlined />,
    description: 'Switch to this track immediately',
  },
  {
    label: 'Play Next',
    value: QueueInsertMode.PlayNext,
    icon: <OrderedListOutlined />,
    description: 'Add after current track',
  },
  {
    label: 'Add to Queue',
    value: QueueInsertMode.AddToQueue,
    icon: <PlusOutlined />,
    description: 'Add to end of queue',
  },
];

export const AddToQueueModal = ({
  open,
  spaceId,
  storeId,
  onClose,
  onSuccess,
}: AddToQueueModalProps) => {
  const [form] = Form.useForm();
  const { styles } = useStyle();
  const [activeTab, setActiveTab] = useState<'tracks' | 'playlist'>('tracks');

  // Fetch data
  const { data: playlistsData, isLoading: isLoadingPlaylists } = usePlaylists({
    page: 1,
    pageSize: 100,
    status: 1,
    storeId,
  });

  const { data: tracksData, isLoading: isLoadingTracks } = useTracks({
    page: 1,
    pageSize: 100,
    status: 1,
  });

  // Mutations
  const addTracks = useAddTracksToQueue();
  const addPlaylist = useAddPlaylistToQueue();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (activeTab === 'tracks') {
        if (!values.trackIds || values.trackIds.length === 0) {
          message.warning('Please select at least one track');
          return;
        }

        await addTracks.mutateAsync({
          spaceId,
          data: {
            trackIds: values.trackIds,
            mode: values.mode || QueueInsertMode.AddToQueue,
            isClearExistingQueue: values.isClearExistingQueue || false,
            reason: values.reason || undefined,
          },
        });
      } else {
        if (!values.playlistId) {
          message.warning('Please select a playlist');
          return;
        }

        await addPlaylist.mutateAsync({
          spaceId,
          data: {
            playlistId: values.playlistId,
            mode: values.mode || QueueInsertMode.AddToQueue,
            isClearExistingQueue: values.isClearExistingQueue || false,
            reason: values.reason || undefined,
          },
        });
      }

      form.resetFields();
      onSuccess?.();
      onClose();
    } catch (error) {
      // Error handled by mutation hooks
      console.error('Failed to add to queue:', error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  const playlistOptions = (playlistsData?.items || []).map((playlist) => ({
    label: playlist.name,
    value: playlist.id,
  }));

  const trackOptions = (tracksData?.items || []).map((track) => ({
    label: track.title,
    value: track.id,
  }));

  return (
    <AppModal
      title='Add to Queue'
      size='large'
      open={open}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={addTracks.isPending || addPlaylist.isPending}
      width={MODAL_WIDTHS.large}
      okText='Add to Queue'
    >
      <Form
        form={form}
        layout='vertical'
        initialValues={{
          mode: QueueInsertMode.AddToQueue,
          isClearExistingQueue: false,
        }}
        size='large'
        styles={{
          label: {
            height: 22,
          },
        }}
      >
        <Tabs
          className={styles.customTabs}
          styles={{
            item: {
              width: 'fit-content',
              paddingInline: 20,
            },
            content: {
              paddingTop: 20,
            },
          }}
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as 'tracks' | 'playlist')}
          items={[
            {
              key: 'tracks',
              label: (
                <Space>
                  <ThunderboltOutlined />
                  Tracks
                </Space>
              ),
              children: (
                <Form.Item
                  name='trackIds'
                  label='Select Tracks'
                  rules={[
                    {
                      required: activeTab === 'tracks',
                      message: 'Please select at least one track',
                    },
                  ]}
                >
                  <Select
                    mode='multiple'
                    placeholder='Choose tracks'
                    options={trackOptions}
                    loading={isLoadingTracks}
                    showSearch
                    optionFilterProp='label'
                    maxTagCount='responsive'
                  />
                </Form.Item>
              ),
            },
            {
              key: 'playlist',
              label: (
                <Space>
                  <UnorderedListOutlined />
                  Playlists
                </Space>
              ),
              children: (
                <Form.Item
                  name='playlistId'
                  label='Select Playlist'
                  rules={[
                    {
                      required: activeTab === 'playlist',
                      message: 'Please select a playlist',
                    },
                  ]}
                >
                  <Select
                    placeholder='Choose a playlist'
                    options={playlistOptions}
                    loading={isLoadingPlaylists}
                    showSearch
                    optionFilterProp='label'
                  />
                </Form.Item>
              ),
            },
          ]}
          size='small'
        />

        <Form.Item
          name='mode'
          label='Queue Mode'
        >
          <Radio.Group
            className={styles.queueModeRadio}
            options={queueModeOptions.map((option) => ({
              label: (
                <Space>
                  {option.icon}
                  <Text>{option.label}</Text>
                </Space>
              ),
              value: option.value,
            }))}
            optionType='button'
            buttonStyle='solid'
          />
        </Form.Item>

        <SettingSwitch
          label='Clear existing queue before adding'
          description='Remove all current tracks from the queue before adding new ones'
          value={form.getFieldValue('isClearExistingQueue') ?? false}
          onChange={(checked) =>
            form.setFieldValue('isClearExistingQueue', checked)
          }
          className='mb-2! pt-0!'
        />

        <Form.Item
          name='isClearExistingQueue'
          hidden
          initialValue={false}
        >
          <input type='hidden' />
        </Form.Item>

        <Form.Item
          name='reason'
          label='Reason (Optional)'
        >
          <TextArea
            placeholder='Why are you adding this to the queue?'
            rows={2}
            maxLength={500}
            showCount
          />
        </Form.Item>
      </Form>
    </AppModal>
  );
};
