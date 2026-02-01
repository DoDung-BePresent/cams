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
          justify='space-between'
          align='center'
        >
          <Title level={3}>Login</Title>
          <Link to='/register'>Don't have an account?</Link>
        </Flex>
        <LoginForm />
      </Flex>
    </AuthWrapper>
  );
};
