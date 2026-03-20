import {
  Avatar,
  Card,
  Col,
  Descriptions,
  Flex,
  Row,
  Tag,
  Typography,
  Badge,
} from 'antd';

/**
 * Icons
 */
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  ShopOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CrownOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';

/**
 * Hooks
 */
import { useMyProfile } from '@/shared/hooks';

/**
 * Components
 */
import { PageHeader } from '@/shared/components';

/**
 * Constants
 */
import {
  ENTITY_STATUS_LABELS,
  ENTITY_STATUS_COLORS,
  ROLE_LABELS,
  ROLE_COLORS,
} from '@/shared/constants';

/**
 * Types
 */
import { EntityStatusEnum, type RoleEnum } from '@/shared/types';

/**
 * Utils
 */
import { formatDate } from '@/shared/utils';

const { Title, Text } = Typography;

type ProfileViewProps = {
  breadcrumbs: { title: string; path?: string }[];
};

/**
 * ProfileView - Shared profile display component
 * Used across all roles (Admin, Brand, Store) to display user profile
 */
export const ProfileView = ({ breadcrumbs }: ProfileViewProps) => {
  const { data: profile, isLoading } = useMyProfile();

  return (
    <div>
      <PageHeader
        title='My Profile'
        breadcrumbs={breadcrumbs}
        seo={{
          description: 'View your profile information',
          keywords: 'user, profile',
        }}
      />

      {/* Banner */}
      <div
        className='mb-6 rounded-lg'
        style={{
          background:
            'linear-gradient(250.38deg, #e6f4ff 2.39%, #69b1ff 34.42%, #1677ff 60.95%, #0958d9 84.83%, #002c8c 104.37%)',
          padding: '24px 32px',
          position: 'relative',
          overflow: 'hidden',
          minHeight: 100,
        }}
      >
        <Flex
          align='center'
          gap='large'
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              border: '3px solid rgba(255,255,255,0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            <Avatar
              size={58}
              src={profile?.avatarUrl}
              icon={<UserOutlined />}
            />
          </div>
          <Flex vertical>
            <Title
              level={4}
              style={{ margin: 0, color: 'white' }}
            >
              {profile?.fullName ?? '—'}
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>
              {profile?.roles
                ?.map((r: RoleEnum) => ROLE_LABELS[r])
                .join(', ') ?? '—'}
            </Text>
          </Flex>
        </Flex>
      </div>

      <Row gutter={[24, 24]}>
        {/* Left sidebar */}
        <Col
          xs={24}
          md={6}
        >
          <Card
            loading={isLoading}
            styles={{ body: { padding: 24 } }}
          >
            <Flex
              vertical
              align='center'
              gap='small'
              style={{ marginBottom: 24 }}
            >
              <div
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  border: '3px dashed #d9d9d9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Avatar
                  size={90}
                  src={profile?.avatarUrl}
                  icon={<UserOutlined />}
                />
              </div>
              <Flex
                align='center'
                gap='small'
              >
                <Title
                  level={5}
                  style={{ margin: 0 }}
                >
                  {profile?.fullName ?? '—'}
                </Title>
                {profile?.isPrimaryOwner && (
                  <CrownOutlined style={{ color: '#faad14' }} />
                )}
              </Flex>
              <Text
                type='secondary'
                style={{ fontSize: 13 }}
              >
                {profile?.roles
                  ?.map((r: RoleEnum) => ROLE_LABELS[r])
                  .join(', ') ?? '—'}
              </Text>
              <Flex
                gap='small'
                wrap='wrap'
                justify='center'
              >
                {profile?.roles?.map((r: RoleEnum) => (
                  <Tag
                    key={r}
                    color={ROLE_COLORS[r]}
                  >
                    {ROLE_LABELS[r]}
                  </Tag>
                ))}
                {profile && (
                  <Tag
                    icon={
                      profile.status === EntityStatusEnum.Active ? (
                        <CheckCircleOutlined />
                      ) : (
                        <CloseCircleOutlined />
                      )
                    }
                    color={ENTITY_STATUS_COLORS[profile.status]}
                  >
                    {ENTITY_STATUS_LABELS[profile.status]}
                  </Tag>
                )}
              </Flex>
            </Flex>

            {/* Organization */}
            <Flex
              vertical
              gap='small'
            >
              {profile?.brandName && (
                <Flex
                  align='center'
                  gap='small'
                >
                  <ShopOutlined style={{ color: '#1677ff' }} />
                  <Text style={{ fontSize: 13 }}>{profile.brandName}</Text>
                </Flex>
              )}
              {profile?.storeName && (
                <Flex
                  align='center'
                  gap='small'
                >
                  <ShopOutlined style={{ color: '#52c41a' }} />
                  <Text style={{ fontSize: 13 }}>{profile.storeName}</Text>
                </Flex>
              )}
              {profile?.lastLoginAt && (
                <Flex
                  align='center'
                  gap='small'
                >
                  <SafetyCertificateOutlined style={{ color: '#722ed1' }} />
                  <Text
                    type='secondary'
                    style={{ fontSize: 12 }}
                  >
                    Last login: {formatDate(profile.lastLoginAt)}
                  </Text>
                </Flex>
              )}
            </Flex>
          </Card>
        </Col>

        {/* Right content */}
        <Col
          xs={24}
          md={18}
        >
          <Flex
            vertical
            gap='large'
          >
            {/* Personal Information */}
            <Card
              title='Personal Information'
              loading={isLoading}
            >
              <Row gutter={[16, 16]}>
                <Col
                  xs={24}
                  sm={12}
                >
                  <Flex
                    vertical
                    gap={4}
                  >
                    <Text
                      type='secondary'
                      style={{ fontSize: 12 }}
                    >
                      First Name
                    </Text>
                    <div
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #d9d9d9',
                        borderRadius: 6,
                        background: '#fafafa',
                        minHeight: 40,
                      }}
                    >
                      <Text>{profile?.firstName ?? '—'}</Text>
                    </div>
                  </Flex>
                </Col>
                <Col
                  xs={24}
                  sm={12}
                >
                  <Flex
                    vertical
                    gap={4}
                  >
                    <Text
                      type='secondary'
                      style={{ fontSize: 12 }}
                    >
                      Last Name
                    </Text>
                    <div
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #d9d9d9',
                        borderRadius: 6,
                        background: '#fafafa',
                        minHeight: 40,
                      }}
                    >
                      <Text>{profile?.lastName ?? '—'}</Text>
                    </div>
                  </Flex>
                </Col>
                <Col
                  xs={24}
                  sm={12}
                >
                  <Flex
                    vertical
                    gap={4}
                  >
                    <Text
                      type='secondary'
                      style={{ fontSize: 12 }}
                    >
                      Email Address
                    </Text>
                    <div
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #d9d9d9',
                        borderRadius: 6,
                        background: '#fafafa',
                        minHeight: 40,
                      }}
                    >
                      <Flex
                        align='center'
                        gap='small'
                      >
                        <MailOutlined style={{ color: '#8c8c8c' }} />
                        <Text>{profile?.email ?? '—'}</Text>
                        {profile?.emailConfirmed ? (
                          <Badge status='success' />
                        ) : (
                          <Badge status='warning' />
                        )}
                      </Flex>
                    </div>
                  </Flex>
                </Col>
                <Col
                  xs={24}
                  sm={12}
                >
                  <Flex
                    vertical
                    gap={4}
                  >
                    <Text
                      type='secondary'
                      style={{ fontSize: 12 }}
                    >
                      Phone Number
                    </Text>
                    <div
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #d9d9d9',
                        borderRadius: 6,
                        background: '#fafafa',
                        minHeight: 40,
                      }}
                    >
                      <Flex
                        align='center'
                        gap='small'
                      >
                        <PhoneOutlined style={{ color: '#8c8c8c' }} />
                        <Text>{profile?.phoneNumber ?? 'Not provided'}</Text>
                        {profile?.phoneNumber &&
                          (profile.phoneNumberConfirmed ? (
                            <Badge status='success' />
                          ) : (
                            <Badge status='warning' />
                          ))}
                      </Flex>
                    </div>
                  </Flex>
                </Col>
              </Row>
            </Card>

            {/* Organization */}
            {(profile?.brandName || profile?.storeName) && (
              <Card
                title='Organization'
                loading={isLoading}
              >
                <Row gutter={[16, 16]}>
                  {profile.brandName && (
                    <Col
                      xs={24}
                      sm={12}
                    >
                      <Flex
                        vertical
                        gap={4}
                      >
                        <Text
                          type='secondary'
                          style={{ fontSize: 12 }}
                        >
                          Brand
                        </Text>
                        <div
                          style={{
                            padding: '8px 12px',
                            border: '1px solid #d9d9d9',
                            borderRadius: 6,
                            background: '#fafafa',
                            minHeight: 40,
                          }}
                        >
                          <Tag color='blue'>{profile.brandName}</Tag>
                        </div>
                      </Flex>
                    </Col>
                  )}
                  {profile.storeName && (
                    <Col
                      xs={24}
                      sm={12}
                    >
                      <Flex
                        vertical
                        gap={4}
                      >
                        <Text
                          type='secondary'
                          style={{ fontSize: 12 }}
                        >
                          Store
                        </Text>
                        <div
                          style={{
                            padding: '8px 12px',
                            border: '1px solid #d9d9d9',
                            borderRadius: 6,
                            background: '#fafafa',
                            minHeight: 40,
                          }}
                        >
                          <Tag color='green'>{profile.storeName}</Tag>
                        </div>
                      </Flex>
                    </Col>
                  )}
                </Row>
              </Card>
            )}

            {/* Security & System */}
            <Card
              title='Security & System'
              loading={isLoading}
            >
              <Descriptions
                column={{ xs: 1, sm: 2 }}
                bordered
              >
                <Descriptions.Item label='Two-Factor Auth'>
                  {profile?.twoFactorEnabled ? (
                    <Badge
                      status='success'
                      text='Enabled'
                    />
                  ) : (
                    <Badge
                      status='default'
                      text='Disabled'
                    />
                  )}
                </Descriptions.Item>
                <Descriptions.Item label='Email Confirmed'>
                  {profile?.emailConfirmed ? (
                    <Badge
                      status='success'
                      text='Confirmed'
                    />
                  ) : (
                    <Badge
                      status='warning'
                      text='Not confirmed'
                    />
                  )}
                </Descriptions.Item>
                <Descriptions.Item label='Last Login'>
                  {profile?.lastLoginAt
                    ? formatDate(profile.lastLoginAt)
                    : 'Never'}
                </Descriptions.Item>
                <Descriptions.Item label='Member Since'>
                  {profile?.createdAt ? formatDate(profile.createdAt) : '—'}
                </Descriptions.Item>
                <Descriptions.Item
                  label='Account ID'
                  span={2}
                >
                  <Tag>{profile?.id ?? '—'}</Tag>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Flex>
        </Col>
      </Row>
    </div>
  );
};
