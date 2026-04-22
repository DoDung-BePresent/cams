import { Button, Drawer, Flex, Radio, Space, Typography, Alert } from 'antd';
import { useState } from 'react';

/**
 * Hooks
 */
import { useSetStoreGovernanceMode } from '@/features/brand/hooks';

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
  const [selectedMode, setSelectedMode] = useState<GovernanceModeEnum>(
    currentMode ?? GovernanceModeEnum.Freedom,
  );

  const setGovernanceMode = useSetStoreGovernanceMode();

  const handleSubmit = () => {
    setGovernanceMode.mutate(
      { storeIds: [storeId], mode: selectedMode },
      { onSuccess: onClose },
    );
  };

  const handleClose = () => {
    setSelectedMode(currentMode ?? GovernanceModeEnum.Freedom);
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
      </Space>
    </Drawer>
  );
};
