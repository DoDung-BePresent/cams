import { Loadable } from '@/shared/components/common/Loadable';

const NotFoundPage = Loadable(
  () => import('@/features/errors/pages/NotFoundPage'),
  'NotFoundPage',
);

const UnauthorizedPage = Loadable(
  () => import('@/features/errors/pages/UnauthorizedPage'),
  'UnauthorizedPage',
);

const UnexpectedErrorPage = Loadable(
  () => import('@/features/errors/pages/UnexpectedErrorPage'),
  'UnexpectedErrorPage',
);

export const ErrorRoutes = [
  {
    path: '/unauthorized',
    element: <UnauthorizedPage />,
  },
  {
    path: '/error',
    element: <UnexpectedErrorPage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
];
