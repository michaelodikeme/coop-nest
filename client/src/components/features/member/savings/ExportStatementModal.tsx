import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Stack,
  Alert,
  Button,
  CircularProgress,
} from '@mui/material';

export interface ExportFilters {
  type: 'ALL' | 'SAVINGS' | 'SHARES';
  startDate?: string;
  endDate?: string;
}

interface ExportStatementModalProps {
  open: boolean;
  onClose: () => void;
  erpId: string;
  onExport: (filters: ExportFilters) => Promise<void>;
}

export const ExportStatementModal: React.FC<ExportStatementModalProps> = ({
  open,
  onClose,
  erpId,
  onExport
}) => {
  const [type, setType] = useState<'ALL' | 'SAVINGS' | 'SHARES'>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateError, setDateError] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const handleTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setType(event.target.value as 'ALL' | 'SAVINGS' | 'SHARES');
  };

  const handleStartDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(event.target.value);
    setDateError('');
  };

  const handleEndDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(event.target.value);
    setDateError('');
  };

  const validateDates = (): boolean => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (end < start) {
        setDateError('End date must be after start date');
        return false;
      }
    }

    return true;
  };

  const handleExport = async () => {
    if (!validateDates()) {
      return;
    }

    const filters: ExportFilters = {
      type,
      ...(startDate && { startDate }),
      ...(endDate && { endDate })
    };

    try {
      setIsExporting(true);
      await onExport(filters);
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleClose = () => {
    if (!isExporting) {
      // Reset form
      setType('ALL');
      setStartDate('');
      setEndDate('');
      setDateError('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Export Savings Statement</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          {/* Type Filter */}
          <FormControl component="fieldset">
            <FormLabel component="legend">Transaction Type</FormLabel>
            <RadioGroup value={type} onChange={handleTypeChange} sx={{ mt: 1 }}>
              <FormControlLabel
                value="ALL"
                control={<Radio />}
                label="All Transactions"
              />
              <FormControlLabel
                value="SAVINGS"
                control={<Radio />}
                label="Savings Only"
              />
              <FormControlLabel
                value="SHARES"
                control={<Radio />}
                label="Shares Only"
              />
            </RadioGroup>
          </FormControl>

          {/* Date Range */}
          <FormControl component="fieldset">
            <FormLabel component="legend">Date Range (Optional)</FormLabel>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Start Date"
                type="date"
                value={startDate}
                onChange={handleStartDateChange}
                InputLabelProps={{ shrink: true }}
                fullWidth
                size="small"
              />
              <TextField
                label="End Date"
                type="date"
                value={endDate}
                onChange={handleEndDateChange}
                InputLabelProps={{ shrink: true }}
                fullWidth
                size="small"
                error={!!dateError}
                helperText={dateError}
              />
            </Stack>
          </FormControl>

          {/* Info Alert */}
          <Alert severity="info">
            The statement will include only transactions matching your filter criteria.
            {(startDate || endDate) && ' The summary totals will be recalculated based on the filtered date range.'}
          </Alert>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={isExporting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleExport}
          disabled={isExporting}
          startIcon={isExporting && <CircularProgress size={16} />}
        >
          {isExporting ? 'Generating...' : 'Export PDF'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
