import React from 'react';
import { Button as MuiButton, ButtonProps as MuiButtonProps, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';

export interface ButtonProps extends Omit<MuiButtonProps, 'color'> {
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  isLoading?: boolean;
  loadingText?: string;
  fullWidth?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

// Styled loader wrapper that positions the spinner correctly
const LoaderWrapper = styled('span')(({ theme }) => ({
  display: 'inline-flex',
  position: 'absolute',
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
  alignItems: 'center',
  justifyContent: 'center',
}));

// Styled content wrapper that fades out when loading
const ContentWrapper = styled('span')<{ $loading?: boolean }>(({ $loading }) => ({
  visibility: $loading ? 'hidden' : 'visible',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

/**
 * Primary button component used throughout the application
 * Uses MUI Button under the hood with custom styling
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    children, 
    color = 'primary', 
    variant = 'contained', 
    isLoading = false, 
    loadingText,
    disabled,
    startIcon,
    endIcon,
    fullWidth = false,
    ...rest 
  }, ref) => {
    const isDisabled = disabled || isLoading;
    
    // Map our color prop to MUI color
    const muiColor = color === 'success' || color === 'error' || color === 'warning' || color === 'info'
      ? color
      : undefined;

    return (
      <MuiButton
        ref={ref}
        color={muiColor}
        variant={variant}
        disabled={isDisabled}
        fullWidth={fullWidth}
        startIcon={isLoading ? null : startIcon}
        endIcon={isLoading ? null : endIcon}
        sx={{ 
          position: 'relative',
          '&.MuiButtonBase-root': {
            boxShadow: variant === 'contained' ? 2 : 'none',
          },
          ...(color === 'primary' && {
            color: variant === 'contained' ? 'white' : 'primary.main',
          }),
          ...(color === 'secondary' && {
            color: variant === 'contained' ? 'white' : 'secondary.main',
          }),
        }}
        {...rest}
      >
        {isLoading && (
          <LoaderWrapper>
            <CircularProgress size={24} color="inherit" thickness={5} />
          </LoaderWrapper>
        )}
        <ContentWrapper $loading={isLoading}>
          {loadingText && isLoading ? loadingText : children}
        </ContentWrapper>
      </MuiButton>
    );
  }
);

Button.displayName = 'Button';
