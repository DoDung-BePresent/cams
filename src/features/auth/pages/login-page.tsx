/**
 * Assets
 */
import loginImage from '../assets/login-image.svg';

/**
 * Components
 */
import LoginForm from '../components/login-form';
import { Seo } from '@/components/common/seo';

export const LoginPage = () => {
  return (
    <>
      <Seo title='Login'  />
      <div className='flex flex-row items-center gap-20'>
        <figure className='select-none'>
          <img
            src={loginImage}
            className=''
            width={600}
            height={600}
            alt='Login Image'
          />
        </figure>
        <div className=''>
          <LoginForm />
        </div>
      </div>
    </>
  );
};
