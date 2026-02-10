'use client';

import {useMemo, useState, useEffect} from 'react';
import {
  Dialog, DialogTitle, DialogContent, Stepper, Step, StepLabel,
  Box, Button, Typography, TextField, MenuItem, Alert,
  Grid, CircularProgress, Divider, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { loanService } from '@/lib/api';
import { formatCurrency } from '@/utils/formatting/format';
import { format } from 'date-fns';
import type { LoanType, LoanCalculation } from '@/types/loan.types';
import { useToast } from '@/components/molecules/Toast';

// Custom hook to debounce a value
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}


// Add new type definitions
// interface LoanType {
//   id: string;
//   name: string;
//   amount: number;
//   description: string;
//   interestRate: string;
//   minDuration: number;
//   maxDuration: number;
//   maxLoanAmount: string;
//   savingsMultiplier: string;
//   isActive: boolean;
//   requiresApproval: boolean;
// }

// API response is wrapped by ApiResponse.success, so structure is:
// { success, status, message, data: EligibilityServiceResponse }
interface EligibilityResponse {
  success: boolean;
  status?: string;
  message?: string;
  data: {
    success: boolean;
    data: {
      isEligible: boolean;
      maxAmount: string;
      formattedMaxAmount: string;
      reason?: string;
      savingsSummary?: {
        totalSavingsAmount: string;
        formattedTotalSavings: string;
      };
      loanTypeDetails?: {
        name: string;
        interestRate: number;
        duration: {
          min: number;
          max: number;
        };
      };
      activeLoans: {
        hasSoftLoan: boolean;
        hasRegularLoan: boolean;
        hasOneYearPlusLoan: boolean;
      };
    };
  };
}

// API response wrapper for calculation (wrapped by ApiResponse.success)
interface LoanCalculationResponse {
  success?: boolean;
  message?: string;
  data: LoanCalculation & {
    schedule: Array<{
      paymentNumber: number;
      paymentDate: string;
      principalAmount: number;
      interestAmount: number;
      totalPayment: number;
      remainingBalance: number;
    }>;
  };
}

interface SelectLoanTypeProps {
  formik: any;
  loanTypes: LoanType[];
}

interface EnterLoanDetailsProps {
  formik: any;
  calculation: LoanCalculationResponse | undefined;
  eligibility: EligibilityResponse | undefined;
  loanTypes: LoanType[];
}

interface ReviewLoanProps {
  formik: any;
  calculation: LoanCalculationResponse | undefined;
  loanTypes: LoanType[];
}

interface Payment {
  paymentDate: string;
  paymentNumber: number;
  principalAmount: number;
  remainingBalance: string;
  interestAmount: number;
  expectedAmount: number;
}

// Helper function to get amount validation error
const getAmountError = (
  formik: any,
  eligibility: EligibilityResponse | undefined,
  isSoftLoan: boolean
): { hasError: boolean; message: string } => {
  const amount = Number(formik.values.loanAmount);
  const maxAmount = Number(eligibility?.data?.data?.maxAmount || 0);
  const softLoanMax = 500000;

  // Check Yup validation errors first
  if (formik.touched.loanAmount && formik.errors.loanAmount) {
    return { hasError: true, message: String(formik.errors.loanAmount) };
  }

  // Check loan type specific validation
  if (amount > 0) {
    if (amount < 1000) {
      return { hasError: true, message: 'Minimum loan amount is ₦1,000' };
    }
    if (isSoftLoan && amount > softLoanMax) {
      return { hasError: true, message: `Soft loan maximum is ${formatCurrency(softLoanMax)}` };
    }
    if (!isSoftLoan && maxAmount > 0 && amount > maxAmount) {
      return { hasError: true, message: `Maximum eligible amount is ${formatCurrency(maxAmount)}` };
    }
  }

  // Return helper text when no error
  const maxDisplay = isSoftLoan
    ? formatCurrency(softLoanMax)
    : (maxAmount > 0 ? formatCurrency(maxAmount) : 'Based on your savings');
  return { hasError: false, message: `Maximum: ${maxDisplay}` };
};


// Step 1: Select Loan Type
const SelectLoanType: React.FC<SelectLoanTypeProps> = ({ formik, loanTypes }) => {
    if (!Array.isArray(loanTypes)) {
    return <Typography color="error">Loan types data is not available.</Typography>;
  }
  const selectedType = (loanTypes || []).find(t => t.id === formik.values.loanTypeId);
  // const isSoftLoan = selectedType?.maxDuration <= 6;
  const isSoftLoan = selectedType && selectedType.maxDuration <= 6;

  // ...
// };

// const SelectLoanType: React.FC<SelectLoanTypeProps> = ({ formik, loanTypes }) => {
// // const SelectLoanType = ({ formik, loanTypes }) => {
//   const selectedType = loanTypes?.find(t => t.id === formik.values.loanTypeId);
//   const isSoftLoan = selectedType?.maxDuration <= 6;

  return (
    <Box sx={{ mt: 2 }}>
    <Typography variant="subtitle1" gutterBottom>
    Select the type of loan you wish to apply for:
    </Typography>
    <TextField
    fullWidth
    select
    label="Loan Type"
    name="loanTypeId"
    value={formik.values.loanTypeId}
    onChange={formik.handleChange}
    error={formik.touched.loanTypeId && Boolean(formik.errors.loanTypeId)}
    helperText={formik.touched.loanTypeId && formik.errors.loanTypeId}
    >
    {/* {loanTypes?.map((type) => (
      <MenuItem key={type.id} value={type.id}>
      {type.name} - {Number(type.interestRate) * 100}%
      {type.maxDuration <= 6 ? ' monthly' : ' p.a.'}
      </MenuItem>
    ))} */}
    {loanTypes?.map((type: LoanType) => (
     <MenuItem key={type.id} value={type.id}>
       {type.name} - {Number(type.interestRate) * 100}%
       {type.maxDuration <= 6 ? ' monthly' : ' p.a.'}
     </MenuItem>
   ))}

    </TextField>

    {selectedType && (
      <Box sx={{ mt: 2 }}>
      <Typography variant="body2" color="text.secondary">
      Selected loan type details:
      </Typography>
      <Typography variant="body2">
      • Interest Rate: {Number(selectedType.interestRate) * 100}%
      {isSoftLoan ? ' monthly' : ' per annum'}
      </Typography>
      <Typography variant="body2">
      • Tenure: {selectedType.minDuration}-{selectedType.maxDuration} months
      </Typography>
      <Typography variant="body2">
      • Maximum Amount: {isSoftLoan ?
        '₦500,000' :
        '3x your total savings'}
        </Typography>
        </Box>
      )}
      </Box>
    );
  };

  // Enhanced EnterLoanDetails component with detailed calculation breakdown
const EnterLoanDetails: React.FC<EnterLoanDetailsProps> = ({ formik, calculation, eligibility, loanTypes }) => {
  // const EnterLoanDetails = ({ formik, calculation, eligibility, loanTypes }) => {
    const selectedLoanType = loanTypes?.find(t => t.id === formik.values.loanTypeId);
    const isSoftLoan = selectedLoanType && selectedLoanType.maxDuration <= 6;
    // const isSoftLoan = selectedLoanType?.maxDuration <= 6;

    // Generate tenure options based on selected loan type
    const tenureOptions = selectedLoanType ? Array.from(
      { length: selectedLoanType.maxDuration - selectedLoanType.minDuration + 1 },
      (_, i) => selectedLoanType.minDuration + i
    ) : [];


    console.log(
        "eligibility",
        eligibility,
        Number(eligibility?.data?.data?.maxAmount), selectedLoanType);
    return (
      <Box sx={{ mt: 2 }}>
      <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 6 }}>
      <TextField
      fullWidth
      label="Loan Amount"
      name="loanAmount"
      type="number"
      value={formik.values.loanAmount}
      onChange={formik.handleChange}
      onBlur={formik.handleBlur}
      error={getAmountError(formik, eligibility, isSoftLoan).hasError}
      helperText={getAmountError(formik, eligibility, isSoftLoan).message}
      InputProps={{
        startAdornment: <Typography sx={{ mr: 1 }}>₦</Typography>,
        inputProps: {
          min: 1000,
          max: isSoftLoan ? 500000 : undefined
        }
      }}
      />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
      <TextField
      fullWidth
      select
      label="Loan Tenure (months)"
      name="loanTenure"
      value={formik.values.loanTenure}
      onChange={formik.handleChange}
      onBlur={formik.handleBlur}
      error={formik.touched.loanTenure && Boolean(formik.errors.loanTenure)}
      helperText={
        (formik.touched.loanTenure && formik.errors.loanTenure) ||
        `Select between ${selectedLoanType?.minDuration} to ${selectedLoanType?.maxDuration} months`
      }
      >
      {tenureOptions.map((months) => (
        <MenuItem key={months} value={months}>
        {months} {months === 1 ? 'month' : 'months'}
        </MenuItem>
      ))}
      </TextField>
      </Grid>
      </Grid>

      {eligibility && (
        <Alert
        severity={eligibility.data?.data?.isEligible ? "success" : "warning"}
        sx={{ mt: 2 }}
        >
        {eligibility.data?.data?.reason ||
          `You are eligible for up to ${eligibility.data?.data?.formattedMaxAmount}`}
          </Alert>
        )}

        {/* Loan type specific info */}
        {selectedLoanType && (
          <Alert severity="info" sx={{ mt: 2 }}>
            {isSoftLoan ? (
              <>
                <strong>Soft Loan:</strong> Total repayment includes principal + interest. Maximum amount is ₦500,000.
              </>
            ) : (
              <>
                <strong>Regular Loan:</strong> Monthly repayment is calculated on principal only. Interest is displayed for reference.
              </>
            )}
          </Alert>
        )}

        {calculation && (
          <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
          Loan Calculation Summary
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {/* Basic Information */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12 }}>
          <Typography variant="subtitle2" color="primary" gutterBottom>
          Basic Information
          </Typography>
          </Grid>
          <Grid size={{ xs: 6 }}>
          <Typography variant="body2" color="text.secondary">Principal Amount</Typography>
          <Typography variant="body1">{formatCurrency(Number(formik.values.loanAmount))}</Typography>
          </Grid>
          <Grid size={{ xs: 6 }}>
          <Typography variant="body2" color="text.secondary">Loan Type</Typography>
          <Typography variant="body1">{selectedLoanType?.name}</Typography>
          </Grid>
          <Grid size={{ xs: 6 }}>
          <Typography variant="body2" color="text.secondary">Interest Rate</Typography>
          <Typography variant="body1">
          {Number(selectedLoanType?.interestRate) * 100}%
          {isSoftLoan ? ' monthly' : ' per annum'}
          </Typography>
          </Grid>
          <Grid size={{ xs: 6 }}>
          <Typography variant="body2" color="text.secondary">Tenure</Typography>
          <Typography variant="body1">{formik.values.loanTenure} months</Typography>
          </Grid>
          </Grid>

          {/* Payment Details */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12 }}>
          <Typography variant="subtitle2" color="primary" gutterBottom>
          Payment Details
          </Typography>
          </Grid>
          <Grid size={{ xs: 6 }}>
          <Typography variant="body2" color="text.secondary">Monthly Payment</Typography>
          <Typography variant="h6" color="primary">
          {formatCurrency(calculation?.data?.monthlyPayment)}
          </Typography>
          </Grid>
          <Grid size={{ xs: 6 }}>
          <Typography variant="body2" color="text.secondary">Number of Payments</Typography>
          <Typography variant="body1">{formik.values.loanTenure}</Typography>
          </Grid>
          </Grid>

          {/* Cost Breakdown */}
          <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
          <Typography variant="subtitle2" color="primary" gutterBottom>
          Cost Breakdown
          </Typography>
          </Grid>
          <Grid size={{ xs: 6 }}>
          <Typography variant="body2" color="text.secondary">Principal Amount</Typography>
          <Typography variant="body1">{formatCurrency(Number(formik.values.loanAmount))}</Typography>
          </Grid>
          <Grid size={{ xs: 6 }}>
          <Typography variant="body2" color="text.secondary">Total Interest</Typography>
          <Typography variant="body1">{formatCurrency(calculation?.data?.totalInterest)}</Typography>
          {/*<Typography variant="body1">{Number(eligibility?.data.data.maxAmount}</Typography>*/}
          </Grid>
          <Grid size={{ xs: 12 }}>
          <Divider sx={{ my: 1 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
          <Typography variant="h5" color="primary">Total Amount Payable</Typography>
          <Typography variant="h4" color="primary">
          {formatCurrency(calculation?.data?.totalRepayment)}
          </Typography>
          </Box>
          </Grid>
          </Grid>

          {/* Payment Schedule Preview */}
          {calculation?.data?.schedule && calculation.data.schedule.length > 0 && (
            <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" color="primary" gutterBottom>
            First 3 Payments Preview
            </Typography>
            <TableContainer component={Paper} variant="outlined">
            <Table size="small">
            <TableHead>
            <TableRow>
            <TableCell>Due Date</TableCell>
            <TableCell align="right">Principal</TableCell>
            <TableCell align="right">Interest</TableCell>
            <TableCell align="right">Total</TableCell>
            </TableRow>
            </TableHead>
            <TableBody>
            {calculation.data.schedule.slice(0, 3).map((payment, index) => (
              <TableRow key={index}>
              <TableCell>{format(new Date(payment.paymentDate), 'MMM dd, yyyy')}</TableCell>
              <TableCell align="right">{formatCurrency(payment.principalAmount)}</TableCell>
              <TableCell align="right">{formatCurrency(payment.interestAmount)}</TableCell>
              <TableCell align="right">{formatCurrency(payment.totalPayment)}</TableCell>
              </TableRow>
            ))}
            </TableBody>
            </Table>
            </TableContainer>
            </Box>
          )}
          </Box>
        )}
        </Box>
      );
    };

    // Step 3: Review & Submit
const ReviewLoan: React.FC<ReviewLoanProps> = ({ formik, calculation, loanTypes }) => {
    // const ReviewLoan = ({ formik, calculation, loanTypes }) => {
      const selectedLoanType = loanTypes?.find(t => t.id === formik.values.loanTypeId);

      return (
        <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
        Please review your loan application details:
        </Typography>
        <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
        <TextField
        fullWidth
        multiline
        rows={4}
        label="Loan Purpose"
        name="loanPurpose"
        value={formik.values.loanPurpose}
        onChange={formik.handleChange}
        error={formik.touched.loanPurpose && Boolean(formik.errors.loanPurpose)}
        helperText={formik.touched.loanPurpose && formik.errors.loanPurpose}
        />
        </Grid>
        </Grid>

        <Box sx={{ mt: 3, bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
        <Typography variant="subtitle2" gutterBottom>Application Summary</Typography>
        <Grid container spacing={2}>
        <Grid size={{ xs: 6 }}>
        <Typography variant="body2" color="text.secondary">Loan Type</Typography>
        <Typography variant="body1" color="text.secondary">{selectedLoanType?.name}</Typography>
        </Grid>
        <Grid size={{ xs: 6 }}>
        <Typography variant="body2" color="text.secondary">Amount</Typography>
        <Typography variant="body1" color="text.secondary">{formatCurrency(formik.values.loanAmount)}</Typography>
        </Grid>
        <Grid size={{ xs: 6 }}>
        <Typography variant="body2" color="text.secondary">Tenure</Typography>
        <Typography variant="body1" color="text.secondary">{formik.values.loanTenure} months</Typography>
        </Grid>
        <Grid size={{ xs: 6 }}>
        <Typography variant="body2" color="text.secondary">Monthly Payment</Typography>
        <Typography variant="body1" color="text.secondary">{formatCurrency(calculation?.data.monthlyPayment)}</Typography>
        </Grid>
        </Grid>
        </Box>
        </Box>
      );
    };

export function LoanApplicationModal({ open, onClose }: { open: boolean; onClose: () => void }) {
      const [activeStep, setActiveStep] = useState(0);
      const queryClient = useQueryClient();
      const toast = useToast();


    const formik = useFormik({
        initialValues: {
            loanTypeId: '',
            loanAmount: '',
            loanTenure: '',
            loanPurpose: ''
        },
        enableReinitialize: true,
        validateOnMount: true,
        validationSchema: [
            // Step 1: Loan Type Selection
            Yup.object({
                loanTypeId: Yup.string().required('Please select a loan type')
            }),
            // Step 2: Amount and Tenure
            Yup.object({
                loanAmount: Yup.number()
                    .required('Amount is required')
                    .positive('Amount must be positive')
                    .min(1000, 'Minimum loan amount is ₦1,000')
                    .max(500000000, 'Amount exceeds maximum limit'),
                loanTenure: Yup.number()
                    .required('Tenure is required')
                    .min(1, 'Tenure must be at least 1 month')
                    .max(36, 'Tenure cannot exceed 36 months')
            }),
            // Step 3: Purpose
            Yup.object({
                loanPurpose: Yup.string()
                    .required('Purpose is required')
                    .min(10, 'Please provide more details about the purpose')
            })
        ][activeStep],
        onSubmit: (values) => {
            if (activeStep === 2) {
                // Final validation before submission
                const amount = Number(values.loanAmount);
                const tenure = Number(values.loanTenure);
                const maxAmount = Number(eligibility?.data?.data?.maxAmount || 0);

                // Get selected loan type for validation
                const selectedType = loanTypes?.find(t => t.id === values.loanTypeId);
                const isSoftLoanType = selectedType && selectedType.maxDuration <= 6;

                // Soft loan cap at 500,000
                if (isSoftLoanType && amount > 500000) {
                    toast.error('Soft loan maximum amount is ₦500,000');
                    return;
                }

                // Eligibility check
                if (eligibility?.data?.data && !eligibility.data.data.isEligible) {
                    toast.error(eligibility.data.data.reason || 'You are not eligible for this loan');
                    return;
                }

                // Max amount check for regular loans
                if (!isSoftLoanType && maxAmount > 0 && amount > maxAmount) {
                    toast.error(`Loan amount exceeds maximum eligible amount of ${formatCurrency(maxAmount)}`);
                    return;
                }

                // Tenure validation
                if (selectedType) {
                    if (tenure < selectedType.minDuration || tenure > selectedType.maxDuration) {
                        toast.error(`Tenure must be between ${selectedType.minDuration} and ${selectedType.maxDuration} months`);
                        return;
                    }
                }

                applyMutation.mutate({
                    loanTypeId: values.loanTypeId,
                    loanAmount: amount,
                    loanTenure: tenure,
                    loanPurpose: values.loanPurpose,
                });
            } else {
                handleNext();
            }
        }
        // onSubmit: (values) => {
        //   if (activeStep === 2) {
        //     applyMutation.mutate(values);
        //   } else {
        //     handleNext();
        //   }
        // }
    });
      // Get loan types
      const { data: loanTypes } = useQuery<LoanType[]>({
        queryKey: ['loan-types'],
        queryFn: async () => {
          try {
            const response: any = await loanService.getLoanTypes();

            // Check the response structure and ensure we return an array
            console.log('Loan types response:', response);

            // If response is already an array, return it
            if (Array.isArray(response)) {
              return response;
            }

            if (response && response.data) {
              // If response has a data property, return that
              return response.data;
            }

            // Default fallback
            return [];
          } catch (error) {
            console.error('Error fetching loan types:', error);
            return [];
          }
        },
      });

      // Debounce the loan amount and tenure to prevent API calls on every keystroke
      const debouncedLoanAmount = useDebounce(formik.values.loanAmount, 500);
      const debouncedLoanTenure = useDebounce(formik.values.loanTenure, 500);

      const { data: eligibility } = useQuery<EligibilityResponse, Error>({
        queryKey: ['loan-eligibility', formik.values.loanTypeId, debouncedLoanAmount],
        queryFn: () => loanService.checkEligibility(formik.values.loanTypeId, Number(debouncedLoanAmount)),
        enabled: !!(formik.values.loanTypeId && debouncedLoanAmount),
    });

      // Calculate loan when amount and tenure change (debounced)
      const { data: calculation } = useQuery({
        queryKey: ['loan-calculation', formik.values.loanTypeId, debouncedLoanAmount, debouncedLoanTenure],
        queryFn: () => loanService.calculateLoan(
            formik.values.loanTypeId,
            Number(debouncedLoanAmount),
            Number(debouncedLoanTenure)
        ),
        enabled: !!(
            formik.values.loanTypeId &&
            debouncedLoanAmount &&
            debouncedLoanTenure
        )
    });

      // const validationSchema = useMemo(() => {
      //     const schemas = [
      //         // Step 1: Loan Type Selection
      //         Yup.object({
      //             loanTypeId: Yup.string().required('Please select a loan type')
      //         }),
      //         // Step 2: Amount and Tenure
      //         (selectedLoanType: LoanType | undefined, eligibility:any) => Yup.object({
      //             loanAmount: Yup.number()
      //                 .required('Amount is required')
      //                 .positive('Amount must be positive')
      //                 .min(
      //                     Number(selectedLoanType?.maxLoanAmount || 1000),
      //                     `Minimum loan amount is ${formatCurrency(Number(selectedLoanType?.maxLoanAmount || 1000))}`
      //                 )
      //                 .max(
      //                     Number(selectedLoanType?.savingsMultiplier * 50 || 5000 ),
      //                     `Maximum loan amount is ${formatCurrency(Number(selectedLoanType?.savingsMultiplier * 500|| 5000))}`
      //                 ),
      //             loanTenure: Yup.number()
      //                 .required('Tenure is required')
      //                 .min(selectedLoanType?.minDuration || 1, `Minimum tenure is ${selectedLoanType?.minDuration} months`)
      //                 .max(selectedLoanType?.maxDuration || 36, `Maximum tenure is ${selectedLoanType?.maxDuration} months`)
      //         }),
      //         // Step 3: Purpose
      //         Yup.object({
      //             loanPurpose: Yup.string()
      //                 .required('Purpose is required')
      //                 .min(10, 'Please provide more details about the purpose')
      //         })
      //     ]
      //     return schemas[activeStep];
      // }, [activeStep, eligibility,loanTypes, calculation ]);

        // useEffect(() => {
        //     if (validationSchema) {
        //         formik.setValidationSchema(validationSchema);
        //     }
        // }, [validationSchema]);

      // Enhanced form handling with proper validations


      // Check eligibility when amount changes
      // const { data: eligibility } = useQuery<EligibilityResponse>({
      //   queryKey: ['loan-eligibility', formik.values.loanTypeId, formik.values.loanAmount],
      //   queryFn: () => loanService.checkEligibility(
      //     formik.values.loanTypeId,
      //     Number(formik.values.loanAmount)
      //   ),
      //   enabled: !!(formik.values.loanTypeId && formik.values.loanAmount),
      //   onSuccess: (data) => {
      //     if (!data.data.isEligible) {
      //       formik.setFieldError('loanAmount', data.data.reason || 'Not eligible for this amount');
      //     }
      //   }
      // });

      // const { data: eligibility } = useQuery<EligibilityResponse>({
      //   queryKey: ['loan-eligibility', formik.values.loanTypeId, formik.values.loanAmount],
      //   queryFn: () => loanService.checkEligibility(
      //     formik.values.loanTypeId,
      //     Number(formik.values.loanAmount)
      //   ),
      //   enabled: !!(formik.values.loanTypeId && formik.values.loanAmount),
      //   onSuccess: (data: EligibilityResponse) => {
      //     if (!data.data.isEligible) {
      //       formik.setFieldError('loanAmount', data.data.reason || 'Not eligible for this amount');
      //     }
      //   }
      // });



      // Submit loan application
      // const applyMutation = useMutation({
      //   mutationFn: loanService.applyForLoan,
      //   onSuccess: () => {
      //     queryClient.invalidateQueries({ queryKey: ['member-loans'] });
      //     onClose();
      //   }
      // });
      // const applyMutation = useMutation<any, Error, { loanTypeId: string; loanAmount: number; loanTenure: number; loanPurpose: string }>({
      //   mutationFn: loanService.applyForLoan,
      //   onSuccess: () => {
      //     queryClient.invalidateQueries({ queryKey: ['member-loans'] });
      //     onClose();
      //   }
      // });

      const applyMutation = useMutation<
        unknown,
        Error,
        { loanTypeId: string; loanAmount: number; loanTenure: number; loanPurpose: string },
        unknown
      >({
        mutationFn: loanService.applyForLoan,
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['member-loans'] });
          toast.success('Loan application submitted successfully!');
          formik.resetForm();
          setActiveStep(0);
          onClose();
        },
        onError: (error: any) => {
          console.error('Loan application error:', error);
          const errorMessage = error?.response?.data?.message
            || error?.message
            || 'Failed to submit loan application. Please try again.';
          toast.error(errorMessage);
        }
      });

      const isApplying = applyMutation.status === 'pending';

      // Get selected loan type for validation
      const selectedLoanType = loanTypes?.find(t => t.id === formik.values.loanTypeId);
      const isSoftLoan = selectedLoanType && selectedLoanType.maxDuration <= 6;

      // Check if current step is valid based on loan type rules
      const isStepValid = () => {
        if (activeStep === 0) {
          return !!formik.values.loanTypeId;
        }
        if (activeStep === 1) {
          const amount = Number(formik.values.loanAmount);
          const tenure = Number(formik.values.loanTenure);
          const maxAmount = Number(eligibility?.data?.data?.maxAmount || 0);

          // Check if amount and tenure are provided
          if (!amount || amount < 1000 || !tenure) return false;

          // Soft loan cap at 500,000
          if (isSoftLoan && amount > 500000) return false;

          // Regular loan max from eligibility
          if (!isSoftLoan && maxAmount > 0 && amount > maxAmount) return false;

          // Tenure validation
          if (selectedLoanType) {
            if (tenure < selectedLoanType.minDuration || tenure > selectedLoanType.maxDuration) return false;
          }

          // Check eligibility
          if (eligibility?.data?.data && !eligibility.data.data.isEligible) return false;

          return true;
        }
        if (activeStep === 2) {
          return formik.values.loanPurpose && formik.values.loanPurpose.length >= 10;
        }
        return true;
      };


      // const handleNext = () => {
      //   if (formik.validateForm()) {
      //     setActiveStep((prevStep) => prevStep + 1);
      //   }
      // };

      const handleNext = async () => {
        const errors = await formik.validateForm();
        if (Object.keys(errors).length === 0) {
          setActiveStep((prevStep) => prevStep + 1);
        } else {
          // formik.setTouched(errors); // optionally touch all fields
        }
      };


      const handleBack = () => {
        setActiveStep((prevStep) => prevStep - 1);
      };

      const steps = ['Select Loan Type', 'Enter Amount', 'Review & Submit'];

      return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>Apply for Loan</DialogTitle>
        <DialogContent>
        <Stepper activeStep={activeStep} sx={{ py: 3 }}>
        {steps.map((label) => (
          <Step key={label}>
          <StepLabel>{label}</StepLabel>
          </Step>
        ))}
        </Stepper>

        <form onSubmit={formik.handleSubmit}>
        {activeStep === 0 && (
          <SelectLoanType formik={formik} loanTypes={loanTypes || []} />
        )}
        {activeStep === 1 && (
          <EnterLoanDetails
          formik={formik}
          calculation={calculation}
          eligibility={eligibility}
          loanTypes={loanTypes || []}
          />
        )}
        {activeStep === 2 && (
          <ReviewLoan
          formik={formik}
          calculation={calculation}
          loanTypes={loanTypes || []}
          />
        )}

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
        <Button
        onClick={handleBack}
        disabled={activeStep === 0}
        >
        Back
        </Button>
        {/* <Button
        variant="contained"
        type="submit"
        disabled={applyMutation.isLoading}
        >
        {activeStep === 2 ? (
          applyMutation.isLoading ? (
            <CircularProgress size={24} />
          ) : 'Submit Application'
        ) : 'Next'}
        </Button> */}

        <Button
        variant="contained"
        type="submit"
        disabled={isApplying || !isStepValid()}
        >
        {activeStep === 2 ? (
          isApplying ? <CircularProgress size={24}
          /> : 'Submit Application') : 'Next'}
      </Button>


        </Box>
        </form>
        </DialogContent>
        </Dialog>
      );
}



