import { TypographyOptions } from '@mui/material/styles/createTypography';

export const typography: TypographyOptions = {
  fontFamily: 'var(--font-geist-sans)',
  h1: {
    fontSize: '2.5rem',
    fontWeight: 700,
    lineHeight: 1.2,
    letterSpacing: '-0.02em',
    '@media (max-width: 600px)': {
      fontSize: '2rem'
    }
  },
  h2: {
    fontSize: '2rem',
    fontWeight: 700,
    lineHeight: 1.3,
    letterSpacing: '-0.01em',
    '@media (max-width: 600px)': {
      fontSize: '1.75rem'
    }
  },
  h3: {
    fontSize: '1.75rem',
    fontWeight: 600,
    lineHeight: 1.4,
    '@media (max-width: 600px)': {
      fontSize: '1.5rem'
    }
  },
  h4: {
    fontSize: '1.5rem',
    fontWeight: 600,
    lineHeight: 1.4
  },
  h5: {
    fontSize: '1.25rem',
    fontWeight: 600,
    lineHeight: 1.5
  },
  h6: {
    fontSize: '1rem',
    fontWeight: 600,
    lineHeight: 1.5
  },
  body1: {
    fontSize: '1rem',
    lineHeight: 1.6
  },
  body2: {
    fontSize: '0.875rem',
    lineHeight: 1.6
  },
  button: {
    fontSize: '0.875rem',
    fontWeight: 600,
    letterSpacing: '0.02em',
    textTransform: 'none'
  },
  caption: {
    fontSize: '0.75rem',
    lineHeight: 1.5
  },
  overline: {
    fontSize: '0.75rem',
    fontWeight: 600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase'
  },
  subtitle1: {
    fontSize: '1rem',
    fontWeight: 500,
    lineHeight: 1.5
  },
  subtitle2: {
    fontSize: '0.875rem',
    fontWeight: 500,
    lineHeight: 1.5
  }
};
