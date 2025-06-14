import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogProps,
  IconButton,
  Typography,
  Box
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface ModalProps extends Omit<DialogProps, 'open' | 'title'> {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  maxWidth?: DialogProps['maxWidth'];
  fullWidth?: boolean;
  children: React.ReactNode;
  showCloseButton?: boolean;
  disableBackdropClick?: boolean;
  disableEscapeKeyDown?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'sm',
  fullWidth = true,
  showCloseButton = true,
  disableBackdropClick = false,
  disableEscapeKeyDown = false,
  ...rest
}) => {
  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (disableBackdropClick) {
      event.stopPropagation();
      return;
    }
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
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
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 1,
          boxShadow: 3,
        },
        zIndex: (theme) => theme.zIndex.modal,
      }}
      {...rest}
    >
      {title && (
        <DialogTitle
          sx={{
            p: 2,
            borderBottom: 1,
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography variant="h6" component="div" fontWeight={600}>
            {title}
          </Typography>
          {showCloseButton && (
            <IconButton
              aria-label="close"
              onClick={onClose}
              size="small"
              sx={{
                color: (theme) => theme.palette.grey[500],
              }}
            >
              <CloseIcon />
            </IconButton>
          )}
        </DialogTitle>
      )}
      <DialogContent
        sx={{
          p: 0,
        }}
      >
        {children}
      </DialogContent>
    </Dialog>
  );
};
