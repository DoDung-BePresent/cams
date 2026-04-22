/**
 * Node modules
 */
import { App, ConfigProvider } from 'antd';
import { createContext, useContext, useState, useEffect } from 'react';

/**
 * Configs
 */
import { antTheme, antDarkTheme } from '@/config/theme';

type ThemeMode = 'light' | 'dark';

type ThemeContextType = {
  mode: ThemeMode;
  toggleTheme: (event?: React.MouseEvent) => void;
  setTheme: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const savedMode = localStorage.getItem('theme-mode') as ThemeMode;
    return savedMode || 'light';
  });

  useEffect(() => {
    localStorage.setItem('theme-mode', mode);
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  const toggleTheme = (event?: React.MouseEvent) => {
    const newMode = mode === 'light' ? 'dark' : 'light';

    // Check if View Transitions API is supported
    if (!document.startViewTransition || !event) {
      setMode(newMode);
      return;
    }

    // Get click position for circular reveal animation
    const x = event.clientX;
    const y = event.clientY;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );

    // Start view transition with circular reveal effect
    const transition = document.startViewTransition(() => {
      setMode(newMode);
    });

    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`,
      ];

      document.documentElement.animate(
        {
          clipPath: clipPath,
        },
        {
          duration: 300,
          easing: 'ease-in-out',
          pseudoElement: '::view-transition-new(root)',
        },
      );
    });
  };

  const setTheme = (newMode: ThemeMode) => {
    setMode(newMode);
  };

  const currentTheme = mode === 'dark' ? antDarkTheme : antTheme;

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme, setTheme }}>
      <ConfigProvider theme={currentTheme}>
        <App>{children}</App>
      </ConfigProvider>
    </ThemeContext.Provider>
  );
};
