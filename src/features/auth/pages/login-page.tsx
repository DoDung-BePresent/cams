/**
 * Assets
 */
import loginImage from '../assets/login-image.svg';

/**
 * Components
 */
import LoginForm from '../components/login-form';

export const LoginPage = () => {
  return (
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
  );
};
