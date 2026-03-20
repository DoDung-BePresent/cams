import { ProfileView } from '@/shared/components/profile';

const breadcrumbs = [
  { title: 'Admin', path: '/admin' },
  { title: 'My Profile' },
];

export const AdminProfile = () => <ProfileView breadcrumbs={breadcrumbs} />;
