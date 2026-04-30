import { useNavigate } from 'react-router';
import { Col, Row, Skeleton, Typography } from 'antd';
import {
  AppstoreOutlined,
  SettingOutlined,
  TeamOutlined,
  UnorderedListOutlined,
  WalletOutlined,
} from '@ant-design/icons';

import { useBrands, useAccounts } from '@/features/admin/hooks';
import { useAuth } from '@/providers';

const { Title, Text } = Typography;

const C = {
  surface: '#18181b',
  surfaceHover: '#242126',
  border: '#2d2528',
  red: '#ef4444',
  text: '#f8f7f7',
  muted: '#b7adb0',
  subtle: '#857b80',
};

const Equalizer = () => (
  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 24 }}>
    <style>{`
      @keyframes adminEq1 { 0%,100%{height:6px} 50%{height:22px} }
      @keyframes adminEq2 { 0%,100%{height:16px} 40%{height:7px} }
      @keyframes adminEq3 { 0%,100%{height:10px} 60%{height:24px} }
      @keyframes adminEq4 { 0%,100%{height:20px} 30%{height:8px} }
    `}</style>
    {[
      'adminEq1 1.1s ease-in-out infinite',
      'adminEq2 0.9s ease-in-out infinite',
      'adminEq3 1.25s ease-in-out infinite',
      'adminEq4 1s ease-in-out infinite',
    ].map((animation, index) => (
      <div
        key={index}
        style={{
          width: 4,
          height: 10,
          borderRadius: 2,
          background: C.red,
          animation,
        }}
      />
    ))}
  </div>
);

const StatCard = ({
  label,
  value,
  loading,
  accent = C.red,
}: {
  label: string;
  value: number | string;
  loading?: boolean;
  accent?: string;
}) => (
  <div
    style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 14,
      padding: '20px 24px',
      minHeight: 118,
    }}
  >
    <Text
      style={{
        color: C.muted,
        fontSize: 12,
        fontWeight: 800,
        letterSpacing: 1,
        textTransform: 'uppercase',
      }}
    >
      {label}
    </Text>
    <div style={{ marginTop: 10 }}>
      {loading ? (
        <Skeleton.Input
          active
          size='small'
          style={{ width: 70 }}
        />
      ) : (
        <span
          style={{
            color: accent,
            fontSize: 36,
            fontWeight: 800,
            lineHeight: 1,
          }}
        >
          {value}
        </span>
      )}
    </div>
  </div>
);

const QuickCard = ({
  icon,
  title,
  desc,
  accent,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  accent: string;
  onClick: () => void;
}) => (
  <div
    onClick={onClick}
    style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 14,
      padding: '22px 24px',
      cursor: 'pointer',
      transition: 'all 0.18s ease',
      minHeight: 150,
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = accent;
      e.currentTarget.style.background = C.surfaceHover;
      e.currentTarget.style.transform = 'translateY(-2px)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = C.border;
      e.currentTarget.style.background = C.surface;
      e.currentTarget.style.transform = 'translateY(0)';
    }}
  >
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: 12,
        background: `${accent}18`,
        color: accent,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 22,
        marginBottom: 14,
      }}
    >
      {icon}
    </div>
    <Title
      level={5}
      style={{ margin: '0 0 5px', color: C.text }}
    >
      {title}
    </Title>
    <Text style={{ color: C.muted, fontSize: 13 }}>{desc}</Text>
  </div>
);

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: brandsData, isLoading: brandsLoading } = useBrands({
    page: 1,
    pageSize: 1,
  });
  const { data: accountsData, isLoading: accountsLoading } = useAccounts({
    page: 1,
    pageSize: 1,
  });

  return (
    <div style={{ paddingBottom: 40 }}>
      <div
        style={{
          background:
            'radial-gradient(circle at 12% 0%, rgba(239,68,68,0.22), transparent 34%), linear-gradient(135deg, #18181b 0%, #161112 54%, #0f0f11 100%)',
          border: `1px solid ${C.border}`,
          borderRadius: 20,
          padding: '36px 40px',
          marginBottom: 28,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            marginBottom: 16,
          }}
        >
          <Equalizer />
          <span
            style={{
              color: C.red,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 3,
              textTransform: 'uppercase',
            }}
          >
            System Admin
          </span>
        </div>
        <Title
          level={2}
          style={{ margin: '0 0 8px', color: C.text }}
        >
          Welcome back{user?.firstName ? `, ${user.firstName}` : ''}
        </Title>
        <Text style={{ color: C.muted, fontSize: 15 }}>
          Monitor platform health, shared music assets, brand access, and system
          policy.
        </Text>
      </div>

      <Row
        gutter={[16, 16]}
        style={{ marginBottom: 28 }}
      >
        <Col
          xs={24}
          sm={12}
          lg={6}
        >
          <StatCard
            label='Total Brands'
            value={brandsData?.totalItems ?? 0}
            loading={brandsLoading}
          />
        </Col>
        <Col
          xs={24}
          sm={12}
          lg={6}
        >
          <StatCard
            label='Total Accounts'
            value={accountsData?.totalItems ?? 0}
            loading={accountsLoading}
            accent='#3b82f6'
          />
        </Col>
        <Col
          xs={24}
          sm={12}
          lg={6}
        >
          <StatCard
            label='System Playlists'
            value='Library'
            accent='#a855f7'
          />
        </Col>
        <Col
          xs={24}
          sm={12}
          lg={6}
        >
          <StatCard
            label='Policy Control'
            value='Live'
            accent='#22c55e'
          />
        </Col>
      </Row>

      <Text
        style={{
          color: C.subtle,
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: 2,
          textTransform: 'uppercase',
          display: 'block',
          marginBottom: 16,
        }}
      >
        Admin Control Center
      </Text>
      <Row gutter={[16, 16]}>
        <Col
          xs={24}
          sm={12}
          lg={6}
        >
          <QuickCard
            icon={<AppstoreOutlined />}
            title='Brands'
            desc='Manage tenant brands and music policy ownership'
            accent={C.red}
            onClick={() => navigate('/admin/brands')}
          />
        </Col>
        <Col
          xs={24}
          sm={12}
          lg={6}
        >
          <QuickCard
            icon={<TeamOutlined />}
            title='Accounts'
            desc='Create managers, assign roles, and reset access'
            accent='#3b82f6'
            onClick={() => navigate('/admin/accounts')}
          />
        </Col>
        <Col
          xs={24}
          sm={12}
          lg={6}
        >
          <QuickCard
            icon={<UnorderedListOutlined />}
            title='Playlist Library'
            desc='Control shared playlists available across brands'
            accent='#a855f7'
            onClick={() => navigate('/admin/playlists')}
          />
        </Col>
        <Col
          xs={24}
          sm={12}
          lg={6}
        >
          <QuickCard
            icon={<SettingOutlined />}
            title='Config Policy'
            desc='Tune platform rules, runtime limits, and overrides'
            accent='#f59e0b'
            onClick={() => navigate('/admin/config-management')}
          />
        </Col>
        <Col
          xs={24}
          sm={12}
          lg={6}
        >
          <QuickCard
            icon={<WalletOutlined />}
            title='Billing'
            desc='Review wallet packages and token purchase activity'
            accent='#22c55e'
            onClick={() => navigate('/admin/billing')}
          />
        </Col>
      </Row>
    </div>
  );
};
