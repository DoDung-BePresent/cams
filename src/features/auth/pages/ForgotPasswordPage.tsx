import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { App, Button, Flex, Form, Input, Progress, Typography } from 'antd';
import {
  Check,
  CheckCircle2,
  KeyRound,
  LockKeyhole,
  Mail,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';

import { authService } from '@/shared/modules/auth/services';
import type {
  ForgotPasswordOtpData,
  ForgotPasswordRequest,
  ResetForgotPasswordRequest,
  VerifyForgotPasswordOtpData,
} from '@/shared/modules/auth/types';
import { Seo } from '@/shared/components';
import { getErrorData, getErrorMessage } from '@/shared/utils';
import { AuthWrapper } from '../components';
import { forgotPasswordValidation } from '../validations';

type ForgotPasswordStep = 'email' | 'otp' | 'reset';

type OtpFormValues = {
  otp: string;
};

const FLOW_STEPS: Array<{
  key: ForgotPasswordStep;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
}> = [
  { key: 'email', label: 'Email', icon: Mail },
  { key: 'otp', label: 'OTP', icon: KeyRound },
  { key: 'reset', label: 'Password', icon: LockKeyhole },
];

const getSecondsUntil = (iso?: string) => {
  if (!iso) return 0;
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 1000));
};

const formatCountdown = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const readErrorMetaNumber = (error: unknown, key: string) => {
  const errors = getErrorData(error)?.errors;
  if (!Array.isArray(errors)) return undefined;

  for (const item of errors) {
    if (typeof item !== 'string') continue;
    const [metaKey, metaValue] = item.split('=');
    if (metaKey === key) {
      const parsed = Number(metaValue);
      return Number.isFinite(parsed) ? parsed : undefined;
    }
  }

  return undefined;
};

const StepRail = ({ current }: { current: ForgotPasswordStep }) => {
  const currentIndex = FLOW_STEPS.findIndex((item) => item.key === current);

  return (
    <div className='mb-8 grid grid-cols-3 gap-3'>
      {FLOW_STEPS.map((item, index) => {
        const Icon = item.icon;
        const isComplete = index < currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <div
            key={item.key}
            className={`flex min-w-0 items-center gap-2 rounded-2xl border px-3 py-2.5 transition-all ${
              isCurrent
                ? 'border-rose-200 bg-rose-50 text-rose-700 shadow-sm shadow-rose-100/80'
                : isComplete
                  ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 bg-white/70 text-slate-400'
            }`}
          >
            <span
              className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${
                isCurrent
                  ? 'bg-rose-600 text-white'
                  : isComplete
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 text-slate-400'
              }`}
            >
              {isComplete ? (
                <Check
                  size={15}
                  strokeWidth={2.5}
                />
              ) : (
                <Icon
                  size={15}
                  strokeWidth={2.2}
                />
              )}
            </span>
            <span className='truncate text-sm font-semibold'>{item.label}</span>
          </div>
        );
      })}
    </div>
  );
};

const StatusPanel = ({
  tone,
  icon,
  title,
  children,
}: {
  tone: 'info' | 'success';
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) => {
  const toneClass =
    tone === 'success'
      ? 'border-emerald-100 bg-emerald-50/90 text-emerald-950'
      : 'border-rose-100 bg-rose-50/90 text-slate-950';
  const iconClass =
    tone === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-600 text-white';

  return (
    <div className={`mb-5 rounded-3xl border p-4 ${toneClass}`}>
      <div className='flex items-start gap-3'>
        <span
          className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-2xl ${iconClass}`}
        >
          {icon}
        </span>
        <div className='min-w-0 flex-1'>
          <Typography.Text className='!text-base !font-semibold !text-inherit'>
            {title}
          </Typography.Text>
          <div className='mt-2 text-sm leading-6 text-slate-600'>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatusMeta = ({
  items,
}: {
  items: Array<{ label: string; value: string }>;
}) => (
  <div className='mt-3 grid grid-cols-2 gap-0 border-t border-slate-200/70 pt-3'>
    {items.map((item, index) => (
      <div
        key={item.label}
        className={`min-w-0 ${index > 0 ? 'border-l border-slate-200/70 pl-4' : 'pr-4'}`}
      >
        <div className='text-[11px] font-semibold tracking-[0.08em] text-slate-400 uppercase'>
          {item.label}
        </div>
        <div className='mt-1 truncate text-sm font-semibold text-slate-800'>
          {item.value}
        </div>
      </div>
    ))}
  </div>
);

export const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [emailForm] = Form.useForm<ForgotPasswordRequest>();
  const [otpForm] = Form.useForm<OtpFormValues>();
  const [resetForm] = Form.useForm<ResetForgotPasswordRequest>();
  const [step, setStep] = useState<ForgotPasswordStep>('email');
  const [email, setEmail] = useState('');
  const [otpData, setOtpData] = useState<ForgotPasswordOtpData | null>(null);
  const [verifyData, setVerifyData] =
    useState<VerifyForgotPasswordOtpData | null>(null);
  const [otpExpiresIn, setOtpExpiresIn] = useState(0);
  const [resendIn, setResendIn] = useState(0);
  const [resetSessionExpiresIn, setResetSessionExpiresIn] = useState(0);
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  useEffect(() => {
    if (!otpData) return;

    const tick = () => {
      setOtpExpiresIn(getSecondsUntil(otpData.expiresAtUtc));
      setResendIn(getSecondsUntil(otpData.resendAvailableAtUtc));
    };

    tick();
    const intervalId = window.setInterval(tick, 1000);
    return () => window.clearInterval(intervalId);
  }, [otpData]);

  useEffect(() => {
    if (!verifyData) return;

    const tick = () => {
      setResetSessionExpiresIn(
        getSecondsUntil(verifyData.resetSessionExpiresAtUtc),
      );
    };

    tick();
    const intervalId = window.setInterval(tick, 1000);
    return () => window.clearInterval(intervalId);
  }, [verifyData]);

  const applyOtpResponse = (data: ForgotPasswordOtpData) => {
    setEmail(data.email);
    setOtpData(data);
    setVerifyData(null);
    otpForm.resetFields();
    setStep('otp');
  };

  const handleRequestOtp = async (values: ForgotPasswordRequest) => {
    setIsRequestingOtp(true);
    try {
      const response = await authService.forgotPassword({
        email: values.email.trim(),
      });
      const data = response.data.data;
      if (!response.data.isSuccess || !data) {
        throw new Error(response.data.message || 'Failed to send OTP.');
      }
      applyOtpResponse(data);
      message.success(response.data.message || 'Password reset OTP sent.');
    } catch (error) {
      const retryAfterSeconds =
        readErrorMetaNumber(error, 'resendAfterSeconds') ??
        readErrorMetaNumber(error, 'retryAfterSeconds');
      if (retryAfterSeconds) setResendIn(retryAfterSeconds);
      message.error(getErrorMessage(error, 'Failed to send OTP.'));
    } finally {
      setIsRequestingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email || resendIn > 0) return;
    await handleRequestOtp({ email });
  };

  const handleVerifyOtp = async (values: OtpFormValues) => {
    setIsVerifyingOtp(true);
    try {
      const response = await authService.verifyForgotPasswordOtp({
        email,
        otp: values.otp,
      });
      const data = response.data.data;
      if (!response.data.isSuccess || !data) {
        throw new Error(response.data.message || 'Failed to verify OTP.');
      }
      setVerifyData(data);
      otpForm.resetFields();
      resetForm.setFieldValue('email', data.email);
      setStep('reset');
      message.success(response.data.message || 'OTP verified successfully.');
    } catch (error) {
      const remainingAttempts = readErrorMetaNumber(error, 'remainingAttempts');
      const maxAttempts = readErrorMetaNumber(error, 'maxAttempts');
      if (remainingAttempts !== undefined && maxAttempts !== undefined) {
        setOtpData((current) =>
          current ? { ...current, remainingAttempts, maxAttempts } : current,
        );
      }
      message.error(getErrorMessage(error, 'Failed to verify OTP.'));
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResetPassword = async (values: ResetForgotPasswordRequest) => {
    setIsResettingPassword(true);
    try {
      const response = await authService.resetForgotPassword({
        email,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      });
      if (!response.data.isSuccess) {
        throw new Error(response.data.message || 'Failed to reset password.');
      }
      setEmail('');
      setOtpData(null);
      setVerifyData(null);
      otpForm.resetFields();
      resetForm.resetFields();
      message.success(response.data.message || 'Password reset successfully.');
      navigate('/login', { replace: true });
    } catch (error) {
      message.error(getErrorMessage(error, 'Failed to reset password.'));
    } finally {
      setIsResettingPassword(false);
    }
  };

  return (
    <>
      <Seo
        title='Forgot Password'
        description='Reset your CAMS account password'
        keywords='forgot password, reset password, OTP'
      />
      <AuthWrapper>
        <div className='flex min-h-[calc(100vh-160px)] items-center justify-center px-4 py-16'>
          <div className='relative w-full max-w-lg rounded-[2rem] border border-white/40 bg-white/20 p-8 shadow-[0_8px_32px_rgba(0,0,0,0.08)] backdrop-blur-xl backdrop-saturate-[1.5] lg:p-10'>
            <div className='mb-8 text-center'>
              <Typography.Title
                level={2}
                className='!mb-2 !text-slate-900'
              >
                Reset password
              </Typography.Title>
              <Typography.Text className='text-slate-500'>
                Verify your email with a one-time code, then choose a new
                password.
              </Typography.Text>
            </div>

            <StepRail current={step} />

            {step === 'email' && (
              <Form
                form={emailForm}
                size='large'
                layout='vertical'
                requiredMark={false}
                onFinish={handleRequestOtp}
              >
                <Form.Item<ForgotPasswordRequest>
                  label='Email Address'
                  name='email'
                  rules={forgotPasswordValidation.email}
                >
                  <Input
                    placeholder='Enter email address'
                    className='h-12 rounded-xl !border-slate-200 !bg-slate-100 px-5 text-base !text-slate-900'
                  />
                </Form.Item>

                <Button
                  type='primary'
                  htmlType='submit'
                  className='mt-2 h-12 w-full rounded-full !border-0 !bg-slate-900 text-base font-medium !text-white'
                  loading={isRequestingOtp}
                >
                  Send OTP
                </Button>
              </Form>
            )}

            {step === 'otp' && (
              <Form
                form={otpForm}
                size='large'
                layout='vertical'
                requiredMark={false}
                onFinish={handleVerifyOtp}
              >
                <StatusPanel
                  tone='info'
                  icon={
                    <ShieldCheck
                      size={19}
                      strokeWidth={2.4}
                    />
                  }
                  title='Check your email'
                >
                  <div className='mb-3'>
                    We sent a 6-digit OTP to{' '}
                    <span className='font-semibold text-slate-900'>
                      {email}
                    </span>
                    .
                  </div>
                  <StatusMeta
                    items={[
                      {
                        label: 'Expires',
                        value: formatCountdown(otpExpiresIn),
                      },
                      {
                        label: 'Attempts',
                        value: `${otpData?.remainingAttempts ?? 0}/${otpData?.maxAttempts ?? 0} left`,
                      },
                    ]}
                  />
                </StatusPanel>

                <Progress
                  percent={
                    otpData?.expiresInSeconds
                      ? Math.round(
                          (otpExpiresIn / otpData.expiresInSeconds) * 100,
                        )
                      : 0
                  }
                  showInfo={false}
                  status={otpExpiresIn === 0 ? 'exception' : 'active'}
                  strokeColor='#e11d48'
                  trailColor='rgba(226, 232, 240, 0.9)'
                  className='mb-4'
                />

                <Form.Item<OtpFormValues>
                  label='OTP Code'
                  name='otp'
                  rules={forgotPasswordValidation.otp}
                >
                  <Input
                    inputMode='numeric'
                    maxLength={6}
                    placeholder='Enter 6-digit OTP'
                    className='h-12 rounded-xl !border-slate-200 !bg-slate-100 px-5 text-center text-lg tracking-[0.4em] !text-slate-900'
                  />
                </Form.Item>

                <Button
                  type='primary'
                  htmlType='submit'
                  className='mt-2 h-12 w-full rounded-full !border-0 !bg-slate-900 text-base font-medium !text-white'
                  loading={isVerifyingOtp}
                  disabled={otpExpiresIn === 0}
                >
                  Verify OTP
                </Button>

                <Flex
                  justify='space-between'
                  align='center'
                  className='mt-5'
                >
                  <Button
                    type='link'
                    className='!px-0 !text-slate-500 hover:!text-slate-900'
                    onClick={() => setStep('email')}
                  >
                    Change email
                  </Button>
                  <Button
                    type='link'
                    icon={
                      <RotateCcw
                        size={15}
                        strokeWidth={2.2}
                      />
                    }
                    className='!inline-flex !items-center !px-0 !text-rose-600 hover:!text-rose-700 disabled:!text-slate-400'
                    onClick={handleResendOtp}
                    loading={isRequestingOtp}
                    disabled={resendIn > 0}
                  >
                    {resendIn > 0
                      ? `Resend in ${formatCountdown(resendIn)}`
                      : 'Resend OTP'}
                  </Button>
                </Flex>
              </Form>
            )}

            {step === 'reset' && (
              <Form
                form={resetForm}
                size='large'
                layout='vertical'
                requiredMark={false}
                onFinish={handleResetPassword}
              >
                <StatusPanel
                  tone='success'
                  icon={
                    <CheckCircle2
                      size={20}
                      strokeWidth={2.4}
                    />
                  }
                  title='OTP verified'
                >
                  <StatusMeta
                    items={[
                      {
                        label: 'Session',
                        value: `${formatCountdown(resetSessionExpiresIn)} left`,
                      },
                      {
                        label: 'Next step',
                        value: 'Set password',
                      },
                    ]}
                  />
                </StatusPanel>

                <Form.Item<ResetForgotPasswordRequest>
                  name='email'
                  hidden
                >
                  <Input />
                </Form.Item>

                <Form.Item<ResetForgotPasswordRequest>
                  label='New Password'
                  name='newPassword'
                  rules={forgotPasswordValidation.newPassword}
                >
                  <Input.Password
                    placeholder='Enter new password'
                    className='h-12 rounded-xl !border-slate-200 !bg-slate-100 px-5 text-base !text-slate-900 [&>input]:!bg-transparent'
                  />
                </Form.Item>

                <Form.Item<ResetForgotPasswordRequest>
                  label='Confirm Password'
                  name='confirmPassword'
                  dependencies={['newPassword']}
                  rules={forgotPasswordValidation.confirmPassword}
                >
                  <Input.Password
                    placeholder='Confirm new password'
                    className='h-12 rounded-xl !border-slate-200 !bg-slate-100 px-5 text-base !text-slate-900 [&>input]:!bg-transparent'
                  />
                </Form.Item>

                <Button
                  type='primary'
                  htmlType='submit'
                  className='mt-2 h-12 w-full rounded-full !border-0 !bg-slate-900 text-base font-medium !text-white'
                  loading={isResettingPassword}
                  disabled={resetSessionExpiresIn === 0}
                >
                  Reset Password
                </Button>
              </Form>
            )}

            <div className='mt-8 text-center'>
              <Link
                to='/login'
                className='text-[#1677ff] hover:text-[#4096ff]'
              >
                Back to sign in
              </Link>
            </div>
          </div>
        </div>
      </AuthWrapper>
    </>
  );
};

export default ForgotPasswordPage;
