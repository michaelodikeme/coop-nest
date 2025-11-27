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

interface EligibilityResponse {
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
}

interface SelectLoanTypeProps {
  formik: any; // Replace 'any' with the correct type if known
  loanTypes: LoanType[];
}

interface EnterLoanDetailsProps {
  formik: any; // Replace 'any' with the correct type if known
  calculation: LoanCalculation; // Replace 'any' with the correct type if known
  eligibility: EligibilityResponse | undefined;
  loanTypes: LoanType[];
}

interface ReviewLoanProps {
  formik: any; // Replace 'any' with the correct type if known
  calculation: any; // Replace 'any' with the correct type if known
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
        Number(eligibility?.data.data.maxAmount), selectedLoanType);
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
      error={formik.touched.loanAmount && Boolean(formik.errors.loanAmount)}
      helperText={formik.touched.loanAmount && formik.errors.loanAmount}
      placeholder={`Maximum amount: ${formatCurrency(Number(eligibility?.data?.data.maxAmount  || 0))}`}
      InputProps={{
        startAdornment: <Typography sx={{ mr: 1 }}>₦</Typography>
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
        severity={eligibility.data.isEligible ? "success" : "warning"}
        sx={{ mt: 2 }}
        >
        {eligibility.data?.data.reason ||
          `You are eligible for up to ${eligibility.data.formattedMaxAmount}`}
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
          {formatCurrency(calculation?.data.monthlyPayment)}
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
          {calculation.schedule && (
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
              {/* {calculation.schedule.slice(0, 3).map((payment: Payment, index: number) => (
                <TableRow key={index}>
                  <TableCell>{format(new Date(payment.paymentDate), 'MMM dd, yyyy')}</TableCell>
                  <TableCell align="right">{formatCurrency(payment.principalAmount)}</TableCell>
                  <TableCell align="right">{formatCurrency(payment.interestAmount)}</TableCell>
                  <TableCell align="right">{formatCurrency(payment.expectedAmount)}</TableCell>
                </TableRow>
              ))} */}

            {calculation.schedule.slice(0, 3).map((payment, index) => (
              <TableRow key={index}>
              <TableCell>{format(new Date(payment.scheduledDate), 'MMM dd, yyyy')}</TableCell>
              <TableCell align="right">{formatCurrency(payment.principalAmount)}</TableCell>
              <TableCell align="right">{formatCurrency(payment.interestAmount)}</TableCell>
              <TableCell align="right">{formatCurrency(payment.totalAmount)}</TableCell>
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
      const [validationSchema, setValidationSchema] = useState()
      const queryClient = useQueryClient();


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
                    .required(`Amount is required `)
                    .positive('Amount must be positive')
                    .test(
                        'checkLoanAmount',
                        'Amount must be within 3x total savings',
                        async function(value) {  // ⚠️ Must use 'function', NOT arrow function!
                            // Now you have access to 'this'
                            console.log(value);              // Current username value
                            console.log(this.parent);        // All form values!
                            console.log(this.parent.email);  // Access email field
                            console.log(this.parent.age);    // Access age field

                            const response = await loanService.checkEligibility(this.parent.loanTypeId, Number(this.parent.loanAmount))
                            console.log('available response', response);
                            const {data} = response?.data;
                            // // if (available) {}
                            // console.log('available', available);
                            console.log("from data here", this.parent.loanAmount,data, data.maxAmount, this.parent.loanAmount >= 1000 && this.parent.loanAmount <= data.maxAmount);
                            return this.parent.loanAmount >= 1000 && this.parent.loanAmount <= data.maxAmount;
                        }
                    // .min(
                    //     Number(selectedLoanType?.maxLoanAmount || 1000),
                    //     `Minimum loan amount is ${formatCurrency(Number(selectedLoanType?.maxLoanAmount || 1000))}`
                    // )
                    // .max(
                    //     Number(selectedLoanType?.savingsMultiplier * 50 || 5000 ),
                    //     `Maximum loan amount is ${formatCurrency(Number(eligibility.data.data.maxAmount|| 5000))}`
                    // ),
                    ),
                loanTenure: Yup.number()
                    .required('Tenure is required')
                    // .min(selectedLoanType?.minDuration || 1, `Minimum tenure is ${selectedLoanType?.minDuration} months`)
                    // .max(selectedLoanType?.maxDuration || 36, `Maximum tenure is ${selectedLoanType?.maxDuration} months`)
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
                applyMutation.mutate({
                    loanTypeId: values.loanTypeId,
                    loanAmount: Number(values.loanAmount), // Convert to number
                    loanTenure: Number(values.loanTenure), // Convert to number
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

      const { data: eligibility } = useQuery<EligibilityResponse, Error>({
        queryKey: ['loan-eligibility', formik.values.loanTypeId, formik.values.loanAmount],
        queryFn: () => loanService.checkEligibility(formik.values.loanTypeId, Number(formik.values.loanAmount)),
        enabled: !!(formik.values.loanTypeId && formik.values.loanAmount),
    });

      // Calculate loan when amount and tenure change
      const { data: calculation } = useQuery({
        queryKey: ['loan-calculation', formik.values],
        queryFn: () => loanService.calculateLoan(
            formik.values.loanTypeId,
            Number(formik.values.loanAmount),
            Number(formik.values.loanTenure)
        ),
        enabled: !!(
            formik.values.loanTypeId &&
            formik.values.loanAmount &&
            formik.values.loanTenure
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
          onClose();
        }
      });

      const isApplying = applyMutation.status === 'pending';


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
        disabled={isApplying}
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



