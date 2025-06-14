import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  IconButton,
  Typography,
  Button as MuiButton,
  Box,
  useTheme,
  styled,
  Divider
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { Button } from '@/components/atoms/Button';

// Enhanced dialog title with close button
const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(2, 3),
}));

// Styled content for consistent padding
const StyledDialogContent = styled(DialogContent)(({ theme }) => ({
  padding: theme.spacing(3),
}));

// Styled actions with proper spacing
const StyledDialogActions = styled(DialogActions)(({ theme }) => ({
  padding: theme.spacing(2, 3),
}));

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  fullWidth?: boolean;
  hideCloseButton?: boolean;
  disableEscapeKeyDown?: boolean;
  disableBackdropClick?: boolean;
  confirmButton?: {
    text: string;
    onClick: () => void;
    color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
    isLoading?: boolean;
  };
  cancelButton?: {
    text: string;
    onClick?: () => void;
    variant?: 'text' | 'outlined' | 'contained';
  };
}

/**
 * Modal component that follows the design system
 */
export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  description,
  children,
  actions,
  maxWidth = 'sm',
  fullWidth = true,
  hideCloseButton = false,
  disableEscapeKeyDown = false,
  disableBackdropClick = false,
  confirmButton,
  cancelButton = { text: 'Cancel', variant: 'text' },
}) => {
  const theme = useTheme();

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (disableBackdropClick) {
      event.stopPropagation();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={(event, reason) => {
        if (reason === 'backdropClick' && disableBackdropClick) {
          return;
        }
        if (reason === 'escapeKeyDown' && disableEscapeKeyDown) {
          return;
        }
        onClose();
      }}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      onClick={handleBackdropClick}
      PaperProps={{
        sx: {
          borderRadius: '16px',
          overflow: 'hidden',
        },
      }}
    >
      {title && (
        <>
          <StyledDialogTitle>
            {typeof title === 'string' ? (
              <Typography variant="h6" component="h2">
                {title}
              </Typography>
            ) : (
              title
            )}
            {!hideCloseButton && (
              <IconButton
                aria-label="close"
                onClick={onClose}
                sx={{
                  color: theme.palette.grey[500],
                }}
                size="small"
              >
                <CloseIcon />
              </IconButton>
            )}
          </StyledDialogTitle>
          <Divider />
        </>
      )}

      <StyledDialogContent>
        {description && (
          <DialogContentText sx={{ mb: 2 }}>
            {description}
          </DialogContentText>
        )}
        {children}
      </StyledDialogContent>

      {(actions || confirmButton || cancelButton) && (
        <>
          <Divider />
          <StyledDialogActions>
            {actions ? (
              actions
            ) : (
              <>
                {cancelButton && (
                  <Button
                    onClick={cancelButton.onClick || onClose}
                    variant={cancelButton.variant as any || 'text'}
                    color="primary"
                  >
                    {cancelButton.text}
                  </Button>
                )}
                {confirmButton && (
                  <Button
                    onClick={confirmButton.onClick}
                    color={confirmButton.color || 'primary'}
                    isLoading={confirmButton.isLoading}
                  >
                    {confirmButton.text}
                  </Button>
                )}
              </>
            )}
          </StyledDialogActions>
        </>
      )}
    </Dialog>
  );
};

/**
 * Confirmation modal for asking users to confirm actions
 */
export const ConfirmationModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
}> = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false,
  color = 'primary',
}) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={message}
      confirmButton={{
        text: confirmText,
        onClick: onConfirm,
        color: color,
        isLoading: isLoading,
      }}
      cancelButton={{
        text: cancelText,
        onClick: onClose,
      }}
    />
  );
};
