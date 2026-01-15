import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '@/lib/auth-provider';
import { Seo } from '@/components/common/seo';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // Lấy đường dẫn user muốn vào trước đó (hoặc mặc định là /)
  const from = location.state?.from?.pathname || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err) {
      setError('Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Seo title='Login' />
      <div className='bg-card text-card-foreground border-border rounded-xl border p-6 shadow-sm'>
        <h2 className='mb-6 text-center text-2xl font-semibold'>
          Đăng nhập hệ thống
        </h2>

        {error && (
          <div className='mb-4 rounded-md border border-red-100 bg-red-50 p-3 text-sm text-red-600'>
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className='space-y-4'
        >
          <div className='space-y-2'>
            <label className='text-sm font-medium'>Email</label>
            <input
              type='email'
              required
              className='border-input ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border bg-transparent px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
              placeholder='admin@cams.com'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className='space-y-2'>
            <label className='text-sm font-medium'>Mật khẩu</label>
            <input
              type='password'
              required
              className='border-input ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border bg-transparent px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type='submit'
            disabled={loading}
            className='bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring mt-4 inline-flex h-10 w-full cursor-pointer items-center justify-center rounded-md px-4 py-2 text-sm font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50'
          >
            {loading ? 'Đang xử lý...' : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </>
  );
};
