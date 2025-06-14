'use client';

import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tabs,
  Tab,
  Divider,
  Chip,
  Paper,
  Grid,
  useTheme,
  alpha,
  styled,
  TableContainer
} from '@mui/material';
import {
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  MonetizationOn,
  Calculate,
  Assessment,
  Help,
  Payments,
  Description,
  Schedule,
  Info as InfoIcon,
  ArrowRight
} from '@mui/icons-material';
import { formatCurrency } from '@/utils/formatting/format';
import { motion } from 'framer-motion';

// Styled components for enhanced visual appeal
const StyledAccordion = styled(Accordion)(({ theme }) => ({
  border: '1px solid',
  borderColor: theme.palette.divider,
  borderRadius: '8px !important',
  marginBottom: theme.spacing(1.5),
  boxShadow: 'none',
  '&:before': {
    display: 'none',
  },
  '&.Mui-expanded': {
    margin: `${theme.spacing(1.5)}px 0`,
    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.08)}`,
  },
}));

const StyledAccordionSummary = styled(AccordionSummary)(({ theme }) => ({
  padding: theme.spacing(1, 2),
  '&.Mui-expanded': {
    backgroundColor: alpha(theme.palette.primary.main, 0.03),
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  '& .MuiAccordionSummary-content': {
    margin: theme.spacing(1, 0),
  },
}));

const StyledAccordionDetails = styled(AccordionDetails)(({ theme }) => ({
  padding: theme.spacing(2, 3),
  borderTop: 'none',
}));

const HighlightChip = styled(Chip)(({ theme }) => ({
  fontWeight: 500,
  backgroundColor: alpha(theme.palette.primary.main, 0.1),
  color: theme.palette.primary.main,
  margin: theme.spacing(0.5),
}));

const InfoBox = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: alpha(theme.palette.info.main, 0.05),
  borderRadius: theme.spacing(1),
  border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
  marginBottom: theme.spacing(2),
}));

const LoanTypeCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  height: '100%',
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.spacing(1),
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.15)}`,
  },
}));

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`faq-tabpanel-${index}`}
      aria-labelledby={`faq-tab-${index}`}
      {...other}
      style={{ paddingTop: 24 }}
    >
      {value === index && children}
    </div>
  );
}

// Main component
export function LoanFAQModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [expanded, setExpanded] = useState<string | false>('panel-loan-types');

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleAccordionChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  // Animation variants for smooth transitions
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  const MotionBox = motion(Box);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
      aria-labelledby="loan-faq-title"
    >
      <DialogTitle id="loan-faq-title" sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h5" component="span" sx={{ display: 'flex', alignItems: 'center' }}>
            <MonetizationOn sx={{ mr: 1.5, color: theme.palette.primary.main }} />
            Loan FAQ & Guidelines
          </Typography>
          <IconButton edge="end" color="inherit" onClick={onClose} aria-label="close">
            <CloseIcon />
          </IconButton>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Comprehensive information about our cooperative's loan programs, application process, and repayment guidelines
        </Typography>
      </DialogTitle>
      
      <Divider />
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="loan faq tabs"
          variant="scrollable"
          scrollButtons="auto"
          sx={{ px: 3 }}
        >
          <Tab icon={<Description fontSize="small" />} iconPosition="start" label="Loan Basics" />
          <Tab icon={<Assessment fontSize="small" />} iconPosition="start" label="Eligibility" />
          <Tab icon={<Calculate fontSize="small" />} iconPosition="start" label="Calculations" />
          <Tab icon={<Payments fontSize="small" />} iconPosition="start" label="Repayment" />
          <Tab icon={<Schedule fontSize="small" />} iconPosition="start" label="Process" />
        </Tabs>
      </Box>
      
      <DialogContent dividers sx={{ px: 3, py: 2 }}>
        <TabPanel value={tabValue} index={0}>
          <MotionBox
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            component="section"
          >
            <MotionBox variants={itemVariants}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <InfoIcon fontSize="small" sx={{ mr: 1, color: theme.palette.primary.main }} />
                Available Loan Types
              </Typography>
              
              <InfoBox>
                <Typography variant="body2">
                  Our cooperative offers several loan types tailored to different needs and durations. Each loan type has specific terms, limits, and eligibility criteria.
                </Typography>
              </InfoBox>
              
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <LoanTypeCard elevation={0}>
                    <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center' }}>
                      <Chip
                        label="Soft Loan"
                        size="small"
                        sx={{ 
                          bgcolor: alpha(theme.palette.success.main, 0.1), 
                          color: theme.palette.success.dark,
                          fontWeight: 600
                        }}
                      />
                    </Box>
                    <Typography variant="h6" gutterBottom>Soft Loan</Typography>
                    <Typography variant="body2" paragraph>
                      Short-term loans ideal for minor financial needs with quick repayment.
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ mt: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">Interest Rate:</Typography>
                        <Typography variant="body2" fontWeight={500}>10% monthly</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">Duration:</Typography>
                        <Typography variant="body2" fontWeight={500}>1-6 months</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">Max Amount:</Typography>
                        <Typography variant="body2" fontWeight={500}>{formatCurrency(500000)}</Typography>
                      </Box>
                    </Box>
                  </LoanTypeCard>
                </Grid>
                
                <Grid size={{ xs: 12, md: 4 }}>
                  <LoanTypeCard elevation={0}>
                    <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center' }}>
                      <Chip
                        label="Regular Loan"
                        size="small"
                        sx={{ 
                          bgcolor: alpha(theme.palette.primary.main, 0.1), 
                          color: theme.palette.primary.dark,
                          fontWeight: 600
                        }}
                      />
                    </Box>
                    <Typography variant="h6" gutterBottom>Regular Loan</Typography>
                    <Typography variant="body2" paragraph>
                      Medium-term loans for substantial expenses with flexible repayment options.
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ mt: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">Interest Rate:</Typography>
                        <Typography variant="body2" fontWeight={500}>10% per annum</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">Duration:</Typography>
                        <Typography variant="body2" fontWeight={500}>6-12 months</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">Max Amount:</Typography>
                        <Typography variant="body2" fontWeight={500}>3x Total Savings</Typography>
                      </Box>
                    </Box>
                  </LoanTypeCard>
                </Grid>
                
                <Grid size={{ xs: 12, md: 4 }}>
                  <LoanTypeCard elevation={0}>
                    <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center' }}>
                      <Chip
                        label="Regular Loan"
                        size="small"
                        sx={{ 
                          bgcolor: alpha(theme.palette.info.main, 0.1), 
                          color: theme.palette.info.dark,
                          fontWeight: 600
                        }}
                      />
                    </Box>
                    <Typography variant="h6" gutterBottom>Regular Loan (1 Year Plus)</Typography>
                    <Typography variant="body2" paragraph>
                      Long-term loans for major investments with extended repayment periods.
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ mt: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">Interest Rate:</Typography>
                        <Typography variant="body2" fontWeight={500}>15% per annum</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">Duration:</Typography>
                        <Typography variant="body2" fontWeight={500}>13-36 months</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">Max Amount:</Typography>
                        <Typography variant="body2" fontWeight={500}>3x Total Savings</Typography>
                      </Box>
                    </Box>
                  </LoanTypeCard>
                </Grid>
              </Grid>
            </MotionBox>
            
            <MotionBox variants={itemVariants} sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>
                Common Loan Questions
              </Typography>
              <StyledAccordion
                expanded={expanded === 'panel-max-loans'}
                onChange={handleAccordionChange('panel-max-loans')}
              >
                <StyledAccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography fontWeight={500}>How many loans can I have at once?</Typography>
                </StyledAccordionSummary>
                <StyledAccordionDetails>
                  <Typography variant="body2" paragraph>
                    Members may have up to one loan of each type concurrently, provided they meet the eligibility requirements for each loan. This means you could potentially have only:
                  </Typography>
                  <Box component="ul" sx={{ pl: 2 }}>
                    <Typography component="li" variant="body2">One active Soft Loan</Typography>
                    <Typography component="li" variant="body2">One active Regular Loan</Typography>
                    <Typography component="li" variant="body2">One active 1 Year Plus Loan</Typography>
                  </Box>
                  <Typography variant="body2" paragraph sx={{ mt: 1 }}>
                    However, your total loan burden must still fall within acceptable limits based on your savings and repayment capacity.
                  </Typography>
                </StyledAccordionDetails>
              </StyledAccordion>
              
              <StyledAccordion
                expanded={expanded === 'panel-loan-purpose'}
                onChange={handleAccordionChange('panel-loan-purpose')}
              >
                <StyledAccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography fontWeight={500}>What can I use the loan for?</Typography>
                </StyledAccordionSummary>
                <StyledAccordionDetails>
                  <Typography variant="body2" paragraph>
                    Our cooperative loans are flexible in purpose, but we require transparency regarding your intended use. Common acceptable purposes include:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', mb: 2 }}>
                    <HighlightChip label="Education" />
                    <HighlightChip label="Medical Expenses" />
                    <HighlightChip label="Home Improvements" />
                    <HighlightChip label="Business Investment" />
                    <HighlightChip label="Debt Consolidation" />
                    <HighlightChip label="Emergency Needs" />
                  </Box>
                  <Typography variant="body2">
                    When applying, you'll need to provide a brief explanation of how you plan to use the funds. This helps ensure the loan serves a productive purpose aligned with our cooperative's values.
                  </Typography>
                </StyledAccordionDetails>
              </StyledAccordion>
              
              <StyledAccordion
                expanded={expanded === 'panel-application-time'}
                onChange={handleAccordionChange('panel-application-time')}
              >
                <StyledAccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography fontWeight={500}>How long does the loan application process take?</Typography>
                </StyledAccordionSummary>
                <StyledAccordionDetails>
                  <Typography variant="body2" paragraph>
                    The timeline for loan approval and disbursement varies based on the loan type and approval requirements:
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight={500}>Soft Loans:</Typography>
                    <Typography variant="body2" sx={{ ml: 2 }}>• Typical approval time: 1-3 business days</Typography>
                    <Typography variant="body2" sx={{ ml: 2 }}>• Disbursement after approval: 1-2 business days</Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight={500}>Regular Loans:</Typography>
                    <Typography variant="body2" sx={{ ml: 2 }}>• Typical approval time: 3-5 business days</Typography>
                    <Typography variant="body2" sx={{ ml: 2 }}>• Disbursement after approval: 1-2 business days</Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight={500}>1 Year Plus Loans:</Typography>
                    <Typography variant="body2" sx={{ ml: 2 }}>• Typical approval time: 5-7 business days</Typography>
                    <Typography variant="body2" sx={{ ml: 2 }}>• Disbursement after approval: 2-3 business days</Typography>
                  </Box>
                  <Typography variant="body2">
                    These timelines represent typical scenarios. The actual processing time may vary depending on the completeness of your application, the current volume of requests, and the availability of approving officers.
                  </Typography>
                </StyledAccordionDetails>
              </StyledAccordion>
            </MotionBox>
          </MotionBox>
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <MotionBox
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <MotionBox variants={itemVariants}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <InfoIcon fontSize="small" sx={{ mr: 1, color: theme.palette.primary.main }} />
                Loan Eligibility Criteria
              </Typography>
              
              <InfoBox>
                <Typography variant="body2">
                  Eligibility for loans is primarily based on your savings history, membership duration, and existing loan obligations. Our system automatically calculates your eligibility when you apply.
                </Typography>
              </InfoBox>
              
              <StyledAccordion
                expanded={expanded === 'panel-basic-eligibility'}
                onChange={handleAccordionChange('panel-basic-eligibility')}
              >
                <StyledAccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography fontWeight={500}>Basic Eligibility Requirements</Typography>
                </StyledAccordionSummary>
                <StyledAccordionDetails>
                  <Typography variant="body2" paragraph>
                    To qualify for any loan with our cooperative, you must meet these basic requirements:
                  </Typography>
                  <Box component="ul" sx={{ pl: 2 }}>
                    <Typography component="li" variant="body2">Active membership for at least 3 months</Typography>
                    <Typography component="li" variant="body2">Regular monthly savings contributions</Typography>
                    <Typography component="li" variant="body2">No outstanding defaulted loans</Typography>
                    <Typography component="li" variant="body2">At least 25% of the requested loan amount in total savings</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic' }}>
                    Note: Meeting the basic eligibility requirements doesn't guarantee loan approval, as each loan type has additional specific criteria.
                  </Typography>
                </StyledAccordionDetails>
              </StyledAccordion>
              
              <StyledAccordion
                expanded={expanded === 'panel-loan-limits'}
                onChange={handleAccordionChange('panel-loan-limits')}
              >
                <StyledAccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography fontWeight={500}>Maximum Loan Amounts</Typography>
                </StyledAccordionSummary>
                <StyledAccordionDetails>
                  <Typography variant="body2" paragraph>
                    Your maximum eligible loan amount is determined by your loan type and savings balance:
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight={500}>Soft Loans:</Typography>
                    <Typography variant="body2" sx={{ ml: 2 }}>
                      • Fixed maximum of {formatCurrency(500000)} regardless of savings
                    </Typography>
                    <Typography variant="body2" sx={{ ml: 2 }}>
                      • Validation is based on a fixed maximum amount only
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight={500}>Regular Loans:</Typography>
                    <Typography variant="body2" sx={{ ml: 2 }}>
                      • Up to 3x your total savings amount
                    </Typography>
                    <Typography variant="body2" sx={{ ml: 2 }}>
                      • Example: With {formatCurrency(500000)} in savings, you qualify for up to {formatCurrency(1500000)}
                    </Typography>
                    <Typography variant="body2" sx={{ ml: 2 }}>
                      • Validation uses the savings multiplier method
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight={500}>1 Year Plus Loans:</Typography>
                    <Typography variant="body2" sx={{ ml: 2 }}>
                      • Up to 3x your total savings amount
                    </Typography>
                    <Typography variant="body2" sx={{ ml: 2 }}>
                      • Example: With {formatCurrency(1000000)} in savings, you qualify for up to {formatCurrency(3000000)}
                    </Typography>
                    <Typography variant="body2" sx={{ ml: 2 }}>
                      • Validation uses the same savings multiplier method
                    </Typography>
                  </Box>
                  
                  <InfoBox sx={{ mt: 2 }}>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                      <InfoIcon fontSize="small" sx={{ mr: 1, color: theme.palette.info.main }} />
                      The cooperative's eligibility calculator will automatically determine your maximum eligible amount when you apply for a loan.
                    </Typography>
                  </InfoBox>
                </StyledAccordionDetails>
              </StyledAccordion>
              
              <StyledAccordion
                expanded={expanded === 'panel-multiple-loans'}
                onChange={handleAccordionChange('panel-multiple-loans')}
              >
                <StyledAccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography fontWeight={500}>Multiple Loan Eligibility</Typography>
                </StyledAccordionSummary>
                <StyledAccordionDetails>
                  <Typography variant="body2" paragraph>
                    Members may have multiple loans of different types simultaneously, subject to these conditions:
                  </Typography>
                  
                  <Box component="ul" sx={{ pl: 2 }}>
                    <Typography component="li" variant="body2">
                      Maximum of one loan per loan type at any time
                    </Typography>
                    <Typography component="li" variant="body2">
                      Combined monthly repayments must not exceed 33% of your monthly income
                    </Typography>
                    <Typography component="li" variant="body2">
                      Total loan exposure (all active loans) should not exceed 3x your total savings
                    </Typography>
                    <Typography component="li" variant="body2">
                      Any existing loans must have at least 3 months of consistent repayment history
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mt: 2, p: 2, bgcolor: alpha(theme.palette.warning.main, 0.05), borderRadius: 1 }}>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'flex-start' }}>
                      <InfoIcon fontSize="small" sx={{ mr: 1, mt: 0.5, color: theme.palette.warning.main }} />
                      <span>If you already have an active loan of the same type, you must fully repay it before applying for another. Refinancing or top-up options are currently not available.</span>
                    </Typography>
                  </Box>
                </StyledAccordionDetails>
              </StyledAccordion>
              
              <StyledAccordion
                expanded={expanded === 'panel-ineligibility'}
                onChange={handleAccordionChange('panel-ineligibility')}
              >
                <StyledAccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography fontWeight={500}>Common Reasons for Ineligibility</Typography>
                </StyledAccordionSummary>
                <StyledAccordionDetails>
                  <Typography variant="body2" paragraph>
                    You may be ineligible for a loan due to the following reasons:
                  </Typography>
                  
                  <Box component="ul" sx={{ pl: 2 }}>
                    <Typography component="li" variant="body2">
                      Insufficient savings balance for the requested loan amount/type
                    </Typography>
                    <Typography component="li" variant="body2">
                      Existing defaulted or overdue loan repayments
                    </Typography>
                    <Typography component="li" variant="body2">
                      Already having an active loan of the same type
                    </Typography>
                    <Typography component="li" variant="body2">
                      Irregular savings contributions in the past 3 months
                    </Typography>
                    <Typography component="li" variant="body2">
                      New membership (less than 3 months)
                    </Typography>
                    <Typography component="li" variant="body2">
                      Total loan obligations would exceed the maximum allowed debt-to-savings ratio
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" sx={{ mt: 2 }}>
                    If you're found ineligible when applying, the system will provide the specific reason, allowing you to address the issue before reapplying.
                  </Typography>
                </StyledAccordionDetails>
              </StyledAccordion>
            </MotionBox>
          </MotionBox>
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <MotionBox
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <MotionBox variants={itemVariants}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <InfoIcon fontSize="small" sx={{ mr: 1, color: theme.palette.primary.main }} />
                Understanding Loan Calculations
              </Typography>
              
              <InfoBox>
                <Typography variant="body2">
                  Our loan calculations use standard financial formulas to determine your repayment schedule, interest amounts, and total repayment obligations.
                </Typography>
              </InfoBox>
              
              <StyledAccordion
                expanded={expanded === 'panel-interest-calc'}
                onChange={handleAccordionChange('panel-interest-calc')}
              >
                <StyledAccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography fontWeight={500}>How Interest Is Calculated</Typography>
                </StyledAccordionSummary>
                <StyledAccordionDetails>
                  <Typography variant="body2" paragraph>
                    We use two different methods for calculating interest, depending on the loan type:
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight={500}>For Soft Loans (1-6 months):</Typography>
                    <Typography variant="body2" sx={{ ml: 2 }}>
                      • Simple interest calculated on the declining balance each month
                    </Typography>
                    <Typography variant="body2" sx={{ ml: 2 }}>
                      • Equal principal payments throughout the loan term
                    </Typography>
                    <Typography variant="body2" sx={{ ml: 2 }}>
                      • Interest calculated on the remaining balance each month
                    </Typography>
                    
                    <Box sx={{ mt: 1, p: 2, bgcolor: alpha(theme.palette.background.default, 0.7), borderRadius: 1 }}>
                      <Typography variant="body2" fontWeight={500}>
                        Example: {formatCurrency(100000)} at 10% monthly for 3 months:
                      </Typography>
                      
                      <Box sx={{ mt: 1.5, ml: 1 }}>
                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                          <strong>Month 1:</strong>
                        </Typography>
                        <Typography variant="body2" sx={{ ml: 2 }}>
                          • Principal payment: {formatCurrency(100000)} ÷ 3 = {formatCurrency(33333.33)}
                        </Typography>
                        <Typography variant="body2" sx={{ ml: 2 }}>
                          • Interest: {formatCurrency(100000)} × 0.10 = {formatCurrency(10000)}
                        </Typography>
                        <Typography variant="body2" sx={{ ml: 2 }}>
                          • Total payment: {formatCurrency(43333.33)}
                        </Typography>
                        <Typography variant="body2" sx={{ ml: 2 }}>
                          • Remaining balance: {formatCurrency(66666.67)}
                        </Typography>

                        <Typography variant="body2" sx={{ mt: 1, mb: 0.5 }}>
                          <strong>Month 2:</strong>
                        </Typography>
                        <Typography variant="body2" sx={{ ml: 2 }}>
                          • Principal payment: {formatCurrency(33333.33)}
                        </Typography>
                        <Typography variant="body2" sx={{ ml: 2 }}>
                          • Interest: {formatCurrency(66666.67)} × 0.10 = {formatCurrency(6666.67)}
                        </Typography>
                        <Typography variant="body2" sx={{ ml: 2 }}>
                          • Total payment: {formatCurrency(40000)}
                        </Typography>
                        <Typography variant="body2" sx={{ ml: 2 }}>
                          • Remaining balance: {formatCurrency(33333.34)}
                        </Typography>

                        <Typography variant="body2" sx={{ mt: 1, mb: 0.5 }}>
                          <strong>Month 3:</strong>
                        </Typography>
                        <Typography variant="body2" sx={{ ml: 2 }}>
                          • Principal payment: {formatCurrency(33333.34)}
                        </Typography>
                        <Typography variant="body2" sx={{ ml: 2 }}>
                          • Interest: {formatCurrency(33333.34)} × 0.10 = {formatCurrency(3333.33)}
                        </Typography>
                        <Typography variant="body2" sx={{ ml: 2 }}>
                          • Total payment: {formatCurrency(36666.67)}
                        </Typography>
                        <Typography variant="body2" sx={{ ml: 2 }}>
                          • Remaining balance: {formatCurrency(0)}
                        </Typography>

                        <Box sx={{ mt: 1.5, pt: 1, borderTop: `1px dashed ${theme.palette.divider}` }}>
                          <Typography variant="body2" fontWeight={500}>
                            Total interest paid: {formatCurrency(10000 + 6666.67 + 3333.33)} = {formatCurrency(20000)}
                          </Typography>
                          <Typography variant="body2" fontWeight={500}>
                            Total repayment: {formatCurrency(100000 + 20000)} = {formatCurrency(120000)}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                    
                    <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic' }}>
                      Note: This approach uses a declining balance method where interest is calculated on the remaining balance each month, not the original principal for the entire term.
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight={500}>For Regular and 1 Year Plus Loans:</Typography>
                    <Typography variant="body2" sx={{ ml: 2 }}>
                      • Amortized interest with reducing balance method
                    </Typography>
                    <Typography variant="body2" sx={{ ml: 2 }}>
                      • Interest is calculated on the outstanding principal each month
                    </Typography>
                    <Typography variant="body2" sx={{ ml: 2 }}>
                      • Monthly payment remains constant throughout the loan term
                    </Typography>
                    <Typography variant="body2" sx={{ ml: 2 }}>
                      • As you pay down the principal, more of each payment goes toward principal and less toward interest
                    </Typography>
                  </Box>
                  
                  <InfoBox sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      When you apply for a loan, our system automatically calculates and displays the full repayment schedule, showing exactly how much of each payment goes toward principal and interest.
                    </Typography>
                  </InfoBox>
                </StyledAccordionDetails>
              </StyledAccordion>
              
              <StyledAccordion
                expanded={expanded === 'panel-repayment-schedule'}
                onChange={handleAccordionChange('panel-repayment-schedule')}
              >
                <StyledAccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography fontWeight={500}>Understanding Your Repayment Schedule</Typography>
                </StyledAccordionSummary>
                <StyledAccordionDetails>
                  <Typography variant="body2" paragraph>
                    Every loan comes with a detailed repayment schedule that shows:
                  </Typography>
                  
                  <Box component="ul" sx={{ pl: 2 }}>
                    <Typography component="li" variant="body2">
                      Due date for each installment
                    </Typography>
                    <Typography component="li" variant="body2">
                      Total amount due for each payment
                    </Typography>
                    <Typography component="li" variant="body2">
                      Breakdown of principal and interest components
                    </Typography>
                    <Typography component="li" variant="body2">
                      Remaining balance after each payment
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" paragraph sx={{ mt: 2 }}>
                    Sample monthly repayment calculation:
                  </Typography>
                  
                  <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ backgroundColor: alpha(theme.palette.primary.main, 0.05) }}>
                          <th style={{ padding: '8px 16px', textAlign: 'left', borderBottom: `1px solid ${theme.palette.divider}` }}>Month</th>
                          <th style={{ padding: '8px 16px', textAlign: 'right', borderBottom: `1px solid ${theme.palette.divider}` }}>Payment</th>
                          <th style={{ padding: '8px 16px', textAlign: 'right', borderBottom: `1px solid ${theme.palette.divider}` }}>Principal</th>
                          <th style={{ padding: '8px 16px', textAlign: 'right', borderBottom: `1px solid ${theme.palette.divider}` }}>Interest</th>
                          <th style={{ padding: '8px 16px', textAlign: 'right', borderBottom: `1px solid ${theme.palette.divider}` }}>Remaining</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ padding: '8px 16px', borderBottom: `1px solid ${theme.palette.divider}` }}>1</td>
                          <td style={{ padding: '8px 16px', textAlign: 'right', borderBottom: `1px solid ${theme.palette.divider}` }}>{formatCurrency(88578)}</td>
                          <td style={{ padding: '8px 16px', textAlign: 'right', borderBottom: `1px solid ${theme.palette.divider}` }}>{formatCurrency(78578)}</td>
                          <td style={{ padding: '8px 16px', textAlign: 'right', borderBottom: `1px solid ${theme.palette.divider}` }}>{formatCurrency(10000)}</td>
                          <td style={{ padding: '8px 16px', textAlign: 'right', borderBottom: `1px solid ${theme.palette.divider}` }}>{formatCurrency(921422)}</td>
                        </tr>
                        <tr style={{ backgroundColor: alpha(theme.palette.background.default, 0.5) }}>
                          <td style={{ padding: '8px 16px', borderBottom: `1px solid ${theme.palette.divider}` }}>2</td>
                          <td style={{ padding: '8px 16px', textAlign: 'right', borderBottom: `1px solid ${theme.palette.divider}` }}>{formatCurrency(88578)}</td>
                          <td style={{ padding: '8px 16px', textAlign: 'right', borderBottom: `1px solid ${theme.palette.divider}` }}>{formatCurrency(79364)}</td>
                          <td style={{ padding: '8px 16px', textAlign: 'right', borderBottom: `1px solid ${theme.palette.divider}` }}>{formatCurrency(9214)}</td>
                          <td style={{ padding: '8px 16px', textAlign: 'right', borderBottom: `1px solid ${theme.palette.divider}` }}>{formatCurrency(842058)}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '8px 16px', borderBottom: `1px solid ${theme.palette.divider}` }}>3</td>
                          <td style={{ padding: '8px 16px', textAlign: 'right', borderBottom: `1px solid ${theme.palette.divider}` }}>{formatCurrency(88578)}</td>
                          <td style={{ padding: '8px 16px', textAlign: 'right', borderBottom: `1px solid ${theme.palette.divider}` }}>{formatCurrency(80157)}</td>
                          <td style={{ padding: '8px 16px', textAlign: 'right', borderBottom: `1px solid ${theme.palette.divider}` }}>{formatCurrency(8421)}</td>
                          <td style={{ padding: '8px 16px', textAlign: 'right', borderBottom: `1px solid ${theme.palette.divider}` }}>{formatCurrency(761901)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </TableContainer>
                  
                  <Typography variant="body2" sx={{ mt: 2 }}>
                    This schedule is automatically generated when you apply for a loan and is available for review throughout the loan term.
                  </Typography>
                </StyledAccordionDetails>
              </StyledAccordion>
              
              <StyledAccordion
                expanded={expanded === 'panel-effective-rates'}
                onChange={handleAccordionChange('panel-effective-rates')}
              >
                <StyledAccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography fontWeight={500}>Effective Interest Rates</Typography>
                </StyledAccordionSummary>
                <StyledAccordionDetails>
                  <Typography variant="body2" paragraph>
                    It's important to understand the difference between nominal and effective interest rates:
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight={500}>Soft Loans:</Typography>
                    <Typography variant="body2" sx={{ ml: 2 }}>
                      • Nominal rate: 10% monthly on declining balance
                    </Typography>
                    <Typography variant="body2" sx={{ ml: 2 }}>
                      • Effective annual rate: Approximately 120% APR
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight={500}>Regular Loans:</Typography>
                    <Typography variant="body2" sx={{ ml: 2 }}>
                      • Nominal rate: 12% per annum
                    </Typography>
                    <Typography variant="body2" sx={{ ml: 2 }}>
                      • Effective rate: 12.68% APR (accounting for monthly compounding)
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight={500}>1 Year Plus Loans:</Typography>
                    <Typography variant="body2" sx={{ ml: 2 }}>
                      • Nominal rate: 15% per annum
                    </Typography>
                    <Typography variant="body2" sx={{ ml: 2 }}>
                      • Effective rate: 16.08% APR (accounting for monthly compounding)
                    </Typography>
                  </Box>
                  
                  <InfoBox sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      These effective rates are provided for transparency. Our interest rates are set to balance affordability for members with the sustainability of our cooperative's lending program.
                    </Typography>
                  </InfoBox>
                </StyledAccordionDetails>
              </StyledAccordion>
              
              <StyledAccordion
                expanded={expanded === 'panel-calculation-example'}
                onChange={handleAccordionChange('panel-calculation-example')}
              >
                <StyledAccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography fontWeight={500}>Loan Calculation Example</Typography>
                </StyledAccordionSummary>
                <StyledAccordionDetails>
                  <Typography variant="body2" paragraph>
                    Let's walk through a complete calculation example for a Regular Loan using the PMT (Payment) formula:
                  </Typography>
                  
                  <Box sx={{ mb: 2, p: 2, bgcolor: alpha(theme.palette.background.default, 0.7), borderRadius: 1 }}>
                    <Typography variant="body2" fontWeight={500}>Loan Details:</Typography>
                    <Typography variant="body2">• Principal amount: {formatCurrency(100000)}</Typography>
                    <Typography variant="body2">• Interest rate: 10% per annum (0.833% monthly)</Typography>
                    <Typography variant="body2">• Loan term: 12 months</Typography>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight={500}>Step 1: Calculate monthly payment using the PMT formula</Typography>
                    <Typography variant="body2" sx={{ ml: 2, fontFamily: 'monospace', my: 1 }}>
                      PMT = P * [r(1+r)^n] / [(1+r)^n - 1]
                    </Typography>
                    <Typography variant="body2" sx={{ ml: 2 }}>
                      Where:
                    </Typography>
                    <Typography variant="body2" sx={{ ml: 4 }}>
                      PMT = Monthly payment
                    </Typography>
                    <Typography variant="body2" sx={{ ml: 4 }}>
                      P = Loan amount ({formatCurrency(100000)})
                    </Typography>
                    <Typography variant="body2" sx={{ ml: 4 }}>
                      r = Monthly interest rate (10% / 12 = 0.833% or 0.00833)
                    </Typography>
                    <Typography variant="body2" sx={{ ml: 4 }}>
                      n = Number of payments (12 months)
                    </Typography>
                    <Typography variant="body2" sx={{ ml: 2, mt: 1 }}>
                      Calculation: {formatCurrency(100000)} * [0.00833(1+0.00833)^12] / [(1+0.00833)^12 - 1] = {formatCurrency(8792.80)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight={500}>Step 2: Create amortization schedule</Typography>
                    <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ backgroundColor: alpha(theme.palette.primary.main, 0.05) }}>
                            <th style={{ padding: '8px 16px', textAlign: 'left', borderBottom: `1px solid ${theme.palette.divider}` }}>Month</th>
                            <th style={{ padding: '8px 16px', textAlign: 'right', borderBottom: `1px solid ${theme.palette.divider}` }}>Payment</th>
                            <th style={{ padding: '8px 16px', textAlign: 'right', borderBottom: `1px solid ${theme.palette.divider}` }}>Principal</th>
                            <th style={{ padding: '8px 16px', textAlign: 'right', borderBottom: `1px solid ${theme.palette.divider}` }}>Interest</th>
                            <th style={{ padding: '8px 16px', textAlign: 'right', borderBottom: `1px solid ${theme.palette.divider}` }}>Remaining</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td style={{ padding: '8px 16px', borderBottom: `1px solid ${theme.palette.divider}` }}>1</td>
                            <td style={{ padding: '8px 16px', textAlign: 'right', borderBottom: `1px solid ${theme.palette.divider}` }}>{formatCurrency(8792.80)}</td>
                            <td style={{ padding: '8px 16px', textAlign: 'right', borderBottom: `1px solid ${theme.palette.divider}` }}>{formatCurrency(7960.47)}</td>
                            <td style={{ padding: '8px 16px', textAlign: 'right', borderBottom: `1px solid ${theme.palette.divider}` }}>{formatCurrency(833.33)}</td>
                            <td style={{ padding: '8px 16px', textAlign: 'right', borderBottom: `1px solid ${theme.palette.divider}` }}>{formatCurrency(92039.53)}</td>
                          </tr>
                          <tr style={{ backgroundColor: alpha(theme.palette.background.default, 0.5) }}>
                            <td style={{ padding: '8px 16px', borderBottom: `1px solid ${theme.palette.divider}` }}>2</td>
                            <td style={{ padding: '8px 16px', textAlign: 'right', borderBottom: `1px solid ${theme.palette.divider}` }}>{formatCurrency(8792.80)}</td>
                            <td style={{ padding: '8px 16px', textAlign: 'right', borderBottom: `1px solid ${theme.palette.divider}` }}>{formatCurrency(8026.74)}</td>
                            <td style={{ padding: '8px 16px', textAlign: 'right', borderBottom: `1px solid ${theme.palette.divider}` }}>{formatCurrency(766.06)}</td>
                            <td style={{ padding: '8px 16px', textAlign: 'right', borderBottom: `1px solid ${theme.palette.divider}` }}>{formatCurrency(84012.79)}</td>
                          </tr>
                          <tr>
                            <td style={{ padding: '8px 16px', borderBottom: `1px solid ${theme.palette.divider}` }}>3</td>
                            <td style={{ padding: '8px 16px', textAlign: 'right', borderBottom: `1px solid ${theme.palette.divider}` }}>{formatCurrency(8792.80)}</td>
                            <td style={{ padding: '8px 16px', textAlign: 'right', borderBottom: `1px solid ${theme.palette.divider}` }}>{formatCurrency(8093.64)}</td>
                            <td style={{ padding: '8px 16px', textAlign: 'right', borderBottom: `1px solid ${theme.palette.divider}` }}>{formatCurrency(699.16)}</td>
                            <td style={{ padding: '8px 16px', textAlign: 'right', borderBottom: `1px solid ${theme.palette.divider}` }}>{formatCurrency(75919.15)}</td>
                          </tr>
                          <tr>
                            <td style={{ padding: '8px 16px', textAlign: 'center', borderBottom: `1px solid ${theme.palette.divider}`, fontStyle: 'italic' }} colSpan={5}>... continues for all 12 months ...</td>
                          </tr>
                          <tr style={{ backgroundColor: alpha(theme.palette.success.main, 0.05) }}>
                            <td style={{ padding: '8px 16px', borderBottom: `1px solid ${theme.palette.divider}` }}>12</td>
                            <td style={{ padding: '8px 16px', textAlign: 'right', borderBottom: `1px solid ${theme.palette.divider}` }}>{formatCurrency(8792.80)}</td>
                            <td style={{ padding: '8px 16px', textAlign: 'right', borderBottom: `1px solid ${theme.palette.divider}` }}>{formatCurrency(8720.07)}</td>
                            <td style={{ padding: '8px 16px', textAlign: 'right', borderBottom: `1px solid ${theme.palette.divider}` }}>{formatCurrency(72.73)}</td>
                            <td style={{ padding: '8px 16px', textAlign: 'right', borderBottom: `1px solid ${theme.palette.divider}` }}>{formatCurrency(0)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </TableContainer>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight={500}>Step 3: Summary</Typography>
                    <Typography variant="body2" sx={{ ml: 2 }}>• Monthly payment: {formatCurrency(8792.80)} (fixed)</Typography>
                    <Typography variant="body2" sx={{ ml: 2 }}>• Total principal: {formatCurrency(100000)}</Typography>
                    <Typography variant="body2" sx={{ ml: 2 }}>• Total interest: {formatCurrency(5513.60)}</Typography>
                    <Typography variant="body2" sx={{ ml: 2 }}>• Total amount repaid: {formatCurrency(105513.60)}</Typography>
                    <Typography variant="body2" sx={{ ml: 2 }}>• Effective cost of credit: 5.51%</Typography>
                  </Box>
                  
                  <Box sx={{ p: 2, bgcolor: alpha(theme.palette.info.main, 0.05), borderRadius: 1 }}>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'flex-start' }}>
                      <InfoIcon fontSize="small" sx={{ mr: 1, mt: 0.5, color: theme.palette.info.main }} />
                      <span>
                        The loan calculator in our system performs these calculations automatically and displays your 
                        full payment schedule at application time. Notice how the monthly payment remains fixed, 
                        but the proportion of principal increases while interest decreases over time.
                      </span>
                    </Typography>
                  </Box>
                </StyledAccordionDetails>
              </StyledAccordion>
              
              <StyledAccordion
                expanded={expanded === 'panel-loan-type-differences'}
                onChange={handleAccordionChange('panel-loan-type-differences')}
              >
                <StyledAccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography fontWeight={500}>Key Differences Between Loan Types</Typography>
                </StyledAccordionSummary>
                <StyledAccordionDetails>
                  <Typography variant="body2" paragraph>
                    Understanding the differences between our loan types helps you choose the best option for your needs:
                  </Typography>
                  
                  <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ backgroundColor: alpha(theme.palette.primary.main, 0.05) }}>
                          <th style={{ padding: '8px 16px', textAlign: 'left', borderBottom: `1px solid ${theme.palette.divider}` }}>Feature</th>
                          <th style={{ padding: '8px 16px', textAlign: 'left', borderBottom: `1px solid ${theme.palette.divider}` }}>Soft Loans</th>
                          <th style={{ padding: '8px 16px', textAlign: 'left', borderBottom: `1px solid ${theme.palette.divider}` }}>Regular Loans</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ padding: '8px 16px', borderBottom: `1px solid ${theme.palette.divider}`, fontWeight: 500 }}>Duration</td>
                          <td style={{ padding: '8px 16px', borderBottom: `1px solid ${theme.palette.divider}` }}>≤ 6 months</td>
                          <td style={{ padding: '8px 16px', borderBottom: `1px solid ${theme.palette.divider}` }}>{'>'} 6 months</td>
                        </tr>
                        <tr style={{ backgroundColor: alpha(theme.palette.background.default, 0.5) }}>
                          <td style={{ padding: '8px 16px', borderBottom: `1px solid ${theme.palette.divider}`, fontWeight: 500 }}>Interest Calculation</td>
                          <td style={{ padding: '8px 16px', borderBottom: `1px solid ${theme.palette.divider}` }}>Simple interest on declining balance</td>
                          <td style={{ padding: '8px 16px', borderBottom: `1px solid ${theme.palette.divider}` }}>Compound interest using PMT formula</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '8px 16px', borderBottom: `1px solid ${theme.palette.divider}`, fontWeight: 500 }}>Payment Schedule</td>
                          <td style={{ padding: '8px 16px', borderBottom: `1px solid ${theme.palette.divider}` }}>Decreasing monthly payments</td>
                          <td style={{ padding: '8px 16px', borderBottom: `1px solid ${theme.palette.divider}` }}>Fixed monthly payments</td>
                        </tr>
                        <tr style={{ backgroundColor: alpha(theme.palette.background.default, 0.5) }}>
                          <td style={{ padding: '8px 16px', borderBottom: `1px solid ${theme.palette.divider}`, fontWeight: 500 }}>Interest Rate Application</td>
                          <td style={{ padding: '8px 16px', borderBottom: `1px solid ${theme.palette.divider}` }}>Applied directly as monthly rate</td>
                          <td style={{ padding: '8px 16px', borderBottom: `1px solid ${theme.palette.divider}` }}>Annual rate divided by 12</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '8px 16px', borderBottom: `1px solid ${theme.palette.divider}`, fontWeight: 500 }}>Principal Payments</td>
                          <td style={{ padding: '8px 16px', borderBottom: `1px solid ${theme.palette.divider}` }}>Equal installments</td>
                          <td style={{ padding: '8px 16px', borderBottom: `1px solid ${theme.palette.divider}` }}>Increases over time</td>
                        </tr>
                        <tr style={{ backgroundColor: alpha(theme.palette.background.default, 0.5) }}>
                          <td style={{ padding: '8px 16px', borderBottom: `1px solid ${theme.palette.divider}`, fontWeight: 500 }}>Interest Payments</td>
                          <td style={{ padding: '8px 16px', borderBottom: `1px solid ${theme.palette.divider}` }}>Decreases over time</td>
                          <td style={{ padding: '8px 16px', borderBottom: `1px solid ${theme.palette.divider}` }}>Decreases over time</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '8px 16px', borderBottom: `1px solid ${theme.palette.divider}`, fontWeight: 500 }}>Eligibility</td>
                          <td style={{ padding: '8px 16px', borderBottom: `1px solid ${theme.palette.divider}` }}>Fixed maximum amount</td>
                          <td style={{ padding: '8px 16px', borderBottom: `1px solid ${theme.palette.divider}` }}>Based on savings multiplier</td>
                        </tr>
                      </tbody>
                    </table>
                  </TableContainer>
                  
                  <Typography variant="body2">
                    This comparison highlights why soft loans are suitable for short-term needs with flexible payments, while regular loans provide predictability with a fixed monthly payment amount.
                  </Typography>
                </StyledAccordionDetails>
              </StyledAccordion>
            </MotionBox>
          </MotionBox>
        </TabPanel>
        
        <TabPanel value={tabValue} index={3}>
          <MotionBox
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <MotionBox variants={itemVariants}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <InfoIcon fontSize="small" sx={{ mr: 1, color: theme.palette.primary.main }} />
                Loan Repayment Guidelines
              </Typography>
              
              <InfoBox>
                <Typography variant="body2">
                  Our cooperative makes loan repayment as convenient as possible while maintaining financial discipline. Understanding your repayment obligations is essential for maintaining good standing.
                </Typography>
              </InfoBox>
              
              <StyledAccordion
                expanded={expanded === 'panel-repayment-methods'}
                onChange={handleAccordionChange('panel-repayment-methods')}
              >
                <StyledAccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography fontWeight={500}>Repayment Methods</Typography>
                </StyledAccordionSummary>
                <StyledAccordionDetails>
                  <Typography variant="body2" paragraph>
                    We offer several convenient methods for loan repayment:
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight={500}>1. Direct Salary Deduction (Recommended)</Typography>
                    <Typography variant="body2" sx={{ ml: 2 }}>
                      • Automatic deduction from your monthly salary
                    </Typography>
                    <Typography variant="body2" sx={{ ml: 2 }}>
                      • Ensures timely payments without manual intervention
                    </Typography>
                    <Typography variant="body2" sx={{ ml: 2 }}>
                      • Requires authorization form submission to HR/Payroll
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight={500}>2. Direct Bank Transfer</Typography>
                    <Typography variant="body2" sx={{ ml: 2 }}>
                      • Transfer to the cooperative's account before due date
                    </Typography>
                    <Typography variant="body2" sx={{ ml: 2 }}>
                      • Use your membership ID and loan ID as reference
                    </Typography>
                    <Typography variant="body2" sx={{ ml: 2 }}>
                      • Notify the cooperative of your payment via the portal
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight={500}>3. Check Payment</Typography>
                    <Typography variant="body2" sx={{ ml: 2 }}>
                      • Post-dated checks may be required for some loan types
                    </Typography>
                    <Typography variant="body2" sx={{ ml: 2 }}>
                      • Submit checks covering the full loan term upon disbursement
                    </Typography>
                  </Box>
                  
                  <InfoBox sx={{ mt: 2 }}>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                      <InfoIcon fontSize="small" sx={{ mr: 1, color: theme.palette.info.main }} />
                      Regardless of payment method, it's your responsibility to ensure payments are made on time. Always retain proof of payment for your records.
                    </Typography>
                  </InfoBox>
                </StyledAccordionDetails>
              </StyledAccordion>
              
              <StyledAccordion
                expanded={expanded === 'panel-late-payments'}
                onChange={handleAccordionChange('panel-late-payments')}
              >
                <StyledAccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography fontWeight={500}>Late Payment Consequences</Typography>
                </StyledAccordionSummary>
                <StyledAccordionDetails>
                  <Typography variant="body2" paragraph>
                    Timely repayment is crucial for our cooperative's financial health. Late payments have the following consequences:
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight={500}>Late Fee Structure:</Typography>
                    <Typography variant="body2" sx={{ ml: 2 }}>
                      • 1-7 days late: 2% of the due installment
                    </Typography>
                    <Typography variant="body2" sx={{ ml: 2 }}>
                      • 8-14 days late: 3% of the due installment
                    </Typography>
                    <Typography variant="body2" sx={{ ml: 2 }}>
                      • 15-30 days late: 5% of the due installment
                    </Typography>
                    <Typography variant="body2" sx={{ ml: 2 }}>
                      • Beyond 30 days: Additional 1% per month on the overdue amount
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight={500}>Default Consequences:</Typography>
                    <Typography variant="body2" sx={{ ml: 2 }}>
                      • Loan marked as "OVERDUE" after 30 days of missed payment
                    </Typography>
                    <Typography variant="body2" sx={{ ml: 2 }}>
                      • Loan marked as "DEFAULTED" after 60 days of missed payment
                    </Typography>
                    <Typography variant="body2" sx={{ ml: 2 }}>
                      • Defaulted loans may lead to:
                    </Typography>
                    <Typography variant="body2" sx={{ ml: 4 }}>
                      - Ineligibility for new loans
                    </Typography>
                    <Typography variant="body2" sx={{ ml: 4 }}>
                      - Deduction from savings to cover outstanding amounts
                    </Typography>
                    <Typography variant="body2" sx={{ ml: 4 }}>
                      - Potential legal action in severe cases
                    </Typography>
                  </Box>
                  
                  <Box sx={{ p: 2, bgcolor: alpha(theme.palette.warning.main, 0.05), borderRadius: 1 }}>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'flex-start' }}>
                      <InfoIcon fontSize="small" sx={{ mr: 1, mt: 0.5, color: theme.palette.warning.main }} />
                      <span>If you anticipate difficulty making a payment, contact the cooperative as soon as possible. We may be able to arrange a repayment plan to help you avoid default.</span>
                    </Typography>
                  </Box>
                </StyledAccordionDetails>
              </StyledAccordion>
              
              <StyledAccordion
                expanded={expanded === 'panel-early-repayment'}
                onChange={handleAccordionChange('panel-early-repayment')}
              >
                <StyledAccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography fontWeight={500}>Early Repayment Options</Typography>
                </StyledAccordionSummary>
                <StyledAccordionDetails>
                  <Typography variant="body2" paragraph>
                    We encourage responsible financial management and offer flexible early repayment options:
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight={500}>Full Early Repayment:</Typography>
                    <Typography variant="body2" sx={{ ml: 2 }}>
                      • You can repay your entire loan balance at any time
                    </Typography>
                    <Typography variant="body2" sx={{ ml: 2 }}>
                      • No early repayment penalty
                    </Typography>
                    <Typography variant="body2" sx={{ ml: 2 }}>
                      • Interest savings on remaining term
                    </Typography>
                    <Typography variant="body2" sx={{ ml: 2 }}>
                      • Request full settlement amount through your account dashboard
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight={500}>Partial Early Repayment:</Typography>
                    <Typography variant="body2" sx={{ ml: 2 }}>
                      • Make additional payments toward principal
                    </Typography>
                    <Typography variant="body2" sx={{ ml: 2 }}>
                      • Minimum additional payment: One full installment amount
                    </Typography>
                    <Typography variant="body2" sx={{ ml: 2 }}>
                      • Options for applying extra payments:
                    </Typography>
                    <Typography variant="body2" sx={{ ml: 4 }}>
                      - Reduce monthly payment (keeps original term)
                    </Typography>
                    <Typography variant="body2" sx={{ ml: 4 }}>
                      - Reduce loan term (keeps original payment)
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" paragraph>
                    To make an early repayment, use the "Make Extra Payment" feature in your loan details page. The system will calculate how the payment affects your loan term or monthly payments based on your preference.
                  </Typography>
                  
                  <InfoBox>
                    <Typography variant="body2">
                      Early repayment can significantly reduce your total interest cost and help you become debt-free sooner. We encourage members to make additional payments whenever possible.
                    </Typography>
                  </InfoBox>
                </StyledAccordionDetails>
              </StyledAccordion>
              
              <StyledAccordion
                expanded={expanded === 'panel-repayment-tracking'}
                onChange={handleAccordionChange('panel-repayment-tracking')}
              >
                <StyledAccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography fontWeight={500}>Tracking Your Repayments</Typography>
                </StyledAccordionSummary>
                <StyledAccordionDetails>
                  <Typography variant="body2" paragraph>
                    Our system provides several ways to track your loan repayment progress:
                  </Typography>
                  
                  <Box component="ul" sx={{ pl: 2 }}>
                    <Typography component="li" variant="body2">
                      <strong>Loan Dashboard:</strong> View all active loans with progress bars showing percentage repaid
                    </Typography>
                    <Typography component="li" variant="body2">
                      <strong>Payment History:</strong> Complete record of all payments made, including dates, amounts, and receipt numbers
                    </Typography>
                    <Typography component="li" variant="body2">
                      <strong>Repayment Schedule:</strong> Interactive schedule showing past and upcoming payments with status indicators
                    </Typography>
                    <Typography component="li" variant="body2">
                      <strong>Monthly Statements:</strong> Detailed statements emailed monthly with all loan activity
                    </Typography>
                    <Typography component="li" variant="body2">
                      <strong>Payment Reminders:</strong> Automatic notifications before payments are due
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" paragraph sx={{ mt: 2 }}>
                    Each payment applied to your loan will update your dashboard in real-time, showing:
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ ml: 2 }}>• Updated outstanding balance</Typography>
                    <Typography variant="body2" sx={{ ml: 2 }}>• Next payment date and amount</Typography>
                    <Typography variant="body2" sx={{ ml: 2 }}>• Principal and interest breakdown</Typography>
                    <Typography variant="body2" sx={{ ml: 2 }}>• Loan completion percentage</Typography>
                  </Box>
                  
                  <Typography variant="body2">
                    If you notice any discrepancies in your payment tracking, please contact the cooperative immediately so we can investigate.
                  </Typography>
                </StyledAccordionDetails>
              </StyledAccordion>
            </MotionBox>
          </MotionBox>
        </TabPanel>
        
        <TabPanel value={tabValue} index={4}>
          <MotionBox
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <MotionBox variants={itemVariants}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <InfoIcon fontSize="small" sx={{ mr: 1, color: theme.palette.primary.main }} />
                Loan Application Process
              </Typography>
              
              <InfoBox>
                <Typography variant="body2">
                  Our loan application process is designed to be straightforward while ensuring proper review and approval. Understanding each step helps set expectations for timing and requirements.
                </Typography>
              </InfoBox>
              
              <Box sx={{ mt: 3, mb: 4 }}>
                <Typography variant="body1" gutterBottom>
                  Loan Application Life Cycle
                </Typography>
                
                <Box sx={{ 
                  position: 'relative',
                  mt: 2,
                  '&:before': {
                    content: '""',
                    position: 'absolute',
                    top: 40,
                    left: 'calc(5% - 1px)',
                    height: 'calc(100% - 80px)',
                    width: '2px',
                    bgcolor: theme.palette.primary.light,
                    opacity: 0.3,
                    zIndex: 0
                  }
                }}>
                  {/* Application Step */}
                  <Box sx={{ display: 'flex', mb: 3, position: 'relative' }}>
                    <Box sx={{ 
                      width: 40, 
                      height: 40, 
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      mr: 2,
                      border: `2px solid ${theme.palette.primary.main}`,
                      zIndex: 1
                    }}>
                      <Typography variant="body1" fontWeight={600} color="primary.main">1</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body1" fontWeight={500}>
                        Application Submission
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Member completes and submits the loan application form, specifying loan type, amount, term, and purpose.
                      </Typography>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        mt: 1,
                        color: 'text.secondary',
                        fontSize: '0.875rem'
                      }}>
                        <ArrowRight fontSize="small" sx={{ mr: 1, fontSize: 16, opacity: 0.7 }} />
                        Status: <Chip size="small" label="PENDING" sx={{ ml: 1, height: 20, fontSize: '0.75rem' }} />
                      </Box>
                    </Box>
                  </Box>
                  
                  {/* Admin Review Step */}
                  <Box sx={{ display: 'flex', mb: 3, position: 'relative' }}>
                    <Box sx={{ 
                      width: 40, 
                      height: 40, 
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      mr: 2,
                      border: `2px solid ${theme.palette.primary.main}`,
                      zIndex: 1
                    }}>
                      <Typography variant="body1" fontWeight={600} color="primary.main">2</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body1" fontWeight={500}>
                        Initial Review (Admin)
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Administrative officer validates application details, checks eligibility criteria, and reviews documentation.
                      </Typography>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        mt: 1,
                        color: 'text.secondary',
                        fontSize: '0.875rem'
                      }}>
                        <ArrowRight fontSize="small" sx={{ mr: 1, fontSize: 16, opacity: 0.7 }} />
                        Status: <Chip size="small" label="IN_REVIEW" sx={{ ml: 1, height: 20, fontSize: '0.75rem' }} />
                      </Box>
                    </Box>
                  </Box>
                  
                  {/* Financial Review Step */}
                  <Box sx={{ display: 'flex', mb: 3, position: 'relative' }}>
                    <Box sx={{ 
                      width: 40, 
                      height: 40, 
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      mr: 2,
                      border: `2px solid ${theme.palette.primary.main}`,
                      zIndex: 1
                    }}>
                      <Typography variant="body1" fontWeight={600} color="primary.main">3</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body1" fontWeight={500}>
                        Financial Review (Treasurer)
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Treasurer reviews financial aspects, verifies savings balance, existing loans, and confirms repayment capacity.
                      </Typography>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        mt: 1,
                        color: 'text.secondary',
                        fontSize: '0.875rem'
                      }}>
                        <ArrowRight fontSize="small" sx={{ mr: 1, fontSize: 16, opacity: 0.7 }} />
                        Status: <Chip size="small" label="REVIEWED" sx={{ ml: 1, height: 20, fontSize: '0.75rem' }} />
                      </Box>
                    </Box>
                  </Box>
                  
                  {/* Final Approval Step */}
                  <Box sx={{ display: 'flex', mb: 3, position: 'relative' }}>
                    <Box sx={{ 
                      width: 40, 
                      height: 40, 
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      mr: 2,
                      border: `2px solid ${theme.palette.primary.main}`,
                      zIndex: 1
                    }}>
                      <Typography variant="body1" fontWeight={600} color="primary.main">4</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body1" fontWeight={500}>
                        Final Approval (Chairman)
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Chairman reviews the complete application and approves or rejects the loan based on all requirements and assessments.
                      </Typography>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        mt: 1,
                        color: 'text.secondary',
                        fontSize: '0.875rem'
                      }}>
                        <ArrowRight fontSize="small" sx={{ mr: 1, fontSize: 16, opacity: 0.7 }} />
                        Status: <Chip size="small" label="APPROVED" sx={{ ml: 1, height: 20, fontSize: '0.75rem' }} />
                      </Box>
                    </Box>
                  </Box>
                  
                  {/* Disbursement Step */}
                  <Box sx={{ display: 'flex', position: 'relative' }}>
                    <Box sx={{ 
                      width: 40, 
                      height: 40, 
                      bgcolor: alpha(theme.palette.success.main, 0.1),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      mr: 2,
                      border: `2px solid ${theme.palette.success.main}`,
                      zIndex: 1
                    }}>
                      <Typography variant="body1" fontWeight={600} color="success.main">5</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body1" fontWeight={500}>
                        Disbursement
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Approved loan funds are transferred to the member's bank account. Repayment schedule commences from the date of disbursement.
                      </Typography>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        mt: 1,
                        color: 'text.secondary',
                        fontSize: '0.875rem'
                      }}>
                        <ArrowRight fontSize="small" sx={{ mr: 1, fontSize: 16, opacity: 0.7 }} />
                        Status: <Chip 
                          size="small" 
                          label="DISBURSED" 
                          sx={{ ml: 1, height: 20, fontSize: '0.75rem', bgcolor: alpha(theme.palette.success.main, 0.1), color: theme.palette.success.dark }} 
                        />
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Box>
              
              <StyledAccordion
                expanded={expanded === 'panel-application-requirements'}
                onChange={handleAccordionChange('panel-application-requirements')}
              >
                <StyledAccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography fontWeight={500}>Application Requirements</Typography>
                </StyledAccordionSummary>
                <StyledAccordionDetails>
                  <Typography variant="body2" paragraph>
                    To apply for a loan, you'll need to provide the following:
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight={500}>Required for All Loan Types:</Typography>
                    <Box component="ul" sx={{ pl: 2 }}>
                      <Typography component="li" variant="body2">Completed online loan application form</Typography>
                      <Typography component="li" variant="body2">Detailed purpose of the loan</Typography>
                      <Typography component="li" variant="body2">Preferred loan term (number of months)</Typography>
                      <Typography component="li" variant="body2">Preferred repayment method</Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight={500}>Additional Requirements for Regular Loans (Optional):</Typography>
                    <Box component="ul" sx={{ pl: 2 }}>
                      <Typography component="li" variant="body2">Supporting documents related to loan purpose (e.g., quotations, invoices)</Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight={500}>Additional Requirements for 1 Year Plus Loans:</Typography>
                    <Box component="ul" sx={{ pl: 2 }}>
                      <Typography component="li" variant="body2">Supporting documents related to loan purpose</Typography>
                      <Typography component="li" variant="body2">Budget plan for the loan funds</Typography>
                      <Typography component="li" variant="body2">Repayment plan overview</Typography>
                    </Box>
                  </Box>
                  
                  <Typography variant="body2">
                    Our online application system will guide you through the required fields and document uploads based on your selected loan type.
                  </Typography>
                </StyledAccordionDetails>
              </StyledAccordion>
              
              <StyledAccordion
                expanded={expanded === 'panel-application-review'}
                onChange={handleAccordionChange('panel-application-review')}
              >
                <StyledAccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography fontWeight={500}>Application Review Process</Typography>
                </StyledAccordionSummary>
                <StyledAccordionDetails>
                  <Typography variant="body2" paragraph>
                    After submission, your loan application undergoes multiple review levels:
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight={500}>Automated System Checks:</Typography>
                    <Box component="ul" sx={{ pl: 2 }}>
                      <Typography component="li" variant="body2">Verification of membership status and duration</Typography>
                      <Typography component="li" variant="body2">Savings balance verification</Typography>
                      <Typography component="li" variant="body2">Existing loan obligations assessment</Typography>
                      <Typography component="li" variant="body2">Calculation of maximum eligible loan amount</Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight={500}>Administrative Review:</Typography>
                    <Box component="ul" sx={{ pl: 2 }}>
                      <Typography component="li" variant="body2">Verification of application completeness</Typography>
                      <Typography component="li" variant="body2">Initial assessment of loan purpose suitability</Typography>
                      <Typography component="li" variant="body2">Validation of supporting documents (if applicable)</Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight={500}>Financial Review:</Typography>
                    <Box component="ul" sx={{ pl: 2 }}>
                      <Typography component="li" variant="body2">Detailed assessment of member's financial standing</Typography>
                      <Typography component="li" variant="body2">Verification of repayment capacity</Typography>
                      <Typography component="li" variant="body2">Risk assessment based on savings history</Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight={500}>Final Approval:</Typography>
                    <Box component="ul" sx={{ pl: 2 }}>
                      <Typography component="li" variant="body2">Review of all previous assessments</Typography>
                      <Typography component="li" variant="body2">Final decision on loan approval</Typography>
                      <Typography component="li" variant="body2">Determination of any special conditions (if applicable)</Typography>
                    </Box>
                  </Box>
                  
                  <Typography variant="body2">
                    You'll receive notifications at each stage of the approval process through the online portal and via email.
                  </Typography>
                </StyledAccordionDetails>
              </StyledAccordion>
              
              <StyledAccordion
                expanded={expanded === 'panel-application-tracking'}
                onChange={handleAccordionChange('panel-application-tracking')}
              >
                <StyledAccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography fontWeight={500}>Tracking Your Loan Application</Typography>
                </StyledAccordionSummary>
                <StyledAccordionDetails>
                  <Typography variant="body2" paragraph>
                    You can track your loan application status at any time through your member dashboard:
                  </Typography>
                  
                  <Box component="ul" sx={{ pl: 2 }}>
                    <Typography component="li" variant="body2">
                      <strong>Application Dashboard:</strong> View all your loan applications and their current statuses
                    </Typography>
                    <Typography component="li" variant="body2">
                      <strong>Status Updates:</strong> Receive real-time notifications when your application status changes
                    </Typography>
                    <Typography component="li" variant="body2">
                      <strong>Review Comments:</strong> Access feedback or requests for additional information from reviewers
                    </Typography>
                    <Typography component="li" variant="body2">
                      <strong>Approval Timeline:</strong> See estimated completion dates for each approval stage
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mt: 2, mb: 2, p: 2, bgcolor: theme.palette.grey[50], borderRadius: 1, border: `1px solid ${theme.palette.divider}` }}>
                    <Typography variant="body2" fontWeight={500} gutterBottom>Loan Application Statuses:</Typography>
                    
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          mb: 1,
                          p: 1, 
                          borderRadius: 1,
                          bgcolor: alpha(theme.palette.primary.light, 0.1)
                        }}>
                          <Chip 
                            size="small" 
                            label="PENDING" 
                            sx={{ 
                              mr: 1, 
                              minWidth: 90,
                              bgcolor: alpha(theme.palette.primary.light, 0.2),
                              color: theme.palette.primary.dark,
                              fontWeight: 500
                            }} 
                          />
                          <Typography variant="body2">Just submitted</Typography>
                        </Box>
                      </Grid>
                      
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          mb: 1,
                          p: 1, 
                          borderRadius: 1,
                          bgcolor: alpha(theme.palette.info.light, 0.1)
                        }}>
                          <Chip 
                            size="small" 
                            label="IN REVIEW" 
                            sx={{ 
                              mr: 1, 
                              minWidth: 90,
                              bgcolor: alpha(theme.palette.info.light, 0.2),
                              color: theme.palette.info.dark,
                              fontWeight: 500
                            }} 
                          />
                          <Typography variant="body2">Under assessment</Typography>
                        </Box>
                      </Grid>
                      
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          mb: 1,
                          p: 1, 
                          borderRadius: 1,
                          bgcolor: alpha(theme.palette.warning.light, 0.1)
                        }}>
                          <Chip 
                            size="small" 
                            label="REVIEWED" 
                            sx={{ 
                              mr: 1,
                              minWidth: 90, 
                              bgcolor: alpha(theme.palette.warning.light, 0.2),
                              color: theme.palette.warning.dark,
                              fontWeight: 500
                            }} 
                          />
                          <Typography variant="body2">Ready for approval</Typography>
                        </Box>
                      </Grid>
                      
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          mb: 1,
                          p: 1, 
                          borderRadius: 1,
                          bgcolor: alpha(theme.palette.success.light, 0.1)
                        }}>
                          <Chip 
                            size="small" 
                            label="APPROVED" 
                            sx={{ 
                              mr: 1,
                              minWidth: 90, 
                              bgcolor: alpha(theme.palette.success.light, 0.2),
                              color: theme.palette.success.dark,
                              fontWeight: 500
                            }} 
                          />
                          <Typography variant="body2">Loan approved</Typography>
                        </Box>
                      </Grid>
                      
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          mb: 1,
                          p: 1, 
                          borderRadius: 1,
                          bgcolor: alpha(theme.palette.error.light, 0.1)
                        }}>
                          <Chip 
                            size="small" 
                            label="REJECTED" 
                            sx={{ 
                              mr: 1,
                              minWidth: 90, 
                              bgcolor: alpha(theme.palette.error.light, 0.2),
                              color: theme.palette.error.dark,
                              fontWeight: 500
                            }} 
                          />
                          <Typography variant="body2">Not approved</Typography>
                        </Box>
                      </Grid>
                      
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          mb: 1,
                          p: 1, 
                          borderRadius: 1,
                          bgcolor: alpha(theme.palette.success.light, 0.1)
                        }}>
                          <Chip 
                            size="small" 
                            label="DISBURSED" 
                            sx={{ 
                              mr: 1,
                              minWidth: 90, 
                              bgcolor: alpha(theme.palette.success.light, 0.2),
                              color: theme.palette.success.dark,
                              fontWeight: 500
                            }} 
                          />
                          <Typography variant="body2">Funds sent</Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                  
                  <Typography variant="body2">
                    If your application status hasn't changed for more than 5 business days, you can use the "Contact Support" feature to request an update.
                  </Typography>
                </StyledAccordionDetails>
              </StyledAccordion>
              
              <StyledAccordion
                expanded={expanded === 'panel-application-tips'}
                onChange={handleAccordionChange('panel-application-tips')}
              >
                <StyledAccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography fontWeight={500}>Tips for Successful Loan Approval</Typography>
                </StyledAccordionSummary>
                <StyledAccordionDetails>
                  <Typography variant="body2" paragraph>
                    Follow these best practices to increase your chances of loan approval:
                  </Typography>
                  
                  <Box component="ul" sx={{ pl: 2 }}>
                    <Typography component="li" variant="body2">
                      <strong>Maintain consistent savings:</strong> Regular savings contributions strengthen your application
                    </Typography>
                    <Typography component="li" variant="body2">
                      <strong>Be specific about loan purpose:</strong> Clearly explain how you plan to use the funds
                    </Typography>
                    <Typography component="li" variant="body2">
                      <strong>Request only what you need:</strong> Avoid applying for the maximum amount if you don't need it
                    </Typography>
                    <Typography component="li" variant="body2">
                      <strong>Choose an appropriate term:</strong> Select a repayment period that balances affordability with total interest cost
                    </Typography>
                    <Typography component="li" variant="body2">
                      <strong>Plan for repayment:</strong> Have a clear plan for how you'll meet your repayment obligations
                    </Typography>
                    <Typography component="li" variant="body2">
                      <strong>Resolve existing issues:</strong> Address any outstanding loans or payment issues before applying
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mt: 2, p: 2, bgcolor: alpha(theme.palette.info.main, 0.05), borderRadius: 1 }}>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'flex-start' }}>
                      <InfoIcon fontSize="small" sx={{ mr: 1, mt: 0.5, color: theme.palette.info.main }} />
                      <span>If your application is rejected, you'll receive detailed feedback on the reasons. You can address these issues and reapply after 30 days.</span>
                    </Typography>
                  </Box>
                </StyledAccordionDetails>
              </StyledAccordion>
            </MotionBox>
          </MotionBox>
        </TabPanel>
      </DialogContent>
    </Dialog>
  );
}