"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  Grid,
  Stack,
  useTheme,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Avatar,
  Rating,
  Divider,
  IconButton,
  Fade,
  Slide,
  Paper,
} from "@mui/material"
import {
  Savings as SavingsIcon,
  AccountBalance as AccountBalanceIcon,
  Groups as GroupsIcon,
  TrendingUp as TrendingUpIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Support as SupportIcon,
  ExpandMore as ExpandMoreIcon,
  Calculate as CalculateIcon,
  Timeline as TimelineIcon,
  Verified as VerifiedIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  ArrowForward as ArrowForwardIcon,
  CheckCircle as CheckCircleIcon,
  MonetizationOn as MonetizationOnIcon,
  FormatQuote as FormatQuoteIcon,
} from "@mui/icons-material"

export default function Home() {
  const theme = useTheme()
  const [selectedLoanType, setSelectedLoanType] = useState(0)

  const loanTypes = [
    {
      name: "Soft Loans",
      duration: "1-6 months",
      interest: "10% monthly",
      maxAmount: "₦500,000",
      description: "Quick access loans for immediate needs",
      features: ["Fast approval", "Flexible repayment", "No collateral required"],
      color: theme.palette.success.main,
    },
    {
      name: "Regular Loans",
      duration: "1-12 months",
      interest: "10% annually",
      maxAmount: "3x your savings",
      description: "Standard loans for medium-term financial goals",
      features: ["Competitive rates", "Up to 12 months", "Based on savings balance"],
      color: theme.palette.primary.main,
    },
    {
      name: "Long-term Loans",
      duration: "12-36 months",
      interest: "15% annually",
      maxAmount: "3x your savings",
      description: "Extended loans for major investments",
      features: ["Extended repayment", "Large amounts", "Investment focused"],
      color: theme.palette.secondary.main,
    },
  ]

  const testimonials = [
    {
      name: "Adebayo Johnson",
      role: "Senior Civil Servant",
      rating: 5,
      comment:
        "Coop Nest helped me secure a loan for my children's education. The process was seamless and the rates are very competitive.",
      avatar: "/avatars/avatar1.jpg",
    },
    {
      name: "Fatima Mohammed",
      role: "Healthcare Worker",
      rating: 5,
      comment:
        "The savings program has helped me build a solid financial foundation. I've grown my savings by 40% in just two years!",
      avatar: "/avatars/avatar2.jpg",
    },
    {
      name: "Chinedu Okafor",
      role: "Teacher",
      rating: 5,
      comment: "Being part of this cooperative has transformed my financial life. The community support is incredible.",
      avatar: "/avatars/avatar3.jpg",
    },
  ]

  const stats = [
    { label: "Active Members", value: "2,500+", icon: GroupsIcon },
    { label: "Total Savings", value: "₦2.5B+", icon: SavingsIcon },
    { label: "Loans Disbursed", value: "₦1.8B+", icon: AccountBalanceIcon },
    { label: "Years of Service", value: "15+", icon: VerifiedIcon },
  ]

  const faqs = [
    {
      question: "How do I become a member?",
      answer:
        "Simply register online, complete your biodata verification, and make your initial savings deposit. Our team will guide you through the entire process.",
    },
    {
      question: "What are the loan eligibility requirements?",
      answer:
        "For regular loans, you can borrow up to 3 times your total savings balance. Soft loans have a maximum of ₦500,000. You must be an active member with verified biodata.",
    },
    {
      question: "How are loan interest rates calculated?",
      answer:
        "Soft loans charge 10% monthly interest, regular loans charge 10% annually, and long-term loans charge 15% annually. All calculations are transparent and provided upfront.",
    },
    {
      question: "Can I make early loan repayments?",
      answer:
        "Yes! You can make early repayments without penalties. Our system automatically recalculates your payment schedule to reflect early payments.",
    },
    {
      question: "How often can I make withdrawals from my savings?",
      answer:
        "You can make annual withdrawal requests. The system tracks your savings balance and ensures you maintain the required minimum for loan eligibility.",
    },
  ]

  return (
    <Box sx={{ bgcolor: "background.default", overflow: "hidden" }}>
      {/* Enhanced Hero Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main}15 0%, ${theme.palette.secondary.main}25 50%, ${theme.palette.primary.dark}35 100%)`,
          position: "relative",
          py: { xs: 8, md: 12 },
          overflow: "hidden",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "radial-gradient(circle at 30% 20%, rgba(120, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255, 119, 198, 0.3) 0%, transparent 50%)",
            zIndex: 1,
          },
        }}
      >
        <Container maxWidth="lg" sx={{ position: "relative", zIndex: 2 }}>
          <Grid container spacing={6} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <Fade in timeout={1000}>
                <Box>
                  <Chip
                    label="🏆 Trusted by 1,500+ Members"
                    sx={{
                      mb: 3,
                      bgcolor: "rgba(255,255,255,0.9)",
                      color: theme.palette.primary.main,
                      fontWeight: 600,
                    }}
                  />
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
                    Your Financial Growth Partner
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{
                      mb: 4,
                      color: "text.secondary",
                      fontWeight: 400,
                      lineHeight: 1.6,
                    }}
                  >
                    Join Nigeria's most trusted cooperative society. Save smart, borrow easy, and grow your wealth with
                    competitive rates and flexible terms.
                  </Typography>

                  {/* Key Benefits */}
                  <Stack spacing={2} sx={{ mb: 4 }}>
                    {[
                      "Loans up to 3x your savings balance",
                      "Competitive interest rates from 10% annually",
                      "Flexible repayment terms up to 36 months",
                      "Annual savings withdrawal options",
                    ].map((benefit, index) => (
                      <Box key={index} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <CheckCircleIcon color="success" sx={{ fontSize: 20 }} />
                        <Typography variant="body1" color="text.secondary">
                          {benefit}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <Button
                      variant="contained"
                      size="large"
                      component={Link}
                      href="/auth/register"
                      endIcon={<ArrowForwardIcon />}
                      sx={{
                        px: 4,
                        py: 1.5,
                        borderRadius: 3,
                        textTransform: "none",
                        fontSize: "1.1rem",
                        fontWeight: 600,
                        background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                        boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
                        "&:hover": {
                          transform: "translateY(-2px)",
                          boxShadow: "0 12px 35px rgba(0,0,0,0.2)",
                        },
                        transition: "all 0.3s ease",
                      }}
                    >
                      Join Coop Nest Today
                    </Button>
                    <Button
                      variant="outlined"
                      size="large"
                      component={Link}
                      href="/auth/login"
                      sx={{
                        px: 4,
                        py: 1.5,
                        borderRadius: 3,
                        textTransform: "none",
                        fontSize: "1.1rem",
                        fontWeight: 600,
                        borderWidth: 2,
                        "&:hover": {
                          borderWidth: 2,
                          transform: "translateY(-2px)",
                          boxShadow: "0 8px 25px rgba(0,0,0,0.1)",
                        },
                        transition: "all 0.3s ease",
                      }}
                    >
                      Member Login
                    </Button>
                  </Stack>
                </Box>
              </Fade>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Slide direction="left" in timeout={1200}>
                <Box
                  sx={{
                    position: "relative",
                    height: { xs: 300, md: 500 },
                    filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.1))",
                    animation: "float 6s ease-in-out infinite",
                    "@keyframes float": {
                      "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
                      "50%": { transform: "translateY(-20px) rotate(2deg)" },
                    },
                  }}
                >
                  <Image
                    src="/coop-nest-logo.svg?height=500&width=500"
                    alt="CoopNest - Cooperative Financial Management"
                    fill
                    style={{ objectFit: "contain" }}
                  />
                </Box>
              </Slide>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Stats Section */}
      <Container maxWidth="lg" sx={{ py: 6, mt: -4, position: "relative", zIndex: 3 }}>
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 4,
            background: "rgba(255,255,255,0.9)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.2)",
          }}
        >
          <Grid container spacing={4}>
            {stats.map((stat, index) => (
              <Grid size={{ xs: 6, md: 3 }} key={index}>
                <Box sx={{ textAlign: "center" }}>
                  <Avatar
                    sx={{
                      width: 60,
                      height: 60,
                      bgcolor: `${theme.palette.primary.main}15`,
                      color: theme.palette.primary.main,
                      mx: "auto",
                      mb: 2,
                    }}
                  >
                    <stat.icon sx={{ fontSize: 30 }} />
                  </Avatar>
                  <Typography variant="h4" fontWeight="bold" color="primary">
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stat.label}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Container>

      {/* Loan Types Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ textAlign: "center", mb: 6 }}>
          <Typography variant="h3" fontWeight="bold" gutterBottom>
            Flexible Loan Options
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: "auto" }}>
            Choose from our three loan categories designed to meet your specific financial needs
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {loanTypes.map((loan, index) => (
            <Grid size={{ xs: 12, md: 4 }} key={index}>
              <Card
                sx={{
                  height: "100%",
                  p: 3,
                  borderRadius: 4,
                  border: selectedLoanType === index ? `2px solid ${loan.color}` : "1px solid rgba(0,0,0,0.1)",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-8px)",
                    boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
                  },
                }}
                onClick={() => setSelectedLoanType(index)}
              >
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: `${loan.color}15`,
                      color: loan.color,
                      mr: 2,
                    }}
                  >
                    <AccountBalanceIcon />
                  </Avatar>
                  <Typography variant="h6" fontWeight="bold">
                    {loan.name}
                  </Typography>
                </Box>

                <Stack spacing={2} sx={{ mb: 3 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">
                      Duration:
                    </Typography>
                    <Typography variant="body2" fontWeight="600">
                      {loan.duration}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">
                      Interest:
                    </Typography>
                    <Typography variant="body2" fontWeight="600" color={loan.color}>
                      {loan.interest}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">
                      Max Amount:
                    </Typography>
                    <Typography variant="body2" fontWeight="600">
                      {loan.maxAmount}
                    </Typography>
                  </Box>
                </Stack>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {loan.description}
                </Typography>

                <Stack spacing={1}>
                  {loan.features.map((feature, idx) => (
                    <Box key={idx} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <CheckCircleIcon sx={{ fontSize: 16, color: loan.color }} />
                      <Typography variant="body2">{feature}</Typography>
                    </Box>
                  ))}
                </Stack>

                <Button
                  variant={selectedLoanType === index ? "contained" : "outlined"}
                  fullWidth
                  sx={{
                    mt: 3,
                    borderRadius: 2,
                    textTransform: "none",
                    bgcolor: selectedLoanType === index ? loan.color : "transparent",
                    borderColor: loan.color,
                    color: selectedLoanType === index ? "white" : loan.color,
                    "&:hover": {
                      bgcolor: loan.color,
                      color: "white",
                    },
                  }}
                  component={Link}
                  href="/auth/login"
                >
                  Apply Now
                </Button>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* FIXED: Savings Programs Section */}
      <Box sx={{ bgcolor: "grey.50", py: 8 }}>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid size={{ xs: 12, md: 7 }}>
              <Typography variant="h3" fontWeight="bold" gutterBottom>
                Smart Savings Programs
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
                Build your financial foundation with our flexible savings options
              </Typography>

              <Stack spacing={3}>
                <Card sx={{ p: 3, borderRadius: 3 }}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <SavingsIcon color="primary" sx={{ mr: 2 }} />
                    <Typography variant="h6" fontWeight="bold">
                      Regular Savings
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Consistent monthly contributions that form the foundation of your cooperative membership
                  </Typography>
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <Chip label="Monthly Contributions" size="small" />
                    <Chip label="Loan Eligibility Base" size="small" />
                  </Box>
                </Card>

                <Card sx={{ p: 3, borderRadius: 3 }}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <MonetizationOnIcon color="secondary" sx={{ mr: 2 }} />
                    <Typography variant="h6" fontWeight="bold">
                      Personal Savings
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Additional voluntary savings to boost your loan eligibility and financial growth
                  </Typography>
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <Chip label="Flexible Amounts" size="small" />
                    <Chip label="Annual Withdrawals" size="small" />
                  </Box>
                </Card>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, md: 5 }}>
              <Card sx={{ p: 4, borderRadius: 4, textAlign: "center" }}>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  Savings Calculator
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  See how your savings can grow and your loan eligibility
                </Typography>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="h4" color="primary" fontWeight="bold">
                    ₦150,000
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Monthly Savings
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ mb: 3 }}>
                  <Typography variant="h4" color="secondary" fontWeight="bold">
                    ₦450,000
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Maximum Loan Eligibility (3x)
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<CalculateIcon />}
                  sx={{ borderRadius: 2, textTransform: "none" }}
                  component={Link}
                  href="/auth/login"
                >
                  Calculate Your Potential
                </Button>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Grid */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ textAlign: "center", mb: 6 }}>
          <Typography variant="h3" fontWeight="bold" gutterBottom>
            Why Choose Coop Nest?
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Experience the benefits of cooperative banking with modern technology
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {[
            {
              icon: SecurityIcon,
              title: "Secure & Regulated",
              description: "Your funds are protected with bank-level security and regulatory compliance",
              color: theme.palette.success.main,
            },
            {
              icon: SpeedIcon,
              title: "Fast Processing",
              description: "Quick loan approvals and instant access to your account information",
              color: theme.palette.primary.main,
            },
            {
              icon: SupportIcon,
              title: "24/7 Support",
              description: "Dedicated member support team available to help with all your needs",
              color: theme.palette.secondary.main,
            },
            {
              icon: TimelineIcon,
              title: "Transparent Tracking",
              description: "Real-time visibility into your savings, loans, and payment schedules",
              color: theme.palette.warning.main,
            },
            {
              icon: GroupsIcon,
              title: "Community Driven",
              description: "Join a thriving community of members supporting each other's growth",
              color: theme.palette.info.main,
            },
            {
              icon: TrendingUpIcon,
              title: "Wealth Building",
              description: "Grow your wealth through shares ownership and competitive returns",
              color: theme.palette.error.main,
            },
          ].map((feature, index) => (
            <Grid size={{ xs: 12, md: 4 }} key={index}>
              <Card
                sx={{
                  height: "100%",
                  p: 4,
                  borderRadius: 4,
                  textAlign: "center",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-5px)",
                    boxShadow: "0 15px 35px rgba(0,0,0,0.1)",
                  },
                }}
              >
                <Avatar
                  sx={{
                    width: 70,
                    height: 70,
                    bgcolor: `${feature.color}15`,
                    color: feature.color,
                    mx: "auto",
                    mb: 3,
                  }}
                >
                  <feature.icon sx={{ fontSize: 35 }} />
                </Avatar>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {feature.description}
                </Typography>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* FIXED: Testimonials Section */}
      <Box sx={{ bgcolor: "grey.50", py: 8 }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: "center", mb: 6 }}>
            <Typography variant="h3" fontWeight="bold" gutterBottom>
              What Our Members Say
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Real stories from satisfied cooperative members
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {testimonials.map((testimonial, index) => (
              <Grid size={{ xs: 12, md: 4 }} key={index}>
                <Card
                  sx={{
                    height: "100%",
                    p: 4,
                    borderRadius: 4,
                    position: "relative",
                  }}
                >
                  {/* Quote Icon - Fixed approach */}
                  <Box
                    sx={{
                      position: "absolute",
                      top: 16,
                      right: 16,
                      opacity: 0.2,
                    }}
                  >
                    <FormatQuoteIcon
                      sx={{
                        fontSize: "3rem",
                        color: theme.palette.primary.main,
                        transform: "rotate(180deg)",
                      }}
                    />
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                    <Avatar src={testimonial.avatar} sx={{ width: 50, height: 50, mr: 2 }}>
                      {testimonial.name.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {testimonial.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {testimonial.role}
                      </Typography>
                    </Box>
                  </Box>

                  <Rating value={testimonial.rating} readOnly sx={{ mb: 2 }} />

                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
                    {testimonial.comment}
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* FAQ Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ textAlign: "center", mb: 6 }}>
          <Typography variant="h3" fontWeight="bold" gutterBottom>
            Frequently Asked Questions
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Get answers to common questions about our cooperative services
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

      {/* CTA Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          color: "white",
          py: 8,
          textAlign: "center",
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h3" fontWeight="bold" gutterBottom>
            Ready to Start Your Financial Journey?
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
            Join thousands of members who have transformed their financial lives with Coop Nest
          </Typography>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center">
            <Button
              variant="contained"
              size="large"
              component={Link}
              href="/auth/register"
              sx={{
                bgcolor: "white",
                color: theme.palette.primary.main,
                px: 4,
                py: 1.5,
                borderRadius: 3,
                textTransform: "none",
                fontSize: "1.1rem",
                fontWeight: 600,
                "&:hover": {
                  bgcolor: "grey.100",
                  transform: "translateY(-2px)",
                },
              }}
            >
              Become a Member
            </Button>
            <Button
              variant="outlined"
              size="large"
              component={Link}
              href="/contact"
              sx={{
                borderColor: "white",
                color: "white",
                px: 4,
                py: 1.5,
                borderRadius: 3,
                textTransform: "none",
                fontSize: "1.1rem",
                fontWeight: 600,
                "&:hover": {
                  borderColor: "white",
                  bgcolor: "rgba(255,255,255,0.1)",
                  transform: "translateY(-2px)",
                },
              }}
            >
              Contact Us
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ bgcolor: "grey.900", color: "white", py: 6 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                Coop Nest
              </Typography>
              <Typography variant="body2" color="grey.400" sx={{ mb: 3 }}>
                Your trusted partner in financial growth and community development. Building stronger financial futures
                together.
              </Typography>
              <Stack direction="row" spacing={1}>
                <IconButton sx={{ color: "white" }}>
                  <PhoneIcon />
                </IconButton>
                <IconButton sx={{ color: "white" }}>
                  <EmailIcon />
                </IconButton>
                <IconButton sx={{ color: "white" }}>
                  <LocationIcon />
                </IconButton>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, md: 2 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Services
              </Typography>
              <Stack spacing={1}>
                <Typography variant="body2" color="grey.400">
                  Savings
                </Typography>
                <Typography variant="body2" color="grey.400">
                  Loans
                </Typography>
                <Typography variant="body2" color="grey.400">
                  Shares
                </Typography>
                <Typography variant="body2" color="grey.400">
                  Withdrawals
                </Typography>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, md: 2 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Support
              </Typography>
              <Stack spacing={1}>
                <Typography variant="body2" color="grey.400">
                  Help Center
                </Typography>
                <Typography variant="body2" color="grey.400">
                  Contact Us
                </Typography>
                <Typography variant="body2" color="grey.400">
                  Member Portal
                </Typography>
                <Typography variant="body2" color="grey.400">
                  Documentation
                </Typography>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Contact Information
              </Typography>
              <Stack spacing={1}>
                <Typography variant="body2" color="grey.400">
                  📍 Federal University, Otuoke, Bayelsa, Nigeria
                </Typography>
                <Typography variant="body2" color="grey.400">
                  📞 +234 (0) 000 000 0000
                </Typography>
                <Typography variant="body2" color="grey.400">
                  ✉️ info@fuosmcsl.online
                </Typography>
              </Stack>
            </Grid>
          </Grid>

          <Divider sx={{ my: 4, borderColor: "grey.700" }} />

          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
            <Typography variant="body2" color="grey.400">
              © 2025 Coop Nest. All rights reserved.
            </Typography>
            <Stack direction="row" spacing={3}>
              <Typography variant="body2" color="grey.400">
                Privacy Policy
              </Typography>
              <Typography variant="body2" color="grey.400">
                Terms of Service
              </Typography>
              <Typography variant="body2" color="grey.400">
                Cookie Policy
              </Typography>
            </Stack>
          </Box>
        </Container>
      </Box>
    </Box>
  )
}
