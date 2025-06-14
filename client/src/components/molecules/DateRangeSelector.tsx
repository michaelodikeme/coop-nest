import { useState } from 'react';
import { 
  Box, 
  Button,
  Grid,
  Popover,
  Stack,
  TextField,
  Typography,
  IconButton, 
  useTheme,
  Chip
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  CalendarMonth as CalendarIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

interface DateRangeSelectorProps {
  startDate: Date | null;
  endDate: Date | null;
  onDateChange: (startDate: Date | null, endDate: Date | null) => void;
  onReset: () => void;
}

export default function DateRangeSelector({ 
  startDate, 
  endDate, 
  onDateChange, 
  onReset
}: DateRangeSelectorProps) {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [tempStartDate, setTempStartDate] = useState<Date | null>(startDate);
  const [tempEndDate, setTempEndDate] = useState<Date | null>(endDate);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
    setTempStartDate(startDate);
    setTempEndDate(endDate);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleApply = () => {
    onDateChange(tempStartDate, tempEndDate);
    handleClose();
  };

  const handleReset = () => {
    setTempStartDate(null);
    setTempEndDate(null);
    onReset();
    handleClose();
  };

  const formatDateRange = () => {
    if (startDate && endDate) {
      return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
    } else if (startDate) {
      return `From ${startDate.toLocaleDateString()}`;
    } else if (endDate) {
      return `Until ${endDate.toLocaleDateString()}`;
    } else {
      return 'All Time';
    }
  };

  // Predefined ranges
  const ranges = [
    {
      label: 'Today',
      setDates: () => {
        const today = new Date();
        setTempStartDate(today);
        setTempEndDate(today);
      }
    },
    {
      label: 'This Week',
      setDates: () => {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        setTempStartDate(startOfWeek);
        setTempEndDate(today);
      }
    },
    {
      label: 'Last 30 Days',
      setDates: () => {
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        setTempStartDate(thirtyDaysAgo);
        setTempEndDate(today);
      }
    },
    {
      label: 'This Month',
      setDates: () => {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        setTempStartDate(startOfMonth);
        setTempEndDate(today);
      }
    },
    {
      label: 'This Quarter',
      setDates: () => {
        const today = new Date();
        const currentQuarter = Math.floor(today.getMonth() / 3);
        const startOfQuarter = new Date(today.getFullYear(), currentQuarter * 3, 1);
        setTempStartDate(startOfQuarter);
        setTempEndDate(today);
      }
    },
    {
      label: 'This Year',
      setDates: () => {
        const today = new Date();
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        setTempStartDate(startOfYear);
        setTempEndDate(today);
      }
    }
  ];

  const open = Boolean(anchorEl);
  const id = open ? 'date-range-popover' : undefined;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
        <Button
          variant="outlined"
          size="small"
          onClick={handleClick}
          startIcon={<CalendarIcon />}
          sx={{ mr: 1 }}
        >
          Date Range
        </Button>
        
        {(startDate || endDate) && (
          <Chip 
            label={formatDateRange()}
            onDelete={onReset}
            color="primary"
            variant="outlined"
            size="small"
          />
        )}
        
        <Popover
          id={id}
          open={open}
          anchorEl={anchorEl}
          onClose={handleClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          PaperProps={{
            sx: { 
              width: 400, 
              p: 3,
              maxWidth: '100%'
            }
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">Select Date Range</Typography>
            <IconButton size="small" onClick={handleClose}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" gutterBottom>Predefined Ranges</Typography>
            <Stack direction="row" flexWrap="wrap" gap={1}>
              {ranges.map((range, index) => (
                <Chip 
                  key={index}
                  label={range.label}
                  onClick={() => range.setDates()}
                  variant="outlined"
                  size="small"
                  clickable
                />
              ))}
            </Stack>
          </Box>
          
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="body2" gutterBottom>Start Date</Typography>
              <DatePicker
                value={tempStartDate}
                onChange={(newDate) => setTempStartDate(newDate)}
                slotProps={{ 
                  textField: { 
                    fullWidth: true,
                    size: 'small'
                  } 
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="body2" gutterBottom>End Date</Typography>
              <DatePicker
                value={tempEndDate}
                onChange={(newDate) => setTempEndDate(newDate)}
                slotProps={{ 
                  textField: { 
                    fullWidth: true,
                    size: 'small' 
                  } 
                }}
                minDate={tempStartDate || undefined}
              />
            </Grid>
          </Grid>
          
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button onClick={handleReset}>
              Reset
            </Button>
            <Button 
              variant="contained" 
              onClick={handleApply}
              disabled={!tempStartDate && !tempEndDate}
            >
              Apply
            </Button>
          </Stack>
        </Popover>
      </Box>
    </LocalizationProvider>
  );
}