import { cn } from '@/shared/lib';
import { Switch, Space, Typography } from 'antd';
import type { SwitchProps } from 'antd';

const { Text } = Typography;

interface SettingSwitchProps extends Omit<SwitchProps, 'onChange'> {
  label: string;
  description?: string;
  value?: boolean;
  onChange?: (checked: boolean) => void;
}

/**
 * SettingSwitch - A styled switch component with label and description
 * Perfect for settings pages with clear labels and helpful descriptions
 *
 * @example
 * <SettingSwitch
 *   label="Auto-add to Playlist"
 *   description="Automatically add generated tracks to the selected playlist"
 *   value={autoAdd}
 *   onChange={setAutoAdd}
 * />
 */
export const SettingSwitch = ({
  label,
  description,
  value,
  onChange,
  className,
  ...switchProps
}: SettingSwitchProps) => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 0',
      }}
      className={cn(className)}
    >
      <Space
        direction='vertical'
        size={4}
        style={{ flex: 1 }}
      >
        <Text strong>{label}</Text>
        {description && (
          <Text
            type='secondary'
            style={{ fontSize: 13 }}
          >
            {description}
          </Text>
        )}
      </Space>
      <Switch
        checked={value}
        onChange={onChange}
        {...switchProps}
      />
    </div>
  );
};
