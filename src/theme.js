import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2563eb', // Azul profesional
      light: '#3b82f6',
      dark: '#1d4ed8',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#7c3aed', // Violeta para acentos
      light: '#8b5cf6',
      dark: '#6d28d9',
      contrastText: '#ffffff',
    },
    success: {
      main: '#059669', // Verde esmeralda
      light: '#10b981',
      dark: '#047857',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#d97706',
      light: '#f59e0b',
      dark: '#b45309',
      contrastText: '#ffffff',
    },
    error: {
      main: '#dc2626',
      light: '#ef4444',
      dark: '#b91c1c',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f8fafc', // Gris azulado muy claro
      paper: '#ffffff',
      sidebar: '#1e293b', // Azul noche
      header: '#ffffff',
    },
    text: {
      primary: '#1e293b', // Azul oscuro
      secondary: '#475569', // Gris azulado
      disabled: '#94a3b8',
    },
    grey: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
    custom: {
      sidebar: {
        background: '#1e293b',
        text: '#f8fafc',
        active: 'rgba(255, 255, 255, 0.1)',
        hover: 'rgba(255, 255, 255, 0.05)',
        border: 'rgba(255, 255, 255, 0.1)',
      },
      card: {
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        hover: '0 4px 12px rgba(0, 0, 0, 0.05)',
        borderRadius: '12px',
      },
      input: {
        background: '#ffffff',
        border: '1px solid #cbd5e1',
        focusBorder: '#2563eb',
        borderRadius: '8px',
      },
    },
  },
  typography: {
    fontFamily: [
      'Roboto',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontWeight: 500,
    },
    h2: {
      fontWeight: 500,
    },
    h3: {
      fontWeight: 500,
    },
    button: {
      textTransform: 'none', // Evita que los textos de los botones estén en mayúsculas
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

export default theme;
