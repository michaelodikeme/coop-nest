import { apiService } from '@/lib/api/apiService';
import type { PaginatedResponse } from '@/types/types';
import { Notification } from '@/types/notification.types';
import { Request } from '@/types/request.types';

/**
 * Service for managing notifications and requests
 * Implements only the endpoints documented in the API
 */
class NotificationsService {
  /**
   * Get unread notifications
   * GET /notifications
   */
  async getUnreadNotifications(): Promise<Notification[]> {
    return apiService.get('/notifications');
  }

  /**
   * Mark notification as read
   * PUT /notifications/:id/read
   */
  async markNotificationRead(id: string): Promise<{ message: string }> {
    return apiService.put(`/notifications/${id}/read`);
  }
  /**
   * Mark all notifications read
   * PUT /notifications/mark-all-read
   */
  async markAllNotificationsRead(): Promise<{ message: string }> {
    return apiService.put('/notifications/mark-all-read');
  }
    /**
   * Get user's requests
   * GET /requests/user
   */
  async getUserRequests(): Promise<Request[]> {
    return apiService.get('/requests/user');
  }

  /**
   * Get all requests
   * GET /requests
   */
  async getAllRequests(page = 1, limit = 10): Promise<PaginatedResponse<Request>> {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });
    return apiService.get(`/requests?${queryParams.toString()}`);
  }
  
  /**
   * Get request details
   * GET /requests/:id
   */  
  async getRequestDetails(id: string): Promise<Request> {
    return apiService.get(`/requests/${id}`);
  }

  /**
   * Get all notifications including read ones
   * GET /notifications/all
   */
  async getAllNotifications(): Promise<Notification[]> {
    return apiService.get('/notifications/all');
  }

  /**
   * Update request
   * PUT /requests/:id
   */
  async updateRequest(id: string, data: {
    status: string;
    notes?: string;
  }): Promise<Request> {
    return apiService.put(`/requests/${id}`, data);
  }

  /**
   * Delete request
   * DELETE /requests/:id
   */
  async deleteRequest(id: string): Promise<{ message: string }> {
    return apiService.delete(`/requests/${id}`);
  }
}

export const notificationsService = new NotificationsService();
