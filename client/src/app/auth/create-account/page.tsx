'use client';

import { Box, Container, Paper, Typography } from '@mui/material';
import AccountCreationForm from '@/components/organisms/auth/forms/AccountCreationForm';

export default function CreateAccountPage() {
  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            borderRadius: 2,
          }}
        >
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Create Your Account
          </Typography>

          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 4 }}>
            You're almost done! Create your login credentials to access your member account.
          </Typography>

          <AccountCreationForm />
        </Paper>
      </Box>
    </Container>
  );
}
