"use client"

import React, { useState } from "react"
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  useTheme,
  LinearProgress,
  Fade,
  Alert,
  AlertTitle,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material"
import {
  Person as PersonIcon,
  Work as WorkIcon,
  Phone as PhoneIcon,
  Group as GroupIcon,
  CheckCircle as CheckCircleIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
} from "@mui/icons-material"
import PersonalInfoStep from "@/components/organisms/auth/registration/personal-info-step"
import EmploymentInfoStep from "@/components/organisms/auth/registration/employment-info-step"
import ContactInfoStep from "@/components/organisms/auth/registration/contact-info-step"
import NextOfKinStep from "@/components/organisms/auth/registration/next-of-kin-step"
import ReviewStep from "@/components/organisms/auth/registration/review-step"
import SuccessStep from "@/components/organisms/auth/registration/success-step"

// Add these imports at the top
import { useMemberRegistration, type MemberRegistrationData } from "@/lib/hooks/member/useMemberRegistration"
import { getFieldDisplayName } from "@/lib/utils/errorUtils"

interface FormData {
  // Personal Information
  firstName: string
  middleName: string
  lastName: string
  dateOfBirth: string
  maritalStatus: string
  profilePhoto: File | null

  // Employment Information
  erpId: string
  ippisId: string
  staffNo: string
  department: string
  dateOfEmployment: string

  // Contact Information
  emailAddress: string
  phoneNumber: string
  residentialAddress: string

  // Next of Kin Information
  nextOfKin: string
  relationshipOfNextOfKin: string
  nextOfKinPhoneNumber: string
  nextOfKinEmailAddress: string
}

const initialFormData: FormData = {
  firstName: "",
  middleName: "",
  lastName: "",
  dateOfBirth: "",
  maritalStatus: "",
  profilePhoto: null,
  erpId: "",
  ippisId: "",
  staffNo: "",
  department: "",
  dateOfEmployment: "",
  emailAddress: "",
  phoneNumber: "",
  residentialAddress: "",
  nextOfKin: "",
  relationshipOfNextOfKin: "",
  nextOfKinPhoneNumber: "",
  nextOfKinEmailAddress: "",
}

const steps = [
  { label: "Personal Information", icon: PersonIcon, description: "Basic personal details" },
  { label: "Employment Details", icon: WorkIcon, description: "Work-related information" },
  { label: "Contact Information", icon: PhoneIcon, description: "Contact details" },
  { label: "Next of Kin", icon: GroupIcon, description: "Emergency contact" },
  { label: "Review & Submit", icon: CheckCircleIcon, description: "Confirm your details" },
]

export default function RegisterPage() {
  const theme = useTheme()
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string>("")
  const [serverFieldErrors, setServerFieldErrors] = useState<Record<string, string>>({})

  const updateFormData = (data: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...data }))
    // Clear errors for updated fields
    const updatedFields = Object.keys(data)
    setErrors((prev) => {
      const newErrors = { ...prev }
      updatedFields.forEach((field) => delete newErrors[field])
      return newErrors
    })
    // Clear server field errors for updated fields
    setServerFieldErrors((prev) => {
      const newErrors = { ...prev }
      updatedFields.forEach((field) => delete newErrors[field])
      return newErrors
    })
    // Clear submit error when user makes changes
    if (submitError) {
      setSubmitError("")
    }
  }

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}

    switch (step) {
      case 0:
        if (!formData.firstName.trim()) newErrors.firstName = "First name is required"
        if (!formData.lastName.trim()) newErrors.lastName = "Last name is required"
        if (!formData.dateOfBirth) newErrors.dateOfBirth = "Date of birth is required"
        break
      case 1:
        if (!formData.erpId.trim()) newErrors.erpId = "ERP ID is required"
        if (!formData.ippisId.trim()) newErrors.ippisId = "IPPIS ID is required"
        if (!formData.staffNo.trim()) newErrors.staffNo = "Staff number is required"
        if (!formData.department.trim()) newErrors.department = "Department is required"
        if (!formData.dateOfEmployment) newErrors.dateOfEmployment = "Date of employment is required"
        break
      case 2:
        if (!formData.emailAddress.trim()) newErrors.emailAddress = "Email address is required"
        if (!formData.phoneNumber.trim()) newErrors.phoneNumber = "Phone number is required"
        if (!formData.residentialAddress.trim()) newErrors.residentialAddress = "Residential address is required"
        if (formData.emailAddress && !/\S+@\S+\.\S+/.test(formData.emailAddress)) {
          newErrors.emailAddress = "Please enter a valid email address"
        }
        break
      case 3:
        if (!formData.nextOfKin.trim()) newErrors.nextOfKin = "Next of kin name is required"
        if (!formData.relationshipOfNextOfKin.trim()) newErrors.relationshipOfNextOfKin = "Relationship is required"
        if (!formData.nextOfKinPhoneNumber.trim())
          newErrors.nextOfKinPhoneNumber = "Next of kin phone number is required"
        if (!formData.nextOfKinEmailAddress.trim()) newErrors.nextOfKinEmailAddress = "Next of kin email is required"
        if (formData.nextOfKinEmailAddress && !/\S+@\S+\.\S+/.test(formData.nextOfKinEmailAddress)) {
          newErrors.nextOfKinEmailAddress = "Please enter a valid email address"
        }
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateAllSteps = (): boolean => {
    // Validate all steps before final submission
    return [0, 1, 2, 3].every((step) => validateStep(step))
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))
    }
  }

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }

  // Updated registration hook with enhanced error handling
  const memberRegistration = useMemberRegistration({
    onSuccess: (data) => {
      console.log("Registration successful:", data)
      setSubmitError("") // Clear any previous errors
      setServerFieldErrors({}) // Clear field errors
      setIsSubmitted(true)
    },
    onError: (error, formattedError) => {
      console.error("Registration failed:", error)
      console.log("Formatted error received:", formattedError)

      // Set the main error message
      setSubmitError(formattedError.message)

      // Set field-specific errors from server validation
      if (formattedError.hasFieldErrors) {
        setServerFieldErrors(formattedError.fieldErrors)

        // Navigate to the first step that has errors
        const fieldToStepMap: Record<string, number> = {
          firstName: 0,
          middleName: 0,
          lastName: 0,
          dateOfBirth: 0,
          maritalStatus: 0,
          erpId: 1,
          ippisId: 1,
          staffNo: 1,
          department: 1,
          dateOfEmployment: 1,
          emailAddress: 2,
          phoneNumber: 2,
          residentialAddress: 2,
          nextOfKin: 3,
          relationshipOfNextOfKin: 3,
          nextOfKinPhoneNumber: 3,
          nextOfKinEmailAddress: 3,
        }

        const errorFields = Object.keys(formattedError.fieldErrors)
        const stepsWithErrors = errorFields.map((field) => fieldToStepMap[field]).filter((step) => step !== undefined)

        if (stepsWithErrors.length > 0) {
          const firstErrorStep = Math.min(...stepsWithErrors)
          setCurrentStep(firstErrorStep)
        }
      }
    },
  })

  const handleSubmit = async () => {
    // Clear previous errors
    setSubmitError("")
    setServerFieldErrors({})

    // Validate all steps before submission
    if (!validateAllSteps()) {
      // Find first step with errors and navigate to it
      for (let i = 0; i < 4; i++) {
        if (!validateStep(i)) {
          setCurrentStep(i)
          return
        }
      }
      return
    }

    // Prepare complete form data for submission using the proper interface
    const submissionData: MemberRegistrationData = {
      // Personal Information
      firstName: formData.firstName,
      middleName: formData.middleName || undefined,
      lastName: formData.lastName,
      // dateOfBirth: formData.dateOfBirth,
      // maritalStatus: formData.maritalStatus || undefined,

      // Employment Information
      dateOfEmployment: formData.dateOfEmployment, // Keep as string, backend will parse
      erpId: formData.erpId,
      ippisId: formData.ippisId,
      staffNo: formData.staffNo,
      department: formData.department,

      // Contact Information
      residentialAddress: formData.residentialAddress,
      emailAddress: formData.emailAddress,
      phoneNumber: formData.phoneNumber,

      // Next of Kin Information
      nextOfKin: formData.nextOfKin,
      relationshipOfNextOfKin: formData.relationshipOfNextOfKin,
      nextOfKinPhoneNumber: formData.nextOfKinPhoneNumber,
      nextOfKinEmailAddress: formData.nextOfKinEmailAddress,

      // Profile Photo (if implemented)
      profilePhoto: formData.profilePhoto ? "uploaded-photo-path" : undefined,
    }

    // Use the mutation instead of direct fetch
    memberRegistration.mutate(submissionData)
  }

  // Combine client-side and server-side errors for display
  const combinedErrors = { ...errors, ...serverFieldErrors }

  const progress = ((currentStep + 1) / steps.length) * 100

  if (isSubmitted) {
    return <SuccessStep />
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: `linear-gradient(135deg, ${theme.palette.primary.main}15, ${theme.palette.secondary.main}15)`,
        py: 4,
      }}
    >
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ textAlign: "center", mb: 6 }}>
          <Typography
            variant="h3"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 700,
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              mb: 2,
            }}
          >
            Join Our Cooperative
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Complete your membership application in a few simple steps
          </Typography>
        </Box>

        {/* Progress Stepper */}
        <Card
          sx={{
            mb: 4,
            borderRadius: 4,
            background: theme.palette.background.paper,
            backdropFilter: "blur(10px)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Stepper
              activeStep={currentStep}
              alternativeLabel
              sx={{
                "& .MuiStepLabel-root .Mui-completed": {
                  color: theme.palette.success.main,
                },
                "& .MuiStepLabel-root .Mui-active": {
                  color: theme.palette.primary.main,
                },
              }}
            >
              {steps.map((step, index) => (
                <Step key={step.label}>
                  <StepLabel
                    StepIconComponent={({ active, completed }) => (
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          bgcolor: completed
                            ? theme.palette.success.main
                            : active
                              ? theme.palette.primary.main
                              : theme.palette.grey[300],
                          color: "white",
                          transition: "all 0.3s ease",
                          transform: active ? "scale(1.1)" : "scale(1)",
                        }}
                      >
                        {completed ? <CheckCircleIcon /> : React.createElement(step.icon, { fontSize: "small" })}
                      </Box>
                    )}
                  >
                    <Typography variant="subtitle2" sx={{ mt: 1, fontWeight: 600 }}>
                      {step.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {step.description}
                    </Typography>
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                mt: 3,
                height: 6,
                borderRadius: 3,
                bgcolor: theme.palette.grey[200],
                "& .MuiLinearProgress-bar": {
                  borderRadius: 3,
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                },
              }}
            />
          </CardContent>
        </Card>

        {/* Form Card */}
        <Card
          sx={{
            borderRadius: 4,
            background: theme.palette.background.paper,
            backdropFilter: "blur(10px)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
            overflow: "visible",
          }}
        >
          <CardContent sx={{ p: 6 }}>
            <Fade in={true} timeout={500}>
              <Box>
                {/* Error Alert - Show at the top of the form */}
                {submitError && (
                  <Alert
                    severity="error"
                    icon={<ErrorIcon />}
                    sx={{
                      mb: 4,
                      borderRadius: 2,
                      "& .MuiAlert-message": {
                        width: "100%",
                      },
                    }}
                  >
                    <AlertTitle>Registration Error</AlertTitle>
                    {submitError}

                    {/* Show field-specific errors if they exist */}
                    {Object.keys(serverFieldErrors).length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                          Please fix the following issues:
                        </Typography>
                        <List dense sx={{ py: 0 }}>
                          {Object.entries(serverFieldErrors).map(([field, message]) => (
                            <ListItem key={field} sx={{ py: 0.5, px: 0 }}>
                              <ListItemIcon sx={{ minWidth: 32 }}>
                                <WarningIcon color="error" fontSize="small" />
                              </ListItemIcon>
                              <ListItemText
                                primary={`${getFieldDisplayName(field)}: ${message}`}
                                primaryTypographyProps={{ variant: "body2" }}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}
                  </Alert>
                )}

                {/* Step Content */}
                {currentStep === 0 && (
                  <PersonalInfoStep formData={formData} updateFormData={updateFormData} errors={combinedErrors} />
                )}
                {currentStep === 1 && (
                  <EmploymentInfoStep formData={formData} updateFormData={updateFormData} errors={combinedErrors} />
                )}
                {currentStep === 2 && (
                  <ContactInfoStep formData={formData} updateFormData={updateFormData} errors={combinedErrors} />
                )}
                {currentStep === 3 && (
                  <NextOfKinStep formData={formData} updateFormData={updateFormData} errors={combinedErrors} />
                )}
                {currentStep === 4 && <ReviewStep formData={formData} errors={combinedErrors} />}

                {/* Navigation Buttons */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    pt: 4,
                    borderTop: `1px solid ${theme.palette.divider}`,
                    mt: 4,
                  }}
                >
                  <Button
                    variant="outlined"
                    onClick={handlePrevious}
                    disabled={currentStep === 0}
                    startIcon={<ArrowBackIcon />}
                    sx={{
                      px: 4,
                      py: 1.5,
                      borderRadius: 2,
                      textTransform: "none",
                    }}
                  >
                    Previous
                  </Button>

                  {currentStep < 4 ? (
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      endIcon={<ArrowForwardIcon />}
                      sx={{
                        px: 4,
                        py: 1.5,
                        borderRadius: 2,
                        textTransform: "none",
                        background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                        "&:hover": {
                          transform: "translateY(-2px)",
                          boxShadow: "0 6px 20px rgba(0,0,0,0.2)",
                        },
                        transition: "all 0.2s ease",
                      }}
                    >
                      Next
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      onClick={handleSubmit}
                      disabled={memberRegistration.isPending}
                      endIcon={<CheckCircleIcon />}
                      sx={{
                        px: 4,
                        py: 1.5,
                        borderRadius: 2,
                        textTransform: "none",
                        bgcolor: theme.palette.success.main,
                        "&:hover": {
                          bgcolor: theme.palette.success.dark,
                          transform: "translateY(-2px)",
                          boxShadow: "0 6px 20px rgba(0,0,0,0.2)",
                        },
                        transition: "all 0.2s ease",
                      }}
                    >
                      {memberRegistration.isPending ? "Submitting..." : "Submit Application"}
                    </Button>
                  )}
                </Box>
              </Box>
            </Fade>
          </CardContent>
        </Card>
      </Container>
    </Box>
  )
}
