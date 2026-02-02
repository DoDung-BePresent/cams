import { Link, useNavigate } from 'react-router';
import { Button, Checkbox, Flex, Form, Input, Typography, message } from 'antd';
import { useAuth } from '@/providers/AuthProvider';
import { loginValidation } from '../validations/authValidation';

const { Link: AntLink } = Typography;

type LoginFormType = {
  email: string;
  password: string;
  remember: boolean;
};

export const LoginForm = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form] = Form.useForm<LoginFormType>();

  const handleSubmit = async (values: LoginFormType) => {
    try {
      await login(values.email, values.password);
      message.success('Login successful!');

      // Navigate based on email (temporary for demo)
      if (values.email.includes('admin')) {
        navigate('/admin/dashboard');
      } else {
        navigate('/manager/dashboard');
      }
    } catch (error) {
      message.error('Login failed!');
    }
  };

  return (
    <Form
      form={form}
      size='large'
      layout='vertical'
      requiredMark={false}
      onFinish={handleSubmit}
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
