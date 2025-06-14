'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { format } from 'date-fns';
import { useQueryWithToast } from '@/lib/hooks/redux/useDataFetching';
import { notificationsService } from '@/lib/api/services/notificationsService';
import { List, ListItem, ListItemText, Typography, Divider, Box, CircularProgress } from '@mui/material';
import { useQuery } from '@tanstack/react-query';

interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}
interface NotificationPanelProps {
  limit?: number;
  onViewAll?: () => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ limit, onViewAll }) => {
  // ...component code
// export const NotificationPanel = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('unread');
  
  // Fetch notifications
  const { 
    data: notifications, 
    isLoading,
    refetch 
  } = useQueryWithToast(
    ['notifications', activeTab],
    () => activeTab === 'unread' 
      ? notificationsService.getUnreadNotifications()
      : notificationsService.getAllNotifications(),
    { errorMessage: 'Failed to load notifications' }
  );  // State for tracking ongoing operations
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  
  // Mark notification as read with visual feedback
  const markAsRead = async (id: string) => {
    try {
      // Add the ID to the processing set
      setProcessingIds(prev => new Set(prev).add(id));
      
      await notificationsService.markNotificationRead(id);
      
      // Optimistic update to immediately reflect the change in UI
      if (notifications) {
        const updatedNotifications = notifications.map(notif => 
          notif.id === id ? { ...notif, isRead: true } : notif
        );
      }
      
      // Refresh data
      refetch();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      alert('Failed to update notification. Please try again.');
    } finally {
      // Remove the ID from processing regardless of success/failure
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };
    // State for mark all as read loading
  const [markingAllAsRead, setMarkingAllAsRead] = useState(false);
  
  // Mark all as read with loading state
  const markAllAsRead = async () => {
    try {
      setMarkingAllAsRead(true);
      await notificationsService.markAllNotificationsRead();
      
      // Optimistic update
      if (notifications) {
        const updatedNotifications = notifications.map(notif => ({ ...notif, isRead: true }));
      }
      
      refetch();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      alert('Failed to update notifications. Please try again.');
    } finally {
      setMarkingAllAsRead(false);
    }
  };

  // Get icon based on notification type
  const getNotificationIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'member':
      case 'registration':
        return (
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-500">
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>
        );
      case 'loan':
      case 'payment':
        return (
          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-500">
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
            </svg>
          </div>
        );
      case 'savings':
      case 'deposit':
        return (
          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-500">
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 14V6c0-1.1-.9-2-2-2H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zm-9-1c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm13-6v11c0 1.1-.9 2-2 2H4v-2h17V7h2z" />
            </svg>
          </div>
        );
      case 'alert':
      case 'warning':
        return (
          <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-500">
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 5.99L19.53 19H4.47L12 5.99M12 2L1 21h22L12 2zm1 14h-2v2h2v-2zm0-6h-2v4h2v-4z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z" />
            </svg>
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="250px">
        <CircularProgress size={30} />
      </Box>
    );
  }

  if (!notifications || notifications.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <Typography color="text.secondary">
          No new notifications
        </Typography>
      </Box>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>          {notifications && notifications.length > 0 && (
            <button
              onClick={markAllAsRead}
              disabled={markingAllAsRead}
              className={`text-sm ${
                markingAllAsRead 
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-indigo-600 hover:text-indigo-900'
              }`}
            >
              {markingAllAsRead ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                'Mark all as read'
              )}
            </button>
          )}
        </div>
        <div className="mt-2 flex space-x-4">
          <button
            className={`px-3 py-2 text-sm font-medium ${
              activeTab === 'unread'
                ? 'text-indigo-700 border-b-2 border-indigo-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('unread')}
          >
            Unread
          </button>
          <button
            className={`px-3 py-2 text-sm font-medium ${
              activeTab === 'all'
                ? 'text-indigo-700 border-b-2 border-indigo-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('all')}
          >
            All
          </button>
        </div>
      </div>
      
      <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-gray-500">Loading notifications...</div>
        ) : notifications && notifications.length > 0 ? (
          notifications.map((notification: Notification) => (
            <div 
              key={notification.id} 
              className={`p-4 hover:bg-gray-50 transition-colors duration-150 ${
                !notification.isRead ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex space-x-3">
                {getNotificationIcon(notification.type)}
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {notification.title}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {notification.message}
                  </p>                  <p className="text-xs text-gray-400 mt-1">
                    {notification.createdAt ? format(new Date(notification.createdAt), 'MMM dd, h:mm a') : ''}
                  </p>
                </div>
                  {!notification.isRead && (
                  <button
                    onClick={() => markAsRead(notification.id)}
                    disabled={processingIds.has(notification.id)}
                    className={`flex-shrink-0 text-sm ${
                      processingIds.has(notification.id) 
                        ? 'text-gray-400 cursor-not-allowed' 
                        : 'text-indigo-600 hover:text-indigo-900'
                    }`}
                  >
                    {processingIds.has(notification.id) ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing
                      </span>
                    ) : (
                      'Mark as read'
                    )}
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="p-4 text-center text-gray-500">
            {activeTab === 'unread' ? 'No unread notifications' : 'No notifications'}
          </div>
        )}
      </div>
      
      <div className="p-3 bg-gray-50 border-t border-gray-200">
        <a
          href="#"
          className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          View all notifications
        </a>
      </div>
    </div>
  );
};

export default NotificationPanel;
