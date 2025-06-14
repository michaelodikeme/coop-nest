import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ReplayIcon from '@mui/icons-material/Replay';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { Button } from '@/components/atoms/Button';
import PermissionGate from '@/components/atoms/PermissionGate';
import { Module } from '@/types/permissions.types';
import { formatCurrency } from '@/utils/formatting/format';
import { TransactionRecord } from '@/types/transaction.types';

interface TransactionDetailsModalProps {
  transaction: TransactionRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (id: string) => void;
  isApproving: boolean;
}

export const TransactionDetailsModal: React.FC<TransactionDetailsModalProps> = ({
  transaction,
  isOpen,
  onClose,
  onApprove,
  isApproving
}) => {
  if (!transaction) return null;

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 1,
          boxShadow: 3,
        }
      }}
    >
      <DialogTitle sx={{ 
        borderBottom: 1, 
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <Typography variant="h6" component="div" fontWeight={600}>
          Transaction Details
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          size="small"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ p: 2 }}>
          {/* Transaction Status Banner */}
          <Paper 
            elevation={0} 
            sx={{ 
              p: 2, 
              mb: 3, 
              bgcolor: 
                transaction.status === 'COMPLETED' ? 'success.light' :
                transaction.status === 'PENDING' ? 'warning.light' :
                transaction.status === 'FAILED' ? 'error.light' :
                'grey.100',
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {transaction.status === 'COMPLETED' && (
                <CheckCircleOutlineIcon color="success" sx={{ mr: 1 }} />
              )}
              {transaction.status === 'PENDING' && (
                <HourglassEmptyIcon color="warning" sx={{ mr: 1 }} />
              )}
              {transaction.status === 'FAILED' && (
                <ErrorOutlineIcon color="error" sx={{ mr: 1 }} />
              )}
              <Typography variant="subtitle1" fontWeight={500}>
                Transaction {transaction.status.toLowerCase()}
              </Typography>
            </Box>
            <Chip 
              label={transaction.status} 
              color={
                transaction.status === 'COMPLETED' ? 'success' :
                transaction.status === 'PENDING' ? 'warning' :
                transaction.status === 'FAILED' ? 'error' :
                'default'
              }
              size="small"
            />
          </Paper>

          {/* Transaction Reference Section */}
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Transaction Reference
              </Typography>
              <Typography variant="h6">
                {transaction.reference || transaction.id}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="caption" color="text.secondary">
                Date & Time
              </Typography>
              <Typography variant="body1">
                {new Date(transaction.createdAt).toLocaleString()}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Transaction Details - Main Information */}
          <Grid container spacing={3} sx={{ mb: 5 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                <Typography variant="caption" color="text.secondary">
                  Amount
                </Typography>
                <Typography variant="h5" component="div" fontWeight={600} sx={{ 
                  color: transaction.baseType === 'CREDIT' ? 'success.main' : 'error.main',
                  display: 'flex',
                  alignItems: 'center',
                  mt: 0.5
                }}>
                  {transaction.baseType === 'CREDIT' ? '+' : '-'}
                  {formatCurrency(transaction.amount)}
                </Typography>
                
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Transaction Type
                  </Typography>
                  <Typography variant="body1">
                    {transaction.transactionType.replace(/_/g, ' ')}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* Additional Information */}
          {transaction.description && (
            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
              <Typography variant="caption" color="text.secondary">
                Description
              </Typography>
              <Typography variant="body1">
                {transaction.description}
              </Typography>
            </Paper>
          )}

          {/* Related Information - could show related transactions or entities */}
          {transaction.relatedEntityId && (
            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
              <Typography variant="caption" color="text.secondary">
                Related Entity
              </Typography>
              <Typography variant="body1">
                {transaction.relatedEntityType}: {transaction.relatedEntityId}
              </Typography>
            </Paper>
          )}

          {/* Transaction Metadata - for technical details */}
          {transaction.metadata && Object.keys(transaction.metadata).length > 0 && (
            <Accordion variant="outlined" sx={{ mb: 3 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Technical Details</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <pre style={{ 
                  overflow: 'auto', 
                  background: '#f5f5f5', 
                  padding: 8, 
                  borderRadius: 4,
                  fontSize: '0.85rem' 
                }}>
                  {JSON.stringify(transaction.metadata, null, 2)}
                </pre>
              </AccordionDetails>
            </Accordion>
          )}

          <Divider sx={{ my: 3 }} />

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button variant="outlined" onClick={onClose}>
                Close
              </Button>
              {transaction.status === 'PENDING' && (
                <PermissionGate permissions={['APPROVE_TRANSACTIONS']} module={Module.TRANSACTION}>
                  <Button 
                    variant="contained"
                    color="success"
                    onClick={() => onApprove(transaction.id)}
                    disabled={isApproving}
                    startIcon={<CheckIcon />}
                  >
                    {isApproving ? 'Processing...' : 'Approve'}
                  </Button>
                </PermissionGate>
              )}
            </Box>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};