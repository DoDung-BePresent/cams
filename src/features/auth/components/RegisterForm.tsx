/**
 * Node modules
 */
import { useState } from 'react';
import { Link } from 'react-router';
import { Button, Checkbox, Col, Form, Input, Row, Typography } from 'antd';

/**
 * Components
 */
import { PasswordStrength } from '@/shared/components/ui/PasswordStrength';

/**
 * Validations
 */
import { registerValidation } from '../validations/authValidation';

const { Text, Link: AntLink } = Typography;

type RegisterFormType = {
  firstName: string;
  lastName: string;
  store?: string;
  email: string;
  password: string;
  terms: boolean;
};

export const RegisterForm = () => {
  const [form] = Form.useForm<RegisterFormType>();
  const [password, setPassword] = useState('');

  const handleSubmit = (values: RegisterFormType) => {
    console.log('Register values:', values);
    // TODO: Implement registration logic
  };

  return (
    <Form
      form={form}
      size='large'
      layout='vertical'
      onFinish={handleSubmit}
      styles={{
        label: {
          height: 20,
        },
      }}
    >
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item<RegisterFormType>
            label='First Name'
            name='firstName'
            rules={registerValidation.firstName}
          >
            <Input placeholder='John' />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item<RegisterFormType>
            label='Last Name'
            name='lastName'
            rules={registerValidation.lastName}
          >
            <Input placeholder='Doe' />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item<RegisterFormType>
        label='Store'
        name='store'
        rules={registerValidation.store}
      >
        <Input placeholder='Demo Inc.' />
      </Form.Item>

      <Form.Item<RegisterFormType>
        label='Email Address'
        name='email'
        rules={registerValidation.email}
      >
        <Input placeholder='demo@store.com' />
      </Form.Item>

      <Form.Item<RegisterFormType>
        label='Password'
        name='password'
        rules={registerValidation.password}
      >
        <Input.Password
          placeholder='Enter password'
          onChange={(e) => setPassword(e.target.value)}
        />
      </Form.Item>

      <PasswordStrength password={password} />

      <Form.Item<RegisterFormType>
        name='terms'
        valuePropName='checked'
        rules={registerValidation.terms}
        label={null}
      >
        <Checkbox>
          <Text>
            By Signing up, you agree to our{' '}
            <Link to='/terms'>
              <AntLink>Terms of Service</AntLink>
            </Link>{' '}
            and{' '}
            <Link to='/privacy'>
              <AntLink>Privacy Policy</AntLink>
            </Link>
          </Text>
        </Checkbox>
      </Form.Item>

      <Button
        type='primary'
        htmlType='submit'
        className='w-full'
      >
        Create Account
      </Button>
    </Form>
  );
};
