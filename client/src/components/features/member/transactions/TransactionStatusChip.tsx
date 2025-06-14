import { Chip, useTheme, alpha } from '@mui/material';

export function TransactionStatusChip({ status }: { status: string }) {
  const theme = useTheme();

  const getStatusConfig = () => {
    switch (status) {
      case 'COMPLETED':
        return {
          label: 'Completed',
          bgColor: alpha(theme.palette.success.main, 0.1),
          color: theme.palette.success.main
        };
      case 'PENDING':
        return {
          label: 'Pending',
          bgColor: alpha(theme.palette.warning.main, 0.1),
          color: theme.palette.warning.main
        };
      case 'FAILED':
        return {
          label: 'Failed',
          bgColor: alpha(theme.palette.error.main, 0.1),
          color: theme.palette.error.main
        };
      case 'PROCESSING':
        return {
          label: 'Processing',
          bgColor: alpha(theme.palette.info.main, 0.1),
          color: theme.palette.info.main
        };
      case 'CANCELLED':
        return {
          label: 'Cancelled',
          bgColor: alpha(theme.palette.grey[500], 0.1),
          color: theme.palette.grey[700]
        };
      default:
        return {
          label: status,
          bgColor: alpha(theme.palette.grey[500], 0.1),
          color: theme.palette.grey[700]
        };
    }
  };

  const { label, bgColor, color } = getStatusConfig();

  return (
    <Chip
      label={label}
      size="small"
      sx={{ 
        bgcolor: bgColor,
        color: color,
        fontWeight: 500,
        fontSize: '0.75rem',
      }}
    />
  );
}