/**
 * Node modules
 */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { App, ConfigProvider } from 'antd';

/**
 * Configs
 */
import { getAntTheme } from '@/config/theme';
import type { ColorMode } from '@/config/theme';

const COLOR_MODE_STORAGE_KEY = 'cams-color-mode';

type ThemeContextValue = {
  colorMode: ColorMode;
  setColorMode: (mode: ColorMode) => void;
  isSpotifyMode: boolean;
};

const ThemeModeContext = createContext<ThemeContextValue | undefined>(undefined);

const getInitialColorMode = (): ColorMode => {
  if (typeof window === 'undefined') {
    return 'default';
  }
  const stored = window.localStorage.getItem(COLOR_MODE_STORAGE_KEY);
  if (stored === 'spotify') {
    return stored;
  }
  return 'default';
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [colorMode, setColorMode] = useState<ColorMode>(getInitialColorMode);

  useEffect(() => {
    window.localStorage.setItem(COLOR_MODE_STORAGE_KEY, colorMode);
    document.documentElement.dataset.colorMode = colorMode;
  }, [colorMode]);

  const value = useMemo(
    () => ({
      colorMode,
      setColorMode,
      isSpotifyMode: colorMode === 'spotify',
    }),
    [colorMode],
  );

  const antTheme = useMemo(() => getAntTheme(colorMode), [colorMode]);

  return (
    <ThemeModeContext.Provider value={value}>
      <ConfigProvider theme={antTheme}>
        <App>{children}</App>
      </ConfigProvider>
    </ThemeModeContext.Provider>
  );
};

export const useThemeMode = () => {
  const context = useContext(ThemeModeContext);
  if (!context) {
    throw new Error('useThemeMode must be used within ThemeProvider');
  }
  return context;
};
