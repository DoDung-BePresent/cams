import { Link, useNavigate } from 'react-router';
import { Button, Checkbox, Flex, Form, Input, Typography, message } from 'antd';

/**
 * Hooks
 */
import { useAuth } from '@/providers/AuthProvider';

/**
 * Validations
 */
import { loginValidation } from '../validations/authValidation';

/**
 * Types
 */
type LoginFormType = {
  email: string;
  password: string;
  rememberMe: boolean;
};

const { Link: AntLink } = Typography;

export const LoginForm = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form] = Form.useForm<LoginFormType>();

  const handleSubmit = async (values: LoginFormType) => {
    try {
      await login({
        email: values.email,
        password: values.password,
        rememberMe: values.rememberMe ?? false,
      });

      message.success('Login successful!');
      
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Login failed!';
      message.error(msg);
    }
  };

  return (
    <Form
      form={form}
      size='large'
      layout='vertical'
      requiredMark={false}
      onFinish={handleSubmit}
      styles={{ label: { height: 20 } }}
    >
      <Form.Item
        label='Email Address'
        name='email'
        rules={loginValidation.email}
      >
        <Input placeholder='Enter email address' />
      </Form.Item>
      <Form.Item
        label='Password'
        name='password'
        rules={loginValidation.password}
      >
        <Input.Password placeholder='Enter password' />
      </Form.Item>
      <Form.Item
        name='rememberMe'
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
