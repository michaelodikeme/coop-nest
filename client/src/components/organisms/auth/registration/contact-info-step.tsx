"use client"

import { Box, Typography, TextField, Grid, Alert, useTheme } from "@mui/material"
import { Phone as PhoneIcon } from "@mui/icons-material"

interface FormData {
  emailAddress: string
  phoneNumber: string
  residentialAddress: string
  [key: string]: any
}

interface ContactInfoStepProps {
  formData: FormData
  updateFormData: (data: Partial<FormData>) => void
  errors: Record<string, string>
}

export default function ContactInfoStep({ formData, updateFormData, errors }: ContactInfoStepProps) {
  const theme = useTheme()

  return (
    <Box>
      <Box sx={{ textAlign: "center", mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
          Contact Information
        </Typography>
        <Typography variant="body1" color="text.secondary">
          How can we reach you?
        </Typography>
      </Box>

      {/* Email and Phone */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="Email Address"
            type="email"
            value={formData.emailAddress}
            onChange={(e) => updateFormData({ emailAddress: e.target.value })}
            error={!!errors.emailAddress}
            helperText={errors.emailAddress}
            required
            placeholder="Enter your email address"
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
              },
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="Phone Number"
            type="tel"
            value={formData.phoneNumber}
            onChange={(e) => updateFormData({ phoneNumber: e.target.value })}
            error={!!errors.phoneNumber}
            helperText={errors.phoneNumber}
            required
            placeholder="Enter your phone number"
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
              },
            }}
          />
        </Grid>
      </Grid>

      {/* Residential Address */}
      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          label="Residential Address"
          multiline
          rows={4}
          value={formData.residentialAddress}
          onChange={(e) => updateFormData({ residentialAddress: e.target.value })}
          error={!!errors.residentialAddress}
          helperText={errors.residentialAddress}
          required
          placeholder="Enter your full residential address"
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
            },
          }}
        />
      </Box>

      {/* Info Box */}
      <Alert
        severity="success"
        icon={<PhoneIcon />}
        sx={{
          borderRadius: 2,
          "& .MuiAlert-message": {
            width: "100%",
          },
        }}
      >
        <Typography variant="subtitle2" gutterBottom>
          Contact Verification
        </Typography>
        <Typography variant="body2">
          We'll use this information to contact you about your membership application and important cooperative updates.
          Please ensure your contact details are current and accurate.
        </Typography>
      </Alert>
    </Box>
  )
}
