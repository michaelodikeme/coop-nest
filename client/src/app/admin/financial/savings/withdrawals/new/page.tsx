"use client";

import React, { useState } from "react";
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
  Card,
  CardContent,
  Divider,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useMutation, useQuery } from "@tanstack/react-query";
import { savingsService } from "@/lib/api/services/savingsService";
import { memberService } from "@/lib/api/services/memberService";
import { toast } from "react-hot-toast";
import { formatCurrency } from "@/utils/formatting/format";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

// Validation schema
const getValidationSchema = (
  withdrawalType: string,
  maxWithdrawalAmount: number
) => {
  return Yup.object({
    biodataId: Yup.string().required("Please select a member"),
    erpId: Yup.string().required("ERP ID is required"),
    withdrawalType: Yup.string()
      .oneOf(["SAVINGS", "PERSONAL_SAVINGS"], "Invalid withdrawal type")
      .required("Please select withdrawal type"),
    amount: Yup.number()
      .min(1000, "Minimum withdrawal amount is ₦1,000")
      .max(
        maxWithdrawalAmount,
        `Maximum withdrawal amount is ${formatCurrency(maxWithdrawalAmount)}`
      )
      .required("Withdrawal amount is required"),
    reason: Yup.string()
      .min(10, "Reason must be at least 10 characters")
      .max(500, "Reason cannot exceed 500 characters")
      .required("Reason is required"),
  });
};

export default function CreateWithdrawalPage() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [savingsBalance, setSavingsBalance] = useState<number>(0);
  const [maxWithdrawalAmount, setMaxWithdrawalAmount] = useState<number>(0);
  const [selectedSavingsId, setSelectedSavingsId] = useState<string>("");
  const [withdrawalType, setWithdrawalType] = useState<string>("SAVINGS");
  const [availableSavingsOptions, setAvailableSavingsOptions] = useState<any[]>(
    []
  );
  const [memberSearchTerm, setMemberSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  const steps = ["Select Member", "Withdrawal Details", "Review & Submit"];

  // Debounce search term
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(memberSearchTerm);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [memberSearchTerm]);

  // Fetch members with server-side search
  const { data: membersData, isLoading: loadingMembers } = useQuery({
    queryKey: ["biodata-search", debouncedSearchTerm],
    queryFn: async () => {
      const response = await memberService.getAllBiodata({
        searchTerm: debouncedSearchTerm || undefined,
        limit: 20, // Limit results for better performance
      });
      return response.data;
    },
    // Keep previous data while loading new results
    placeholderData: (previousData) => previousData,
  });

  // Form handling
  const formik = useFormik({
    initialValues: {
      biodataId: "",
      erpId: "",
      withdrawalType: "SAVINGS",
      amount: 0,
      reason: "",
      savingsId: "",
      personalSavingsId: "",
    },
    validationSchema: getValidationSchema(withdrawalType, maxWithdrawalAmount),
    onSubmit: async (values) => {
      // Submit will be handled by mutation
    },
  });

  // Fetch member's latest savings when member is selected
  const handleMemberSelect = async (member: any) => {
    if (!member) {
      setSelectedMember(null);
      setSavingsBalance(0);
      setMaxWithdrawalAmount(0);
      setAvailableSavingsOptions([]);
      formik.setFieldValue("biodataId", "");
      formik.setFieldValue("erpId", "");
      return;
    }

    setSelectedMember(member);
    formik.setFieldValue("biodataId", member.id);
    formik.setFieldValue("erpId", member.erpId);

    // Fetch member's latest savings record (most recent month/year)
    try {
      const latestSavingsResponse = await savingsService.getLatestSavings(member.id);

      // Create a single savings option from the latest record
      const savingsOption = {
        id: latestSavingsResponse.id,
        type: "SAVINGS",
        label: `Regular Savings - ${latestSavingsResponse.month}/${latestSavingsResponse.year} (${formatCurrency(latestSavingsResponse.totalSavingsAmount)})`,
        balance: latestSavingsResponse.totalSavingsAmount,
        maxWithdrawal: latestSavingsResponse.totalSavingsAmount * 0.8,
        month: latestSavingsResponse.month,
        year: latestSavingsResponse.year,
      };

      setAvailableSavingsOptions([savingsOption]);

      // Auto-select the latest savings
      handleSavingsSelect(savingsOption);
    } catch (error: any) {
      console.error("Error fetching latest savings:", error);

      // Check if it's a 404 (no savings found)
      if (error?.response?.status === 404) {
        toast.error("This member has no savings records");
        setAvailableSavingsOptions([]);
      } else {
        toast.error("Failed to fetch member's savings");
      }
    }
  };

  const handleSavingsSelect = (option: any) => {
    if (!option) return;

    setSavingsBalance(option.balance);
    setMaxWithdrawalAmount(option.maxWithdrawal);
    setWithdrawalType(option.type);
    formik.setFieldValue("withdrawalType", option.type);

    if (option.type === "SAVINGS") {
      formik.setFieldValue("savingsId", option.id);
      formik.setFieldValue("personalSavingsId", "");
      setSelectedSavingsId(option.id);
    } else {
      formik.setFieldValue("personalSavingsId", option.id);
      formik.setFieldValue("savingsId", "");
      setSelectedSavingsId(option.id);
    }
  };

  // Create withdrawal mutation
  const createWithdrawalMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await savingsService.createWithdrawalForMember(data);
      if (response && response.success === false) {
        throw new Error(response.message || "Failed to create withdrawal");
      }
      return response;
    },
    onSuccess: (response) => {
      toast.success("Withdrawal processed successfully");
      const withdrawalId = response?.data?.id;
      if (withdrawalId) {
        router.push(`/admin/approvals/withdrawals`);
      } else {
        router.push("/admin/approvals/withdrawals");
      }
    },
    onError: (error: any) => {
      let errorMessage = "Failed to create withdrawal";

      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    },
  });

  const handleNext = async () => {
    if (activeStep === 0) {
      // Validate member selection
      if (!selectedMember) {
        toast.error("Please select a member");
        return;
      }
      if (availableSavingsOptions.length === 0) {
        toast.error("Member has no active savings accounts");
        return;
      }
    }

    if (activeStep === 1) {
      // Validate withdrawal details
      const errors = await formik.validateForm();
      if (Object.keys(errors).length > 0) {
        formik.setTouched({
          amount: true,
          reason: true,
          withdrawalType: true,
        });
        return;
      }
    }

    if (activeStep === steps.length - 1) {
      // Final submission
      handleSubmit();
    } else {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSubmit = async () => {
    const values = formik.values;

    const withdrawalData = {
      biodataId: values.biodataId,
      erpId: values.erpId,
      amount: values.amount,
      reason: values.reason,
      withdrawalType: values.withdrawalType as "SAVINGS" | "PERSONAL_SAVINGS",
      ...(values.withdrawalType === "SAVINGS" && {
        savingsId: values.savingsId,
      }),
      ...(values.withdrawalType === "PERSONAL_SAVINGS" && {
        personalSavingsId: values.personalSavingsId,
      }),
    };

    createWithdrawalMutation.mutate(withdrawalData);
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Select Member
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Search for a member by name or ERP ID
            </Typography>

            {loadingMembers ? (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
              </Box>
            ) : (
              <Grid container spacing={3}>
                  <Autocomplete
                    fullWidth
                    sx={{ width: "85%" }}
                    options={membersData || []}
                    getOptionLabel={(option: any) =>
                      `${option.fullName} (${option.erpId})`
                    }
                    value={selectedMember}
                    onChange={(_, newValue) => handleMemberSelect(newValue)}
                    onInputChange={(_, newInputValue) => {
                      setMemberSearchTerm(newInputValue);
                    }}
                    loading={loadingMembers}
                    filterOptions={(x) => x} // Disable client-side filtering
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Search and Select Member"
                        placeholder="Type member name or ERP ID to search..."
                        fullWidth
                        sx={{
                          "& .MuiInputBase-root": {
                            fontSize: "1.0rem",
                            padding: "10px 20px",
                            borderRadius: "12px",
                          },
                          "& .MuiInputBase-input": {
                            textAlign: "left",
                          },
                          "& .MuiInputLabel-root": {
                            fontSize: "1rem",
                          },
                        }}
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {loadingMembers ? <CircularProgress color="inherit" size={20} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                    renderOption={(props, option: any) => (
                      <li {...props} key={option.id}>
                        <Box sx={{ py: 1.5, px: 1 }}>
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 600, fontSize: "1.1rem" }}
                          >
                            {option.fullName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            ERP ID: {option.erpId} | Dept: {option.department}
                          </Typography>
                        </Box>
                      </li>
                    )}
                  />

                {selectedMember && (
                  <Grid item xs={12}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" gutterBottom>
                          Selected Member
                        </Typography>
                        <Divider sx={{ my: 1 }} />
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Name
                            </Typography>
                            <Typography variant="body2">
                              {selectedMember.fullName}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              ERP ID
                            </Typography>
                            <Typography variant="body2">
                              {selectedMember.erpId}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Department
                            </Typography>
                            <Typography variant="body2">
                              {selectedMember.department}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Phone
                            </Typography>
                            <Typography variant="body2">
                              {selectedMember.phoneNumber}
                            </Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                )}

                {selectedMember && availableSavingsOptions.length > 0 && (
                  <Grid item xs={12}>
                    <Alert severity="info">
                      Found {availableSavingsOptions.length} active savings
                      account(s) for this member
                    </Alert>
                  </Grid>
                )}

                {selectedMember && availableSavingsOptions.length === 0 && (
                  <Grid item xs={12}>
                    <Alert severity="warning">
                      This member has no active savings accounts
                    </Alert>
                  </Grid>
                )}
              </Grid>
            )}
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Withdrawal Details
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Enter withdrawal amount and reason
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  label="Savings Account"
                  value={selectedSavingsId}
                  onChange={(e) => {
                    const option = availableSavingsOptions.find(
                      (opt) => opt.id === e.target.value
                    );
                    handleSavingsSelect(option);
                  }}
                >
                  {availableSavingsOptions.map((option) => (
                    <MenuItem key={option.id} value={option.id}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <Card variant="outlined" sx={{ bgcolor: "grey.50" }}>
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Current Balance
                        </Typography>
                        <Typography variant="h6">
                          {formatCurrency(savingsBalance)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Max Withdrawal
                        </Typography>
                        <Typography variant="h6" color="primary">
                          {formatCurrency(maxWithdrawalAmount)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Withdrawal Amount"
                  type="number"
                  name="amount"
                  value={formik.values.amount || ""}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.amount && Boolean(formik.errors.amount)}
                  helperText={formik.touched.amount && formik.errors.amount}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1 }}>₦</Typography>,
                  }}
                />
              </Grid>

              {formik.values.amount > 0 && (
                <Grid item xs={12}>
                  <Card variant="outlined" sx={{ bgcolor: "info.lighter" }}>
                    <CardContent>
                      <Typography variant="caption" color="text.secondary">
                        Remaining Balance After Withdrawal
                      </Typography>
                      <Typography variant="h6" color="info.main">
                        {formatCurrency(savingsBalance - formik.values.amount)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Reason for Withdrawal"
                  name="reason"
                  value={formik.values.reason}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.reason && Boolean(formik.errors.reason)}
                  helperText={
                    formik.touched.reason
                      ? formik.errors.reason
                      : "Provide a detailed reason (10-500 characters)"
                  }
                />
              </Grid>

              {formik.values.amount > maxWithdrawalAmount && (
                <Grid item xs={12}>
                  <Alert severity="error">
                    Withdrawal amount exceeds maximum allowed amount of{" "}
                    {formatCurrency(maxWithdrawalAmount)}
                  </Alert>
                </Grid>
              )}

              {formik.values.amount < 1000 && formik.values.amount > 0 && (
                <Grid item xs={12}>
                  <Alert severity="warning">
                    Minimum withdrawal amount is ₦1,000
                  </Alert>
                </Grid>
              )}
            </Grid>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review & Submit
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Review the withdrawal details before processing
            </Typography>

            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  Member Information
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Name
                    </Typography>
                    <Typography variant="body2">
                      {selectedMember?.fullName}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      ERP ID
                    </Typography>
                    <Typography variant="body2">
                      {selectedMember?.erpId}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Department
                    </Typography>
                    <Typography variant="body2">
                      {selectedMember?.department}
                    </Typography>
                  </Grid>
                </Grid>

                <Typography variant="subtitle2" gutterBottom>
                  Withdrawal Details
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Account Type
                    </Typography>
                    <Typography variant="body2">
                      {formik.values.withdrawalType === "SAVINGS"
                        ? "Regular Savings"
                        : "Personal Savings"}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Withdrawal Amount
                    </Typography>
                    <Typography
                      variant="body2"
                      color="error.main"
                      fontWeight="bold"
                    >
                      {formatCurrency(formik.values.amount)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">
                      Reason
                    </Typography>
                    <Typography variant="body2">
                      {formik.values.reason}
                    </Typography>
                  </Grid>
                </Grid>

                <Typography variant="subtitle2" gutterBottom>
                  Impact
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Typography variant="caption" color="text.secondary">
                      Current Balance
                    </Typography>
                    <Typography variant="body2">
                      {formatCurrency(savingsBalance)}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="caption" color="text.secondary">
                      Withdrawal Amount
                    </Typography>
                    <Typography variant="body2" color="error">
                      -{formatCurrency(formik.values.amount)}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="caption" color="text.secondary">
                      Remaining Balance
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {formatCurrency(savingsBalance - formik.values.amount)}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {savingsBalance - formik.values.amount < 10000 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                Warning: Remaining balance will be less than ₦10,000
              </Alert>
            )}

            <Alert severity="info" sx={{ mt: 2 }}>
              This withdrawal will be processed immediately and cannot be
              undone.
            </Alert>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Container maxWidth={false} sx={{ py: 4, px: { xs: 2, md: 6 } }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box mb={4}>
          <Typography variant="h4" gutterBottom>
            Create Withdrawal
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create an instant withdrawal for a member (bypasses approval
            workflow)
          </Typography>
        </Box>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStepContent()}

        <Box mt={4} display="flex" justifyContent="space-between">
          <Button
            variant="outlined"
            onClick={() => router.push("/admin/approvals/withdrawals")}
            disabled={createWithdrawalMutation.isPending}
          >
            Cancel
          </Button>

          <Box display="flex" gap={2}>
            {activeStep > 0 && (
              <Button
                variant="outlined"
                onClick={handleBack}
                startIcon={<ArrowBackIcon />}
                disabled={createWithdrawalMutation.isPending}
              >
                Back
              </Button>
            )}
            <Button
              variant="contained"
              onClick={handleNext}
              endIcon={
                activeStep === steps.length - 1 ? (
                  <CheckCircleIcon />
                ) : (
                  <ArrowForwardIcon />
                )
              }
              disabled={createWithdrawalMutation.isPending}
            >
              {createWithdrawalMutation.isPending ? (
                <CircularProgress size={24} />
              ) : activeStep === steps.length - 1 ? (
                "Process Withdrawal"
              ) : (
                "Next"
              )}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}
