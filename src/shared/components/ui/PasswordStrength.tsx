import { useState } from 'react';
import { Flex, Typography, message } from 'antd';

const { Text } = Typography;

type PasswordStrengthProps = {
  password: string;
  onPasswordChange?: (password: string) => void;
  showGenerator?: boolean;
  description?: string;
};

export const PasswordStrength = ({
  password,
  onPasswordChange,
  showGenerator = false,
  description,
}: PasswordStrengthProps) => {
  const [generatedPassword, setGeneratedPassword] = useState<string>('');

  const getStrength = (pwd: string) => {
    if (!pwd) return { level: 0, label: '', color: '' };

    let level = 0;
    const checks = {
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /[0-9]/.test(pwd),
      special: /[^A-Za-z0-9]/.test(pwd),
    };

    // Calculate strength level
    if (checks.length) level++;
    if (checks.uppercase && checks.lowercase) level++;
    if (checks.number) level++;
    if (checks.special) level++;

    const strengthMap = [
      { level: 0, label: '', color: '' },
      { level: 1, label: 'Weak', color: '#ff4d4f' },
      { level: 2, label: 'Fair', color: '#faad14' },
      { level: 3, label: 'Good', color: '#52c41a' },
      { level: 4, label: 'Strong', color: '#52c41a' },
    ];

    return strengthMap[level] || strengthMap[0];
  };

  const generatePassword = (length: number = 16): string => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const allChars = uppercase + lowercase + numbers + special;

    let password = '';

    // Ensure at least one character from each category
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];

    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password
    return password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  };

  const handleGenerate = () => {
    const newPassword = generatePassword();
    setGeneratedPassword(newPassword);
    onPasswordChange?.(newPassword);
    message.success('Password generated!');
  };

  const strength = getStrength(password);
  const displayPassword = generatedPassword || password;

  if (!password && !showGenerator) return null;

  return (
    <Flex
      vertical
      gap={8}
    >
      {/* Strength Indicator */}
      {displayPassword && (
        <Flex
          gap={8}
          align='center'
        >
          <div
            className='h-1.25 flex-1 rounded'
            style={{
              backgroundColor: strength.level >= 1 ? strength.color : '#d9d9d9',
            }}
          />
          <div
            className='h-1.25 flex-1 rounded'
            style={{
              backgroundColor: strength.level >= 2 ? strength.color : '#d9d9d9',
            }}
          />
          <div
            className='h-1.25 flex-1 rounded'
            style={{
              backgroundColor: strength.level >= 3 ? strength.color : '#d9d9d9',
            }}
          />
          <div
            className='h-1.25 flex-1 rounded'
            style={{
              backgroundColor: strength.level >= 4 ? strength.color : '#d9d9d9',
            }}
          />
        </Flex>
      )}

      {/* Generator Actions */}
      {showGenerator && (
        <Flex
          gap={8}
          align='center'
        >
          <Text type='secondary'>
            {description}{' '}
            <Text
              onClick={handleGenerate}
              underline
              className='font-medium transition-opacity duration-150 ease-in-out hover:opacity-65'
            >
              Generate Password
            </Text>
          </Text>
        </Flex>
      )}
    </Flex>
  );
};
