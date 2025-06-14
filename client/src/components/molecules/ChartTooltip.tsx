import { Box, Typography, Divider, useTheme } from '@mui/material';
import { TooltipProps } from 'recharts';
import { formatCurrency } from '@/utils/formatting/format';

interface CustomTooltipProps extends TooltipProps<number, string> {
  showBalance?: boolean;
  showTotal?: boolean;
  valuePrefix?: string;
}

export function ChartTooltip({ 
  active, 
  payload, 
  label,
  showBalance = false,
  showTotal = false,
  valuePrefix = ''
}: CustomTooltipProps) {
  const theme = useTheme();
  
  if (!active || !payload || !payload.length) {
    return null;
  }

  // Calculate total if needed
  const total = showTotal 
    ? payload.reduce((sum, entry) => sum + (Number(entry.value) || 0), 0)
    : null;

  // Find balance if it exists
  const balanceEntry = payload.find(entry => entry.dataKey === 'balance');

  return (
    <Box sx={{ 
      bgcolor: 'background.paper',
      p: 1.5,
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: 1,
      boxShadow: theme.shadows[3],
      minWidth: 180
    }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        {label}
      </Typography>
      
      {payload.map((entry, index) => {
        // Skip balance from the regular entries if we're showing it separately
        if (showBalance && entry.dataKey === 'balance') return null;
        
        return (
          <Box key={`item-${index}`} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box 
                component="span" 
                sx={{ 
                  width: 8, 
                  height: 8, 
                  mr: 1, 
                  borderRadius: '50%',
                  bgcolor: entry.color 
                }} 
              />
              <Typography variant="body2">
                {entry.name}:
              </Typography>
            </Box>
            <Typography variant="body2" fontWeight={500} sx={{ ml: 2 }}>
              {valuePrefix}{formatCurrency(Number(entry.value))}
            </Typography>
          </Box>
        );
      })}
      
      {(showTotal || (showBalance && balanceEntry)) && (
        <Divider sx={{ my: 1 }} />
      )}
      
      {showTotal && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2" fontWeight={500}>
            Total:
          </Typography>
          <Typography variant="body2" fontWeight={600}>
            {valuePrefix}{formatCurrency(total!)}
          </Typography>
        </Box>
      )}
      
      {showBalance && balanceEntry && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2" fontWeight={500}>
            Balance:
          </Typography>
          <Typography 
            variant="body2" 
            fontWeight={600}
            color={Number(balanceEntry.value) >= 0 ? 'success.main' : 'error.main'}
          >
            {valuePrefix}{formatCurrency(Number(balanceEntry.value))}
          </Typography>
        </Box>
      )}
    </Box>
  );
}