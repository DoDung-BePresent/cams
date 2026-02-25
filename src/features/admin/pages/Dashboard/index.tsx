import { Typography } from 'antd';
import { MusicScheduleCalendar } from '@/features/manager/components/MusicScheduleCalendar';

const { Title } = Typography;

export const AdminDashboard = () => {
  return (
    <div>
      <Title level={2}>Admin Dashboard</Title>
      <MusicScheduleCalendar />
    </div>
  );
};
