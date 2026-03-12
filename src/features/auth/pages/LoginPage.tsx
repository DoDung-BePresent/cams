/**
 * Node modules
 */
import { Flex, Typography } from 'antd';

const { Title } = Typography;

/**
 * Components
 */
import { AuthWrapper, LoginForm } from '../components';

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
