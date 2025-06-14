import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Button,
  Typography,
  Box,
  CircularProgress,
  Divider,
  useTheme,
} from '@mui/material';
import {
  FileDownload as FileDownloadIcon,
  PictureAsPdf as PdfIcon,
  TableChart as TableIcon,
  InsertDriveFile as ExcelIcon,
} from '@mui/icons-material';
import { transactionService } from '@/lib/api/services/transactionService';
import { filterTransactions } from '@/utils/filtering/filterTransactions';

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  entityType: string;
  filters: Record<string, any>;
}

/**
 * A dialog component for configuring data export options
 */
export default function ExportDialog({
  open,
  onClose,
  title,
  entityType,
  filters,
}: ExportDialogProps) {
  const theme = useTheme();
  const [format, setFormat] = useState<'pdf' | 'excel' | 'csv'>('excel');
  const [isExporting, setIsExporting] = useState(false);

  const handleFormatChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormat(event.target.value as 'pdf' | 'excel' | 'csv');
  };

  // Update the handleExport function to work with client-side data
  const handleExport = async () => {
    setIsExporting(true);

    try {
      // Instead of calling the API, generate a client-side export
      // This is a simplified example - in a real implementation, you'd use a library
      // like jspdf, xlsx, or file-saver to create the actual files

      // Fetch the data
      const response = await transactionService.getUserTransactions();
      const allTransactions = response.data;

      // Apply filters
      const filteredData = filterTransactions(allTransactions, filters);

      // Convert to appropriate format
      let exportData: string;

      if (format === 'csv') {
        // Convert to CSV
        const headers =
          'ID,Date,Type,Amount,Status,Module,Description\n';
        const rows = filteredData
          .map(
            (tx) =>
              `${tx.id},"${new Date(tx.createdAt).toLocaleString()}",${tx.transactionType},${tx.amount},${tx.status},${tx.module},"${
                tx.description || ''
              }"`
          )
          .join('\n');
        exportData = headers + rows;

        // Create and download file
        const blob = new Blob([exportData], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `transactions_${new Date()
          .toISOString()
          .split('T')[0]}.csv`;
        link.click();
      } else {
        // For PDF and Excel, you'd typically use libraries like jspdf, xlsx
        alert(`Export to ${format} would be implemented with a proper library`);
      }

      onClose();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const formatIcon = () => {
    switch (format) {
      case 'pdf':
        return <PdfIcon fontSize="large" sx={{ color: '#F40F02' }} />;
      case 'excel':
        return <ExcelIcon fontSize="large" sx={{ color: '#1D6F42' }} />;
      case 'csv':
        return <TableIcon fontSize="large" sx={{ color: '#2C7FB8' }} />;
    }
  };

  return (
    <Dialog open={open} onClose={isExporting ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>{title}</DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 3 }}>
        <Typography variant="body2" paragraph>
          Choose the format to export your {entityType}:
        </Typography>

        <FormControl component="fieldset">
          <RadioGroup value={format} onChange={handleFormatChange}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                mb: 1,
                p: 1,
                borderRadius: 1,
                border: `1px solid ${
                  format === 'excel' ? theme.palette.primary.main : theme.palette.divider
                }`,
                bgcolor: format === 'excel' ? `${theme.palette.primary.main}10` : 'transparent',
              }}
            >
              <FormControlLabel
                value="excel"
                control={<Radio />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <ExcelIcon sx={{ mr: 1, color: '#1D6F42' }} />
                    <Typography>Excel (.xlsx)</Typography>
                  </Box>
                }
              />
            </Box>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                mb: 1,
                p: 1,
                borderRadius: 1,
                border: `1px solid ${
                  format === 'pdf' ? theme.palette.primary.main : theme.palette.divider
                }`,
                bgcolor: format === 'pdf' ? `${theme.palette.primary.main}10` : 'transparent',
              }}
            >
              <FormControlLabel
                value="pdf"
                control={<Radio />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <PdfIcon sx={{ mr: 1, color: '#F40F02' }} />
                    <Typography>PDF (.pdf)</Typography>
                  </Box>
                }
              />
            </Box>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                mb: 1,
                p: 1,
                borderRadius: 1,
                border: `1px solid ${
                  format === 'csv' ? theme.palette.primary.main : theme.palette.divider
                }`,
                bgcolor: format === 'csv' ? `${theme.palette.primary.main}10` : 'transparent',
              }}
            >
              <FormControlLabel
                value="csv"
                control={<Radio />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TableIcon sx={{ mr: 1, color: '#2C7FB8' }} />
                    <Typography>CSV (.csv)</Typography>
                  </Box>
                }
              />
            </Box>
          </RadioGroup>
        </FormControl>

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, mb: 1 }}>{formatIcon()}</Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={isExporting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleExport}
          disabled={isExporting}
          startIcon={isExporting ? <CircularProgress size={16} /> : <FileDownloadIcon />}
        >
          {isExporting ? 'Exporting...' : 'Export'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
