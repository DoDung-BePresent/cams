import { Link } from 'react-router';
import { Button, Checkbox, Flex, Form, Input, message, Typography } from 'antd';

/**
 * Hooks
 */
import { useAuth } from '@/providers';

/**
 * Validations
 */
import { loginValidation } from '../validations';

/**
 * Utils
 */
import { handleApiError } from '@/shared/utils';

/**
 * Types
 */
import { ErrorCodeEnum } from '@/shared/types';

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
  const { login } = useAuth();
  const [form] = Form.useForm<LoginFormType>();

  const handleSubmit = (values: LoginFormType) => {
    login.mutate(
      {
        email: values.email,
        password: values.password,
        rememberMe: values.rememberMe ?? false,
      },
      {
        onError: (error) => {
          handleApiError(
            error,
            {
              [ErrorCodeEnum.InvalidCredentials]: () => {
                message.error('Invalid credentials! Please try again!');
              },
              [ErrorCodeEnum.Unauthorized]: () => {
                message.error('Invalid credentials! Please try again!');
              },
            },
            'Login failed! Please try again.',
          );
        },
      },
    );
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
        loading={login.isPending}
      >
        Login
      </Button>
    </Form>
  );
};
