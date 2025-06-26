"use client"

import type React from "react"
import { useState } from "react"
import {
  Box,
  Container,
  Typography,
  Card,
  Grid,
  Stack,
  useTheme,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Fade,
  Slide,
} from "@mui/material"
import {
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Send as SendIcon,
  WhatsApp as WhatsAppIcon,
  Facebook as FacebookIcon,
  Twitter as TwitterIcon,
  LinkedIn as LinkedInIcon,
  Instagram as InstagramIcon,
  Support as SupportIcon,
  Business as BusinessIcon,
  AccountBalance as AccountBalanceIcon,
  Group as GroupIcon,
  Help as HelpIcon,
  Feedback as FeedbackIcon,
  BugReport as BugReportIcon,
  ExpandMore as ExpandMoreIcon,
  AccessTime as AccessTimeIcon,
  Directions,
  Call,
  EmailOutlined as EmailOutlinedIcon,
  PersonPin,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material"

export default function ContactPage() {
  const theme = useTheme()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    category: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setIsSubmitting(false)
    setSubmitSuccess(true)
    setFormData({
      name: "",
      email: "",
      phone: "",
      subject: "",
      category: "",
      message: "",
    })
  }

  const contactMethods = [
    {
      icon: PhoneIcon,
      title: "Phone Support",
      description: "Speak directly with our support team",
      primary: "+234 (0) 803 123 4567",
      secondary: "+234 (0) 805 987 6543",
      action: "Call Now",
      color: theme.palette.success.main,
      available: "Mon-Fri, 8AM-6PM",
    },
    {
      icon: EmailIcon,
      title: "Email Support",
      description: "Send us detailed inquiries",
      primary: "support@fuosmcsl.online",
      secondary: "info@fuosmcsl.online",
      action: "Send Email",
      color: theme.palette.primary.main,
      available: "24/7 Response",
    },
    {
      icon: WhatsAppIcon,
      title: "WhatsApp",
      description: "Quick messaging and support",
      primary: "+234 803 123 4567",
      secondary: "Business Account",
      action: "Chat Now",
      color: "#25D366",
      available: "Mon-Sat, 8AM-8PM",
    },
    {
      icon: LocationIcon,
      title: "Visit Our Office",
      description: "Meet us in person",
      primary: "Federal University Otuoke",
      secondary: "Bayelsa State, Nigeria",
      action: "Get Directions",
      color: theme.palette.secondary.main,
      available: "Mon-Fri, 9AM-5PM",
    },
  ]

  const departments = [
    {
      name: "Member Services",
      icon: PersonPin,
      email: "members@fuosmcsl.online",
      phone: "+234 803 123 4567",
      description: "Account inquiries, membership applications, general support",
      hours: "Mon-Fri: 8AM-6PM",
    },
    {
      name: "Loan Department",
      icon: AccountBalanceIcon,
      email: "loans@fuosmcsl.online",
      phone: "+234 805 987 6543",
      description: "Loan applications, repayments, loan inquiries",
      hours: "Mon-Fri: 9AM-5PM",
    },
    {
      name: "Treasury",
      icon: BusinessIcon,
      email: "treasury@fuosmcsl.online",
      phone: "+234 807 456 7890",
      description: "Financial matters, savings, withdrawals",
      hours: "Mon-Fri: 9AM-4PM",
    },
    {
      name: "Technical Support",
      icon: SupportIcon,
      email: "tech@fuosmcsl.online",
      phone: "+234 809 234 5678",
      description: "Website issues, app support, technical problems",
      hours: "Mon-Sat: 8AM-8PM",
    },
  ]

  const inquiryTypes = [
    { value: "membership", label: "Membership Inquiry", icon: GroupIcon },
    { value: "loans", label: "Loan Information", icon: AccountBalanceIcon },
    { value: "savings", label: "Savings & Deposits", icon: BusinessIcon },
    { value: "technical", label: "Technical Support", icon: SupportIcon },
    { value: "feedback", label: "Feedback & Suggestions", icon: FeedbackIcon },
    { value: "complaint", label: "Complaint", icon: BugReportIcon },
    { value: "general", label: "General Inquiry", icon: HelpIcon },
  ]

  const faqs = [
    {
      question: "What are your office hours?",
      answer:
        "Our main office is open Monday to Friday, 9AM to 5PM. Phone support is available Monday to Friday, 8AM to 6PM. WhatsApp support extends to Saturday, 8AM to 8PM.",
    },
    {
      question: "How quickly do you respond to emails?",
      answer:
        "We aim to respond to all emails within 24 hours during business days. Urgent matters are typically addressed within 4-6 hours.",
    },
    {
      question: "Can I visit your office without an appointment?",
      answer:
        "Yes, walk-ins are welcome during office hours. However, we recommend scheduling an appointment for complex matters to ensure dedicated time with the right specialist.",
    },
    {
      question: "Do you offer video consultations?",
      answer:
        "Yes, we offer video consultations for members who cannot visit our office. Please contact us to schedule a video meeting.",
    },
  ]

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
      {/* Hero Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main}15 0%, ${theme.palette.secondary.main}25 50%, ${theme.palette.primary.dark}35 100%)`,
          py: { xs: 8, md: 12 },
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Container maxWidth="lg">
          <Fade in timeout={1000}>
            <Box sx={{ textAlign: "center", mb: 6 }}>
              <Typography
                variant="h2"
                component="h1"
                gutterBottom
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: "2.5rem", md: "3.5rem" },
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  lineHeight: 1.2,
                }}
              >
                Get in Touch
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  mb: 4,
                  color: "text.secondary",
                  fontWeight: 400,
                  maxWidth: 600,
                  mx: "auto",
                }}
              >
                We're here to help you with all your cooperative needs. Choose the best way to reach us.
              </Typography>

              {/* Quick Contact Chips */}
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center" sx={{ mb: 4 }}>
                <Chip
                  icon={<PhoneIcon />}
                  label="+234 803 123 4567"
                  clickable
                  sx={{
                    bgcolor: "rgba(255,255,255,0.9)",
                    color: theme.palette.primary.main,
                    fontWeight: 600,
                    py: 2,
                    px: 1,
                  }}
                />
                <Chip
                  icon={<EmailIcon />}
                  label="support@fuosmcsl.online"
                  clickable
                  sx={{
                    bgcolor: "rgba(255,255,255,0.9)",
                    color: theme.palette.primary.main,
                    fontWeight: 600,
                    py: 2,
                    px: 1,
                  }}
                />
                <Chip
                  icon={<WhatsAppIcon />}
                  label="WhatsApp Chat"
                  clickable
                  sx={{
                    bgcolor: "rgba(255,255,255,0.9)",
                    color: "#25D366",
                    fontWeight: 600,
                    py: 2,
                    px: 1,
                  }}
                />
              </Stack>
            </Box>
          </Fade>
        </Container>
      </Box>

      {/* Contact Methods Grid */}
      <Container maxWidth="lg" sx={{ py: 8, mt: -4, position: "relative", zIndex: 2 }}>
        <Grid container spacing={4}>
          {contactMethods.map((method, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
              <Slide direction="up" in timeout={1000 + index * 200}>
                <Card
                  sx={{
                    height: "100%",
                    p: 3,
                    borderRadius: 4,
                    textAlign: "center",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-8px)",
                      boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
                    },
                  }}
                >
                  <Avatar
                    sx={{
                      width: 60,
                      height: 60,
                      bgcolor: `${method.color}15`,
                      color: method.color,
                      mx: "auto",
                      mb: 2,
                    }}
                  >
                    <method.icon sx={{ fontSize: 30 }} />
                  </Avatar>

                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    {method.title}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {method.description}
                  </Typography>

                  <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 1 }}>
                    {method.primary}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {method.secondary}
                  </Typography>

                  <Chip
                    label={method.available}
                    size="small"
                    sx={{ mb: 3, bgcolor: `${method.color}10`, color: method.color }}
                  />

                  <Button
                    variant="contained"
                    fullWidth
                    sx={{
                      bgcolor: method.color,
                      "&:hover": { bgcolor: method.color, opacity: 0.9 },
                      borderRadius: 2,
                      textTransform: "none",
                    }}
                  >
                    {method.action}
                  </Button>
                </Card>
              </Slide>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Contact Form & Map Section */}
      <Box sx={{ bgcolor: "grey.50", py: 8 }}>
        <Container maxWidth="lg">
          <Grid container spacing={6}>
            {/* Contact Form */}
            <Grid size={{ xs: 12, md: 7 }}>
              <Card sx={{ p: 4, borderRadius: 4 }}>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                  Send us a Message
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                  Fill out the form below and we'll get back to you as soon as possible.
                </Typography>

                {submitSuccess && (
                  <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: 3, borderRadius: 2 }}>
                    Thank you! Your message has been sent successfully. We'll respond within 24 hours.
                  </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit}>
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Full Name"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        required
                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Email Address"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        required
                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Phone Number"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <FormControl fullWidth>
                        <InputLabel>Inquiry Type</InputLabel>
                        <Select
                          value={formData.category}
                          onChange={(e) => handleInputChange("category", e.target.value)}
                          label="Inquiry Type"
                          sx={{ borderRadius: 2 }}
                        >
                          {inquiryTypes.map((type) => (
                            <MenuItem key={type.value} value={type.value}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <type.icon sx={{ fontSize: 20 }} />
                                {type.label}
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        label="Subject"
                        value={formData.subject}
                        onChange={(e) => handleInputChange("subject", e.target.value)}
                        required
                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                      />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        label="Message"
                        multiline
                        rows={4}
                        value={formData.message}
                        onChange={(e) => handleInputChange("message", e.target.value)}
                        required
                        placeholder="Please provide details about your inquiry..."
                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                      />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        disabled={isSubmitting}
                        endIcon={<SendIcon />}
                        sx={{
                          px: 4,
                          py: 1.5,
                          borderRadius: 2,
                          textTransform: "none",
                          fontSize: "1.1rem",
                          background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                        }}
                      >
                        {isSubmitting ? "Sending..." : "Send Message"}
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              </Card>
            </Grid>

            {/* Office Information & Map */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Stack spacing={4}>
                {/* Office Location */}
                <Card sx={{ p: 4, borderRadius: 4 }}>
                  <Typography variant="h5" fontWeight="bold" gutterBottom>
                    Visit Our Office
                  </Typography>

                  <Stack spacing={3}>
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                      <LocationIcon color="primary" />
                      <Box>
                        <Typography variant="subtitle1" fontWeight="600">
                          Main Office
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Federal University Otuoke
                          <br />
                          Otuoke, Bayelsa State
                          <br />
                          Nigeria
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                      <AccessTimeIcon color="primary" />
                      <Box>
                        <Typography variant="subtitle1" fontWeight="600">
                          Office Hours
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Monday - Friday: 9:00 AM - 5:00 PM
                          <br />
                          Saturday: 10:00 AM - 2:00 PM
                          <br />
                          Sunday: Closed
                        </Typography>
                      </Box>
                    </Box>

                    <Button
                      variant="outlined"
                      startIcon={<Directions />}
                      fullWidth
                      sx={{ borderRadius: 2, textTransform: "none" }}
                    >
                      Get Directions
                    </Button>
                  </Stack>
                </Card>

                {/* Map Placeholder */}
                <Card sx={{ borderRadius: 4, overflow: "hidden" }}>
                  <Box
                    sx={{
                      height: 250,
                      bgcolor: "grey.100",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                    }}
                  >
                    <Typography variant="h6" color="text.secondary">
                      Interactive Map
                    </Typography>
                    <Box
                      sx={{
                        position: "absolute",
                        bottom: 16,
                        right: 16,
                        bgcolor: "white",
                        p: 1,
                        borderRadius: 1,
                        boxShadow: 1,
                      }}
                    >
                      <Typography variant="caption">Federal University Otuoke</Typography>
                    </Box>
                  </Box>
                </Card>

                {/* Social Media */}
                <Card sx={{ p: 3, borderRadius: 4 }}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Follow Us
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <IconButton sx={{ bgcolor: "#1877F2", color: "white", "&:hover": { bgcolor: "#1877F2" } }}>
                      <FacebookIcon />
                    </IconButton>
                    <IconButton sx={{ bgcolor: "#1DA1F2", color: "white", "&:hover": { bgcolor: "#1DA1F2" } }}>
                      <TwitterIcon />
                    </IconButton>
                    <IconButton sx={{ bgcolor: "#0A66C2", color: "white", "&:hover": { bgcolor: "#0A66C2" } }}>
                      <LinkedInIcon />
                    </IconButton>
                    <IconButton sx={{ bgcolor: "#E4405F", color: "white", "&:hover": { bgcolor: "#E4405F" } }}>
                      <InstagramIcon />
                    </IconButton>
                  </Stack>
                </Card>
              </Stack>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Departments Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ textAlign: "center", mb: 6 }}>
          <Typography variant="h3" fontWeight="bold" gutterBottom>
            Contact by Department
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Reach the right team for your specific needs
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {departments.map((dept, index) => (
            <Grid size={{ xs: 12, md: 6 }} key={index}>
              <Card
                sx={{
                  p: 4,
                  borderRadius: 4,
                  height: "100%",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 12px 30px rgba(0,0,0,0.1)",
                  },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                  <Avatar
                    sx={{
                      width: 50,
                      height: 50,
                      bgcolor: `${theme.palette.primary.main}15`,
                      color: theme.palette.primary.main,
                      mr: 2,
                    }}
                  >
                    <dept.icon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      {dept.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {dept.hours}
                    </Typography>
                  </Box>
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {dept.description}
                </Typography>

                <Stack spacing={2}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Call sx={{ fontSize: 20, color: theme.palette.primary.main }} />
                    <Typography variant="body2">{dept.phone}</Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <EmailOutlinedIcon sx={{ fontSize: 20, color: theme.palette.primary.main }} />
                    <Typography variant="body2">{dept.email}</Typography>
                  </Box>
                </Stack>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* FAQ Section */}
      <Box sx={{ bgcolor: "grey.50", py: 8 }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: "center", mb: 6 }}>
            <Typography variant="h3" fontWeight="bold" gutterBottom>
              Frequently Asked Questions
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Quick answers to common contact questions
            </Typography>
          </Box>

          <Box sx={{ maxWidth: 800, mx: "auto" }}>
            {faqs.map((faq, index) => (
              <Accordion
                key={index}
                sx={{
                  mb: 2,
                  borderRadius: 2,
                  "&:before": { display: "none" },
                  boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6" fontWeight="600">
                    {faq.question}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body1" color="text.secondary">
                    {faq.answer}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Emergency Contact Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Card
          sx={{
            p: 6,
            borderRadius: 4,
            textAlign: "center",
            background: `linear-gradient(135deg, ${theme.palette.error.main}15, ${theme.palette.warning.main}15)`,
            border: `1px solid ${theme.palette.error.light}`,
          }}
        >
          <Typography variant="h4" fontWeight="bold" gutterBottom color="error">
            Emergency Contact
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            For urgent matters outside business hours or emergency situations
          </Typography>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center">
            <Button
              variant="contained"
              color="error"
              size="large"
              startIcon={<PhoneIcon />}
              sx={{ borderRadius: 2, textTransform: "none" }}
            >
              Emergency Hotline: +234 803 999 8888
            </Button>
            <Button
              variant="outlined"
              color="error"
              size="large"
              startIcon={<EmailIcon />}
              sx={{ borderRadius: 2, textTransform: "none" }}
            >
              emergency@fuosmcsl.online
            </Button>
          </Stack>
        </Card>
      </Container>
    </Box>
  )
}
