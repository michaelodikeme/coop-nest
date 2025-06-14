import { useState } from 'react';
import {
  Drawer,
  Box,
  Typography,
  Divider,
  FormControl,
  IconButton,
  OutlinedInput,
  Grid,
  Button,
  MenuItem,
  Select,
  InputLabel,
  FormHelperText,
  Stack,
  useTheme,
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Close as CloseIcon } from '@mui/icons-material';
import { format } from 'date-fns';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterDrawerProps {
  open: boolean;
  onClose: () => void;
  filters: {
    startDate: string;
    endDate: string;
    transactionType: string;
    status: string;
    module?: string;
    [key: string]: string | undefined;
  };
  onApplyFilters: (filters: any) => void;
  onFilterChange: (filters: any) => void;
  onResetFilters: () => void;
  filterOptions: {
    transactionTypes: FilterOption[];
    statuses: FilterOption[];
  };
  transactionTypes?: string[];
  showModuleFilter?: boolean;
}

export default function FilterDrawer({
  open,
  onClose,
  filters,
  onApplyFilters,
  onFilterChange,
  onResetFilters,
  filterOptions,
  transactionTypes = [],
  showModuleFilter = false,
}: FilterDrawerProps) {
  const theme = useTheme();
  
  // Create local state to track filter changes
  const [localFilters, setLocalFilters] = useState(filters);
  
  // Update local filters when drawer opens with new filters
  useState(() => {
    if (open) {
      setLocalFilters(filters);
    }
  });

  const handleDateChange = (key: string, date: Date | null) => {
    if (date) {
      setLocalFilters(prev => ({ ...prev, [key]: format(date, 'yyyy-MM-dd') }));
    }
  };

  const handleApplyFilters = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const handleResetFilters = () => {
    const resetFilters = {
      ...filters,
      transactionType: '',
      status: ''
    };
    setLocalFilters(resetFilters);
    onApplyFilters(resetFilters);
    onClose();
  };
  
  const handleStatusChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ status: (event.target as HTMLInputElement).value });
  };
  
  const handleTransactionTypeChange = (event: any) => {
    onFilterChange({ transactionType: event.target.value });
  };
  
  const handleModuleChange = (event: any) => {
    onFilterChange({ module: event.target.value });
  };
  
  const getTransactionTypeOptions = () => {
    if (transactionTypes.length > 0) {
      return transactionTypes;
    }
    
    return [
      'DEPOSIT',
      'WITHDRAWAL',
      'LOAN_DISBURSEMENT',
      'LOAN_REPAYMENT',
      'SHARE_PURCHASE',
      'SHARE_REDEMPTION'
    ];
  };
  
  // Update the onFilterChange handler to work with client-side filtering
  const handleFilterChange = (key: string, value: any) => {
    onFilterChange({
      ...filters,
      [key]: value,
    });
  };
  
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ 
        sx: { 
          width: { xs: '100%', sm: 400 }, 
          p: 3 
        } 
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Filter Transactions</Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>Date Range</Typography>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 6 }}>
              <DatePicker
                label="Start Date"
                value={localFilters.startDate ? new Date(localFilters.startDate) : null}
                onChange={(date) => handleDateChange('startDate', date)}
                format="MMM dd, yyyy"
                slotProps={{
                  textField: {
                    size: 'small',
                    fullWidth: true
                  }
                }}
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <DatePicker
                label="End Date"
                value={localFilters.endDate ? new Date(localFilters.endDate) : null}
                onChange={(date) => handleDateChange('endDate', date)}
                format="MMM dd, yyyy"
                slotProps={{
                  textField: {
                    size: 'small',
                    fullWidth: true
                  }
                }}
              />
            </Grid>
          </Grid>
        </LocalizationProvider>
      </Box>
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>Transaction Type</Typography>
        <FormControl fullWidth size="small">
          <InputLabel id="transaction-type-label">Select Type</InputLabel>
          <Select
            labelId="transaction-type-label"
            value={localFilters.transactionType}
            onChange={(e) => handleFilterChange('transactionType', e.target.value)}
            input={<OutlinedInput label="Select Type" />}
          >
            <MenuItem value="">All Types</MenuItem>
            {filterOptions.transactionTypes.map(option => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>Status</Typography>
        <FormControl fullWidth size="small">
          <InputLabel id="status-label">Select Status</InputLabel>
          <Select
            labelId="status-label"
            value={localFilters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            input={<OutlinedInput label="Select Status" />}
          >
            <MenuItem value="">All Statuses</MenuItem>
            {filterOptions.statuses.map(option => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      
      {/* Module Filter */}
      {showModuleFilter && (
        <Box sx={{ mb: 4 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Module</InputLabel>
            <Select
              value={filters.module || ''}
              label="Module"
              onChange={handleModuleChange}
            >
              <MenuItem value="">All Modules</MenuItem>
              <MenuItem value="SAVINGS">Savings</MenuItem>
              <MenuItem value="LOAN">Loans</MenuItem>
              <MenuItem value="SHARES">Shares</MenuItem>
              <MenuItem value="ADMIN">Admin</MenuItem>
            </Select>
            <FormHelperText>Filter by transaction module</FormHelperText>
          </FormControl>
        </Box>
      )}
      
      <Stack direction="row" spacing={2} sx={{ mt: 4 }}>
        <Button 
          variant="outlined"
          fullWidth
          onClick={handleResetFilters}
        >
          Reset Filters
        </Button>
        <Button 
          variant="contained"
          fullWidth
          onClick={handleApplyFilters}
        >
          Apply Filters
        </Button>
      </Stack>
    </Drawer>
  );
}