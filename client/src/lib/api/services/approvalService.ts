import { RequestStatus } from '@/types/request.types';
import { requestService } from '@/lib/api/services/requestService';


/**
 * Service for approvals management
 * This is a wrapper around the request service focused on approval workflows
 */
export const approvalService = {
  /**
   * Get pending approvals assigned to current user
   * This method specifically filters for actionable approval items
   */
  async getPendingApprovals(page = 1, limit = 10) {
    console.log('Fetching pending approvals for current user');
    
    try {
      const response = await requestService.getAssignedRequests(page, limit);
      
      console.log('Raw response from getAssignedRequests:', response); // Added debugging
    
      if (!response.data || !Array.isArray(response.data)) {
        console.warn('Invalid response structure from getAssignedRequests', response);
        return [];
      }
      
      // Filter for requests that need approval action
      const pendingApprovals = response.data.filter(request => {
        // Check if the request is in a status that requires approval
        const needsApproval = [
          RequestStatus.PENDING,
          RequestStatus.IN_REVIEW, 
          RequestStatus.REVIEWED
        ].includes(request.status as RequestStatus);
        
        // Exclude completed, rejected, or cancelled requests
        const isActionable = ![
          RequestStatus.APPROVED,
          RequestStatus.REJECTED,
          RequestStatus.CANCELLED,
          RequestStatus.COMPLETED
        ].includes(request.status as RequestStatus);
        
        console.log(`Request ${request.id}: status=${request.status}, needsApproval=${needsApproval}, isActionable=${isActionable}`); // Added debugging
      
        return needsApproval && isActionable;
      });
      
      console.log(`Found ${pendingApprovals.length} pending approvals out of ${response.data.length} assigned requests`);
      console.log('Pending approvals:', pendingApprovals); // Added debugging
    
      return pendingApprovals;
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      return [];
    }
  },
  
  /**
   * Approve a request
   * @param requestId - Request ID
   * @param notes - Optional approval notes
   * @returns Updated request
   */
  async approveRequest(requestId: string, notes?: string) {
    console.log(`Approving request: ${requestId}`);
    return requestService.updateRequestStatus(requestId, RequestStatus.APPROVED, notes);
  },
  
  /**
   * Reject a request
   * @param requestId - Request ID
   * @param reason - Rejection reason
   * @returns Updated request
   */
  async rejectRequest(requestId: string, reason: string) {
    console.log(`Rejecting request: ${requestId}`);
    return requestService.updateRequestStatus(requestId, RequestStatus.REJECTED, reason);
  },
  
  /**
   * Mark a request as in-review
   * @param requestId - Request ID
   * @param notes - Optional review notes
   * @returns Updated request
   */
  async reviewRequest(requestId: string, notes?: string) {
    console.log(`Marking request as in-review: ${requestId}`);
    return requestService.updateRequestStatus(requestId, RequestStatus.IN_REVIEW, notes);
  },
  
  /**
   * Complete a request after all approvals
   * @param requestId - Request ID
   * @param notes - Optional completion notes
   * @returns Updated request
   */
  async completeRequest(requestId: string, notes?: string) {
    console.log(`Completing request: ${requestId}`);
    return requestService.updateRequestStatus(requestId, RequestStatus.COMPLETED, notes);
  }
};