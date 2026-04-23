import {
  Button,
  Drawer,
  Flex,
  Radio,
  Select,
  Space,
  Typography,
  Alert,
} from 'antd';
import { useState } from 'react';

/**
 * Hooks
 */
import {
  useSetStoreGovernanceMode,
  useBrandScheduleTemplates,
} from '@/features/brand/hooks';

/**
 * Types
 */
import {
  GovernanceModeEnum,
  GOVERNANCE_MODE_DESCRIPTIONS,
  GOVERNANCE_MODE_LABELS,
} from '@/features/brand/types';

/**
 * Config
 */
import { DRAWER_WIDTHS } from '@/config';

/**
 * Providers
 */
import { useAuth } from '@/providers';

const { Text } = Typography;

type SetGovernanceModeDrawerProps = {
  open: boolean;
  storeId: string;
  storeName?: string;
  currentMode?: GovernanceModeEnum;
  onClose: () => void;
};

export const SetGovernanceModeDrawer = ({
  open,
  storeId,
  currentMode,
  onClose,
}: SetGovernanceModeDrawerProps) => {
  const { user } = useAuth();
  const brandId = user?.brandId ?? undefined;

  const [selectedMode, setSelectedMode] = useState<GovernanceModeEnum>(
    currentMode ?? GovernanceModeEnum.Freedom,
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState<
    string | undefined
  >(undefined);

  const setGovernanceMode = useSetStoreGovernanceMode();
  const { data: templates = [], isLoading: templatesLoading } =
    useBrandScheduleTemplates(
      brandId,
      open && selectedMode === GovernanceModeEnum.StrictSync,
    );

  const templateOptions = templates.map((t) => ({
    label: t.title,
    value: t.id,
  }));

  const handleSubmit = () => {
    setGovernanceMode.mutate(
      {
        storeIds: [storeId],
        mode: selectedMode,
        ...(selectedMode === GovernanceModeEnum.StrictSync && selectedTemplateId
          ? { sourceId: selectedTemplateId }
          : {}),
      },
      { onSuccess: onClose },
    );
  };

  const handleClose = () => {
    setSelectedMode(currentMode ?? GovernanceModeEnum.Freedom);
    setSelectedTemplateId(undefined);
    onClose();
  };

  const modeOptions = [
    GovernanceModeEnum.StrictSync,
    GovernanceModeEnum.AIMode,
    GovernanceModeEnum.Freedom,
  ] as const;

  return (
    <Drawer
      closeIcon={null}
      title='Set Governance Mode'
      open={open}
      onClose={handleClose}
      afterOpenChange={(nextOpen) => {
        if (nextOpen) {
          setSelectedMode(currentMode ?? GovernanceModeEnum.Freedom);
          setSelectedTemplateId(undefined);
        }
      }}
      width={DRAWER_WIDTHS.small}
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
            onClick={handleSubmit}
            loading={setGovernanceMode.isPending}
          >
            Apply
          </Button>
        </Flex>
      }
    >
      <Space
        direction='vertical'
        size='large'
        style={{ width: '100%' }}
      >
        {selectedMode === GovernanceModeEnum.StrictSync && (
          <Alert
            type='warning'
            showIcon
            message='Switching to Strict Sync will immediately enqueue a schedule-sync job for this store.'
          />
        )}

        {selectedMode === GovernanceModeEnum.AIMode && (
          <Alert
            type='info'
            showIcon
            message='AI Mode allows bounded AI playback with temporary manager interventions.'
          />
        )}

        <Radio.Group
          value={selectedMode}
          onChange={(e) =>
            setSelectedMode(e.target.value as GovernanceModeEnum)
          }
          style={{ width: '100%' }}
        >
          <Space
            direction='vertical'
            size='middle'
            style={{ width: '100%' }}
          >
            {modeOptions.map((mode) => (
              <Radio
                key={mode}
                value={mode}
                style={{ width: '100%', alignItems: 'flex-start' }}
              >
                <Space
                  direction='vertical'
                  size={2}
                >
                  <Text strong>{GOVERNANCE_MODE_LABELS[mode]}</Text>
                  <Text
                    type='secondary'
                    style={{ fontSize: 13 }}
                  >
                    {GOVERNANCE_MODE_DESCRIPTIONS[mode]}
                  </Text>
                </Space>
              </Radio>
            ))}
          </Space>
        </Radio.Group>

        {selectedMode === GovernanceModeEnum.StrictSync && (
          <Alert
            type='warning'
            showIcon
            message='Switching to Strict Sync will immediately enqueue a schedule-sync job for this store.'
          />
        )}

        {selectedMode === GovernanceModeEnum.StrictSync && (
          <Space
            direction='vertical'
            size={4}
            style={{ width: '100%' }}
          >
            <Text>
              Brand Schedule Template <Text type='secondary'>(optional)</Text>
            </Text>
            <Select
              size='large'
              placeholder='Select a brand schedule template to apply...'
              options={templateOptions}
              value={selectedTemplateId}
              onChange={setSelectedTemplateId}
              loading={templatesLoading}
              allowClear
              showSearch
              optionFilterProp='label'
              style={{ width: '100%' }}
            />
            <Text
              type='secondary'
              style={{ fontSize: 12 }}
            >
              If selected, this template's slots will be linked to all spaces in
              this store, allowing brand execution jobs to be built immediately
              after sync.
            </Text>
          </Space>
        )}

        {selectedMode === GovernanceModeEnum.AIMode && (
          <Alert
            type='info'
            showIcon
            message='AI Mode allows bounded AI playback with temporary manager interventions.'
          />
        )}
      </Space>
    </Drawer>
  );
};
