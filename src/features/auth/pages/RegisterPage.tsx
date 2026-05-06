import { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { message } from 'antd';

/**
 * Components
 */
import { Seo } from '@/shared/components';
import { AuthWrapper, RegisterForm } from '../components';
import type { RegisterFormValues } from '../components/RegisterForm';

import LogoImage from '@/assets/images/logo logai-Photoroom.png';

export const RegisterPage = () => {
  const formSectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 },
    );

    if (formSectionRef.current) {
      observer.observe(formSectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleSubmit = async (values: RegisterFormValues, logoFile: File) => {
    setIsLoading(true);
    try {
      const formData = new FormData();

      // Brand Manager fields
      formData.append('firstName', values.firstName);
      formData.append('lastName', values.lastName);
      formData.append('managerEmail', values.managerEmail);
      if (values.phoneNumber)
        formData.append('phoneNumber', values.phoneNumber);

      // Brand fields
      formData.append('brandName', values.brandName);
      formData.append('brandLogo', logoFile);
      if (values.industry) formData.append('industry', values.industry);
      if (values.contactEmail)
        formData.append('contactEmail', values.contactEmail);
      if (values.contactPhone)
        formData.append('contactPhone', values.contactPhone);
      if (values.primaryContactName)
        formData.append('primaryContactName', values.primaryContactName);
      if (values.website) formData.append('website', values.website);
      if (values.description)
        formData.append('description', values.description);

      // Legal fields
      if (values.legalName) formData.append('legalName', values.legalName);
      if (values.taxCode) formData.append('taxCode', values.taxCode);
      if (values.billingAddress)
        formData.append('billingAddress', values.billingAddress);

      // TODO: Replace with real API call when endpoint is available
      // await registerService.submitInquiry(formData);

      // Simulate API call for now
      await new Promise<void>((resolve) => setTimeout(resolve, 1500));

      setIsSuccess(true);
      message.success('Registration request submitted successfully!');
    } catch {
      message.error('Failed to submit registration request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Seo
        title='Register'
        description='Register your brand on CAMS - Content and Music System'
        keywords='register, signup, brand, CAMS'
      />
      <AuthWrapper>
        {/* Section 1: Hero */}
        <div className='flex min-h-[calc(50vh-80px)] flex-col items-center justify-center px-4 text-center'>
          <div className='mb-6 flex animate-[fadeInScale_0.8s_ease-out_0.2s_forwards] items-center justify-center gap-4 opacity-0'>
            <img
              src={LogoImage}
              alt='Log.AI Logo'
              className='h-12 w-auto sm:h-16'
            />
            <span className='animate-gradient-flow bg-[linear-gradient(to_right,#ef4444,#f87171,#fb7185,#ef4444)] bg-[length:200%_auto] bg-clip-text pb-2 text-4xl font-extrabold text-transparent drop-shadow-sm sm:text-5xl'>
              Log.AI
            </span>
          </div>
          <h1 className='animate-[fadeInUp_0.8s_ease-out_0s_forwards] text-4xl leading-tight font-medium tracking-tight text-slate-900 opacity-0 sm:text-[3.5rem]'>
            Get Started with CAMS
          </h1>
          <p className='mt-4 animate-[fadeInUp_0.8s_ease-out_0.3s_forwards] text-lg font-light tracking-wide text-slate-500 opacity-0 sm:text-xl'>
            Submit your brand details and our team will set up your account
          </p>
        </div>

        {/* Section 2: Form */}
        <div
          ref={formSectionRef}
          className='relative flex min-h-screen flex-col items-center justify-start overflow-hidden px-4 py-12'
        >
          <div className='pointer-events-none absolute top-1/3 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-tr from-red-500/20 via-rose-400/10 to-transparent opacity-70 blur-[90px]' />

          <div
            className={`relative w-full max-w-2xl rounded-[2rem] border border-white/40 bg-white/10 p-8 shadow-[0_8px_32px_rgba(0,0,0,0.08)] backdrop-blur-xl backdrop-saturate-[1.5] transition-all duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-white/20 lg:p-10 ${
              isVisible
                ? 'translate-y-0 scale-100 opacity-100'
                : 'translate-y-12 scale-95 opacity-0'
            }`}
          >
            {!isSuccess && (
              <div className='mb-8 text-center'>
                <h2 className='text-[2rem] font-medium tracking-tight text-slate-900'>
                  Brand Registration
                </h2>
                <p className='mt-2 text-base text-slate-500'>
                  Fill in the details below and we will review your request
                </p>
              </div>
            )}

            <RegisterForm
              onSubmit={handleSubmit}
              isLoading={isLoading}
              isSuccess={isSuccess}
            />

            {!isSuccess && (
              <p className='mt-6 text-center text-sm text-slate-500'>
                Already have an account?{' '}
                <Link
                  to='/login'
                  className='font-medium text-slate-900 underline-offset-4 hover:underline'
                >
                  Sign in
                </Link>
              </p>
            )}

            {isSuccess && (
              <p className='mt-6 text-center text-sm text-slate-500'>
                <Link
                  to='/login'
                  className='font-medium text-slate-900 underline-offset-4 hover:underline'
                >
                  Back to Sign In
                </Link>
              </p>
            )}
          </div>
        </div>
      </AuthWrapper>
    </>
  );
};
