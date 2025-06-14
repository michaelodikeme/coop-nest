'use client';

import { useTheme } from '@/lib/theme/ThemeRegistry';
import { IconButton, Tooltip, useMediaQuery } from '@mui/material';
import { Brightness4, Brightness7, BrightnessAuto } from '@mui/icons-material';
import { useEffect, useState } from 'react';

interface ThemeToggleProps {
  size?: 'small' | 'medium' | 'large';
}

export default function ThemeToggle({ size = 'medium' }: ThemeToggleProps) {
  const { mode, setMode, isDarkMode } = useTheme();
  const [mounted, setMounted] = useState(false);
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  // Avoid hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  // Get the icon based on current theme mode
  const getIcon = () => {
    switch (mode) {
      case 'light':
        return <Brightness7 />;
      case 'dark':
        return <Brightness4 />;
      case 'system':
        return <BrightnessAuto />;
    }
  };

  // Cycle through theme modes: light -> dark -> system -> light
  const cycleThemeMode = () => {
    switch (mode) {
      case 'light':
        setMode('dark');
        break;
      case 'dark':
        setMode('system');
        break;
      case 'system':
        setMode('light');
        break;
    }
  };

  // Get tooltip text based on current theme mode
  const getTooltipText = () => {
    switch (mode) {
      case 'light':
        return 'Light mode (click to toggle)';
      case 'dark':
        return 'Dark mode (click to toggle)';
      case 'system':
        return `System preference: ${prefersDarkMode ? 'Dark' : 'Light'} (click to toggle)`;
    }
  };

  return (
    <Tooltip title={getTooltipText()}>
      <IconButton
        onClick={cycleThemeMode}
        color="inherit"
        size={size}
        aria-label="Toggle theme mode"
      >
        {getIcon()}
      </IconButton>
    </Tooltip>
  );
}
