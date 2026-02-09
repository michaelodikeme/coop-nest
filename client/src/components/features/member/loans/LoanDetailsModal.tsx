import { format } from "date-fns";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Chip,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Divider,
  CircularProgress,
} from "@mui/material";
import { useLoanDetails } from "@/lib/hooks/member/useMemberLoans";
import { formatCurrency } from "@/utils/formatting/format";

export function LoanDetailsModal({
  open,
  onClose,
  loanId,
}: {
  open: boolean;
  onClose: () => void;
  loanId: string;
}) {
  const { loanDetails, isLoading } = useLoanDetails(loanId);

  console.log("Loan Details:", loanDetails); // Add this for debugging

  if (isLoading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <Box sx={{ p: 4, textAlign: "center" }}>
          <CircularProgress />
        </Box>
      </Dialog>
    );
  }

  if (!loanDetails) return null;

  // Calculate payment progress using the correct path
  const progressPercent = Math.min(
    100,
    Math.round(
      (Number(loanDetails.paidAmount) / Number(loanDetails.totalAmount)) * 100
    ) || 0
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      // Add these props to help with modal visibility
      keepMounted={false}
      disableEscapeKeyDown={false}
      sx={{ zIndex: (theme) => theme.zIndex.modal + 1 }}
    >
      <DialogTitle>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6">
            {loanDetails.loanType?.name || "Loan Details"}
          </Typography>
          <Chip
            label={loanDetails.status}
            color={
              loanDetails.status === "ACTIVE"
                ? "success"
                : loanDetails.status === "PENDING"
                ? "warning"
                : loanDetails.status === "COMPLETED"
                ? "info"
                : "default"
            }
            size="small"
          />
        </Box>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3}>
          {/* Loan Summary */}
          <Grid size={{ xs: 12 }}>
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Loan Summary
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6, md: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    Principal
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {formatCurrency(Number(loanDetails.principalAmount))}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    Interest
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {formatCurrency(Number(loanDetails.interestAmount))}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Amount
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {formatCurrency(
                      Number(
                        loanDetails.totalAmount + loanDetails.interestAmount
                      )
                    )}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    Tenure
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {loanDetails.tenure} months
                  </Typography>
                </Grid>
              </Grid>

              {/* Payment Progress */}
              <Box sx={{ mt: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 0.5,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Payment Progress
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {progressPercent}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={progressPercent}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            </Paper>
          </Grid>

          {/* Payment Schedules */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle1" gutterBottom>
              Payment Schedule
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Due Date</TableCell>
                    <TableCell align="right">Expected Amount</TableCell>
                    <TableCell align="right">Principal</TableCell>
                    <TableCell align="right">Interest</TableCell>
                    <TableCell align="right">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loanDetails.paymentSchedules.map((schedule) => (
                    <TableRow key={schedule.id}>
                      <TableCell>
                        {format(new Date(schedule.dueDate), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(Number(schedule.expectedAmount))}
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(Number(schedule.principalAmount))}
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(Number(schedule.interestAmount))}
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          label={schedule.status}
                          size="small"
                          color={
                            schedule.status === "PAID"
                              ? "success"
                              : schedule.status === "PARTIAL"
                              ? "warning"
                              : "default"
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>

          {/* Status History */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle1" gutterBottom>
              Status History
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    {/* <TableCell>From Status</TableCell> */}
                    <TableCell>Status</TableCell>
                    <TableCell>Notes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loanDetails.statusHistory.map((history, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {format(new Date(history.changeDate), "MMM dd, yyyy")}
                      </TableCell>
                      {/* <TableCell>{history.fromStatus}</TableCell> */}
                      <TableCell>{history.toStatus}</TableCell>
                      <TableCell>{history.reason || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
}
