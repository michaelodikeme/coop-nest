import * as React from 'react';
import { Box, TextField } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

interface DateRangePickerProps {
  value: [Date | null, Date | null];
  onChange: (value: [Date | null, Date | null]) => void;
  size?: 'small' | 'medium';
}

export default function DateRangePicker({ value, onChange, size = 'medium' }: DateRangePickerProps) {
  const [startDate, endDate] = value;

  const handleStartDateChange = (newValue: Date | null) => {
    onChange([newValue, endDate]);
  };

  const handleEndDateChange = (newValue: Date | null) => {
    onChange([startDate, newValue]);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <DatePicker
          label="Start Date"
          value={startDate}
          onChange={handleStartDateChange}
          slotProps={{ 
            textField: { 
              size, 
              fullWidth: true,
              InputLabelProps: { shrink: true } 
            } 
          }}
        />
        <DatePicker
          label="End Date"
          value={endDate}
          onChange={handleEndDateChange}
          minDate={startDate || undefined}
          slotProps={{ 
            textField: { 
              size, 
              fullWidth: true,
              InputLabelProps: { shrink: true } 
            } 
          }}
        />
      </Box>
    </LocalizationProvider>
  );
}