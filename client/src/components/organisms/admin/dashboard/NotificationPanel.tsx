import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  Divider,
  Button,
  Tabs,
  Tab,
  CircularProgress,
  Badge,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  useTheme,
  alpha,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { notificationsService } from '@/lib/api/services/notificationsService';
import { Notification } from '@/types/notification.types';

// Import icons
import PersonIcon from '@mui/icons-material/Person';
import MoneyIcon from '@mui/icons-material/Money';
import SavingsIcon from '@mui/icons-material/Savings';
import WarningIcon from '@mui/icons-material/Warning';
import NotificationsIcon from '@mui/icons-material/Notifications';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';

interface NotificationPanelProps {
  limit?: number;
  onViewAll?: () => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ limit = 5, onViewAll }) => {
  const router = useRouter();
  const theme = useTheme();
  const [activeTab, setActiveTab] = React.useState<number>(0);
  const [processingIds, setProcessingIds] = React.useState<Set<string>>(new Set());
  const [markingAllAsRead, setMarkingAllAsRead] = React.useState<boolean>(false);

  // Fetch notifications with proper error handling
  const { 
    data: notifications = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['admin-notifications', activeTab],
    queryFn: () => activeTab === 0 
      ? notificationsService.getUnreadNotifications()
      : notificationsService.getAllNotifications(),
    staleTime: 60000, // 1 minute
  });

  // Sort and limit notifications
  const displayNotifications = React.useMemo(() => {
    // First sort by priority (high to low) then by date (new to old)
    const sortedNotifications = [...notifications].sort((a, b) => {
      // Sort by priority first
      const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      const priorityA = priorityOrder[a.priority as keyof typeof priorityOrder] || 3;
      const priorityB = priorityOrder[b.priority as keyof typeof priorityOrder] || 3;
      
      if (priorityA !== priorityB) return priorityA - priorityB;
      
      // Then sort by date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    // Limit the number of notifications if specified
    return limit ? sortedNotifications.slice(0, limit) : sortedNotifications;
  }, [notifications, limit]);

  // Mark notification as read
  const markAsRead = async (id: string) => {
    try {
      setProcessingIds(prev => new Set(prev).add(id));
      await notificationsService.markNotificationRead(id);
      refetch();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      setMarkingAllAsRead(true);
      await notificationsService.markAllNotificationsRead();
      refetch();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    } finally {
      setMarkingAllAsRead(false);
    }
  };

  // Handle tab change
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Navigate to notifications page
  const handleViewAllClick = () => {
    if (onViewAll) {
      onViewAll();
    } else {
      router.push('/admin/notifications');
    }
  };

  // Get icon based on notification type
  const getNotificationIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'member':
      case 'registration':
        return <PersonIcon />;
      case 'loan':
      case 'payment':
        return <MoneyIcon />;
      case 'savings':
      case 'deposit':
        return <SavingsIcon />;
      case 'alert':
      case 'warning':
        return <WarningIcon />;
      default:
        return <NotificationsIcon />;
    }
  };

  // Get color based on priority
  const getPriorityColor = (priority: string) => {
    switch (priority?.toUpperCase()) {
      case 'HIGH':
        return 'error';
      case 'MEDIUM':
        return 'warning';
      case 'LOW':
      default:
        return 'info';
    }
  };

  if (isLoading) {
    return (
      <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 3, height: '100%' }}>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" height="250px">
            <CircularProgress size={30} />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 3, height: '100%' }}>
        <CardContent>
          <Box textAlign="center" py={4}>
            <Typography color="error">
              Error loading notifications
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (!notifications || notifications.length === 0) {
    return (
      <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 3, height: '100%' }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Notifications
          </Typography>
          <Box textAlign="center" py={4}>
            <Typography color="text.secondary">
              {activeTab === 0 ? 'No unread notifications' : 'No notifications'}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      elevation={0} 
      sx={{ 
        border: 1, 
        borderColor: 'divider', 
        borderRadius: 3, 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column' 
      }}
    >
      <CardContent sx={{ p: 3, pb: 1, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight={600}>
            Notifications
          </Typography>
          
          <Box display="flex" alignItems="center" gap={1}>
            {notifications.length > 0 && (
              <Tooltip title="Mark all as read">
                <IconButton 
                  size="small" 
                  onClick={markAllAsRead} 
                  disabled={markingAllAsRead || !notifications.some(n => !n.isRead)}
                  sx={{
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.08),
                    }
                  }}
                >
                  {markingAllAsRead ? <CircularProgress size={20} /> : <DoneAllIcon />}
                </IconButton>
              </Tooltip>
            )}
            
            <Button
              size="small"
              endIcon={<KeyboardArrowRightIcon />}
              onClick={handleViewAllClick}
              sx={{ 
                color: 'text.secondary',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.08),
                  color: 'primary.main',
                }
              }}
            >
              View All
            </Button>
          </Box>
        </Box>
        
        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 500,
              }
            }}
          >
            <Tab label={
              <Badge badgeContent={notifications.filter(n => !n.isRead).length} color="error" max={99}>
                Unread
              </Badge>
            } />
            <Tab label="All" />
          </Tabs>
        </Box>
        
        {/* Notifications List */}
        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
          <List disablePadding>
            {displayNotifications.map((notification, index) => (
              <React.Fragment key={notification.id}>
                <ListItem
                  alignItems="flex-start"
                  secondaryAction={
                    !notification.isRead && (
                      <IconButton 
                        edge="end" 
                        size="small"
                        onClick={() => markAsRead(notification.id)}
                        disabled={processingIds.has(notification.id)}
                        sx={{
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.success.main, 0.08),
                          }
                        }}
                      >
                        {processingIds.has(notification.id) ? (
                          <CircularProgress size={18} />
                        ) : (
                          <CheckCircleIcon fontSize="small" />
                        )}
                      </IconButton>
                    )
                  }
                  sx={{
                    bgcolor: notification.isRead ? 'transparent' : alpha(theme.palette.primary.main, 0.04),
                    borderRadius: 2,
                    mb: 1,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                    },
                  }}
                >
                  <ListItemAvatar>
                    <Avatar 
                      sx={{ 
                        bgcolor: alpha(theme.palette[getPriorityColor(notification.priority)].main, 0.1),
                        color: `${getPriorityColor(notification.priority)}.main`,
                        width: 36,
                        height: 36,
                      }}
                    >
                      {getNotificationIcon(notification.type)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                        <Typography variant="subtitle2" component="span" fontWeight={600}>
                          {notification.title}
                        </Typography>
                        {notification.priority === 'HIGH' && (
                          <Chip 
                            label="Urgent" 
                            size="small" 
                            color="error" 
                            variant="outlined" 
                            sx={{ height: 18, fontSize: '0.7rem' }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" color="text.primary" component="span">
                          {notification.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                          {format(new Date(notification.createdAt), 'MMM d, h:mm a')}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
                {index < displayNotifications.length - 1 && (
                  <Divider variant="inset" component="li" sx={{ ml: 6 }} />
                )}
              </React.Fragment>
            ))}
          </List>
        </Box>
      </CardContent>
    </Card>
  );
};

export default NotificationPanel;