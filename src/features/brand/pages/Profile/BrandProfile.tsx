import { ProfileView } from '@/shared/components/profile';

const breadcrumbs = [
  { title: 'Dashboard', path: '/brand' },
  { title: 'My Profile' },
];

export const BrandProfile = () => <ProfileView breadcrumbs={breadcrumbs} />;
