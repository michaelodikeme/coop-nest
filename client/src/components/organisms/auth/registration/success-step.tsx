"use client"

import type React from "react"

import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Button,
  Stack,
  Avatar,
  useTheme,
  Divider,
  Paper,
} from "@mui/material"
import {
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Notifications as NotificationsIcon,
  Home as HomeIcon,
  Support as SupportIcon,
} from "@mui/icons-material"
import Link from "next/link"

export default function SuccessStep() {
  const theme = useTheme()

  const TimelineStep = ({
    icon,
    title,
    description,
    isCompleted = false,
    isActive = false,
    isLast = false,
  }: {
    icon: React.ReactNode
    title: string
    description: string
    isCompleted?: boolean
    isActive?: boolean
    isLast?: boolean
  }) => (
    <Box sx={{ display: "flex", alignItems: "flex-start", mb: isLast ? 0 : 3 }}>
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mr: 3 }}>
        <Avatar
          sx={{
            width: 40,
            height: 40,
            bgcolor: isCompleted
              ? theme.palette.success.main
              : isActive
                ? theme.palette.warning.main
                : theme.palette.grey[400],
            color: "white",
          }}
        >
          {icon}
        </Avatar>
        {!isLast && (
          <Box
            sx={{
              width: 2,
              height: 40,
              bgcolor: theme.palette.grey[300],
              mt: 1,
            }}
          />
        )}
      </Box>
      <Box sx={{ flex: 1, pt: 1 }}>
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 600,
            color: isCompleted || isActive ? "text.primary" : "text.secondary",
          }}
        >
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {description}
        </Typography>
      </Box>
    </Box>
  )

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: `linear-gradient(135deg, ${theme.palette.success.main}15, ${theme.palette.success.light}15)`,
        py: 4,
      }}
    >
      <Container maxWidth="md">
        <Card
          sx={{
            borderRadius: 4,
            background: theme.palette.background.paper,
            backdropFilter: "blur(10px)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
          }}
        >
          <CardHeader
            sx={{
              textAlign: "center",
              pb: 2,
            }}
            avatar={
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: theme.palette.success.main,
                  mx: "auto",
                  mb: 2,
                }}
              >
                <CheckCircleIcon sx={{ fontSize: 40 }} />
              </Avatar>
            }
            title={
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: theme.palette.success.main,
                  mt: 2,
                }}
              >
                Application Submitted Successfully!
              </Typography>
            }
          />

          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: "center", mb: 4 }}>
              <Typography variant="body1" color="text.secondary">
                Thank you for applying to join our cooperative. Your membership application has been received and is now
                under review.
              </Typography>
            </Box>

            {/* Status Timeline */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                mb: 4,
                bgcolor: theme.palette.grey[50],
                borderRadius: 2,
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                Application Status
              </Typography>

              <TimelineStep
                icon={<CheckCircleIcon sx={{ fontSize: 20 }} />}
                title="Application Submitted"
                description="Your application has been successfully submitted"
                isCompleted={true}
              />

              <TimelineStep
                icon={<ScheduleIcon sx={{ fontSize: 20 }} />}
                title="Pending Review"
                description="Awaiting approval from treasurer (Level 2 approver)"
                isActive={true}
              />

              <TimelineStep
                icon={<NotificationsIcon sx={{ fontSize: 20 }} />}
                title="Approval Notification"
                description="You'll be notified once your application is approved"
                isLast={true}
              />
            </Paper>

            {/* Next Steps */}
            <Card
              sx={{
                mb: 4,
                background: `linear-gradient(135deg, ${theme.palette.info.main}08, ${theme.palette.info.light}08)`,
                border: `1px solid ${theme.palette.info.light}`,
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: theme.palette.info.main }}>
                  What's Next?
                </Typography>
                <Stack spacing={1}>
                  <Typography variant="body2">• Check your email for confirmation and updates</Typography>
                  <Typography variant="body2">• Your application will be reviewed within 3-5 business days</Typography>
                  <Typography variant="body2">• You'll receive notifications about any status changes</Typography>
                  <Typography variant="body2">• Once approved, you can access all member benefits</Typography>
                </Stack>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 4 }}>
              <Button
                component={Link}
                href="/"
                variant="contained"
                startIcon={<HomeIcon />}
                fullWidth
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: "none",
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                }}
              >
                Return to Home
              </Button>
              <Button
                component={Link}
                href="/contact"
                variant="outlined"
                startIcon={<SupportIcon />}
                fullWidth
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: "none",
                }}
              >
                Contact Support
              </Button>
            </Stack>

            {/* Reference Information */}
            <Divider sx={{ mb: 3 }} />
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">
                Application Reference:{" "}
                <Typography component="span" sx={{ fontFamily: "monospace", fontWeight: 600 }}>
                  APP-{Date.now().toString().slice(-8)}
                </Typography>
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                Keep this reference number for your records
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  )
}
