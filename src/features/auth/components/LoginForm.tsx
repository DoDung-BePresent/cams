/**
 * Node modules
 */
import { Link } from 'react-router';
import { Button, Checkbox, Flex, Form, Input, Typography } from 'antd';
import { loginValidation } from '../validations/authValidation';

const { Link: AntLink } = Typography;

/**
 * Types
 */
type LoginFormType = {
  email: string;
  password: string;
  remember: boolean;
};

export const LoginForm = () => {
  return (
    <Form
      size='large'
      layout='vertical'
      requiredMark={false}
      styles={{
        label: {
          height: 20,
        },
      }}
    >
      <Form.Item<LoginFormType>
        label='Email Address'
        name='email'
        rules={loginValidation.email}
      >
        <Input placeholder='Enter email address' />
      </Form.Item>
      <Form.Item<LoginFormType>
        label='Password'
        name='password'
        rules={loginValidation.password}
      >
        <Input.Password placeholder='Enter password' />
      </Form.Item>
      <Form.Item<LoginFormType>
        name='remember'
        valuePropName='checked'
        label={null}
      >
        <Flex justify='space-between'>
          <Checkbox>Remember me</Checkbox>
          <Link to='/forgot-password'>
            <AntLink>Forgot Password?</AntLink>
          </Link>
        </Flex>
      </Form.Item>
      <Button
        type='primary'
        htmlType='submit'
        className='w-full'
      >
        Login
      </Button>
    </Form>
  );
};
