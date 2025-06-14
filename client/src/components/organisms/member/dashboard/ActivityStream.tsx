'use client';

import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { useMembers } from '@/lib/hooks/admin/useMembers';
import { useQueryWithToast } from '@/lib/hooks/redux/useDataFetching';
import { loanService } from '@/lib/api';
import { notificationsService } from '@/lib/api/services/notificationsService';
import { savingsService } from '@/lib/api/services/savingsService';
import { SavingsTransaction } from '@/types/financial.types';
import { useMemo } from 'react';
import {
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  Divider,
  Box,
  CircularProgress
} from '@mui/material';
import {
  Person as PersonIcon,
  AccountBalance as AccountIcon,
  Payment as PaymentIcon,
  Description as DocumentIcon
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';

interface ActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: string;
}

interface ActivityStreamProps {
  limit?: number;
  filter?: string[]; // Filter by activity type: 'member', 'loan', 'savings', etc.
}

const ActivityStream = ({ limit = 5, filter }: ActivityStreamProps) => {
  const [activityItems, setActivityItems] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Use memo for consistent date across server/client render
  const currentDate = useMemo(() => new Date().toISOString(), []);

  // Get members data with custom hooks
  const { members } = useMembers(1, 5);

  // Get pending loans data
  const { data: pendingLoans } = useQueryWithToast(
    ['loans', 'recent'],
    async () => {
      return loanService.getLoans(1, 5, {});
    },
    { errorMessage: 'Failed to load recent loans' }
  );

  // Get savings transactions
  const { data: savingsTransactions } = useQueryWithToast<{ data: SavingsTransaction[] }>(
    ['savings', 'transactions'],
    async () => {
      const response = await savingsService.getTransactions();
      // Transform SavingsRecord[] to SavingsTransaction[]
      const transactions: SavingsTransaction[] = response.data.map(record => {
        // Convert status string to one of the valid enum values
        let status: "COMPLETED" | "PENDING" | "FAILED" = "PENDING";
        if (record.status === "COMPLETED") status = "COMPLETED";
        else if (record.status === "FAILED") status = "FAILED";
        
        return {
          ...record,
          date: record.createdAt || new Date().toISOString(),
          type: String(record.transactions?.[0]?.transactionType || "unknown"),
          amount: record.monthlyTarget || 0,
          reference: record.id,
          description: record.description || '',  // Provide default empty string for description
          status, // Use the properly typed status
          // Add any other required properties
        };
      });
      return { data: transactions };
    },
    { errorMessage: 'Failed to load savings transactions' }
  );

  // Get notifications/system activity
  const { data: notifications } = useQueryWithToast(
    ['notifications', 'all'],
    () => notificationsService.getAllNotifications?.() || [], // Optional chaining in case this method doesn't exist
    { errorMessage: 'Failed to load notifications' }
  );

  // Activity item component with icon
  const ActivityItemComponent = ({ item }: { item: ActivityItem }) => {
    const iconMap = {
      member: (
        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-500">
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        </div>
      ),
      loan: (
        <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-500">
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
          </svg>
        </div>
      ),
      savings: (
        <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-500">
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 14V6c0-1.1-.9-2-2-2H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zm-9-1c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm13-6v11c0 1.1-.9 2-2 2H4v-2h17V7h2z" />
          </svg>
        </div>
      ),
      notification: (
        <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-500">
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z" />
          </svg>
        </div>
      )
    };

    return (
      <li className="px-4 py-4">
        <div className="flex items-center space-x-4">
          {iconMap[item.type as keyof typeof iconMap] || iconMap.notification}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {item.title}
            </p>
            <p className="text-sm text-gray-500">
              {item.description}
            </p>
          </div>
          <div className="text-sm text-gray-500 whitespace-nowrap">
            {item.timestamp ? format(new Date(item.timestamp), 'MMM dd, h:mm a') : ''}
          </div>
        </div>
      </li>
    );
  };

  // Combine recent activities from different sources
  useEffect(() => {
    async function fetchActivities() {
      try {
        setIsLoading(true);

        // Get recent member registrations
        const memberActivities = members?.slice(0, limit).map(member => ({
          id: member.id,
          title: `New member registration`,
          description: `${member.firstName} ${member.lastName} joined the cooperative`,
          timestamp: member.createdAt || currentDate,
          type: 'member'
        })) || [];

        // Get recent loan applications
        const loanActivities = pendingLoans?.data?.slice(0, limit).map(loan => ({
          id: loan.id,
          title: `New loan application`,
          description: `${loan.totalAmount} for ${loan.purpose}`,
          timestamp: loan.createdAt,
          type: 'loan'
        })) || [];

        // Get savings transactions
        const savingsActivities = Array.isArray(savingsTransactions)
          ? savingsTransactions?.slice(0, limit)
          : savingsTransactions?.data
            ? savingsTransactions.data.slice(0, limit)
            : [];

        // Get notifications
        const notificationActivities = notifications?.slice(0, limit).map(notification => ({
          id: notification.id,
          title: notification.title,
          description: notification.message,
          timestamp: notification.createdAt,
          type: 'notification'
        })) || [];

        // Combine all activities
        let allActivities = [
          ...memberActivities,
          ...loanActivities,
          ...savingsActivities,
          ...notificationActivities
        ];

        // Filter by type if filter is provided
        if (filter && filter.length > 0) {
          allActivities = allActivities.filter(activity =>
            filter.includes(activity.type)
          );
        }

        // Sort by timestamp (newest first)
        allActivities = allActivities
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, limit);

        setActivityItems(allActivities);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load activities:', error);
        setIsLoading(false);
      }
    }

    fetchActivities();
  }, [members, pendingLoans, savingsTransactions, notifications, limit, filter]);

  const { data: activities, isLoading: queryLoading, error } = useQuery({
    queryKey: ['admin-activity-stream'],
    queryFn: async () => {
      try {
        // Replace with your actual API call
        return [
          {
            id: '1',
            type: 'member',
            action: 'New member registered',
            actor: 'John Doe',
            timestamp: new Date().toISOString(),
            details: 'Member #12345'
          },
          {
            id: '2',
            type: 'transaction',
            action: 'Loan disbursement',
            actor: 'System',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            details: 'Loan #L-5678'
          },
          {
            id: '3',
            type: 'document',
            action: 'Document uploaded',
            actor: 'Jane Smith',
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            details: 'Membership form'
          }
        ];
      } catch (error) {
        console.error("Error fetching activity stream:", error);
        return [];
      }
    },
    staleTime: 60000 // 1 minute
  });

  const getIconByType = (type: string) => {
    switch (type) {
      case 'member':
        return <PersonIcon />;
      case 'transaction':
        return <PaymentIcon />;
      case 'account':
        return <AccountIcon />;
      case 'document':
        return <DocumentIcon />;
      default:
        return <DocumentIcon />;
    }
  };

  if (queryLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="250px">
        <CircularProgress size={30} />
      </Box>
    );
  }

  if (error || !activities || activities.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <Typography color="text.secondary">
          No recent activity to display
        </Typography>
      </Box>
    );
  }

  return (
    <List disablePadding>
      {activities.map((activity, index) => (
        <React.Fragment key={activity.id}>
          <ListItem alignItems="flex-start" sx={{ py: 1.5, px: 0 }}>
            <ListItemAvatar>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                {getIconByType(activity.type)}
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={activity.action}
              secondary={
                <React.Fragment>
                  <Typography
                    sx={{ display: 'inline' }}
                    component="span"
                    variant="body2"
                    color="text.primary"
                  >
                    {activity.details}
                  </Typography>
                  {' — '}
                  {activity.actor}
                  <Typography variant="caption" display="block" color="text.disabled" sx={{ mt: 0.5 }}>
                    {new Date(activity.timestamp).toLocaleString()}
                  </Typography>
                </React.Fragment>
              }
            />
          </ListItem>
          {index < activities.length - 1 && <Divider component="li" />}
        </React.Fragment>
      ))}
    </List>
  );
};

export default ActivityStream;
