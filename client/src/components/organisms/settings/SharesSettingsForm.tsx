'use client';

import { useState } from 'react';
import { Box, Button, CircularProgress, TextField, Typography, Alert, Paper } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { savingsService } from '@/lib/api/services/savingsService';

interface SharesSettingsFormProps {
  initialData?: {
    amount: number;
    lastUpdated: string;
    updatedBy: string;
  };
  isLoading?: boolean;
}

export function SharesSettingsForm({ initialData, isLoading = false }: SharesSettingsFormProps) {
  const [amount, setAmount] = useState<string>(initialData?.amount.toString() || '');
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { mutate: updateShareAmount, isPending } = useMutation({
    mutationFn: async (newAmount: number) => {
      return await savingsService.updateShareAmount(newAmount);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'shares'] });
      setError(null);
    },
    onError: (error: any) => {
      setError(error?.message || 'Failed to update share amount. Please try again.');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid positive number');
      return;
    }
    
    updateShareAmount(numAmount);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Share Unit Price
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Set the default share unit price for members. This amount will be used for all share purchases.
        </Typography>
        
        <TextField
          label="Share Unit Price"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          type="number"
          inputProps={{ min: "0", step: "0.01" }}
          fullWidth
          sx={{ mb: 3 }}
          InputProps={{
            startAdornment: <Box component="span" sx={{ mr: 1 }}>$</Box>,
          }}
        />
        
        {initialData && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Last updated on: {new Date(initialData.lastUpdated).toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Updated by: {initialData.updatedBy}
            </Typography>
          </Box>
        )}
        
        <Button
          type="submit"
          variant="contained"
          disabled={isPending}
          sx={{ mt: 2 }}
        >
          {isPending ? <CircularProgress size={24} /> : 'Update Share Amount'}
        </Button>
      </Paper>
    </Box>
  );
}
