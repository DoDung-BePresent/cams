import { Flex, Typography } from 'antd';

const { Text } = Typography;

type PasswordStrengthProps = {
  password: string;
};

export const PasswordStrength = ({ password }: PasswordStrengthProps) => {
  const getStrength = (pwd: string) => {
    if (!pwd) return { level: 0, label: '', color: '' };
    if (pwd.length < 6) return { level: 1, label: 'Poor', color: '#ff4d4f' };
    if (pwd.length < 8) return { level: 2, label: 'Weak', color: '#faad14' };
    if (pwd.length < 10) return { level: 3, label: 'Good', color: '#52c41a' };
    return { level: 4, label: 'Strong', color: '#52c41a' };
  };

  const strength = getStrength(password);

  if (!password) return null;

  return (
    <Flex
      gap={8}
      align='center'
    >
      <div
        className='h-1 flex-1 rounded'
        style={{
          backgroundColor: strength.level >= 1 ? strength.color : '#d9d9d9',
        }}
      />
      <div
        className='h-1 flex-1 rounded'
        style={{
          backgroundColor: strength.level >= 2 ? strength.color : '#d9d9d9',
        }}
      />
      <div
        className='h-1 flex-1 rounded'
        style={{
          backgroundColor: strength.level >= 3 ? strength.color : '#d9d9d9',
        }}
      />
      <div
        className='h-1 flex-1 rounded'
        style={{
          backgroundColor: strength.level >= 4 ? strength.color : '#d9d9d9',
        }}
      />
      <Text style={{ color: strength.color }}>{strength.label}</Text>
    </Flex>
  );
};
