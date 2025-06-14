'use client';

import { ThemeProvider, CssBaseline } from '@mui/material';
import { ReactNode, createContext, useContext, useMemo, useState, useEffect } from 'react';
import { lightTheme, darkTheme } from '@/lib/theme';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  isDarkMode: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeRegistry');
  }
  return context;
}

const THEME_MODE_KEY = 'coop_theme_mode';

export default function ThemeRegistry({ children }: { children: ReactNode }) {
  // Initialize theme preference from localStorage or default to 'system'
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // Load saved theme preference
  useEffect(() => {
    const savedMode = localStorage.getItem(THEME_MODE_KEY) as ThemeMode | null;
    if (savedMode) {
      setModeState(savedMode);
    }
  }, []);

  // Detect system preference for 'system' mode
  useEffect(() => {
    if (mode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setIsDarkMode(mediaQuery.matches);

      const handleChange = (e: MediaQueryListEvent) => {
        setIsDarkMode(e.matches);
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      setIsDarkMode(mode === 'dark');
    }
  }, [mode]);

  // Update theme preference in localStorage
  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem(THEME_MODE_KEY, newMode);
  };

  // Select theme based on dark mode state
  const theme = useMemo(() => (isDarkMode ? darkTheme : lightTheme), [isDarkMode]);

  // Theme context value
  const contextValue = useMemo(
    () => ({
      mode,
      setMode,
      isDarkMode,
    }),
    [mode, isDarkMode]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}
