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
  },
};
