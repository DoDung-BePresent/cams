import { theme as antdTheme } from 'antd';
import type { ThemeConfig } from 'antd';

export type ColorMode = 'default' | 'spotify';

const sharedComponents: ThemeConfig['components'] = {
    Layout: {
      headerBg: '#ffffff',
      bodyBg: '#FAFAFB',
      footerBg: '#FAFAFB',
      siderBg: '#ffffff',
    },
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
        Input: {
          fontSizeLG: 14,
          activeShadow: 'none',
        },
        InputNumber: {
          fontSizeLG: 14,
        },
        Select: {
          fontSizeLG: 14,
        },
        DatePicker: {
          fontSizeLG: 14,
        },
        Mentions: {
          controlItemBgHover: '#2f2f2f',
        },
        AutoComplete: {
          optionSelectedBg: '#2f2f2f',
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

export const antDarkTheme: ThemeConfig = {
  cssVar: { key: '_,:root,css-var-my-theme-id' },
  token: {
    fontFamily: 'Inter',
    borderRadius: 4,
    // Spotify-inspired dark mode colors
    colorBgBase: '#121212',
    colorBgContainer: '#181818',
    colorBgElevated: '#282828',
    colorBgLayout: '#000000',
    colorBorder: '#282828',
    colorBorderSecondary: '#282828',
    colorText: '#ffffff',
    colorTextSecondary: '#b3b3b3',
    colorTextTertiary: '#6a6a6a',
    colorTextQuaternary: '#535353',
    colorPrimary: '#1db954',
    colorPrimaryHover: '#1ed760',
    colorPrimaryActive: '#169c46',
    colorInfo: '#1db954',
    colorSuccess: '#1db954',
    colorWarning: '#ffa500',
    colorError: '#e22134',
    colorLink: '#1db954',
    colorLinkHover: '#1ed760',
    colorLinkActive: '#169c46',
  },
  components: {
    Layout: {
      headerBg: '#181818',
      bodyBg: '#121212',
      footerBg: '#181818',
      siderBg: '#181818',
    },
    Typography: {
      titleMarginBottom: 0,
      colorText: '#ffffff',
      colorTextSecondary: '#b3b3b3',
      colorTextTertiary: '#6a6a6a',
    },
    Form: {
      labelColor: '#b3b3b3',
    },
    Menu: {
      itemMarginInline: 0,
      itemMarginBlock: 0,
      itemBorderRadius: 0,
      itemHeight: 46,
      colorBgContainer: '#000000',
      colorItemBg: '#000000',
      colorItemBgHover: '#1a1a1a',
      colorItemBgSelected: '#282828',
      colorItemText: '#b3b3b3',
      colorItemTextHover: '#ffffff',
      colorItemTextSelected: '#ffffff',
    },
    Button: {
      fontSizeLG: 14,
      colorBgContainer: '#282828',
      colorBorder: '#535353',
      colorText: '#ffffff',
      colorPrimary: '#1db954',
      colorPrimaryHover: '#1ed760',
      colorPrimaryActive: '#169c46',
    },
    Input: {
      fontSizeLG: 14,
      colorBgContainer: '#282828',
      colorBorder: '#535353',
      colorText: '#ffffff',
      colorTextPlaceholder: '#6a6a6a',
      colorBgContainerDisabled: '#181818',
    },
    InputNumber: {
      fontSizeLG: 14,
      colorBgContainer: '#282828',
      colorBorder: '#535353',
      colorText: '#ffffff',
      colorTextPlaceholder: '#6a6a6a',
    },
    Select: {
      fontSizeLG: 14,
      colorBgContainer: '#282828',
      colorBgElevated: '#282828',
      colorBorder: '#535353',
      colorText: '#ffffff',
      colorTextPlaceholder: '#6a6a6a',
      optionSelectedBg: '#1db954',
    },
    Card: {
      colorBgContainer: '#181818',
      colorBorderSecondary: '#282828',
      headerFontSize: 14,
      colorText: '#ffffff',
      colorTextHeading: '#ffffff',
    },
    Tabs: {
      horizontalItemGutter: 0,
      colorBgContainer: '#181818',
      colorText: '#b3b3b3',
      colorPrimary: '#1db954',
    },
    DatePicker: {
      fontSizeLG: 14,
      colorBgContainer: '#282828',
      colorBgElevated: '#282828',
      colorBorder: '#535353',
      colorText: '#ffffff',
      colorTextPlaceholder: '#6a6a6a',
    },
    Divider: {
      marginLG: 0,
      colorSplit: '#282828',
    },
    Table: {
      colorBgContainer: '#181818',
      colorText: '#ffffff',
      colorTextHeading: '#ffffff',
      colorBorderSecondary: '#282828',
      headerBg: '#121212',
      rowHoverBg: '#282828',
    },
    Drawer: {
      colorBgElevated: '#181818',
      colorBgMask: 'rgba(0, 0, 0, 0.7)',
      colorText: '#ffffff',
    },
    Modal: {
      contentBg: '#282828',
      headerBg: '#282828',
      colorBgMask: 'rgba(0, 0, 0, 0.7)',
      colorText: '#ffffff',
    },
    Dropdown: {
      colorBgElevated: '#282828',
      colorText: '#ffffff',
      controlItemBgHover: '#3e3e3e',
    },
    Collapse: {
      colorBgContainer: '#181818',
      colorBorder: '#282828',
      headerBg: '#121212',
      colorText: '#ffffff',
    },
    Segmented: {
      itemSelectedBg: '#1db954',
      itemSelectedColor: '#ffffff',
      itemColor: '#b3b3b3',
      itemHoverColor: '#ffffff',
      trackBg: '#282828',
    },
    Switch: {
      colorPrimary: '#1db954',
      colorPrimaryHover: '#1ed760',
    },
    Radio: {
      colorPrimary: '#1db954',
      colorBgContainer: '#282828',
      colorBorder: '#535353',
      colorText: '#ffffff',
    },
    Checkbox: {
      colorPrimary: '#1db954',
      colorBgContainer: '#282828',
      colorBorder: '#535353',
      colorText: '#ffffff',
    },
    Slider: {
      colorPrimary: '#1db954',
      colorPrimaryBorder: '#1db954',
      trackBg: '#535353',
      trackHoverBg: '#6a6a6a',
    },
    Alert: {
      colorInfoBg: '#1a3a2a',
      colorInfoBorder: '#1db954',
      colorSuccessBg: '#1a3a2a',
      colorSuccessBorder: '#1db954',
      colorWarningBg: '#3a2a1a',
      colorWarningBorder: '#ffa500',
      colorErrorBg: '#3a1a1a',
      colorErrorBorder: '#e22134',
    },
    Spin: {
      colorPrimary: '#1db954',
    },
    Progress: {
      colorText: '#ffffff',
      defaultColor: '#1db954',
    },
    Tooltip: {
      colorBgSpotlight: '#282828',
      colorTextLightSolid: '#ffffff',
    },
    Tag: {
      defaultBg: 'transparent',
      defaultColor: '#b3b3b3',
      colorBorder: '#535353',
      colorSuccess: '#1db954',
      colorInfo: '#1db954',
      colorWarning: '#ffa500',
      colorError: '#e22134',
    },
  },
};
