import type { ThemeConfig } from 'antd';

export const antTheme: ThemeConfig = {
  cssVar: { key: '_,:root,css-var-my-theme-id' },
  token: {
    fontFamily: 'Inter',
    borderRadius: 4,
  },
  components: {
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
      fontSizeLG: 15,
    },
    Input: {
      fontSizeLG: 15,
    },
    InputNumber: {
      fontSizeLG: 15,
    },
    Select: {
      fontSizeLG: 15,
    },
    Card: {
      colorBorderSecondary: '#E6EBF1',
    },
    Tabs: {
      horizontalItemPadding: '0px 0px 12px 0px',
    },
  },
};
