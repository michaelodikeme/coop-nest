'use client';

import { Box, Typography, Paper } from '@mui/material';

export default function ReportsPage() {
  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Reports & Analytics
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Export data, view analytics, and generate custom reports.
        </Typography>
        {/* Add charts, tables, export buttons here */}
      </Paper>
    </Box>
  );
}