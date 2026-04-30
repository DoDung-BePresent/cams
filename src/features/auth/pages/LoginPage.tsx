import { useRef, useEffect, useState } from 'react';

/**
 * Components
 */
import { Seo } from '@/shared/components';
import { AuthWrapper, LoginForm } from '../components';

import LogoImage from '@/assets/images/logo logai-Photoroom.png';

export const LoginPage = () => {
  const formSectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 },
    );

    if (formSectionRef.current) {
      observer.observe(formSectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <Seo
        title='Login'
        description='Sign in to CAMS - Content and Music System'
        keywords='login, signin, authentication'
      />
      <AuthWrapper>
        {/* Section 1: Hero */}
        <div className='flex min-h-[calc(100vh-160px)] flex-col items-center justify-center px-4 text-center'>
          <div className='mb-6 flex animate-[fadeInScale_0.8s_ease-out_1s_forwards] items-center justify-center gap-4 opacity-0'>
            <img
              src={LogoImage}
              alt='Log.AI Logo'
              className='h-12 w-auto sm:h-16'
            />
            <span className='animate-gradient-flow bg-[linear-gradient(to_right,#ef4444,#f87171,#fb7185,#ef4444)] bg-[length:200%_auto] bg-clip-text pb-2 text-4xl font-extrabold text-transparent drop-shadow-sm sm:text-5xl'>
              Log.AI
            </span>
          </div>
          <h1 className='animate-[fadeInUp_0.8s_ease-out_0s_forwards] text-5xl leading-tight font-medium tracking-tight text-slate-900 opacity-0 sm:text-[4rem]'>
            Welcome to CAMS
          </h1>
          <p className='mt-4 animate-[fadeInUp_0.8s_ease-out_0.3s_forwards] text-xl font-light tracking-wide text-slate-500 opacity-0 sm:text-2xl'>
            the intelligent soundtrack for every space
          </p>
        </div>

        {/* Section 2: Form */}
        <div
          ref={formSectionRef}
          className='relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-20'
        >
          <div className='pointer-events-none absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-tr from-red-500/20 via-rose-400/10 to-transparent opacity-70 blur-[90px]' />

          <div
            className={`relative w-full max-w-md rounded-[2rem] border border-white/40 bg-white/10 p-8 shadow-[0_8px_32px_rgba(0,0,0,0.08)] backdrop-blur-xl backdrop-saturate-[1.5] transition-all duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-white/20 lg:p-10 ${
              isVisible
                ? 'translate-y-0 scale-100 opacity-100'
                : 'translate-y-12 scale-75 opacity-0'
            }`}
          >
            <div className='mb-8 text-center'>
              <h2 className='text-[2.25rem] font-medium tracking-tight text-slate-900'>
                Welcome back
              </h2>
              <p className='mt-2 text-base text-slate-500'>
                Please enter your details to sign in
              </p>
            </div>
            <LoginForm />
          </div>
        </div>
      </AuthWrapper>
    </>
  );
};
