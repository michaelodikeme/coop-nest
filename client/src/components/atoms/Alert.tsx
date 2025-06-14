import React from 'react';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon, 
  XCircleIcon 
} from '@heroicons/react/24/outline';

type AlertVariant = 'success' | 'warning' | 'info' | 'error';

interface AlertProps {
  variant?: AlertVariant;
  title: string;
  message?: string;
  className?: string;
}

const variantStyles = {
  success: {
    container: 'bg-green-50 border-green-200',
    icon: 'text-green-400',
    title: 'text-green-800',
    message: 'text-green-700',
    component: CheckCircleIcon,
  },
  warning: {
    container: 'bg-yellow-50 border-yellow-200',
    icon: 'text-yellow-400',
    title: 'text-yellow-800',
    message: 'text-yellow-700',
    component: ExclamationTriangleIcon,
  },
  info: {
    container: 'bg-blue-50 border-blue-200',
    icon: 'text-blue-400',
    title: 'text-blue-800',
    message: 'text-blue-700',
    component: InformationCircleIcon,
  },
  error: {
    container: 'bg-red-50 border-red-200',
    icon: 'text-red-400',
    title: 'text-red-800',
    message: 'text-red-700',
    component: XCircleIcon,
  },
};

export const Alert = ({
  variant = 'info',
  title,
  message,
  className = '',
}: AlertProps) => {
  const styles = variantStyles[variant];
  const Icon = styles.component;

  return (
    <div className={`rounded-md border p-4 ${styles.container} ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <Icon className={`h-5 w-5 ${styles.icon}`} aria-hidden="true" />
        </div>
        <div className="ml-3">
          <h3 className={`text-sm font-medium ${styles.title}`}>{title}</h3>
          {message && (
            <div className={`mt-2 text-sm ${styles.message}`}>{message}</div>
          )}
        </div>
      </div>
    </div>
  );
};
