/**
 * Node modules
 */
import { Flex, Typography } from 'antd';
import { Link } from 'react-router';

const { Title } = Typography;

/**
 * Components
 */
import { AuthWrapper } from '../components/AuthWrapper';
import { LoginForm } from '../components/LoginForm';

export const LoginPage = () => {
  return (
    <AuthWrapper>
      <Flex
        vertical
        gap={24}
      >
        <Flex
          justify='start'
          align='center'
        >
          <Title level={3}>Login</Title>
        </Flex>
        <LoginForm />
      </Flex>
    </AuthWrapper>
  );
};
