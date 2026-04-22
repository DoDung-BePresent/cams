import { theme as antdTheme } from 'antd';
import type { ThemeConfig } from 'antd';

export type ColorMode = 'default' | 'spotify';

const sharedComponents: ThemeConfig['components'] = {
  Typography: {
    titleMarginBottom: 0,
  },
  Form: {
    labelColor: 'var(--color-gray)',
  },
  Menu: {
    itemMarginInline: 0,
    itemMarginBlock: 0,
    itemBorderRadius: 0,
    itemHeight: 46,
  },
  Button: {
    fontSizeLG: 14,
  },
  Input: {
    fontSizeLG: 14,
  },
  InputNumber: {
    fontSizeLG: 14,
  },
  Select: {
    fontSizeLG: 14,
  },
  Card: {
    headerFontSize: 14,
  },
  Tabs: {
    horizontalItemGutter: 0,
  },
  DatePicker: {
    fontSizeLG: 14,
  },
  Divider: {
    marginLG: 0,
  },
};

export const getAntTheme = (mode: ColorMode): ThemeConfig => {
  if (mode === 'spotify') {
    return {
      algorithm: antdTheme.darkAlgorithm,
      cssVar: { key: '_,:root,css-var-my-theme-id' },
      token: {
        fontFamily: 'Inter',
        borderRadius: 8,
        colorPrimary: '#1ed760',
        colorInfo: '#1ed760',
        colorSuccess: '#1ed760',
        colorBgBase: '#000000',
        colorBgLayout: '#000000',
        colorBgContainer: '#121212',
        colorBgElevated: '#181818',
        colorBorder: '#2a2a2a',
        colorBorderSecondary: '#1f1f1f',
        colorText: '#ffffff',
        colorTextSecondary: '#b3b3b3',
        colorTextTertiary: '#8c8c8c',
        colorError: '#f3727f',
        colorWarning: '#ffa42b',
        colorLink: '#1ed760',
        boxShadow:
          'rgba(0, 0, 0, 0.5) 0px 8px 24px',
      },
      components: {
        ...sharedComponents,
        Button: {
          fontSizeLG: 14,
          borderRadius: 999,
          primaryShadow: 'none',
        },
        Card: {
          colorBorderSecondary: '#1f1f1f',
          headerFontSize: 14,
        },
        Layout: {
          headerBg: '#000000',
          siderBg: '#121212',
          bodyBg: '#000000',
          triggerBg: '#000000',
        },
        Menu: {
          itemMarginInline: 0,
          itemMarginBlock: 0,
          itemBorderRadius: 8,
          itemHeight: 46,
          darkItemBg: '#121212',
          darkSubMenuItemBg: '#121212',
          darkItemSelectedBg: '#2a2a2a',
          darkItemSelectedColor: '#ffffff',
          darkItemColor: '#b3b3b3',
          darkItemHoverColor: '#ffffff',
          darkGroupTitleColor: '#8c8c8c',
        },
        Tabs: {
          horizontalItemGutter: 0,
          itemColor: '#b3b3b3',
          itemSelectedColor: '#ffffff',
          itemHoverColor: '#ffffff',
          inkBarColor: '#1ed760',
        },
      },
    };
  }

  return {
    cssVar: { key: '_,:root,css-var-my-theme-id' },
    token: {
      fontFamily: 'Inter',
      borderRadius: 4,
    },
    components: {
      ...sharedComponents,
      Card: {
        colorBorderSecondary: '#E6EBF1',
        headerFontSize: 14,
      },
    },
  };
};
