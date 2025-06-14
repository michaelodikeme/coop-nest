import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { bankAccountSchema } from '@/validations/memberSchema';
import type { BankAccount } from '@/types/account.types';
import { Button } from '@/components/atoms/Button';
import { Alert } from '@/components/atoms/Alert';
import { apiService } from '@/lib/api/apiService';
import {
  Paper,
  Grid,
  Typography,
  Divider,
  InputAdornment,
  CircularProgress,
  Box,
  Tooltip,
  IconButton,
} from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import NumbersIcon from '@mui/icons-material/Numbers';
import PersonIcon from '@mui/icons-material/Person';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

interface Bank {
  id: string;
  name: string;
  code: string;
}

interface BankAccountFormProps {
  onSubmit: (data: Omit<BankAccount, 'id' | 'isVerified'>) => void;
  isLoading?: boolean;
  error?: string;
  initialData?: Partial<BankAccount>;
}

const accountTypeOptions = [
  { value: 'SAVINGS', label: 'Savings Account' },
  { value: 'CURRENT', label: 'Current Account' },
];

export const BankAccountForm: React.FC<BankAccountFormProps> = ({
  onSubmit,
  isLoading,
  error,
  initialData,
}) => {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [bankLoading, setBankLoading] = useState(false);
  const [bankError, setBankError] = useState<string>();

  useEffect(() => {
    const fetchBanks = async () => {
      setBankLoading(true);
      try {
        const response = await apiService.get<Bank[]>('/banks');
        setBanks(response || []);
      } catch (err) {
        setBankError('Failed to load bank list');
        console.error(err);
      } finally {
        setBankLoading(false);
      }
    };
    fetchBanks();
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<Omit<BankAccount, 'id' | 'isVerified'>>({
    resolver: zodResolver(bankAccountSchema),
    defaultValues: initialData,
  });

  const accountNumber = watch('accountNumber');
  const bankId = watch('bankId');
  const selectedBank = banks.find(b => b.id === bankId);

  return (
    <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 4, bgcolor: 'background.paper' }}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Typography variant="h5" fontWeight={700} color="primary.main" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
          <AccountBalanceIcon sx={{ mr: 1 }} /> Bank Account Details
        </Typography>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 3 }}>
          Please provide accurate bank account information for this member.
        </Typography>
        <Divider sx={{ mb: 3 }} />

        {error && (
          <Alert variant="error" title="Error" message={error} sx={{ mb: 2 }} />
        )}
        {bankError && (
          <Alert variant="warning" title="Warning" message={bankError} sx={{ mb: 2 }} />
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Account Number <span style={{ color: '#FF5252' }}>*</span>
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <NumbersIcon sx={{ color: 'action.active', mr: 1 }} />
              <input
                type="text"
                {...register('accountNumber')}
                placeholder="Enter account number"
                className="MuiInputBase-input MuiOutlinedInput-input"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: errors.accountNumber ? '1.5px solid #FF5252' : '1.5px solid #E0E0E0',
                  outline: 'none',
                  fontSize: 16,
                }}
                maxLength={10}
              />
            </Box>
            {errors.accountNumber && (
              <Typography color="error" variant="caption">
                {errors.accountNumber.message}
              </Typography>
            )}
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Bank <span style={{ color: '#FF5252' }}>*</span>
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AccountBalanceIcon sx={{ color: 'action.active', mr: 1 }} />
              {bankLoading ? (
                <CircularProgress size={24} />
              ) : (
                <select
                  {...register('bankId')}
                  className="MuiInputBase-input MuiOutlinedInput-input"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: errors.bankId ? '1.5px solid #FF5252' : '1.5px solid #E0E0E0',
                    outline: 'none',
                    fontSize: 16,
                  }}
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select bank
                  </option>
                  {banks.map(bank => (
                    <option key={bank.id} value={bank.id}>
                      {bank.name}
                    </option>
                  ))}
                </select>
              )}
            </Box>
            {errors.bankId && (
              <Typography color="error" variant="caption">
                {errors.bankId.message}
              </Typography>
            )}
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Account Name <span style={{ color: '#FF5252' }}>*</span>
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <PersonIcon sx={{ color: 'action.active', mr: 1 }} />
              <input
                type="text"
                {...register('accountName')}
                placeholder="Enter account name"
                className="MuiInputBase-input MuiOutlinedInput-input"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: errors.accountName ? '1.5px solid #FF5252' : '1.5px solid #E0E0E0',
                  outline: 'none',
                  fontSize: 16,
                }}
              />
            </Box>
            {errors.accountName && (
              <Typography color="error" variant="caption">
                {errors.accountName.message}
              </Typography>
            )}
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              BVN <Tooltip title="Bank Verification Number (optional)">
                <InfoOutlinedIcon fontSize="small" color="action" sx={{ ml: 0.5 }} />
              </Tooltip>
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CreditCardIcon sx={{ color: 'action.active', mr: 1 }} />
              <input
                type="text"
                {...register('bvn')}
                placeholder="Enter BVN (optional)"
                className="MuiInputBase-input MuiOutlinedInput-input"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: errors.bvn ? '1.5px solid #FF5252' : '1.5px solid #E0E0E0',
                  outline: 'none',
                  fontSize: 16,
                }}
                maxLength={11}
              />
            </Box>
            {errors.bvn && (
              <Typography color="error" variant="caption">
                {errors.bvn.message}
              </Typography>
            )}
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Account Type <span style={{ color: '#FF5252' }}>*</span>
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <VerifiedUserIcon sx={{ color: 'action.active', mr: 1 }} />
              <select
                {...register('accountType')}
                className="MuiInputBase-input MuiOutlinedInput-input"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: errors.accountType ? '1.5px solid #FF5252' : '1.5px solid #E0E0E0',
                  outline: 'none',
                  fontSize: 16,
                }}
                defaultValue=""
              >
                <option value="" disabled>
                  Select account type
                </option>
                {accountTypeOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </Box>
            {errors.accountType && (
              <Typography color="error" variant="caption">
                {errors.accountType.message}
              </Typography>
            )}
          </Grid>

          <Grid item xs={12} sm={6} sx={{ display: 'flex', alignItems: 'center', mt: 3 }}>
            <input
              type="checkbox"
              id="isPrimary"
              {...register('isPrimary')}
              style={{ marginRight: 8, width: 18, height: 18 }}
            />
            <label htmlFor="isPrimary" style={{ fontWeight: 500, fontSize: 15 }}>
              Set as Primary Account
            </label>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Button
            type="button"
            variant="outlined"
            color="secondary"
            onClick={() => {
              if (accountNumber && selectedBank?.code) {
                alert(`Verification would be triggered for account ${accountNumber} at bank ${selectedBank.name}`);
              } else {
                alert('Please enter account number and select a bank first');
              }
            }}
            startIcon={<VerifiedUserIcon />}
          >
            Verify Account
          </Button>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              type="button"
              variant="outlined"
              color="secondary"
              onClick={() => window.history.back()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress size={20} color="inherit" /> : 'Save Account'}
            </Button>
          </Box>
        </Box>
      </form>
    </Paper>
  );
};
