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
  useTheme,
  Alert,
} from "@mui/material"
import { Work as WorkIcon } from "@mui/icons-material"

interface FormData {
  erpId: string
  ippisId: string
  staffNo: string
  department: string
  dateOfEmployment: string
  [key: string]: any
}

interface EmploymentInfoStepProps {
  formData: FormData
  updateFormData: (data: Partial<FormData>) => void
  errors: Record<string, string>
}

const departments = [
  "Administration",
  "Finance",
  "Human Resources",
  "Information Technology",
  "Operations",
  "Marketing",
  "Legal",
  "Procurement",
  "Audit",
  "Planning & Research",
]

export default function EmploymentInfoStep({ formData, updateFormData, errors }: EmploymentInfoStepProps) {
  const theme = useTheme()

  return (
    <Box>
      <Box sx={{ textAlign: "center", mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
          Employment Details
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Provide your work-related information
        </Typography>
      </Box>

      {/* Employee IDs */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <TextField
            fullWidth
            label="ERP ID"
            value={formData.erpId}
            onChange={(e) => updateFormData({ erpId: e.target.value })}
            error={!!errors.erpId}
            helperText={errors.erpId}
            required
            placeholder="Enter your ERP ID"
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
              },
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <TextField
            fullWidth
            label="IPPIS ID"
            value={formData.ippisId}
            onChange={(e) => updateFormData({ ippisId: e.target.value })}
            error={!!errors.ippisId}
            helperText={errors.ippisId}
            required
            placeholder="Enter your IPPIS ID"
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
              },
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <TextField
            fullWidth
            label="Staff Number"
            value={formData.staffNo}
            onChange={(e) => updateFormData({ staffNo: e.target.value })}
            error={!!errors.staffNo}
            helperText={errors.staffNo}
            required
            placeholder="Enter your staff number"
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
              },
            }}
          />
        </Grid>
      </Grid>

      {/* Department and Employment Date */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <FormControl fullWidth error={!!errors.department}>
            <InputLabel>Department *</InputLabel>
            <Select
              value={formData.department}
              onChange={(e) => updateFormData({ department: e.target.value })}
              label="Department *"
              sx={{
                borderRadius: 2,
              }}
            >
              {departments.map((dept) => (
                <MenuItem key={dept} value={dept}>
                  {dept}
                </MenuItem>
              ))}
            </Select>
            {errors.department && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                {errors.department}
              </Typography>
            )}
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="Date of Employment"
            type="date"
            value={formData.dateOfEmployment}
            onChange={(e) => updateFormData({ dateOfEmployment: e.target.value })}
            error={!!errors.dateOfEmployment}
            helperText={errors.dateOfEmployment}
            required
            InputLabelProps={{ shrink: true }}
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
        severity="info"
        icon={<WorkIcon />}
        sx={{
          borderRadius: 2,
          "& .MuiAlert-message": {
            width: "100%",
          },
        }}
      >
        <Typography variant="subtitle2" gutterBottom>
          Employment Information
        </Typography>
        <Typography variant="body2">
          Please ensure all employment details are accurate as they will be verified against official records. Your ERP
          ID and IPPIS ID are particularly important for membership processing.
        </Typography>
      </Alert>
    </Box>
  )
}
