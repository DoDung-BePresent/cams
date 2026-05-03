import { Link } from 'react-router';
import { Button, Checkbox, Flex, Form, Input } from 'antd';

/**
 * Hooks
 */
import { useAuth } from '@/providers';

/**
 * Validations
 */
import { loginValidation } from '../validations';

/**
 * Types
 */
import { ErrorCodeEnum } from '@/shared/types';

type LoginFormType = {
  email: string;
  password: string;
  rememberMe: boolean;
};

type ApiError = {
  response?: {
    data?: {
      errorCode?: string;
      message?: string;
    };
  };
};

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
        onError: (error: unknown) => {
          const apiError = error as ApiError;
          const errorCode = apiError.response?.data?.errorCode;
          const errorMessage =
            apiError.response?.data?.message ||
            'Login failed! Please try again.';

          // Handle InvalidCredentials (wrong email/password)
          if (errorCode === ErrorCodeEnum.InvalidCredentials) {
            form.setFields([
              {
                name: 'email',
                errors: [''],
              },
              {
                name: 'password',
                errors: [errorMessage], // Show error on password field
              },
            ]);
            return;
          }

          // Handle other auth errors
          if (errorCode === ErrorCodeEnum.Forbidden) {
            form.setFields([
              {
                name: 'email',
                errors: ['You do not have permission to access this system'],
              },
            ]);
            return;
          }
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
      // autoComplete='off'
      initialValues={{
        rememberMe: true,
      }}
      styles={{ label: { height: 20 } }}
    >
      <Form.Item<LoginFormType>
        label={
          <span className='text-sm font-medium text-slate-700'>
            Email Address
          </span>
        }
        name='email'
        rules={loginValidation.email}
      >
        <Input
          placeholder='Enter email address'
          className='h-12 rounded-xl !border-slate-200 !bg-slate-100 px-5 text-base !text-slate-900 transition-all hover:!bg-slate-200 focus:!bg-white focus:ring-2 focus:ring-slate-900/10'
        />
      </Form.Item>

      <Form.Item<LoginFormType>
        label={
          <span className='text-sm font-medium text-slate-700'>Password</span>
        }
        name='password'
        rules={loginValidation.password}
      >
        <Input.Password
          placeholder='Enter password'
          className='h-12 rounded-xl !border-slate-200 !bg-slate-100 px-5 text-base !text-slate-900 transition-all hover:!bg-slate-200 focus:!bg-white focus:ring-2 focus:ring-slate-900/10 [&>input]:!bg-transparent [&>input]:!text-slate-900'
        />
      </Form.Item>

      <Form.Item<LoginFormType>
        name='rememberMe'
        valuePropName='checked'
        label={null}
      >
        <Flex justify='space-between'>
          <Checkbox
            defaultChecked
            className='!text-slate-700'
          >
            Remember me
          </Checkbox>
          <Link
            to='/forgot-password'
            className='text-[#1677ff] hover:text-[#4096ff]'
          >
            Forgot Password?
          </Link>
        </Flex>
      </Form.Item>

      <Button
        type='primary'
        htmlType='submit'
        className='mt-6 h-12 w-full rounded-full !border-0 !bg-slate-900 text-base font-medium !text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:!bg-slate-800 hover:shadow-lg'
        loading={login.isPending}
      >
        Sign In
      </Button>
    </Form>
  );
};
