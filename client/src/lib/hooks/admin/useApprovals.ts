import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { requestService } from '@/lib/api/services/requestService';
import { useToast } from '@/components/molecules/Toast';
import { RequestQueryParams, RequestStatus, RequestType } from '@/types/request.types';
import { PaginatedResponse } from '@/types/types';
import { loanService } from '@/lib/api';
import { LoanStatus } from '@/types/loan.types';
import React from 'react';

/**
* Get approvals by type with pagination and filtering
* Handles both generic requests and all approval types
*/
export function useApprovals(type?: RequestType | string, page: number = 1, limit: number = 10, status?: RequestStatus | string, searchTerm?: string) {
  const toast = useToast();
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: ['approvals', type, page, limit, status, searchTerm],
    queryFn: async () => {
      try {
        console.log(`Fetching approvals with type: ${type || 'all'}`);
        
        // Build query parameters consistent with backend expectations
        const params: RequestQueryParams = { 
          page,
          limit,
          // Only include valid query parameters
          ...(type ? { type: type as RequestType } : {}),
          ...(status ? { status: status as RequestStatus } : {}),
          ...(searchTerm ? { searchTerm } : {})
        };
        
        const response = await requestService.getAllRequests(params);

        // Ensure we return a consistent structure that matches API response
        return {
          data: response.data || response?.data?.data || [],
          meta: {
            total: response.meta?.total || 0,
            page: response.meta?.page || page,
            limit: response.meta?.limit || limit,
            totalPages: response.meta?.totalPages || 0,
            statusCounts: response.meta?.statusCounts || {}
          }
        };
      } catch (error) {
        console.error('Error in useApprovals:', error);
        toast.error('Failed to fetch approval requests');
        throw error;
      }
    }
  });
}

/**
* Get approval request details by ID with loan-specific information
*/
export function useApprovalDetails(requestId: string | undefined) {
  const showToast = useToast();
  const queryClient = useQueryClient();
  
  const queryResult = useQuery({
    queryKey: ['approval', requestId],
    queryFn: async () => {
      const request = await requestService.getRequestById(requestId as string);
      
      // If this is a loan request, also fetch the loan details
      if (request.type === 'LOAN_APPLICATION' && request.loanId) {
        try {
          const loanDetails = await loanService.getLoanDetails(request.loanId);
          
          // Add a helper property to show the correct status for the UI
          // This ensures we show "DISBURSED" for completed loan requests when appropriate
          if (request.status === 'COMPLETED' && loanDetails.status === 'DISBURSED') {
            request.displayStatus = 'DISBURSED';
          }
          
          return {
            ...request,
            loanDetails
          };
        } catch (error) {
          console.error('Failed to fetch loan details:', error);
        }
      }
      
      return request;
    },
    enabled: !!requestId,
  });

  // Handle side effects for success and error
  React.useEffect(() => {
    if (queryResult.isSuccess) {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['approval'] });
      showToast?.success('Request details fetched successfully');
    }
    if (queryResult.isError) {
      console.error(`Failed to fetch approval details for ${requestId}:`, queryResult.error);
      showToast?.error('Failed to fetch request details');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryResult.isSuccess, queryResult.isError]);

  return queryResult;
}

/**
* Review a loan request (first approval level - Treasurer)
* Changes status from PENDING to IN_REVIEW
*/
export function useReviewRequest() {
  const queryClient = useQueryClient();
  const showToast = useToast();

  return useMutation({
    mutationFn: async (data: { requestId: string; notes?: string }) => {
      // Check if this is a loan request
      const request = await requestService.getRequestById(data.requestId);

      if (request.type === 'LOAN_APPLICATION' && request.loanId) {
        // Only call loanService - it updates both the loan AND request status
        return loanService.updateLoanStatus(request.loanId, LoanStatus.IN_REVIEW, data.notes);
      }

      // For non-loan requests, use the request service
      return requestService.updateRequestStatus(data.requestId, RequestStatus.IN_REVIEW, data.notes);
    },
    onSuccess: () => {
      showToast?.success('Loan application moved to review');
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['approval'] });
    },
    onError: (error) => {
      console.error('Failed to move loan to review:', error);
      showToast?.error('Failed to update request status');
    }
  });
}

/**
* Mark a loan as reviewed (second approval level - Chairman)
* Changes status from IN_REVIEW to REVIEWED
*/
export function useMarkReviewed() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async (data: { requestId: string; notes?: string }) => {
      // Check if this is a loan request
      const request = await requestService.getRequestById(data.requestId);

      if (request.type === 'LOAN_APPLICATION' && request.loanId) {
        // Only call loanService - it updates both the loan AND request status
        return loanService.updateLoanStatus(request.loanId, LoanStatus.REVIEWED, data.notes);
      }

      // For non-loan requests, use the request service
      return requestService.updateRequestStatus(data.requestId, RequestStatus.REVIEWED, data.notes);
    },
    onSuccess: () => {
      toast?.success('Loan application marked as reviewed');
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['approval'] });
    },
    onError: (error) => {
      console.error('Failed to mark loan as reviewed:', error);
      toast?.error('Failed to update request status');
    }
  });
}

/**
* Approve a loan (third approval level - Treasurer for disbursement)
* Changes status from REVIEWED to APPROVED
*/
export function useApproveRequest() {
  const queryClient = useQueryClient();
  const showToast = useToast();

  return useMutation({
    mutationFn: async (data: { requestId: string; notes?: string }) => {
      // Check if this is a loan request
      const request = await requestService.getRequestById(data.requestId);

      if (request.type === 'LOAN_APPLICATION' && request.loanId) {
        // Only call loanService - it updates both the loan AND request status
        return loanService.updateLoanStatus(request.loanId, LoanStatus.APPROVED, data.notes);
      }

      // For non-loan requests, use the request service
      return requestService.updateRequestStatus(data.requestId, RequestStatus.APPROVED, data.notes);
    },
    onSuccess: () => {
      showToast?.success('Request approved successfully');
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['approval'] });
    },
    onError: (error) => {
      console.error('Failed to approve request:', error);
      showToast?.error('Failed to approve request');
    }
  });
}

/**
* Reject a request at any level
*/
export function useRejectRequest() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async (data: { requestId: string; reason: string }) => {
      // Check if this is a loan request
      const request = await requestService.getRequestById(data.requestId);

      if (request.type === 'LOAN_APPLICATION' && request.loanId) {
        // Only call loanService - it updates both the loan AND request status
        return loanService.updateLoanStatus(request.loanId, LoanStatus.REJECTED, data.reason);
      }

      // For non-loan requests, use the request service
      return requestService.updateRequestStatus(data.requestId, RequestStatus.REJECTED, data.reason);
    },
    onSuccess: () => {
      toast.success('Request rejected');
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['approval'] });
    },
    onError: (error) => {
      console.error('Failed to reject request:', error);
      toast.error('Failed to reject request');
    }
  });
}

/**
* Disburse an approved loan (final step - Treasurer)
* Changes loan status to DISBURSED and request status to COMPLETED
*/
export function useDisburseLoan() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async (data: { requestId: string; loanId: string; notes?: string }) => {
      // Single call - backend handles both loan status (DISBURSED) and request status (COMPLETED)
      await loanService.updateLoanStatus(data.loanId, LoanStatus.DISBURSED, data.notes);
    },
    onSuccess: () => {
      toast.success('Loan disbursed successfully');
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['approval'] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
    },
    onError: (error) => {
      console.error('Failed to disburse loan:', error);
      toast.error('Failed to disburse loan');
    }
  });
}

/**
* Get approval history for a request
*/
export function useApprovalHistory(requestId: string | undefined) {
  const toast = useToast();
  const queryResult = useQuery({
    queryKey: ['approval-history', requestId],
    queryFn: () => requestService.getRequestHistory(requestId as string),
    enabled: !!requestId,
  });

  React.useEffect(() => {
    if (queryResult.isError) {
      console.error(`Failed to fetch approval history for ${requestId}:`, queryResult.error);
      toast.error('Failed to fetch approval history');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryResult.isError]);

  return queryResult;
}

/**
* Helper function to map user approval level to expected loan status
*/
function mapApprovalLevelToStatus(approvalLevel?: number): string | undefined {
  let statuses;
  
  switch (approvalLevel) {
    case 1: // Admin
    statuses = 'PENDING'; // Admins see loans in PENDING status
    break;
    case 2: // Treasurer
    // Treasurer sees loans in IN_REVIEW status and APPROVED (for disbursement)
    // We need to map "APPROVED" when looking for loans ready for disbursement
    statuses = 'IN_REVIEW,APPROVED'; 
    break;
    case 3: // Chairman
    statuses = 'REVIEWED'; // Chairman sees loans in REVIEWED status
    break;
    default:
    return undefined; // No filtering
  }
  
  return statuses;
}

/**
* Helper function to map loan status to request status
* This ensures we're using the correct status values when filtering
*/
function mapLoanStatusToRequestStatus(loanStatus?: string): string | undefined {
  if (!loanStatus) return undefined;
  
  // Map loan-specific statuses to request statuses
  switch (loanStatus) {
    case 'PENDING': return 'PENDING';
    case 'IN_REVIEW': return 'IN_REVIEW';
    case 'REVIEWED': return 'REVIEWED';
    case 'APPROVED': return 'APPROVED';
    case 'REJECTED': return 'REJECTED';
    case 'DISBURSED': return 'COMPLETED'; // This is the key mapping
    case 'COMPLETED': return 'COMPLETED';
    case 'DEFAULTED': return undefined; // No direct equivalent
    case 'CANCELLED': return 'CANCELLED';
    default: return loanStatus;
  }
}