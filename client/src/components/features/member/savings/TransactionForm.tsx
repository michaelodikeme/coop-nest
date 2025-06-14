import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Alert,
  Typography,
  InputAdornment,
  CircularProgress,
  Stack,
  useTheme
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { savingsService } from '@/lib/api';

import { TransactionFormData } from '@/types/financial.types';

interface TransactionFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  type?: 'deposit' | 'withdrawal';
  maxAmount?: number;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ 
  open, 
  onClose, 
  onSuccess, 
  type = 'deposit',
  maxAmount = 0
}) => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [transactionType, setTransactionType] = useState(type);
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Create transaction mutation
  const createMutation = useMutation({
    mutationFn: (data: TransactionFormData) => 
      transactionType === 'deposit' 
        ? savingsService.createSavingsEntry({
            memberId: '', // Will be determined by the backend based on the logged-in user
            amount: data.amount,
            type: data.type,
            reference: data.reference
          })
        : savingsService.createSavingsEntry({
            memberId: '', // Will be determined by the backend based on the logged-in user
            amount: data.amount,
            type: 'WITHDRAWAL',
            reference: data.reference
          }),    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['savings-summary'] });
      handleClose();
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: any) => {
      setError(error.message || 'Failed to process transaction');
    }
  });
  
  // Close form handler
  const handleClose = () => {
    setAmount('');
    setReference('');
    setError(null);
    onClose();
  };
    // Submit form handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const amountValue = parseFloat(amount);
    
    if (!amountValue || isNaN(amountValue) || amountValue <= 0) {
      setError('Please enter a valid amount greater than zero');
      return;
    }
    
    // For withdrawal, check if amount is within allowed limit
    if (transactionType === 'withdrawal' && amountValue > maxAmount) {
      setError(`Withdrawal amount exceeds available balance of ${new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(maxAmount)}`);
      return;
    }
    
    createMutation.mutate({
      amount: amountValue,
      type: transactionType.toUpperCase(),
      reference: reference || undefined
    });
  };
  
  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        {transactionType === 'deposit' ? 'Make a Deposit' : 'Request a Withdrawal'}
      </DialogTitle>
      
      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <FormControl component="fieldset" sx={{ mb: 2 }}>
            <FormLabel component="legend">Transaction Type</FormLabel>
            <RadioGroup
              row
              value={transactionType}
              onChange={(e) => setTransactionType(e.target.value as 'deposit' | 'withdrawal')}
            >
              <FormControlLabel value="deposit" control={<Radio />} label="Deposit" />
              <FormControlLabel value="withdrawal" control={<Radio />} label="Withdrawal" />
            </RadioGroup>
          </FormControl>
          
          <TextField
            label="Amount"
            fullWidth
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="number"
            margin="normal"
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
          />
          
          <TextField
            label="Reference/Description"
            fullWidth
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            margin="normal"
            placeholder="Optional: e.g. Monthly contribution, Emergency fund, etc."
          />
          
          {transactionType === 'withdrawal' && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                Withdrawal requests are subject to approval and processing time. Please see the 
                Withdrawals tab for the status of your requests.
              </Typography>
            </Alert>
          )}
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Stack direction="row" spacing={1}>
          <Button onClick={handleClose} disabled={createMutation.isPending}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={createMutation.isPending}
            startIcon={createMutation.isPending ? <CircularProgress size={20} /> : undefined}
          >
            {createMutation.isPending
              ? 'Processing...'
              : transactionType === 'deposit'
                ? 'Make Deposit'
                : 'Request Withdrawal'}
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
};

export default TransactionForm;
