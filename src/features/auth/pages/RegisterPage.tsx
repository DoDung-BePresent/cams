import { Flex, Typography } from 'antd';
import { Link } from 'react-router';

const { Title } = Typography;

import { AuthWrapper } from '../components/AuthWrapper';
import { RegisterForm } from '../components/RegisterForm';

export const RegisterPage = () => {
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
          <Title level={3}>Sign up</Title>
          <Link to='/login'>Already have an account?</Link>
        </Flex>
        <RegisterForm />
      </Flex>
    </AuthWrapper>
  );
};
