"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Paper,
  Typography,
  Stepper,
  Step,
  StepLabel,
  TextField,
  MenuItem,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Divider,
} from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useMutation, useQuery } from "@tanstack/react-query";
import { loanService } from "@/lib/api/services/loanService";
import { memberService } from "@/lib/api/services/memberService";
import { apiService } from "@/lib/api/apiService";
import { toast } from "react-hot-toast";
import { formatCurrency } from "@/utils/formatting/format";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

// Dynamic validation schema
const getValidationSchema = (
  loanTypes: any[],
  loanTypeId: string,
  savingsBalance: number
) => {
  const selectedLoanType = loanTypes.find((lt: any) => lt.id === loanTypeId);
  const maxTenure = selectedLoanType?.maxDuration || 36;
  const minTenure = selectedLoanType?.minDuration || 1;

  let maxAmount = Infinity;
  let maxAmountMessage = "";

  if (selectedLoanType) {
    // Soft loan (6 months or less) has a fixed max amount
    if (selectedLoanType.maxDuration <= 6) {
      maxAmount = 500000;
      maxAmountMessage = `Soft loan maximum is ${formatCurrency(maxAmount)}`;
    }
    // Regular loan max amount is 3x savings
    else if (savingsBalance > 0) {
      maxAmount = savingsBalance * 3;
      maxAmountMessage = `Loan maximum is ${formatCurrency(
        maxAmount
      )} (3x your savings)`;
    }
  }

  return Yup.object({
    biodataId: Yup.string().required("Please select a member"),
    erpId: Yup.string().required("ERP ID is required"),
    loanTypeId: Yup.string().required("Please select a loan type"),
    loanAmount: Yup.number()
      .min(1, "Loan amount must be at least ₦1")
      .min(1000, "Minimum loan amount is ₦1,000")
      .max(maxAmount, maxAmountMessage)
      .required("Loan amount is required"),
    loanTenure: Yup.number()
      .min(1, "Tenure must be at least 1 month")
      .min(
        minTenure,
        `Minimum tenure for this loan type is ${minTenure} month${
          minTenure > 1 ? "s" : ""
        }`
      )
      .max(
        maxTenure,
        `Maximum tenure for this loan type is ${maxTenure} months`
      )
      .required("Loan tenure is required"),
    loanPurpose: Yup.string()
      .transform((value) => (value === "" ? undefined : value))
      .test(
        "min-length-if-provided",
        "Purpose must be at least 10 characters when provided",
        function (value) {
          // If no value provided, it's valid (optional field)
          if (!value || value.trim().length === 0) return true;
          // If value provided, must be at least 10 characters
          return value.trim().length >= 10;
        }
      )
      .max(500, "Purpose cannot exceed 500 characters")
      .optional(),
  });
};

export default function CreateLoanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const memberId = searchParams?.get("memberId");
  const [activeStep, setActiveStep] = useState(0); // Always start at step 0
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [memberPreSelected] = useState(!!memberId);
  const [memberSavingsBalance, setMemberSavingsBalance] = useState<number>(0);
  const [calculationError, setCalculationError] = useState<string | null>(null);

  // Conditional steps based on whether member is pre-selected
  const steps = memberPreSelected
    ? ["Loan Details", "Review & Submit"]
    : ["Select Member", "Loan Details", "Review & Submit"];

  // Fetch pre-selected member data if memberId is provided
  const { data: preSelectedMemberData, isLoading: loadingPreSelectedMember } =
    useQuery({
      queryKey: ["pre-selected-member", memberId],
      queryFn: async () => {
        if (!memberId) return null;
        const member = await memberService.getBiodataById(memberId);
        return member;
      },
      enabled: !!memberId,
    });

  // Fetch members only if no memberId (full 3-step flow)
  const { data: membersData, isLoading: loadingMembers } = useQuery({
    queryKey: ["biodata"],
    queryFn: async () => {
      const response = await memberService.getAllBiodata();
      return response.data;
    },
    enabled: !memberId,
  });

  // Fetch loan types
  const { data: loanTypesData } = useQuery({
    queryKey: ["loanTypes"],
    queryFn: () => loanService.getLoanTypes(),
  });

  const loanTypes = loanTypesData?.data || [];
  const members = membersData || [];

  // Formik setup
  const formik = useFormik({
    initialValues: {
      biodataId: "",
      erpId: "",
      loanTypeId: "",
      loanAmount: 0,
      loanTenure: 12,
      loanPurpose: "",
    },
    // Replace static validation schema with a dynamic validate function
    validate: (values) => {
      const schema = getValidationSchema(
        loanTypes,
        values.loanTypeId,
        memberSavingsBalance
      );
      try {
        schema.validateSync(values, { abortEarly: false });
        return {};
      } catch (err: any) {
        // Transform Yup's error object into a format Formik understands
        return err.inner.reduce((errors: any, error: any) => {
          errors[error.path] = error.message;
          return errors;
        }, {});
      }
    },
    onSubmit: async (values) => {
      // Only allow submission on the final step
      const finalStep = memberPreSelected ? 1 : 2;
      if (activeStep !== finalStep) {
        return; // Prevent submission if not on final step
      }

      // Directly create the loan - backend handles all eligibility checks
      createLoanMutation.mutate(values);
    },
  });

  // This useEffect is incorrect for updating validation and has been replaced by the `validate` function in useFormik
  // useEffect(() => {
  //   if (formik.values.loanTypeId) {
  //     formik.setFieldValue('validationSchema', getValidationSchema(loanTypes, formik.values.loanTypeId));
  //   }
  // }, [formik.values.loanTypeId, loanTypes]);

  // Set pre-selected member and fetch savings balance
  useEffect(() => {
    if (memberId && preSelectedMemberData && !selectedMember) {
      setSelectedMember(preSelectedMemberData);
      formik.setFieldValue("biodataId", preSelectedMemberData.id);
      formik.setFieldValue("erpId", preSelectedMemberData.erpId);

      // Fetch savings balance for pre-selected member
      const fetchSavingsBalance = async () => {
        try {
          const response = await apiService.get<{
            data: {
              data: Array<{
                totalSavingsAmount: number;
              }>;
            };
          }>(`/savings?erpId=${preSelectedMemberData.erpId}&limit=1`);
          if (response?.data?.data && response.data.data.length > 0) {
            const latestSaving = response.data.data[0];
            setMemberSavingsBalance(
              Number(latestSaving.totalSavingsAmount || 0)
            );
          }
        } catch (error) {
          console.error("Error fetching savings balance:", error);
          setMemberSavingsBalance(0);
        }
      };

      fetchSavingsBalance();
    }
  }, [memberId, preSelectedMemberData, selectedMember]);

  // Create loan mutation
  const createLoanMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await loanService.createLoanForMember(data);
      console.log("I am here:", response);
      // Check if backend returned error in response body (HTTP 200 with success: false)
      if (response && response.success === false) {
        throw new Error(response.message || "Failed to create loan");
      }
      return response;
    },
    onSuccess: (response) => {
      toast.success("Loan created successfully");
      const loanId = response?.data?.id;
      if (loanId) {
        router.push(`/admin/financial/loans/${loanId}`);
      } else {
        router.push("/admin/financial/loans");
      }
    },
    onError: (error: any) => {
      // Better error message extraction
      let errorMessage = "Failed to create loan";

      // Check if error has response property (Axios error)
      if (error?.response?.data) {
        // If the response data has our error structure
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        }
      }
      // Check if it's a plain Error object with message
      else if (error?.message) {
        errorMessage = error.message;
      }
      // Check if it's a string
      else if (typeof error === "string") {
        errorMessage = error;
      }

      toast.error(errorMessage);
      console.error("Loan creation error:", error);
    },
  });

  // Eligibility check - disabled for admin flow
  // Backend will validate eligibility when loan is submitted
  const { data: eligibilityData } = useQuery({
    queryKey: [
      "eligibility",
      formik.values.loanTypeId,
      formik.values.loanAmount,
    ],
    queryFn: async () => {
      const response = await loanService.checkEligibility(
        formik.values.loanTypeId,
        formik.values.loanAmount
      );
      return response.data;
    },
    enabled: false, // Disabled - backend handles validation
  });

  // Loan calculation - captures errors from backend validation
  // Passes biodataId so backend can validate regular loans against member's savings (3x)
  const {
    data: calculationData,
    isLoading: calculating,
    error: calculationQueryError,
  } = useQuery({
    queryKey: [
      "calculation",
      formik.values.loanTypeId,
      formik.values.loanAmount,
      formik.values.loanTenure,
      formik.values.biodataId,
    ],
    queryFn: async () => {
      setCalculationError(null);
      try {
        const response = await loanService.calculateLoan(
          formik.values.loanTypeId,
          formik.values.loanAmount,
          formik.values.loanTenure,
          formik.values.biodataId // Pass biodataId for savings-based validation
        );
        return response.data;
      } catch (error: any) {
        const errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          "Validation error";
        setCalculationError(errorMessage);
        throw error;
      }
    },
    enabled: !!(
      (
        formik.values.loanTypeId &&
        formik.values.loanAmount > 0 &&
        formik.values.loanTenure > 0 &&
        formik.values.biodataId
      ) // Only calculate when we have member selected
    ),
    retry: false, // Don't retry on validation errors
  });

  // Clear calculation error when inputs change
  useEffect(() => {
    if (calculationData) {
      setCalculationError(null);
    }
  }, [calculationData]);

  const eligibility = eligibilityData;
  const calculation = calculationData;

  // Check if there's a calculation error to display
  const hasCalculationError = !!calculationError || !!calculationQueryError;

  // Handle member selection
  const handleMemberSelect = (member: any) => {
    if (member) {
      setSelectedMember(member);
      formik.setFieldValue("biodataId", member.id);
      formik.setFieldValue("erpId", member.erpId);

      // Fetch savings balance for the newly selected member
      const fetchSavingsBalance = async () => {
        try {
          const response = await apiService.get<{
            data: {
              data: Array<{
                totalSavingsAmount: number;
              }>;
            };
          }>(`/savings?erpId=${member.erpId}&limit=1`);
          if (response?.data?.data && response.data.data.length > 0) {
            const latestSaving = response.data.data[0];
            setMemberSavingsBalance(
              Number(latestSaving.totalSavingsAmount || 0)
            );
          } else {
            setMemberSavingsBalance(0);
          }
        } catch (error) {
          console.error("Error fetching savings balance:", error);
          setMemberSavingsBalance(0);
        }
      };

      fetchSavingsBalance();
    } else {
      setSelectedMember(null);
      formik.setFieldValue("biodataId", "");
      formik.setFieldValue("erpId", "");
      setMemberSavingsBalance(0); // Reset savings balance when member is cleared
    }
  };

  // Handle next step with validation
  const handleNext = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    // Explicitly prevent any form submission
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // For 3-step flow (not pre-selected), check if member is selected on step 0
    if (!memberPreSelected && activeStep === 0 && !selectedMember) {
      toast.error("Please select a member");
      return;
    }

    // Determine the "Loan Details" step based on flow
    const loanDetailsStep = memberPreSelected ? 0 : 1;

    if (activeStep === loanDetailsStep) {
      // Trigger formik validation
      const validationErrors = await formik.validateForm();

      // Check for validation errors (excluding optional fields)
      const errors = Object.keys(validationErrors).filter(
        (key) => !["biodataId", "erpId", "loanPurpose"].includes(key)
      );

      if (errors.length > 0 || !formik.values.loanTypeId) {
        toast.error("Please fill in all required fields correctly");
        // Mark all fields as touched to show validation errors
        formik.setTouched({
          loanTypeId: true,
          loanAmount: true,
          loanTenure: true,
        });
        return;
      }

      if (!formik.values.loanAmount || formik.values.loanAmount < 1000) {
        toast.error("Minimum loan amount is ₦1,000");
        return;
      }

      if (!formik.values.loanTenure || formik.values.loanTenure < 1) {
        toast.error("Please enter a valid loan tenure");
        return;
      }

      // Check for calculation errors (validates amount and tenure against loan type rules)
      if (hasCalculationError) {
        toast.error(calculationError || "Please fix the validation errors");
        return;
      }

      // Check that calculation was successful (we have a valid calculation)
      if (!calculation) {
        toast.error("Please wait for loan calculation to complete");
        return;
      }
    }

    // Navigate to next step
    setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  // Handle back step
  const handleBack = (e?: React.MouseEvent<HTMLButtonElement>) => {
    // Explicitly prevent any form submission
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // If member was pre-selected and we're on step 0 (Loan Details), navigate back to member's financial page
    if (memberPreSelected && activeStep === 0 && memberId) {
      router.push(`/admin/members/${memberId}/financial`);
      return;
    }
    // Otherwise, go to previous step
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  const selectedLoanType = loanTypes.find(
    (lt: any) => lt.id === formik.values.loanTypeId
  );

  return (
    <Container maxWidth="lg">
      <Paper sx={{ p: 4, mt: 3, mb: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            Create Loan for Member
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create and disburse a loan for a member. The loan will be
            immediately disbursed upon creation.
          </Typography>
        </Box>

        <Stepper activeStep={activeStep} sx={{ mt: 3, mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <form
          onSubmit={formik.handleSubmit}
          onKeyDown={(e) => {
            // Prevent Enter key from submitting form unless we're on the final step
            const finalStep = memberPreSelected ? 1 : 2;
            if (e.key === "Enter" && activeStep !== finalStep) {
              e.preventDefault();
            }
          }}
        >
          {/* Step 1: Select Member (only shown in full 3-step flow) */}
          {!memberPreSelected && activeStep === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Select Member
              </Typography>

              <Autocomplete
                options={members}
                getOptionLabel={(option: any) =>
                  `${option.fullName} (${option.erpId})`
                }
                value={selectedMember}
                onChange={(_, newValue) => handleMemberSelect(newValue)}
                loading={loadingMembers}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Search Member"
                    placeholder="Type to search by name or ERP ID"
                    fullWidth
                    margin="normal"
                  />
                )}
                renderOption={(props, option: any) => (
                  <li {...props} key={option.id}>
                    <Box>
                      <Typography variant="body1">{option.fullName}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.erpId} • {option.department}
                      </Typography>
                    </Box>
                  </li>
                )}
              />

              {selectedMember && (
                <Card sx={{ mt: 3 }}>
                  <CardContent>
                    <Typography
                      variant="subtitle1"
                      gutterBottom
                      color="primary"
                    >
                      Selected Member Details
                    </Typography>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Full Name
                        </Typography>
                        <Typography variant="body1">
                          {selectedMember.fullName}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          ERP ID
                        </Typography>
                        <Typography variant="body1">
                          {selectedMember.erpId}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Department
                        </Typography>
                        <Typography variant="body1">
                          {selectedMember.department}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Email
                        </Typography>
                        <Typography variant="body1">
                          {selectedMember.emailAddress}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              )}
            </Box>
          )}

          {/* Step 2: Loan Details */}
          {((memberPreSelected && activeStep === 0) ||
            (!memberPreSelected && activeStep === 1)) && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Loan Details
              </Typography>

              {/* Display member info */}
              {selectedMember && (
                <Card sx={{ mb: 3, bgcolor: "grey.50" }}>
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="body2" color="text.secondary">
                          Member Name
                        </Typography>
                        <Typography variant="body1" fontWeight={600}>
                          {selectedMember.fullName}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="body2" color="text.secondary">
                          ERP ID
                        </Typography>
                        <Typography variant="body1" fontWeight={600}>
                          {selectedMember.erpId}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="body2" color="text.secondary">
                          Total Savings Balance
                        </Typography>
                        <Typography
                          variant="body1"
                          fontWeight={600}
                          color="primary"
                        >
                          {memberPreSelected
                            ? formatCurrency(memberSavingsBalance)
                            : eligibility?.savingsSummary
                            ? formatCurrency(
                                Number(
                                  eligibility.savingsSummary.totalSavingsAmount
                                )
                              )
                            : "Loading..."}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              )}

              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <TextField
                    select
                    fullWidth
                    label="Loan Type"
                    name="loanTypeId"
                    value={formik.values.loanTypeId}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                      formik.touched.loanTypeId &&
                      Boolean(formik.errors.loanTypeId)
                    }
                    helperText={
                      formik.touched.loanTypeId && formik.errors.loanTypeId
                    }
                    SelectProps={{
                      displayEmpty: false,
                      MenuProps: {
                        PaperProps: {
                          style: {
                            maxHeight: 300,
                          },
                        },
                      },
                    }}
                  >
                    {loanTypes.map((type: any) => (
                      <MenuItem key={type.id} value={type.id}>
                        {type.name} - {type.interestRate}% interest
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Loan Amount (₦)"
                    name="loanAmount"
                    value={formik.values.loanAmount || ""}
                    onChange={(e) => {
                      // Only allow numeric input
                      const value = e.target.value.replace(/[^0-9]/g, "");
                      formik.setFieldValue(
                        "loanAmount",
                        value ? Number(value) : 0
                      );
                    }}
                    onBlur={formik.handleBlur}
                    error={
                      (formik.touched.loanAmount &&
                        Boolean(formik.errors.loanAmount)) ||
                      (hasCalculationError &&
                        calculationError?.toLowerCase().includes("amount"))
                    }
                    helperText={
                      (formik.touched.loanAmount && formik.errors.loanAmount) ||
                      (hasCalculationError &&
                      calculationError?.toLowerCase().includes("amount")
                        ? calculationError
                        : null) ||
                      (selectedLoanType
                        ? selectedLoanType.maxDuration <= 6
                          ? `Soft Loan max: ${formatCurrency(500000)}`
                          : `Regular Loan max: ${formatCurrency(
                              (memberPreSelected
                                ? memberSavingsBalance
                                : Number(
                                    eligibility?.savingsSummary
                                      ?.totalSavingsAmount || 0
                                  )) * 3
                            )} (3x savings)`
                        : "Select loan type to see limits")
                    }
                    slotProps={{
                      input: {
                        inputMode: "numeric",
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Tenure (Months)"
                    name="loanTenure"
                    value={formik.values.loanTenure || ""}
                    onChange={(e) => {
                      // Only allow numeric input
                      const value = e.target.value.replace(/[^0-9]/g, "");
                      formik.setFieldValue(
                        "loanTenure",
                        value ? Number(value) : 0
                      );
                    }}
                    onBlur={formik.handleBlur}
                    error={
                      (formik.touched.loanTenure &&
                        Boolean(formik.errors.loanTenure)) ||
                      (hasCalculationError &&
                        calculationError?.toLowerCase().includes("tenure"))
                    }
                    helperText={
                      (formik.touched.loanTenure && formik.errors.loanTenure) ||
                      (hasCalculationError &&
                      calculationError?.toLowerCase().includes("tenure")
                        ? calculationError
                        : null) ||
                      (selectedLoanType
                        ? `Min: ${selectedLoanType.minDuration}, Max: ${selectedLoanType.maxDuration} months`
                        : "Select a loan type first")
                    }
                    slotProps={{
                      input: {
                        inputMode: "numeric",
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Loan Purpose (Optional)"
                    name="loanPurpose"
                    value={formik.values.loanPurpose}
                    onChange={formik.handleChange}
                    error={
                      formik.touched.loanPurpose &&
                      Boolean(formik.errors.loanPurpose)
                    }
                    helperText={
                      formik.touched.loanPurpose && formik.errors.loanPurpose
                    }
                    placeholder="Enter the purpose of this loan (optional, minimum 10 characters if provided)"
                  />
                </Grid>
              </Grid>

              {/* Calculation Preview */}
              {calculation && (
                <Card sx={{ mt: 3 }}>
                  <CardContent>
                    <Typography
                      variant="subtitle1"
                      gutterBottom
                      color="primary"
                    >
                      Loan Calculation
                    </Typography>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      <Grid item xs={6} md={3}>
                        <Typography variant="body2" color="text.secondary">
                          Principal Amount
                        </Typography>
                        <Typography variant="h6">
                          {formatCurrency(formik.values.loanAmount)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Typography variant="body2" color="text.secondary">
                          Total Interest
                        </Typography>
                        <Typography variant="h6">
                          {formatCurrency(calculation.totalInterest)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Typography variant="body2" color="text.secondary">
                          Total Repayment
                        </Typography>
                        <Typography variant="h6">
                          {formatCurrency(calculation.totalRepayment)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Typography variant="body2" color="text.secondary">
                          Monthly Payment
                        </Typography>
                        <Typography variant="h6">
                          {formatCurrency(
                            calculation.schedule?.[0]?.totalPayment || 0
                          )}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              )}
            </Box>
          )}

          {/* Step 3: Review & Submit */}
          {((memberPreSelected && activeStep === 1) ||
            (!memberPreSelected && activeStep === 2)) && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Review & Submit
              </Typography>

              <Card sx={{ mt: 3 }}>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom color="primary">
                    Member Information
                  </Typography>
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Name
                      </Typography>
                      <Typography variant="body1">
                        {selectedMember?.fullName}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        ERP ID
                      </Typography>
                      <Typography variant="body1">
                        {selectedMember?.erpId}
                      </Typography>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 3 }} />

                  <Typography variant="subtitle1" gutterBottom color="primary">
                    Loan Information
                  </Typography>
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Loan Type
                      </Typography>
                      <Typography variant="body1">
                        {selectedLoanType?.name}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Interest Rate
                      </Typography>
                      <Typography variant="body1">
                        {selectedLoanType?.interestRate}%
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Principal Amount
                      </Typography>
                      <Typography variant="body1">
                        {formatCurrency(formik.values.loanAmount)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Tenure
                      </Typography>
                      <Typography variant="body1">
                        {formik.values.loanTenure} months
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        Purpose
                      </Typography>
                      <Typography variant="body1">
                        {formik.values.loanPurpose}
                      </Typography>
                    </Grid>
                  </Grid>

                  {calculation && (
                    <>
                      <Divider sx={{ my: 3 }} />

                      <Typography
                        variant="subtitle1"
                        gutterBottom
                        color="primary"
                      >
                        Loan Summary
                      </Typography>
                      <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Total Interest
                          </Typography>
                          <Typography variant="h6">
                            {formatCurrency(calculation.totalInterest)}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Total Repayment
                          </Typography>
                          <Typography variant="h6" color="primary">
                            {formatCurrency(calculation.totalRepayment)}
                          </Typography>
                        </Grid>
                      </Grid>

                      <Divider sx={{ my: 3 }} />

                      <Typography variant="subtitle1" gutterBottom>
                        Payment Schedule
                      </Typography>
                      <TableContainer sx={{ mt: 2, maxHeight: 400 }}>
                        <Table size="small" stickyHeader>
                          <TableHead>
                            <TableRow>
                              <TableCell>Month</TableCell>
                              <TableCell align="right">Principal</TableCell>
                              <TableCell align="right">Interest</TableCell>
                              <TableCell align="right">Total Payment</TableCell>
                              <TableCell align="right">Balance</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {calculation.schedule?.map(
                              (payment: any, index: number) => (
                                <TableRow key={index}>
                                  <TableCell>{index + 1}</TableCell>
                                  <TableCell align="right">
                                    {formatCurrency(payment.principalAmount)}
                                  </TableCell>
                                  <TableCell align="right">
                                    {formatCurrency(payment.interestAmount)}
                                  </TableCell>
                                  <TableCell align="right">
                                    {formatCurrency(payment.totalPayment)}
                                  </TableCell>
                                  <TableCell align="right">
                                    {formatCurrency(payment.remainingBalance)}
                                  </TableCell>
                                </TableRow>
                              )
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </>
                  )}
                </CardContent>
              </Card>

              <Alert severity="success" sx={{ mt: 3 }}>
                This loan will be created and immediately disbursed. All
                approval steps will be auto-completed and a disbursement
                transaction will be recorded.
              </Alert>
            </Box>
          )}

          {/* Navigation buttons */}
          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
            <Button
              type="button"
              disabled={activeStep === 0 && !memberPreSelected}
              onClick={(e) => handleBack(e)}
              startIcon={<ArrowBackIcon />}
            >
              {memberPreSelected && activeStep === 0
                ? "Back to Member"
                : "Back"}
            </Button>

            {activeStep < steps.length - 1 ? (
              <Button
                type="button"
                variant="contained"
                onClick={(e) => handleNext(e)}
                endIcon={
                  calculating ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <ArrowForwardIcon />
                  )
                }
                disabled={
                  (!memberPreSelected && activeStep === 0 && !selectedMember) ||
                  ((memberPreSelected ? activeStep === 0 : activeStep === 1) &&
                    (hasCalculationError || calculating))
                }
              >
                {calculating ? "Calculating..." : "Next"}
              </Button>
            ) : (
              <Button
                variant="contained"
                type="submit"
                disabled={createLoanMutation.isPending}
                endIcon={
                  createLoanMutation.isPending ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <CheckCircleIcon />
                  )
                }
              >
                {createLoanMutation.isPending ? "Creating..." : "Create Loan"}
              </Button>
            )}
          </Box>
        </form>
      </Paper>
    </Container>
  );
}
