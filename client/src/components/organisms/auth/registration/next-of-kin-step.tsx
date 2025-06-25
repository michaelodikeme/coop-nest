"use client"

import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  useTheme,
} from "@mui/material"
import { Group as GroupIcon } from "@mui/icons-material"

interface FormData {
  nextOfKin: string
  relationshipOfNextOfKin: string
  nextOfKinPhoneNumber: string
  nextOfKinEmailAddress: string
  [key: string]: any
}

interface NextOfKinStepProps {
  formData: FormData
  updateFormData: (data: Partial<FormData>) => void
  errors: Record<string, string>
}

const relationships = [
  "Spouse",
  "Parent",
  "Child",
  "Sibling",
  "Grandparent",
  "Grandchild",
  "Uncle/Aunt",
  "Nephew/Niece",
  "Cousin",
  "Friend",
  "Other",
]

export default function NextOfKinStep({ formData, updateFormData, errors }: NextOfKinStepProps) {
  const theme = useTheme()

  return (
    <Box>
      <Box sx={{ textAlign: "center", mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
          Next of Kin Information
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Emergency contact person details
        </Typography>
      </Box>

      {/* Next of Kin Name and Relationship */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="Next of Kin Full Name"
            value={formData.nextOfKin}
            onChange={(e) => updateFormData({ nextOfKin: e.target.value })}
            error={!!errors.nextOfKin}
            helperText={errors.nextOfKin}
            required
            placeholder="Enter full name"
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
              },
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <FormControl fullWidth error={!!errors.relationshipOfNextOfKin}>
            <InputLabel>Relationship *</InputLabel>
            <Select
              value={formData.relationshipOfNextOfKin}
              onChange={(e) => updateFormData({ relationshipOfNextOfKin: e.target.value })}
              label="Relationship *"
              sx={{
                borderRadius: 2,
              }}
            >
              {relationships.map((relationship) => (
                <MenuItem key={relationship} value={relationship}>
                  {relationship}
                </MenuItem>
              ))}
            </Select>
            {errors.relationshipOfNextOfKin && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                {errors.relationshipOfNextOfKin}
              </Typography>
            )}
          </FormControl>
        </Grid>
      </Grid>

      {/* Contact Information */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="Phone Number"
            type="tel"
            value={formData.nextOfKinPhoneNumber}
            onChange={(e) => updateFormData({ nextOfKinPhoneNumber: e.target.value })}
            error={!!errors.nextOfKinPhoneNumber}
            helperText={errors.nextOfKinPhoneNumber}
            required
            placeholder="Enter phone number"
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
            label="Email Address"
            type="email"
            value={formData.nextOfKinEmailAddress}
            onChange={(e) => updateFormData({ nextOfKinEmailAddress: e.target.value })}
            error={!!errors.nextOfKinEmailAddress}
            helperText={errors.nextOfKinEmailAddress}
            required
            placeholder="Enter email address"
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
              },
            }}
          />
        </Grid>
      </Grid>

      {/* Info Box */}
      <Alert
        severity="warning"
        icon={<GroupIcon />}
        sx={{
          borderRadius: 2,
          "& .MuiAlert-message": {
            width: "100%",
          },
        }}
      >
        <Typography variant="subtitle2" gutterBottom>
          Next of Kin Information
        </Typography>
        <Typography variant="body2">
          Your next of kin will be contacted in case of emergencies or if we're unable to reach you directly. Please
          ensure they are aware of your cooperative membership application.
        </Typography>
      </Alert>
    </Box>
  )
}
