"use client";

import {
  usePersonalSavingsPlan,
  useRequestWithdrawal,
} from "@/lib/hooks/member/usePersonalSavings";
import {
  PersonalSavingsStatus,
  RequestStatus,
} from "@/types/personal-savings.types";
import { useState } from "react";
import { formatCurrency } from "@/utils/formatting/format";
import { TransactionHistory } from "./shared/TransactionHistory";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Grid,
  Tabs,
  Tab,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Alert,
  AlertTitle,
  Chip,
  Stack,
  LinearProgress,
  Paper,
  Divider,
} from "@mui/material";

const withdrawalSchema = z.object({
  amount: z.number().positive("Amount must be greater than zero"),
  reason: z.string().optional(),
});

type WithdrawalFormValues = z.infer<typeof withdrawalSchema>;

interface PlanDetailsProps {
  id: string;
}

export function PlanDetails({ id }: PlanDetailsProps) {
  const { data: response, isLoading } = usePersonalSavingsPlan(id);
  const plan = response?.data;
  const [tabValue, setTabValue] = useState(0);
  const [isWithdrawalOpen, setIsWithdrawalOpen] = useState(false);
  const withdrawalMutation = useRequestWithdrawal();

  const form = useForm<WithdrawalFormValues>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      amount: 0,
      reason: "",
    },
  });

  if (isLoading) {
    return <LinearProgress sx={{ my: 4 }} />;
  }

  if (!plan) {
    return (
      <Alert severity="error">
        <AlertTitle>Error</AlertTitle>
        Unable to load plan details. Please try again later.
      </Alert>
    );
  }

  const handleWithdrawal = (data: WithdrawalFormValues) => {
    if (!plan.id) return;

    withdrawalMutation.mutate(
      {
        id: plan.id,
        data: {
          amount: data.amount,
          reason: data.reason,
        },
      },
      {
        onSuccess: () => setIsWithdrawalOpen(false),
      }
    );
  };

  // Determine if plan has pending withdrawal
  const hasPendingWithdrawal = !!plan.pendingWithdrawal;

  // Determine plan status display
  const getPlanStatusDisplay = () => {
    if (hasPendingWithdrawal) {
      return {
        label: "Withdrawal Pending",
        color: "warning.main",
      };
    }

    switch (plan.status) {
      case PersonalSavingsStatus.ACTIVE:
        return { label: "Active", color: "success.main" };
      case PersonalSavingsStatus.CLOSED:
        return { label: "Closed", color: "text.secondary" };
      case PersonalSavingsStatus.SUSPENDED:
        return { label: "Suspended", color: "error.main" };
      default:
        return { label: plan.status, color: "info.main" };
    }
  };

  const statusDisplay = getPlanStatusDisplay();
  const isActive =
    plan.status === PersonalSavingsStatus.ACTIVE && !hasPendingWithdrawal;

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4" fontWeight="bold">
          {plan.planName || "Savings Plan"}
        </Typography>

        {isActive && (
          <Button variant="contained" onClick={() => setIsWithdrawalOpen(true)}>
            Request Withdrawal
          </Button>
        )}
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardHeader title="Current Balance" sx={{ pb: 0 }} />
            <CardContent>
              <Typography variant="h4" fontWeight="bold">
                {formatCurrency(parseFloat(plan.currentBalance) || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardHeader title="Status" sx={{ pb: 0 }} />
            <CardContent>
              <Typography
                variant="h4"
                fontWeight="bold"
                color={statusDisplay.color}
              >
                {statusDisplay.label}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardHeader title="Target Amount" sx={{ pb: 0 }} />
            <CardContent>
              <Typography variant="h4" fontWeight="bold">
                {plan.targetAmount
                  ? formatCurrency(parseFloat(plan.targetAmount))
                  : "N/A"}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Display pending withdrawal information if exists */}
      {hasPendingWithdrawal && (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 4,
            backgroundColor: "rgba(255, 178, 0, 0.08)",
            borderLeft: "4px solid #FFB200",
          }}
        >
          <Typography variant="h6" color="warning.main" gutterBottom>
            Pending Withdrawal Request
          </Typography>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Amount:
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {formatCurrency(plan.pendingWithdrawal?.amount || 0)}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Status:
                </Typography>
                <Chip
                  label={plan.pendingWithdrawal?.status || "Pending"}
                  color="warning"
                  size="small"
                />
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary">
                  Requested:
                </Typography>
                <Typography variant="body1">
                  {plan.pendingWithdrawal?.requestedAt
                    ? new Date(
                        plan.pendingWithdrawal.requestedAt
                      ).toLocaleDateString()
                    : "N/A"}
                </Typography>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              {plan.pendingWithdrawal &&
                plan.pendingWithdrawal.approvalSteps && (
                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Approval Progress:
                    </Typography>
                    <ApprovalProgress
                      steps={plan.pendingWithdrawal.approvalSteps}
                      currentLevel={plan.pendingWithdrawal.currentApprovalLevel}
                    />
                  </Box>
                )}
            </Grid>
          </Grid>
        </Paper>
      )}

      <Box sx={{ width: "100%", mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={tabValue}
            onChange={(_, newValue) => setTabValue(newValue)}
            aria-label="plan details tabs"
          >
            <Tab label="Transactions" />
          </Tabs>
        </Box>
        <Box sx={{ pt: 3 }}>
          {tabValue === 0 && <TransactionHistory planId={id} />}
        </Box>
      </Box>
      {/* Withdrawal Dialog */}
      <Dialog
        open={isWithdrawalOpen}
        onClose={() => setIsWithdrawalOpen(false)}
      >
        <DialogTitle>Request Withdrawal</DialogTitle>
        <form onSubmit={form.handleSubmit(handleWithdrawal)}>
          <DialogContent>
            {withdrawalMutation.isError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {(withdrawalMutation.error as any)?.response?.data?.message ||
                  withdrawalMutation.error?.message ||
                  "Withdrawal request failed"}
              </Alert>
            )}
            <DialogContentText sx={{ mb: 2 }}>
              Enter the amount you wish to withdraw and an optional reason.
            </DialogContentText>

            <TextField
              label="Amount"
              type="number"
              fullWidth
              margin="normal"
              {...form.register("amount", { valueAsNumber: true })}
              error={!!form.formState.errors.amount}
              helperText={form.formState.errors.amount?.message}
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Current Balance:{" "}
              {formatCurrency(parseFloat(plan?.currentBalance || "0"))}
            </Typography>

            <TextField
              label="Reason (Optional)"
              fullWidth
              multiline
              rows={3}
              margin="normal"
              {...form.register("reason")}
              error={!!form.formState.errors.reason}
              helperText={form.formState.errors.reason?.message}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsWithdrawalOpen(false)}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={withdrawalMutation.isPending}
            >
              {withdrawalMutation.isPending
                ? "Submitting..."
                : "Submit Request"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ApprovalProgress component for general plan approvals (if any) */}
      {plan.approvalSteps && plan.approvalSteps.length > 0 && (
        <Paper sx={{ p: 2, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Plan Approval Status
          </Typography>
          <ApprovalProgress
            steps={plan.approvalSteps}
            currentLevel={plan.currentApprovalLevel || 1}
          />
        </Paper>
      )}
    </Box>
  );
}

// Custom ApprovalProgress component
type ApprovalStep = {
  level: number;
  approverRole?: string;
};

interface ApprovalProgressProps {
  steps: ApprovalStep[];
  currentLevel: number;
}

function ApprovalProgress({ steps, currentLevel }: ApprovalProgressProps) {
  if (!steps || steps.length === 0) return null;

  return (
    <Box>
      <Stack direction="row" spacing={1} alignItems="center">
        {steps.map((step, index) => (
          <Box key={index} sx={{ display: "flex", alignItems: "center" }}>
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.75rem",
                fontWeight: "medium",
                ...(step.level < currentLevel
                  ? {
                      bgcolor: "success.light",
                      color: "success.contrastText",
                      border: "1px solid",
                      borderColor: "success.main",
                    }
                  : step.level === currentLevel
                  ? {
                      bgcolor: "primary.light",
                      color: "primary.contrastText",
                      border: "2px solid",
                      borderColor: "primary.main",
                    }
                  : {
                      bgcolor: "grey.100",
                      color: "text.secondary",
                      border: "1px solid",
                      borderColor: "grey.300",
                    }),
              }}
            >
              {step.level}
            </Box>
            {index < steps.length - 1 && (
              <Box
                sx={{ width: 24, height: 1, bgcolor: "grey.300", mx: 0.5 }}
              />
            )}
          </Box>
        ))}
      </Stack>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ mt: 1, display: "block" }}
      >
        Current: Level {currentLevel} (
        {steps.find((s) => s.level === currentLevel)?.approverRole || "Unknown"}
        )
      </Typography>
    </Box>
  );
}
