import { ProfileView } from '@/shared/components/profile';

const breadcrumbs = [
  { title: 'Dashboard', path: '/store' },
  { title: 'My Profile' },
];

export const StoreProfile = () => <ProfileView breadcrumbs={breadcrumbs} />;
