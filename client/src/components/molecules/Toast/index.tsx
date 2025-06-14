import React, { useState, useEffect } from 'react';
import { Snackbar, Alert, AlertProps, AlertTitle, Slide, SlideProps } from '@mui/material';
import { useUI } from '@/lib/hooks/redux/useUI';
import { CheckCircle, Error, Info, Warning } from '@mui/icons-material';

type TransitionProps = Omit<SlideProps, 'direction'>;

function TransitionUp(props: TransitionProps) {
  return <Slide {...props} direction="up" />;
}

function TransitionLeft(props: TransitionProps) {
  return <Slide {...props} direction="left" />;
}

interface CustomToastProps {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

/**
 * Custom toast notification component used by the toast notification system
 */
const CustomToast: React.FC<CustomToastProps> = ({ id, message, type, duration = 6000 }) => {
  const [open, setOpen] = useState(true);
  const { removeToast } = useUI();

  // Auto close the toast after duration
  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => {
      clearTimeout(timer);
    };
  }, [duration]);

  const handleClose = () => {
    setOpen(false);
    // Give time for the closing animation before removing
    setTimeout(() => {
      removeToast(id);
    }, 300);
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle fontSize="inherit" />;
      case 'error':
        return <Error fontSize="inherit" />;
      case 'warning':
        return <Warning fontSize="inherit" />;
      case 'info':
        return <Info fontSize="inherit" />;
      default:
        return <Info fontSize="inherit" />;
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'success':
        return 'Success';
      case 'error':
        return 'Error';
      case 'warning':
        return 'Warning';
      case 'info':
        return 'Information';
      default:
        return 'Notice';
    }
  };

  return (
    <Snackbar
      open={open}
      onClose={handleClose}
      TransitionComponent={type === 'error' ? TransitionUp : TransitionLeft}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      key={id}
      autoHideDuration={duration}
    >
      <Alert
        severity={type}
        variant="filled"
        onClose={handleClose}
        sx={{
          width: '100%',
          boxShadow: 4,
          '.MuiAlert-message': {
            display: 'flex',
            flexDirection: 'column',
          },
        }}
        icon={getIcon()}
      >
        <AlertTitle>{getTitle()}</AlertTitle>
        {message}
      </Alert>
    </Snackbar>
  );
};

/**
 * Toast container component that renders all active toasts
 */
export const ToastContainer: React.FC = () => {
  const { toasts } = useUI();

  return (
    <>
      {toasts.map((toast) => (
        <CustomToast
          key={toast.id}
          id={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
        />
      ))}
    </>
  );
};

/**
 * Hook to create and show toast notifications
 */
export const useToast = () => {
  const { addToast } = useUI();

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning', duration?: number) => {
    addToast({ message, type, duration });
  };

  const toast = {
    success: (message: string, duration?: number) => showToast(message, 'success', duration),
    error: (message: string, duration?: number) => showToast(message, 'error', duration),
    info: (message: string, duration?: number) => showToast(message, 'info', duration),
    warning: (message: string, duration?: number) => showToast(message, 'warning', duration),
  };

  return toast;
};
