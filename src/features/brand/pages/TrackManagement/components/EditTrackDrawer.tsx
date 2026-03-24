import { useState, useEffect } from 'react';
import {
  Drawer,
  Form,
  Input,
  Button,
  Flex,
  Row,
  Col,
  Typography,
  InputNumber,
  Slider,
  Select,
  Spin,
  Tag,
} from 'antd';

/**
 * Components
 */
import { ImageDragger } from '@/shared/components';
import { HLSAudioPlayer } from '@/shared/modules/tracks/components';

/**
 * Utils
 */
import { createImageUploadProps } from '@/shared/utils';

/**
 * Validations
 */
import { updateTrackValidation } from '@/shared/modules/tracks/validations';

/**
 * Types
 */
import type { UploadFile } from 'antd';
import type { UpdateTrackRequest } from '@/shared/modules/tracks/types';

/**
 * Hooks
 */
import { useTrack, useUpdateTrack } from '@/shared/modules/tracks/hooks';
import { useMoodOptions } from '@/shared/modules/moods/hooks';

/**
 * Constants
 */
import { GENRE_OPTIONS } from '@/shared/modules/tracks/constants';
import { MOOD_TYPE_COLORS } from '@/shared/modules/moods/constants';

/**
 * Configs
 */
import { DRAWER_WIDTHS } from '@/config';

const { Title } = Typography;

interface EditTrackDrawerProps {
  open: boolean;
  trackId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditTrackDrawer = ({
  open,
  trackId,
  onClose,
  onSuccess,
}: EditTrackDrawerProps) => {
  const [form] = Form.useForm<UpdateTrackRequest>();
  const { data: track, isLoading } = useTrack(trackId, open);
  const updateTrack = useUpdateTrack();
  const { options: moodOptions, isLoading: moodsLoading } = useMoodOptions();

  const [coverImageFile, setCoverImageFile] = useState<UploadFile | null>(null);
  const [energyLevel, setEnergyLevel] = useState(0.5);
  const [valence, setValence] = useState(0.5);

  const imageUploadProps = createImageUploadProps<UpdateTrackRequest>(
    setCoverImageFile,
    (field, value) => form.setFieldValue(field, value),
  );

  useEffect(() => {
    if (track) {
      form.setFieldsValue({
        title: track.title,
        artist: track.artist,
        genre: track.genre,
        durationSec: track.durationSec,
        bpm: track.bpm,
        moodId: track.moodId,
      });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEnergyLevel(track.energyLevel ?? 0.5);
      setValence(track.valence ?? 0.5);
    }
  }, [track, form]);

  const getCoverPreviewUrl = () => {
    if (coverImageFile?.originFileObj) {
      return URL.createObjectURL(coverImageFile.originFileObj);
    }
    return track?.coverImageUrl || null;
  };

  const handleSubmit = async (values: UpdateTrackRequest) => {
    if (!trackId) return;

    const payload: UpdateTrackRequest = {
      title: values.title,
      artist: values.artist,
      genre: values.genre,
      durationSec: values.durationSec,
      bpm: values.bpm,
      moodId: values.moodId,
      energyLevel,
      valence,
      coverImageFile: coverImageFile?.originFileObj,
    };

    updateTrack.mutate(
      { id: trackId, data: payload },
      {
        onSuccess: () => {
          handleCancel();
          onSuccess();
        },
      },
    );
  };

  const handleCancel = () => {
    form.resetFields();
    setCoverImageFile(null);
    onClose();
  };

  return (
    <Drawer
      title='Edit Track'
      placement='right'
      width={DRAWER_WIDTHS.medium}
      open={open}
      onClose={handleCancel}
      closeIcon={null}
      footer={
        <Flex
          justify='end'
          gap='small'
        >
          <Button
            size='large'
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button
            size='large'
            type='primary'
            onClick={() => form.submit()}
            loading={updateTrack.isPending}
            disabled={isLoading}
          >
            Update
          </Button>
        </Flex>
      }
    >
      {isLoading ? (
        <Flex
          justify='center'
          align='center'
          style={{ minHeight: 400 }}
        >
          <Spin size='large' />
        </Flex>
      ) : (
        <Form
          size='large'
          form={form}
          layout='vertical'
          onFinish={handleSubmit}
          styles={{
            label: {
              height: 22,
            },
          }}
        >
          {/* Current Audio */}
          {track?.hlsUrl && (
            <div style={{ marginBottom: 24 }}>
              <Title
                level={5}
                style={{ marginBottom: 16 }}
              >
                Current Audio
              </Title>
              <HLSAudioPlayer
                hlsUrl={track.hlsUrl}
                title={track.title}
                artist={track.artist}
                coverImageUrl={track.coverImageUrl}
                shouldStop={!open}
              />
            </div>
          )}

          {/* Basic Information */}
          <div style={{ marginBottom: 24 }}>
            <Title
              level={5}
              style={{ marginBottom: 16 }}
            >
              Basic Information
            </Title>

            <Form.Item
              label='Track Title'
              name='title'
              rules={updateTrackValidation.title}
            >
              <Input placeholder='e.g., Summer Vibes' />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label='Artist'
                  name='artist'
                  rules={updateTrackValidation.artist}
                >
                  <Input placeholder='e.g., John Doe' />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label='Genre'
                  name='genre'
                  rules={updateTrackValidation.genre}
                >
                  <Select
                    placeholder='Select genre'
                    options={GENRE_OPTIONS}
                    showSearch
                    allowClear
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>

          {/* Cover Image */}
          <div style={{ marginBottom: 24 }}>
            <Title
              level={5}
              style={{ marginBottom: 16 }}
            >
              Cover Image
            </Title>

            <Form.Item
              label='Cover Image'
              name='coverImageFile'
              valuePropName='file'
            >
              <ImageDragger
                previewUrl={getCoverPreviewUrl()}
                uploadProps={imageUploadProps}
              />
            </Form.Item>
          </div>

          {/* Audio Metadata */}
          <div style={{ marginBottom: 24 }}>
            <Title
              level={5}
              style={{ marginBottom: 16 }}
            >
              Audio Metadata
            </Title>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label='Duration (seconds)'
                  name='durationSec'
                  rules={updateTrackValidation.durationSec}
                >
                  <InputNumber
                    min={1}
                    placeholder='e.g., 180'
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label='BPM'
                  name='bpm'
                  rules={updateTrackValidation.bpm}
                >
                  <InputNumber
                    min={20}
                    max={300}
                    placeholder='e.g., 120'
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label='Energy Level (0.0 - 1.0)'>
              <Slider
                min={0}
                max={1}
                step={0.1}
                value={energyLevel}
                onChange={setEnergyLevel}
                marks={{ 0: '0.0', 0.5: '0.5', 1: '1.0' }}
              />
            </Form.Item>

            <Form.Item label='Valence (0.0 - 1.0)'>
              <Slider
                min={0}
                max={1}
                step={0.1}
                value={valence}
                onChange={setValence}
                marks={{ 0: '0.0', 0.5: '0.5', 1: '1.0' }}
              />
            </Form.Item>
          </div>

          {/* Additional Settings */}
          <div style={{ marginBottom: 24 }}>
            <Title
              level={5}
              style={{ marginBottom: 16 }}
            >
              Additional Settings
            </Title>

            <Form.Item
              label='Mood'
              name='moodId'
            >
              <Select
                placeholder='Select mood'
                options={moodOptions}
                loading={moodsLoading}
                optionRender={(option) => (
                  <Flex
                    justify='space-between'
                    align='center'
                  >
                    <span>{option.label}</span>
                    {option.data.moodType && (
                      <Tag color={MOOD_TYPE_COLORS[option.data.moodType]}>
                        {option.data.moodType}
                      </Tag>
                    )}
                  </Flex>
                )}
                allowClear
                showSearch
              />
            </Form.Item>
          </div>
        </Form>
      )}
    </Drawer>
  );
};
