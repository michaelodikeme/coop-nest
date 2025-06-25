"use client"

import type React from "react"

import { Box, Typography, Card, CardContent, CardHeader, Grid, Chip, Alert, useTheme, Stack } from "@mui/material"
import {
  Person as PersonIcon,
  Work as WorkIcon,
  Phone as PhoneIcon,
  Group as GroupIcon,
  Info as InfoIcon,
} from "@mui/icons-material"

interface FormData {
  firstName: string
  middleName: string
  lastName: string
  dateOfBirth: string
  maritalStatus: string
  profilePhoto: File | null
  erpId: string
  ippisId: string
  staffNo: string
  department: string
  dateOfEmployment: string
  emailAddress: string
  phoneNumber: string
  residentialAddress: string
  nextOfKin: string
  relationshipOfNextOfKin: string
  nextOfKinPhoneNumber: string
  nextOfKinEmailAddress: string
}

interface ReviewStepProps {
  formData: FormData
  errors: Record<string, string>
}

export default function ReviewStep({ formData, errors }: ReviewStepProps) {
  const theme = useTheme()
  const fullName =
    `${formData.firstName} ${formData.middleName ? formData.middleName + " " : ""}${formData.lastName}`.trim()

  const InfoCard = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
    <Card
      sx={{
        borderRadius: 3,
        background: theme.palette.background.paper,
        boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      <CardHeader
        avatar={
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              bgcolor: theme.palette.primary.main,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
            }}
          >
            {icon}
          </Box>
        }
        title={
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
        }
        sx={{ pb: 1 }}
      />
      <CardContent sx={{ pt: 0 }}>{children}</CardContent>
    </Card>
  )

  const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <Box sx={{ mb: 2 }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, textTransform: "uppercase" }}>
        {label}
      </Typography>
      <Typography variant="body1" sx={{ mt: 0.5 }}>
        {value || "Not provided"}
      </Typography>
    </Box>
  )

  return (
    <Box>
      <Box sx={{ textAlign: "center", mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
          Review Your Application
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Please review all information before submitting
        </Typography>
      </Box>

      <Stack spacing={3}>
        {/* Personal Information */}
        <InfoCard title="Personal Information" icon={<PersonIcon />}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <InfoRow label="Full Name" value={fullName} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <InfoRow label="Date of Birth" value={formData.dateOfBirth} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <InfoRow label="Marital Status" value={formData.maritalStatus} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <InfoRow label="Profile Photo" value={formData.profilePhoto ? "Uploaded" : "Not uploaded"} />
            </Grid>
          </Grid>
        </InfoCard>

        {/* Employment Information */}
        <InfoCard title="Employment Details" icon={<WorkIcon />}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <InfoRow label="ERP ID" value={formData.erpId} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <InfoRow label="IPPIS ID" value={formData.ippisId} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <InfoRow label="Staff Number" value={formData.staffNo} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <InfoRow label="Department" value={formData.department} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <InfoRow label="Date of Employment" value={formData.dateOfEmployment} />
            </Grid>
          </Grid>
        </InfoCard>

        {/* Contact Information */}
        <InfoCard title="Contact Information" icon={<PhoneIcon />}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <InfoRow label="Email Address" value={formData.emailAddress} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <InfoRow label="Phone Number" value={formData.phoneNumber} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <InfoRow label="Residential Address" value={formData.residentialAddress} />
            </Grid>
          </Grid>
        </InfoCard>

        {/* Next of Kin Information */}
        <InfoCard title="Next of Kin Information" icon={<GroupIcon />}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <InfoRow label="Full Name" value={formData.nextOfKin} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <InfoRow label="Relationship" value={formData.relationshipOfNextOfKin} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <InfoRow label="Phone Number" value={formData.nextOfKinPhoneNumber} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <InfoRow label="Email Address" value={formData.nextOfKinEmailAddress} />
            </Grid>
          </Grid>
        </InfoCard>

        {/* Application Status Info */}
        <Alert
          severity="info"
          icon={<InfoIcon />}
          sx={{
            borderRadius: 2,
            "& .MuiAlert-message": {
              width: "100%",
            },
          }}
        >
          <Typography variant="subtitle2" gutterBottom>
            What happens next?
          </Typography>
          <Stack spacing={1}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="body2">• Your application will be submitted with a</Typography>
              <Chip label="PENDING" size="small" color="warning" />
              <Typography variant="body2">status</Typography>
            </Box>
            <Typography variant="body2">• A treasurer (Level 2 approver) will review your application</Typography>
            <Typography variant="body2">• You'll receive notifications about your application status</Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="body2">• Once approved, your membership status will become</Typography>
              <Chip label="ACTIVE" size="small" color="success" />
            </Box>
          </Stack>
        </Alert>
      </Stack>
    </Box>
  )
}
