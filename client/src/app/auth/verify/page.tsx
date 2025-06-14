'use client';

import { Box, Container, Paper, Typography, Stepper, Step, StepLabel } from '@mui/material';
import BiodataVerificationForm from '@/components/organisms/auth/forms/BiodataVerificationForm';
import { useState } from 'react';

const steps = ['Verify Biodata', 'Create Account'];

export default function VerifyPage() {
  const [activeStep, setActiveStep] = useState(0);

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
            Member Verification
          </Typography>
          
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <BiodataVerificationForm 
            onStepComplete={() => setActiveStep(1)}
          />
        </Paper>
      </Box>
    </Container>
  );
}