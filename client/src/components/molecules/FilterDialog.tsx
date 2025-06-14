import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  SelectChangeEvent,
  IconButton,
  Box,
  Typography,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

interface FilterOption {
  value: string;
  label: string;
}

export interface FilterDialogProps {
  open: boolean;
  onClose: () => void;
  onApply: (filters: Record<string, any>) => void;
  filterOptions?: {
    department?: FilterOption[];
    membershipStatus?: FilterOption[];
    verificationStatus?: FilterOption[];
    [key: string]: FilterOption[] | undefined;
  };
  currentFilters: Record<string, any>;
}

/**
 * A reusable filter dialog component for configuring data filtering
 */
export const FilterDialog: React.FC<FilterDialogProps> = ({
  open,
  onClose,
  onApply,
  filterOptions = {},
  currentFilters,
}) => {
  // Create a local state for filter values
  const [filters, setFilters] = useState<Record<string, any>>({ ...currentFilters });

  // Handle filter change
  const handleFilterChange = (name: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Reset filters
  const handleReset = () => {
    const emptyFilters: Record<string, string> = {};
    
    // Initialize all filter keys with empty values
    Object.keys(filterOptions).forEach(key => {
      emptyFilters[key] = '';
    });
    
    setFilters(emptyFilters);
  };

  // Apply filters and close dialog
  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      fullWidth 
      maxWidth="sm"
      aria-labelledby="filter-dialog-title"
    >
      <DialogTitle id="filter-dialog-title">
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Filter Options</Typography>
          <IconButton edge="end" color="inherit" onClick={onClose} aria-label="close">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <Grid container spacing={2}>
          {/* Search filter */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Search"
              variant="outlined"
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search by name, ID, email..."
              size="small"
            />
          </Grid>
          
          {/* Department filter */}
          {filterOptions.department && (
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel id="department-filter-label">Department</InputLabel>
                <Select
                  labelId="department-filter-label"
                  id="department-filter"
                  value={filters.department || ''}
                  label="Department"
                  onChange={(e: SelectChangeEvent) => handleFilterChange('department', e.target.value)}
                >
                  <MenuItem value="">All Departments</MenuItem>
                  {filterOptions.department.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}
          
          {/* Membership status filter */}
          {filterOptions.membershipStatus && (
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel id="status-filter-label">Membership Status</InputLabel>
                <Select
                  labelId="status-filter-label"
                  id="status-filter"
                  value={filters.membershipStatus || ''}
                  label="Membership Status"
                  onChange={(e: SelectChangeEvent) => handleFilterChange('membershipStatus', e.target.value)}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  {filterOptions.membershipStatus.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}
          
          {/* Verification status filter */}
          {filterOptions.verificationStatus && (
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel id="verification-filter-label">Verification Status</InputLabel>
                <Select
                  labelId="verification-filter-label"
                  id="verification-filter"
                  value={filters.verificationStatus || ''}
                  label="Verification Status"
                  onChange={(e: SelectChangeEvent) => handleFilterChange('verificationStatus', e.target.value)}
                >
                  <MenuItem value="">All Verification Statuses</MenuItem>
                  {filterOptions.verificationStatus.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleReset} color="inherit">
          Reset
        </Button>
        <Button onClick={handleApply} variant="contained" color="primary">
          Apply Filters
        </Button>
      </DialogActions>
    </Dialog>
  );
};
