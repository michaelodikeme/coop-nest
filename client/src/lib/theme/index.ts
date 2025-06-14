import { createTheme, Components, Theme } from '@mui/material/styles';
import { colors } from './colors';
import { typography } from './typography';
import { spacing } from './spacing';
import { shadows } from './shadows';

// Component overrides shared between light and dark themes
const getCommonComponentOverrides = (theme: Theme): Components<Theme> => ({
  MuiButton: {
    styleOverrides: {
      root: {
        textTransform: 'none',
        borderRadius: 8,
        padding: '0.5rem 1.25rem',
        transition: 'all 0.2s ease-in-out',
        fontWeight: 500,
      },
      contained: {
        boxShadow: 'none',
        '&:hover': {
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
          transform: 'translateY(-2px)',
        },
      },
      outlined: {
        borderWidth: '1.5px',
        '&:hover': {
          borderWidth: '1.5px',
        },
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        backgroundImage: 'none',
        boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
        overflow: 'visible',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.1)',
        },
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        backgroundImage: 'none',
        borderRadius: 12,
      },
      elevation1: {
        boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
      },
      elevation2: {
        boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.08)',
      },
    },
  },
  MuiTextField: {
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          borderRadius: 8,
        },
      },
    },
  },
  MuiOutlinedInput: {
    styleOverrides: {
      root: {
        borderRadius: 8,
      },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: {
        borderRadius: 16,
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: 16,
      },
    },
  },
});

// Create light theme
export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: colors.light.primary,
    secondary: colors.light.secondary,
    background: colors.light.background,
    text: colors.light.text,
    error: {
      main: '#FF5252',
    },
    warning: {
      main: '#FFC107',
    },
    info: {
      main: '#2196F3',
    },
    success: {
      main: '#4CAF50',
    },
  },
  typography,
  spacing: (factor) => `${0.25 * factor}rem`,
  shape: {
    borderRadius: 8,
  },
  shadows: shadows.light,
});

// Apply component overrides to light theme
lightTheme.components = getCommonComponentOverrides(lightTheme);

// Create dark theme
export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: colors.dark.primary,
    secondary: colors.dark.secondary,
    background: colors.dark.background,
    text: colors.dark.text,
    error: {
      main: '#FF5252',
    },
    warning: {
      main: '#FFC107',
    },
    info: {
      main: '#64B5F6',
    },
    success: {
      main: '#81C784',
    },
  },
  typography,
  spacing: (factor) => `${0.25 * factor}rem`,
  shape: {
    borderRadius: 8,
  },
  shadows: shadows.dark,
});

// Apply component overrides to dark theme
darkTheme.components = getCommonComponentOverrides(darkTheme);

export { colors, typography, spacing, shadows };
