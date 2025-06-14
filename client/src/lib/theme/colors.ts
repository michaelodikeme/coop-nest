export const colors = {
  light: {
    primary: {
      main: '#1A237E', // Deep navy with matte finish
      light: '#534bae',
      dark: '#000051',
      contrastText: '#fff'
    },
    secondary: {
      main: '#00796B', // Soft teal
      light: '#48a999',
      dark: '#004c40',
      contrastText: '#fff'
    },
    background: {
      default: '#F5F7FA',
      paper: '#FFFFFF',
      gradient: 'linear-gradient(45deg, #1A237Edd, #000051)'
    },
    text: {
      primary: '#1a1a1a',
      secondary: '#666666'
    },
    // Semantic colors for consistent UI
    success: {
      main: '#4CAF50',
      light: '#81C784',
      dark: '#388E3C',
      contrastText: '#fff'
    },
    warning: {
      main: '#FFC107',
      light: '#FFD54F',
      dark: '#FFA000',
      contrastText: 'rgba(0, 0, 0, 0.87)'
    },
    error: {
      main: '#FF5252', // Warm coral for CTAs
      light: '#FF8A80',
      dark: '#D50000',
      contrastText: '#fff'
    },
    info: {
      main: '#2196F3',
      light: '#64B5F6',
      dark: '#1976D2',
      contrastText: '#fff'
    },
    // UI Element colors
    divider: 'rgba(0, 0, 0, 0.12)',
    action: {
      active: 'rgba(0, 0, 0, 0.54)',
      hover: 'rgba(0, 0, 0, 0.04)',
      selected: 'rgba(0, 0, 0, 0.08)',
      disabled: 'rgba(0, 0, 0, 0.26)',
      disabledBackground: 'rgba(0, 0, 0, 0.12)',
      focus: 'rgba(0, 0, 0, 0.12)'
    }
  },
  dark: {
    primary: {
      main: '#534bae', // Lighter version of the primary for dark mode
      light: '#8577dd',
      dark: '#241f80',
      contrastText: '#fff'
    },
    secondary: {
      main: '#48a999', // Lighter version of the secondary for dark mode
      light: '#7bdbcb',
      dark: '#00796b',
      contrastText: '#fff'
    },
    background: {
      default: '#121212',
      paper: '#1E1E1E',
      gradient: 'linear-gradient(45deg, #534baedd, #241f80)'
    },
    text: {
      primary: '#ffffff',
      secondary: '#b3b3b3'
    },
    // Semantic colors for consistent UI
    success: {
      main: '#66BB6A',
      light: '#90CC93',
      dark: '#43A047',
      contrastText: 'rgba(0, 0, 0, 0.87)'
    },
    warning: {
      main: '#FFA726',
      light: '#FFCC80',
      dark: '#FB8C00',
      contrastText: 'rgba(0, 0, 0, 0.87)'
    },
    error: {
      main: '#FF5252',
      light: '#FF7F7F',
      dark: '#C20000',
      contrastText: '#fff'
    },
    info: {
      main: '#29B6F6',
      light: '#4FC3F7',
      dark: '#0288D1',
      contrastText: 'rgba(0, 0, 0, 0.87)'
    },
    // UI Element colors
    divider: 'rgba(255, 255, 255, 0.12)',
    action: {
      active: 'rgba(255, 255, 255, 0.7)',
      hover: 'rgba(255, 255, 255, 0.08)',
      selected: 'rgba(255, 255, 255, 0.16)',
      disabled: 'rgba(255, 255, 255, 0.3)',
      disabledBackground: 'rgba(255, 255, 255, 0.12)',
      focus: 'rgba(255, 255, 255, 0.12)'
    }
  }
};
