// A function that returns spacing value based on the factor
export const spacing = (factor: number): string => `${0.25 * factor}rem`;

// Spacing constants for common values
export const spacingConstants = {
  // Base spacing units
  xxs: '0.25rem',  // 4px
  xs: '0.5rem',    // 8px
  sm: '0.75rem',   // 12px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  xxl: '3rem',     // 48px

  // Component-specific spacing
  containerPadding: '1.5rem',
  cardPadding: '1.25rem',
  buttonPadding: '0.5rem 1.25rem',
  inputPadding: '0.75rem 1rem',
  tableCellPadding: '0.75rem 1rem',
  sectionGap: '2rem',
  elementGap: '1rem',
  inlineGap: '0.5rem',
  
  // Page layout spacing
  pageMargin: '2rem',
  contentMaxWidth: '1200px',
  sidebarWidth: '260px',
  headerHeight: '64px',
  footerHeight: '64px',
};
