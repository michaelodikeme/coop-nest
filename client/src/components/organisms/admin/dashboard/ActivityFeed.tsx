// import React from 'react';
// import {
//   Card,
//   CardContent,
//   Typography,
//   List,
//   ListItem,
//   ListItemAvatar,
//   ListItemText,
//   Avatar,
//   Box,
//   Chip,
//   Divider,
//   Button,
//   useTheme,
//   alpha,
//   Skeleton,
//   Stack,
// } from '@mui/material';
// import { formatDistanceToNow } from 'date-fns';
// import { useRouter } from 'next/navigation';

// // Icons
// import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
// import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
// import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
// import SavingsIcon from '@mui/icons-material/Savings';
// import PeopleIcon from '@mui/icons-material/People';
// import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
// import { formatCurrency } from '@/utils/formatting/format';

// interface ActivityItem {
//   id: string;
//   type: 'DEPOSIT' | 'WITHDRAWAL' | 'LOAN_DISBURSEMENT' | 'LOAN_REPAYMENT' | 'MEMBER_JOINED' | 'SHARES_PURCHASE';
//   title: string;
//   description?: string;
//   amount?: number;
//   status: 'COMPLETED' | 'PENDING' | 'FAILED';
//   timestamp: string;
//   user?: {
//     name: string;
//     avatar?: string;
//   };
// }

// interface ActivityFeedProps {
//   title?: string;
//   activities: ActivityItem[];
//   loading?: boolean;
//   error?: string;
//   onViewAll?: () => void;
//   maxItems?: number;
// }

// export const ActivityFeed: React.FC<ActivityFeedProps> = ({
//   title = "Recent Activity",
//   activities,
//   loading = false,
//   error,
//   onViewAll,
//   maxItems = 5
// }) => {
//   const theme = useTheme();
//   const router = useRouter();

//   const getActivityIcon = (type: string) => {
//     switch (type) {
//       case 'DEPOSIT':
//         return <ArrowUpwardIcon />;
//       case 'WITHDRAWAL':
//         return <ArrowDownwardIcon />;
//       case 'LOAN_DISBURSEMENT':
//       case 'LOAN_REPAYMENT':
//         return <MonetizationOnIcon />;
//       case 'MEMBER_JOINED':
//         return <PeopleIcon />;
//       default:
//         return <SavingsIcon />;
//     }
//   };

//   const getActivityColor = (type: string) => {
//     switch (type) {
//       case 'DEPOSIT':
//         return theme.palette.success.main;
//       case 'WITHDRAWAL':
//         return theme.palette.error.main;
//       case 'LOAN_DISBURSEMENT':
//         return theme.palette.info.main;
//       case 'LOAN_REPAYMENT':
//         return theme.palette.warning.main;
//       case 'MEMBER_JOINED':
//         return theme.palette.primary.main;
//       default:
//         return theme.palette.grey[500];
//     }
//   };

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case 'COMPLETED':
//         return 'success';
//       case 'PENDING':
//         return 'warning';
//       case 'FAILED':
//         return 'error';
//       default:
//         return 'default';
//     }
//   };

//   const displayActivities = activities.slice(0, maxItems);

//   if (loading) {
//     return (
//       <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 3 }}>
//         <CardContent sx={{ p: 3 }}>
//           <Typography variant="h6" fontWeight={600} gutterBottom>
//             {title}
//           </Typography>
//           <Stack spacing={2}>
//             {[...Array(maxItems)].map((_, index) => (
//               <Box key={index} sx={{ display: 'flex', alignItems: 'center' }}>
//                 <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
//                 <Box sx={{ flexGrow: 1 }}>
//                   <Skeleton variant="text" width="70%" height={20} />
//                   <Skeleton variant="text" width="50%" height={16} />
//                 </Box>
//                 <Skeleton variant="rectangular" width={60} height={24} sx={{ borderRadius: 1 }} />
//               </Box>
//             ))}
//           </Stack>
//         </CardContent>
//       </Card>
//     );
//   }

//   if (error) {
//     return (
//       <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 3 }}>
//         <CardContent sx={{ p: 3, textAlign: 'center' }}>
//           <Typography variant="h6" fontWeight={600} gutterBottom>
//             {title}
//           </Typography>
//           <Typography color="error" variant="body2">
//             {error}
//           </Typography>
//           {/* ADDED: Debug info in development */}
//           {process.env.NODE_ENV === 'development' && (
//             <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
//               Check console for detailed error information
//             </Typography>
//           )}
//         </CardContent>
//       </Card>
//     );
//   }

//   return (
//     <Card 
//       elevation={0} 
//       sx={{ 
//         border: 1, 
//         borderColor: 'divider', 
//         borderRadius: 3,
//         height: '100%',
//         display: 'flex',
//         flexDirection: 'column',
//       }}
//     >
//       <CardContent sx={{ p: 3, pb: 1, flexGrow: 1 }}>
//         {/* Header */}
//         <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
//           <Typography variant="h6" fontWeight={600}>
//             {title}
//           </Typography>
//           {onViewAll && (
//             <Button
//               size="small"
//               endIcon={<KeyboardArrowRightIcon />}
//               onClick={onViewAll}
//               sx={{ 
//                 color: 'text.secondary',
//                 '&:hover': {
//                   backgroundColor: alpha(theme.palette.primary.main, 0.08),
//                   color: 'primary.main',
//                 }
//               }}
//             >
//               View All
//             </Button>
//           )}
//         </Box>

//         {/* Activity List */}
//         {displayActivities.length === 0 ? (
//           <Box 
//             sx={{ 
//               py: 4, 
//               textAlign: 'center',
//               color: 'text.secondary' 
//             }}
//           >
//             <Typography variant="body2">
//               No recent activity to display
//             </Typography>
//           </Box>
//         ) : (
//           <List disablePadding sx={{ maxHeight: 400, overflow: 'auto' }}>
//             {displayActivities.map((activity, index) => (
//               <React.Fragment key={activity.id}>
//                 <ListItem
//                   alignItems="flex-start"
//                   sx={{
//                     px: 0,
//                     py: 1.5,
//                     '&:hover': {
//                       backgroundColor: alpha(theme.palette.primary.main, 0.04),
//                       borderRadius: 2,
//                     },
//                   }}
//                 >
//                   <ListItemAvatar sx={{ minWidth: 56 }}>
//                     <Avatar
//                       sx={{
//                         bgcolor: alpha(getActivityColor(activity.type), 0.1),
//                         color: getActivityColor(activity.type),
//                         width: 40,
//                         height: 40,
//                       }}
//                     >
//                       {getActivityIcon(activity.type)}
//                     </Avatar>
//                   </ListItemAvatar>

//                   <ListItemText
//                     primary={
//                       <Box display="flex" justifyContent="space-between" alignItems="flex-start">
//                         <Typography 
//                           variant="body2" 
//                           fontWeight={600}
//                           sx={{ mr: 1, flexGrow: 1 }}
//                         >
//                           {activity.title}
//                         </Typography>
//                         <Chip
//                           label={activity.status}
//                           size="small"
//                           color={getStatusColor(activity.status) as any}
//                           variant="outlined"
//                           sx={{ 
//                             height: 20,
//                             fontSize: '0.75rem',
//                             fontWeight: 500,
//                           }}
//                         />
//                       </Box>
//                     }
//                     secondary={
//                       <Box sx={{ mt: 0.5 }}>
//                         {activity.description && (
//                           <Typography 
//                             variant="body2" 
//                             color="text.primary"
//                             sx={{ mb: 0.5 }}
//                           >
//                             {activity.description}
//                           </Typography>
//                         )}
//                         {activity.amount && (
//                           <Typography 
//                             variant="body2" 
//                             fontWeight={600}
//                             color={activity.type === 'DEPOSIT' || activity.type === 'LOAN_REPAYMENT' || activity.type === 'SHARES_PURCHASE'
//                               ? 'success.main' 
//                               : 'text.primary'
//                             }
//                             sx={{ mb: 0.5 }}
//                           >
//                             {activity.type === 'WITHDRAWAL' ? '-' : '+'}
//                             {formatCurrency(activity.amount)}
//                           </Typography>
//                         )}
//                         <Typography variant="caption" color="text.secondary">
//                           {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
//                           {activity.user && ` • ${activity.user.name}`}
//                         </Typography>
//                       </Box>
//                     }
//                   />
//                 </ListItem>
//                 {index < displayActivities.length - 1 && (
//                   <Divider variant="inset" component="li" sx={{ ml: 7 }} />
//                 )}
//               </React.Fragment>
//             ))}
//           </List>
//         )}
//       </CardContent>
//     </Card>
//   );
// };
import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Box,
  Chip,
  Divider,
  Button,
  useTheme,
  alpha,
  Skeleton,
  Stack,
} from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';

import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import SavingsIcon from '@mui/icons-material/Savings';
import PeopleIcon from '@mui/icons-material/People';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';

import { formatCurrency } from '@/utils/formatting/format';

interface ActivityItem {
  id: string;
  type:
    | 'DEPOSIT'
    | 'WITHDRAWAL'
    | 'LOAN_DISBURSEMENT'
    | 'LOAN_REPAYMENT'
    | 'MEMBER_JOINED'
    | 'SHARES_PURCHASE';
  title: string;
  description?: string;
  amount?: number;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  timestamp: string;
  user?: {
    name: string;
    avatar?: string;
  };
}

interface ActivityFeedProps {
  title?: string;
  activities: ActivityItem[];
  loading?: boolean;
  error?: string;
  onViewAll?: () => void;
  maxItems?: number;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  title = 'Recent Activity',
  activities,
  loading = false,
  error,
  onViewAll,
  maxItems = 5,
}) => {
  const theme = useTheme();
  const router = useRouter();

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'DEPOSIT':
        return <ArrowUpwardIcon />;
      case 'WITHDRAWAL':
        return <ArrowDownwardIcon />;
      case 'LOAN_DISBURSEMENT':
      case 'LOAN_REPAYMENT':
        return <MonetizationOnIcon />;
      case 'MEMBER_JOINED':
        return <PeopleIcon />;
      default:
        return <SavingsIcon />;
    }
  };

  const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'DEPOSIT':
        return theme.palette.success.main;
      case 'WITHDRAWAL':
        return theme.palette.error.main;
      case 'LOAN_DISBURSEMENT':
        return theme.palette.info.main;
      case 'LOAN_REPAYMENT':
        return theme.palette.warning.main;
      case 'MEMBER_JOINED':
        return theme.palette.primary.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const getStatusColor = (status: ActivityItem['status']) => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'FAILED':
        return 'error';
      default:
        return 'default';
    }
  };

  const displayActivities = activities.slice(0, maxItems);

  if (loading) {
    return (
      <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            {title}
          </Typography>
          <Stack spacing={2}>
            {[...Array(maxItems)].map((_, index) => (
              <Box key={index} display="flex" alignItems="center">
                <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
                <Box flexGrow={1}>
                  <Skeleton width="70%" />
                  <Skeleton width="50%" />
                </Box>
                <Skeleton variant="rectangular" width={60} height={24} sx={{ borderRadius: 1 }} />
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 3 }}>
        <CardContent sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            {title}
          </Typography>
          <Typography color="error" variant="body2">
            {error}
          </Typography>
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
        flexDirection: 'column',
      }}
    >
      <CardContent sx={{ p: 3, pb: 1, flexGrow: 1 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" fontWeight={600}>
            {title}
          </Typography>

          {onViewAll && (
            <Button
              size="small"
              endIcon={<KeyboardArrowRightIcon />}
              onClick={onViewAll}
              sx={{
                color: 'text.secondary',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.08),
                  color: 'primary.main',
                },
              }}
            >
              View All
            </Button>
          )}
        </Box>

        {displayActivities.length === 0 ? (
          <Box py={4} textAlign="center" color="text.secondary">
            <Typography variant="body2">No recent activity to display</Typography>
          </Box>
        ) : (
          <List disablePadding sx={{ maxHeight: 400, overflow: 'auto' }}>
            {displayActivities.map((activity, index) => (
              <React.Fragment key={activity.id}>
                <ListItem
                  alignItems="flex-start"
                  sx={{
                    px: 0,
                    py: 1.5,
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.04),
                      borderRadius: 2,
                    },
                  }}
                >
                  <ListItemAvatar sx={{ minWidth: 56 }}>
                    <Avatar
                      sx={{
                        bgcolor: alpha(getActivityColor(activity.type), 0.1),
                        color: getActivityColor(activity.type),
                        width: 40,
                        height: 40,
                      }}
                    >
                      {getActivityIcon(activity.type)}
                    </Avatar>
                  </ListItemAvatar>

                  {/* 🔑 FIXED */}
                  <ListItemText
                    disableTypography
                    primary={
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          sx={{ mr: 1, flexGrow: 1 }}
                          component="div"
                        >
                          {activity.title}
                        </Typography>

                        <Chip
                          label={activity.status}
                          size="small"
                          color={getStatusColor(activity.status) as any}
                          variant="outlined"
                          sx={{ height: 20, fontSize: '0.75rem', fontWeight: 500 }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box mt={0.5}>
                        {activity.description && (
                          <Typography
                            variant="body2"
                            color="text.primary"
                            mb={0.5}
                            component="div"
                          >
                            {activity.description}
                          </Typography>
                        )}

                        {activity.amount && (
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            color={
                              activity.type === 'DEPOSIT' ||
                              activity.type === 'LOAN_REPAYMENT' ||
                              activity.type === 'SHARES_PURCHASE'
                                ? 'success.main'
                                : 'text.primary'
                            }
                            mb={0.5}
                            component="div"
                          >
                            {activity.type === 'WITHDRAWAL' ? '-' : '+'}
                            {formatCurrency(activity.amount)}
                          </Typography>
                        )}

                        <Typography
                          variant="caption"
                          color="text.secondary"
                          component="div"
                        >
                          {formatDistanceToNow(new Date(activity.timestamp), {
                            addSuffix: true,
                          })}
                          {activity.user && ` • ${activity.user.name}`}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>

                {index < displayActivities.length - 1 && (
                  <Divider variant="inset" component="li" sx={{ ml: 7 }} />
                )}
              </React.Fragment>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
};
