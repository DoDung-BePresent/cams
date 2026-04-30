import { useNavigate, useLocation } from 'react-router';
import { Tooltip, Skeleton } from 'antd';
import { WalletOutlined } from '@ant-design/icons';

/**
 * Features
 */
import { BRAND_MENU_ITEMS, BRAND_ROUTE_MAP } from '@/features/brand/constants';

/**
 * Configs
 */
import { SIDEBAR_WIDTHS } from '@/config';

/**
 * Hooks
 */
import { useAuth } from '@/providers';
import { useBrand } from '@/features/admin/hooks/brand';
import { useWallet } from '@/shared/modules/billing/hooks';

type AppSidebarProps = {
  collapsed: boolean;
};

const SOUNDTRACK_ACCENT = '#ef4444';

export const AppSidebar = ({ collapsed }: AppSidebarProps) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user } = useAuth();
  const brandId = user?.brandId;

  const { data: brand, isLoading: isBrandLoading } = useBrand(
    brandId || undefined,
    !!brandId,
  );
  const { data: wallet, isLoading: isWalletLoading } = useWallet();

  const handleClick = (key: string) => {
    const route = BRAND_ROUTE_MAP[key] || `/brand/${key}`;
    navigate(route);
  };

  const isActive = (key: string) => {
    const route = BRAND_ROUTE_MAP[key] || `/brand/${key}`;
    return pathname === route || pathname.startsWith(route + '/');
  };

  const width = collapsed
    ? SIDEBAR_WIDTHS.collapsedWidth
    : SIDEBAR_WIDTHS.width;

  return (
    <div
      style={{
        width,
        minWidth: width,
        maxWidth: width,
        height: '100vh',
        position: 'sticky',
        top: 0,
        left: 0,
        background:
          'linear-gradient(180deg, rgba(17,17,19,0.96) 0%, rgba(12,12,14,0.98) 100%)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        borderRight: '1px solid rgba(80,45,50,0.7)',
        zIndex: 10,
        flexShrink: 0,
      }}
    >
      {/* Logo & Brand Info */}
      <div
        style={{
          padding: collapsed ? '20px 14px' : '20px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          borderBottom: '1px solid rgba(80,45,50,0.7)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #ef4444 0%, #7f1d1d 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: 'none',
            }}
          >
            <svg
              width='18'
              height='18'
              viewBox='0 0 24 24'
              fill='white'
            >
              <path d='M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z' />
            </svg>
          </div>
          {!collapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  color: '#f8f7f7',
                  fontWeight: 700,
                  fontSize: 16,
                  lineHeight: 1.2,
                  letterSpacing: '-0.3px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {isBrandLoading ? (
                  <Skeleton.Input
                    size='small'
                    active
                    style={{ width: 80, height: 16 }}
                  />
                ) : (
                  brand?.name || 'Log.AI'
                )}
              </div>
              <div
                style={{
                  color: '#b7adb0',
                  fontSize: 11,
                  fontWeight: 500,
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                  marginTop: 2,
                }}
              >
                Brand Manager
              </div>
            </div>
          )}
        </div>

        {!collapsed && (
          <div
            style={{
              background: 'rgba(24,24,27,0.72)',
              borderRadius: 12,
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              border: '1px solid rgba(80,45,50,0.7)',
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: '#2a171b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: SOUNDTRACK_ACCENT,
              }}
            >
              <WalletOutlined style={{ fontSize: 16 }} />
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  color: '#b7adb0',
                  fontSize: 10,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                }}
              >
                Credits
              </div>
              <div style={{ color: '#f8f7f7', fontWeight: 700, fontSize: 14 }}>
                {isWalletLoading
                  ? '...'
                  : (wallet?.balanceTokens?.toLocaleString() ?? 0)}
                <span
                  style={{
                    color: '#b7adb0',
                    fontSize: 11,
                    fontWeight: 400,
                    marginLeft: 4,
                  }}
                >
                  tokens
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: collapsed ? '12px 8px' : '12px 8px',
        }}
      >
        {!collapsed && (
          <div
            style={{
              padding: '8px 12px 4px',
              color: '#857b80',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
            }}
          >
            Menu
          </div>
        )}
        {BRAND_MENU_ITEMS.map((item) => {
          if (!item || !('key' in item)) return null;
          const key = item.key as string;
          const active = isActive(key);
          const label = ('label' in item ? item.label : '') as string;
          const icon = ('icon' in item ? item.icon : null) as React.ReactNode;

          const menuItem = (
            <div
              key={key}
              onClick={() => handleClick(key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: collapsed ? '12px 14px' : '10px 12px',
                borderRadius: 8,
                cursor: 'pointer',
                marginBottom: 2,
                background: active
                  ? 'linear-gradient(90deg, #2a171b 0%, #202024 100%)'
                  : 'transparent',
                color: '#f8f7f7',
                fontWeight: active ? 700 : 400,
                fontSize: 14,
                transition: 'all 0.15s ease',
                userSelect: 'none',
                justifyContent: collapsed ? 'center' : 'flex-start',
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLDivElement).style.background =
                    '#242126';
                  (e.currentTarget as HTMLDivElement).style.color = '#f8f7f7';
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLDivElement).style.background =
                    'transparent';
                  (e.currentTarget as HTMLDivElement).style.color = '#f8f7f7';
                }
              }}
            >
              <span
                style={{
                  fontSize: 18,
                  color: active
                    ? key === 'suno-ai'
                      ? 'inherit'
                      : SOUNDTRACK_ACCENT
                    : 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  flexShrink: 0,
                }}
                className={key === 'suno-ai' ? 'rainbow-text-animate' : ''}
              >
                {icon}
              </span>
              {!collapsed && (
                <span
                  className={key === 'suno-ai' ? 'rainbow-text-animate' : ''}
                  style={{
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    ...(key === 'suno-ai' ? { fontWeight: 700 } : {}),
                  }}
                >
                  {label}
                </span>
              )}
              {active && !collapsed && (
                <div
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    background:
                      key === 'suno-ai' ? '#f87171' : SOUNDTRACK_ACCENT,
                    marginLeft: 'auto',
                    flexShrink: 0,
                  }}
                />
              )}
            </div>
          );

          return collapsed ? (
            <Tooltip
              key={key}
              title={label}
              placement='right'
            >
              {menuItem}
            </Tooltip>
          ) : (
            menuItem
          );
        })}
      </div>

      {/* Bottom brand badge */}
      {!collapsed && (
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid rgba(80,45,50,0.7)',
            flexShrink: 0,
          }}
        >
          <div style={{ color: '#857b80', fontSize: 11, textAlign: 'center' }}>
            CAMS © {new Date().getFullYear()}
          </div>
        </div>
      )}
    </div>
  );
};
