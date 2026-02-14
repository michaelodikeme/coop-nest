"use client";

import React, { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Tooltip,
  alpha,
  useTheme,
  IconButton,
  Alert,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import UploadIcon from "@mui/icons-material/Upload";
import { DataTable, DataTableColumn } from "@/components/organisms/DataTable";
import { Button } from "@/components/atoms/Button";
import PermissionGate from "@/components/atoms/PermissionGate";
import { Modal } from "@/components/molecules/Modal";
import { Module } from "@/types/permissions.types";
import { formatCurrency, formatDate } from "@/utils/formatting/format";
import { useRouter } from "next/navigation";
import { Loan, LoanStatus } from "@/types/loan.types";
import {
  useAdminLoans,
  useAdminLoanTypes,
  useAdminLoansSummary,
  useEnhancedLoansSummary,
  useAdminLoanRepaymentUpload,
} from "@/lib/hooks/admin/useAdminFinancial";
import { useToast } from "@/components/molecules/Toast";

export default function AdminLoansPage() {
  const theme = useTheme();
  const router = useRouter();
  const toast = useToast();

  // State management
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [activeTab, setActiveTab] = useState(0);
  const [statusFilter, setStatusFilter] = useState<LoanStatus | "">("");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Define the filters object based on selected filters
  const filters = useMemo(
    () => ({
      ...(statusFilter ? { status: statusFilter } : {}),
    }),
    [statusFilter]
  );

  // Fetch loans and loan types using the hooks from useAdminFinancial
  const {
    data: loansData,
    isLoading,
    refetch,
  } = useAdminLoans(currentPage, pageSize, filters);
  const { data: loanTypes, isLoading: isLoadingLoanTypes } =
    useAdminLoanTypes();
  const { data: loanSummary, isLoading: isLoadingSummary } =
    useAdminLoansSummary();
  const { data: enhancedSummary, isLoading: isLoadingEnhanced } =
    useEnhancedLoansSummary();
  const loanRepaymentUploadMutation = useAdminLoanRepaymentUpload();

  // Log fetched data for debugging
  React.useEffect(() => {
    if (loansData) {
      console.log("Loans Data from AdminLoansPage:", loansData);
    }
    if (loanTypes) {
      console.log("Loan Types from AdminLoansPage:", loanTypes);
    }
    if (loanSummary) {
      console.log("Loan Summary from AdminLoansPage:", loanSummary);
    }
    if (enhancedSummary) {
      console.log("Enhanced Summary from AdminLoansPage:", enhancedSummary);
    }
  }, [loansData, loanTypes, loanSummary, enhancedSummary]);

  // Handle tab change
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);

    // Set status filter based on tab
    switch (newValue) {
      case 0: // All loans
        setStatusFilter("");
        break;
      case 1: // Pending approval loans
        setStatusFilter("PENDING" as LoanStatus);
        break;
      case 2: // Active and Disbursed loans
        setStatusFilter(["DISBURSED"] as any);
        break;
      case 3: // In process loans (IN_REVIEW, REVIEWED, APPROVED)
        setStatusFilter(["IN_REVIEW"] as any);
        break;
      case 4: // Completed loans
        setStatusFilter("COMPLETED" as LoanStatus);
        break;
      default:
        setStatusFilter("");
    }
  };

  // Handle loan repayment upload
  const handleLoanRepaymentUpload = async (file: File) => {
    try {
      toast.info("Uploading loan repayments...");
      const result = await loanRepaymentUploadMutation.mutateAsync(file);

      // Show detailed results if there are failures
      if (result.totalFailed > 0) {
        const failedSheets = result.sheetResults
          .filter((sheet) => sheet.failedRows.length > 0)
          .map((sheet) => {
            const firstErrors = sheet.failedRows
              .slice(0, 3)
              .map((f) => `Row ${f.row}: ${f.error}`)
              .join("; ");
            return `${sheet.sheetName} (${
              sheet.failedRows.length
            } errors): ${firstErrors}${
              sheet.failedRows.length > 3 ? "..." : ""
            }`;
          })
          .join(" | ");

        console.warn("Upload errors:", failedSheets);
      }

      setIsUploadModalOpen(false);
    } catch (error) {
      console.error("Upload failed:", error);
      // Error already shown by mutation onError
    }
  };

  // Get color and label for loan status chips
  const getStatusChip = (status: LoanStatus) => {
    const statusConfig: Record<
      string,
      {
        color:
          | "default"
          | "primary"
          | "secondary"
          | "error"
          | "info"
          | "success"
          | "warning";
        label: string;
      }
    > = {
      PENDING: { color: "warning", label: "Pending" },
      IN_REVIEW: { color: "info", label: "In Review" },
      REVIEWED: { color: "secondary", label: "Reviewed" },
      APPROVED: { color: "success", label: "Approved" },
      REJECTED: { color: "error", label: "Rejected" },
      DISBURSED: { color: "primary", label: "Disbursed" },
      ACTIVE: { color: "primary", label: "Active" },
      COMPLETED: { color: "default", label: "Completed" },
      DEFAULTED: { color: "error", label: "Defaulted" },
      CANCELLED: { color: "default", label: "Cancelled" },
    };

    return statusConfig[status] || { color: "default", label: status };
  };

  // Define columns for DataTable
  // const loansColumns: DataTableColumn<Loan>[] = [
  //   {
  //     id: "id",
  //     label: "Loan ID",
  //     accessor: "id",
  //     Cell: ({ value }) => (
  //       <Typography variant="body2" fontFamily="monospace">
  //         {value.substring(0, 8)}
  //       </Typography>
  //     ),
  //     filterable: true,
  //   },
  //   {
  //     id: "member",
  //     label: "Member",
  //     accessor: (row) => row.member?.fullName || "",
  //     Cell: ({ row }) => (
  //       <Box>
  //         <Typography variant="body2">
  //           {row.original.member?.fullName || "N/A"}
  //         </Typography>
  //         <Typography variant="caption" color="text.secondary">
  //           {row.original.member?.erpId || ""}
  //         </Typography>
  //       </Box>
  //     ),
  //     filterable: true,
  //   },
  //   {
  //     id: "loanType",
  //     label: "Loan Type",
  //     accessor: (row) => row.loanType?.name || "",
  //     filterable: true,
  //   },
  //   {
  //     id: "amount",
  //     label: "Amount",
  //     accessor: "principalAmount",
  //     Cell: ({ value }) => formatCurrency(Number(value)),
  //     filterable: false,
  //   },
  //   {
  //     id: "status",
  //     label: "Status",
  //     accessor: "status",
  //     Cell: ({ value }) => {
  //       const { color, label } = getStatusChip(value as LoanStatus);
  //       return (
  //         <Chip
  //           label={label}
  //           color={color}
  //           size="small"
  //           sx={{ minWidth: 85, fontWeight: 500 }}
  //         />
  //       );
  //     },
  //     filterable: true,
  //   },
  //   {
  //     id: "progress",
  //     label: "Progress",
  //     accessor: (row) => {
  //       const total = Number(row.totalAmount);
  //       const paid = Number(row.paidAmount);
  //       return total > 0 ? Math.round((paid / total) * 100) : 0;
  //     },
  //     Cell: ({ value }) => (
  //       <Box
  //         sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}
  //       >
  //         <Box sx={{ width: "100%" }}>
  //           <LinearProgress
  //             variant="determinate"
  //             value={value}
  //             sx={{ height: 6, borderRadius: 3 }}
  //           />
  //         </Box>
  //         <Box sx={{ minWidth: 35, textAlign: "right" }}>
  //           <Typography variant="body2" color="text.secondary">
  //             {value}%
  //           </Typography>
  //         </Box>
  //       </Box>
  //     ),
  //     filterable: false,
  //   },
  //   {
  //     id: "createdAt",
  //     label: "Created",
  //     accessor: "createdAt",
  //     Cell: ({ value }) => formatDate(value),
  //     filterable: false,
  //   },
  //   {
  //     id: "actions",
  //     label: "Actions",
  //     accessor: "id",
  //     Cell: ({ row }) => (
  //       <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
  //         <PermissionGate permissions={["VIEW_LOANS"]} module={Module.LOAN}>
  //           <Tooltip title="View Details">
  //             <IconButton
  //               size="small"
  //               onClick={(e) => {
  //                 e.stopPropagation();
  //                 router.push(`/admin/financial/loans/${row.original.id}`);
  //               }}
  //               sx={{
  //                 color: theme.palette.primary.main,
  //                 "&:hover": {
  //                   bgcolor: alpha(theme.palette.primary.main, 0.1),
  //                 },
  //               }}
  //             >
  //               <VisibilityIcon fontSize="small" />
  //             </IconButton>
  //           </Tooltip>
  //         </PermissionGate>
  //       </Box>
  //     ),
  //     filterable: false,
  //   },
  // ];
  const loansColumns: DataTableColumn<Loan>[] = [
    {
      id: "id",
      label: "Loan ID",
      accessor: "id",
      Cell: ({ value }) => (
        <Box sx={{ display: "flex", alignItems: "center", py: 1.5 }}>
          <Typography variant="body2" fontFamily="monospace">
            {value.substring(0, 8)}
          </Typography>
        </Box>
      ),
      filterable: true,
    },
    {
      id: "member",
      label: "Member",
      accessor: (row) => row.member?.fullName || "",
      Cell: ({ row }) => (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            py: 1.5,
          }}
        >
          <Typography variant="body2">
            {row.original.member?.fullName || "N/A"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {row.original.member?.erpId || ""}
          </Typography>
        </Box>
      ),
      filterable: true,
    },
    {
      id: "loanType",
      label: "Loan Type",
      accessor: (row) => row.loanType?.name || "",
      Cell: ({ value }) => (
        <Box sx={{ display: "flex", alignItems: "center", py: 1.5 }}>
          <Typography variant="body2">{value}</Typography>
        </Box>
      ),
      filterable: true,
    },
    {
      id: "amount",
      label: "Amount",
      accessor: "principalAmount",
      Cell: ({ value }) => (
        <Box sx={{ display: "flex", alignItems: "center", py: 1.5 }}>
          <Typography variant="body2">
            {formatCurrency(Number(value))}
          </Typography>
        </Box>
      ),
      filterable: false,
    },
    {
      id: "status",
      label: "Status",
      accessor: "status",
      Cell: ({ value }) => {
        const { color, label } = getStatusChip(value as LoanStatus);
        return (
          <Box sx={{ display: "flex", alignItems: "center", py: 1.5 }}>
            <Chip
              label={label}
              color={color}
              size="small"
              sx={{
                minWidth: 90,
                fontWeight: 500,
              }}
            />
          </Box>
        );
      },
      filterable: true,
    },
    {
      id: "progress",
      label: "Progress",
      accessor: (row) => {
        const total = Number(row.totalAmount);
        const paid = Number(row.paidAmount);
        return total > 0 ? Math.round((paid / total) * 100) : 0;
      },
      Cell: ({ value }) => (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            minWidth: 140,
            py: 1.5,
          }}
        >
          <Box sx={{ flex: 1 }}>
            <LinearProgress
              variant="determinate"
              value={value}
              sx={{
                height: 6,
                borderRadius: 3,
              }}
            />
          </Box>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ minWidth: 35, textAlign: "right" }}
          >
            {value}%
          </Typography>
        </Box>
      ),
      filterable: false,
    },
    {
      id: "createdAt",
      label: "Created",
      accessor: "createdAt",
      Cell: ({ value }) => (
        <Box sx={{ display: "flex", alignItems: "center", py: 1.5 }}>
          <Typography variant="body2">{formatDate(value)}</Typography>
        </Box>
      ),
      filterable: false,
    },
    {
      id: "actions",
      label: "Actions",
      accessor: "id",
      Cell: ({ row }) => (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
            py: 1.5,
          }}
        >
          <PermissionGate permissions={["VIEW_LOANS"]} module={Module.LOAN}>
            <Tooltip title="View Details">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/admin/financial/loans/${row.original.id}`);
                }}
                sx={{
                  color: theme.palette.primary.main,
                  "&:hover": {
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                  },
                }}
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </PermissionGate>
        </Box>
      ),
      filterable: false,
    },
  ];

  // Calculate loan statistics for summary cards
  const loanStats = useMemo(
    () => ({
      totalLoans: loansData?.meta?.total || 0,
      totalDisbursed: loanSummary?.totalDisbursed || 0,
      totalOutstanding: loanSummary?.totalOutstanding || 0,
      totalRepaid: enhancedSummary?.totalRepaid || 0,
      pendingApproval: enhancedSummary?.pendingLoans || 0,
      activeLoans: enhancedSummary?.newLoansCount || 0,
    }),
    [loansData, loanSummary, enhancedSummary]
  );

  return (
    <Box sx={{ maxWidth: "100%", pt: 2, pb: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Typography variant="h4" component="h1" fontWeight={600}>
          Loan Management
        </Typography>

        <PermissionGate
          permissions={["PROCESS_LOANS_REPAYMENT"]}
          module={Module.LOAN}
          approvalLevel={2}
        >
          <Button
            variant="contained"
            color="primary"
            startIcon={<UploadIcon />}
            onClick={() => setIsUploadModalOpen(true)}
          >
            Upload Repayments
          </Button>
        </PermissionGate>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
          <Card
            variant="outlined"
            sx={{
              height: "100%",
              borderRadius: 3,
              transition: "0.2s ease",
              "&:hover": {
                boxShadow: 3,
              },
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                sx={{ mb: 1, fontWeight: 500 }}
              >
                Total Loans
              </Typography>

              <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>
                {isLoadingSummary ? "-" : loanStats.totalLoans}
              </Typography>

              <Typography variant="caption" color="text.secondary">
                All time
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
          <Card
            variant="outlined"
            sx={{
              height: "100%",
              borderRadius: 3,
              transition: "0.2s ease",
              "&:hover": {
                boxShadow: 3,
              },
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                sx={{ mb: 1, fontWeight: 500 }}
              >
                Disbursed Amount
              </Typography>

              <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>
                {isLoadingSummary
                  ? "-"
                  : formatCurrency(loanStats.totalDisbursed)}
              </Typography>

              <Typography variant="caption" color="text.secondary">
                Funds released
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
          <Card
            variant="outlined"
            sx={{
              height: "100%",
              borderRadius: 3,
              transition: "0.2s ease",
              "&:hover": {
                boxShadow: 3,
              },
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                sx={{ mb: 1, fontWeight: 500 }}
              >
                Outstanding
              </Typography>

              <Typography
                variant="h4"
                fontWeight={700}
                color="info.main"
                sx={{ mb: 0.5 }}
              >
                {isLoadingSummary
                  ? "-"
                  : formatCurrency(loanStats.totalOutstanding)}
              </Typography>

              <Typography variant="caption" color="text.secondary">
                To be collected
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
          <Card
            variant="outlined"
            sx={{
              height: "100%",
              borderRadius: 3,
              transition: "0.2s ease",
              "&:hover": {
                boxShadow: 3,
              },
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                sx={{ mb: 1, fontWeight: 500 }}
              >
                Total Repaid
              </Typography>

              <Typography
                variant="h4"
                fontWeight={700}
                color="success.main"
                sx={{ mb: 0.5 }}
              >
                {isLoadingEnhanced
                  ? "-"
                  : formatCurrency(loanStats.totalRepaid)}
              </Typography>

              <Typography variant="caption" color="text.secondary">
                Collected amount
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs for loan filtering */}
      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="loan status tabs"
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            "& .MuiTabs-indicator": {
              height: 3,
            },
          }}
        >
          <Tab label="All Loans" />
          <Tab label="Pending" />
          <Tab label="Active" />
          <Tab label="In Process" />
          <Tab label="Completed" />
        </Tabs>
      </Paper>
      {/* Loans data table */}
      <Paper sx={{ p: 2, position: "relative", overflow: "auto" }}>
        {isLoading && (
          <LinearProgress
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              zIndex: 10,
            }}
          />
        )}

        <DataTable
          columns={loansColumns}
          data={loansData?.data || []}
          pagination={{
            pageIndex: currentPage - 1,
            pageSize: pageSize,
            pageCount: loansData?.meta?.totalPages || 1,
            totalRecords: loansData?.meta?.total || 0,
          }}
          onPageChange={(newPage) => setCurrentPage(newPage + 1)}
          onPageSizeChange={setPageSize}
          loading={isLoading || isLoadingLoanTypes}
          enableFiltering={false}
          onRowClick={(row) => router.push(`/admin/financial/loans/${row.id}`)}
          noDataMessage={
            Object.keys(filters).length > 0
              ? "No loans match your search criteria"
              : "No loans available in the system"
          }
          headerBackgroundColor={theme.palette.grey[200]}
        />
      </Paper>

      {/* Loan Repayment Upload Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Loan Repayments"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fileInput = e.currentTarget.elements.namedItem(
              "file"
            ) as HTMLInputElement;
            if (fileInput && fileInput.files && fileInput.files[0]) {
              handleLoanRepaymentUpload(fileInput.files[0]);
            } else {
              toast.error("Please select a file to upload");
            }
          }}
          className="space-y-5 px-6 py-5"
        >
          <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Upload an Excel or CSV file containing monthly loan repayments.
              Each row should contain the member&apos;s ERP ID, payment amount,
              month, year, and loan type description.
            </Typography>

            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
              File Format Requirements:
            </Typography>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1 mb-4">
              <li>Excel (.xlsx, .xls) or CSV format</li>
              <li>
                Required columns: Employee (ERP ID), amount, month, year,
                description (loan type)
              </li>
              <li>Maximum file size: 5MB</li>
            </ul>

            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
              Loan Type Descriptions (case-insensitive):
            </Typography>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1 mb-4">
              <li>&quot;soft loan&quot; → Soft Loan</li>
              <li>&quot;regular loan 1 year&quot; → Regular Loan (1 Year)</li>
              <li>
                &quot;regular loan 1+ year&quot; → Regular Loan (1 Year Plus)
              </li>
            </ul>

            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
              Example Data:
            </Typography>
            <Box
              component="pre"
              sx={{
                p: 2,
                bgcolor: "grey.50",
                border: "1px solid",
                borderColor: "grey.200",
                borderRadius: 2,
                fontSize: "0.75rem",
                overflow: "auto",
                mb: 2,
              }}
            >
              {`Employee         amount    month    year    description
FUO-ADM-00008    12500     1        2026    soft loan
FUO-ADM-00059    8334      1        2026    regular loan 1 year
FUO-ADM-00077    33334     1        2026    regular loan 1+ year`}
            </Box>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select File
              </label>
              <input
                type="file"
                name="file"
                accept=".xlsx,.xls,.csv"
                className="mt-1 block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-primary-50 file:text-primary-700
            hover:file:bg-primary-100"
              />
            </div>
          </div>

          {loanRepaymentUploadMutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {(loanRepaymentUploadMutation.error as any)?.message ||
                "Error uploading file. Please check format and try again."}
            </Alert>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
            <Button
              variant="outlined"
              onClick={() => setIsUploadModalOpen(false)}
              disabled={loanRepaymentUploadMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={loanRepaymentUploadMutation.isPending}
              disabled={loanRepaymentUploadMutation.isPending}
            >
              {loanRepaymentUploadMutation.isPending
                ? "Uploading..."
                : "Upload"}
            </Button>
          </div>
        </form>
      </Modal>
    </Box>
  );
}
