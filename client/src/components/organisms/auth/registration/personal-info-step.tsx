"use client"

import type React from "react"
import { useState, useRef } from "react"
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Avatar,
  Stack,
  Grid,
  Card,
  useTheme,
} from "@mui/material"
import { CloudUpload as CloudUploadIcon, Delete as DeleteIcon, Person as PersonIcon } from "@mui/icons-material"

interface FormData {
  firstName: string
  middleName: string
  lastName: string
  dateOfBirth: string
  maritalStatus: string
  profilePhoto: File | null
  [key: string]: any
}

interface PersonalInfoStepProps {
  formData: FormData
  updateFormData: (data: Partial<FormData>) => void
  errors: Record<string, string>
}

export default function PersonalInfoStep({ formData, updateFormData, errors }: PersonalInfoStepProps) {
  const theme = useTheme()
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      updateFormData({ profilePhoto: file })
      const reader = new FileReader()
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removePhoto = () => {
    updateFormData({ profilePhoto: null })
    setPhotoPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <Box>
      <Box sx={{ textAlign: "center", mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
          Personal Information
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Let's start with your basic personal details
        </Typography>
      </Box>

      {/* Profile Photo Upload */}
      <Card
        sx={{
          p: 3,
          mb: 4,
          textAlign: "center",
          background: `linear-gradient(135deg, ${theme.palette.primary.main}08, ${theme.palette.secondary.main}08)`,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Stack spacing={2} alignItems="center">
          <Avatar
            src={photoPreview || undefined}
            sx={{
              width: 100,
              height: 100,
              bgcolor: theme.palette.primary.main,
              fontSize: "2rem",
            }}
          >
            {!photoPreview && <PersonIcon fontSize="large" />}
          </Avatar>

          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<CloudUploadIcon />}
              onClick={() => fileInputRef.current?.click()}
              sx={{ textTransform: "none" }}
            >
              {photoPreview ? "Change Photo" : "Upload Photo"}
            </Button>

            {photoPreview && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={removePhoto}
                sx={{ textTransform: "none" }}
              >
                Remove
              </Button>
            )}
          </Stack>

          <Typography variant="caption" color="text.secondary">
            Optional - JPG, PNG up to 5MB
          </Typography>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            style={{ display: "none" }}
          />
        </Stack>
      </Card>

      {/* Name Fields */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <TextField
            fullWidth
            label="First Name"
            value={formData.firstName}
            onChange={(e) => updateFormData({ firstName: e.target.value })}
            error={!!errors.firstName}
            helperText={errors.firstName}
            required
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
            label="Middle Name"
            value={formData.middleName}
            onChange={(e) => updateFormData({ middleName: e.target.value })}
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
            label="Last Name"
            value={formData.lastName}
            onChange={(e) => updateFormData({ lastName: e.target.value })}
            error={!!errors.lastName}
            helperText={errors.lastName}
            required
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
              },
            }}
          />
        </Grid>
      </Grid>

      {/* Date of Birth and Marital Status */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="Date of Birth"
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => updateFormData({ dateOfBirth: e.target.value })}
            error={!!errors.dateOfBirth}
            helperText={errors.dateOfBirth}
            required
            InputLabelProps={{ shrink: true }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
              },
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <FormControl fullWidth>
            <InputLabel>Marital Status</InputLabel>
            <Select
              value={formData.maritalStatus}
              onChange={(e) => updateFormData({ maritalStatus: e.target.value })}
              label="Marital Status"
              sx={{
                borderRadius: 2,
              }}
            >
              <MenuItem value="single">Single</MenuItem>
              <MenuItem value="married">Married</MenuItem>
              <MenuItem value="divorced">Divorced</MenuItem>
              <MenuItem value="widowed">Widowed</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </Box>
  )
}