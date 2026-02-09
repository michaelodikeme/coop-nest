'use client';

import React, { ReactNode, useState } from 'react';
import {
  Box,
  Drawer,
  AppBar as MuiAppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Container,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  useTheme,
  styled,
} from '@mui/material';
import {
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  Dashboard as DashboardIcon,
  Group as GroupIcon,
  SettingsOutlined as SettingsIcon,
  AccountBalance as AccountBalanceIcon,
  Receipt as ReceiptIcon,
  Notifications as NotificationsIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Settings as UserSettingsIcon,
  Help as HelpIcon,
} from '@mui/icons-material';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import ThemeToggle from '@/components/atoms/ThemeToggle';
import { useAuth } from '@/lib/api/contexts/AuthContext';
import { isAdminUser } from '@/lib/utils/roleUtils';
import { useUI } from '@/lib/hooks/redux/useUI';
import { useAuthentication } from '@/lib/hooks/auth/useAuthentication';
import { usePermissions } from '@/lib/hooks/auth/usePermissions';
import { ToastContainer } from '@/components/molecules/Toast';
import PermissionGate from '@/components/atoms/PermissionGate';
import { Module } from '@/types/permissions.types';
import SavingsIcon from '@mui/icons-material/Savings';
import MoneyIcon from '@mui/icons-material/Money';
import PieChartIcon from '@mui/icons-material/PieChart';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import SecurityIcon from '@mui/icons-material/Security';
import TuneIcon from '@mui/icons-material/Tune';
import AssessmentIcon from '@mui/icons-material/Assessment';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

// Drawer width
const drawerWidth = 260;

// Styled app bar that shifts when drawer is open
const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<{ open?: boolean }>(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

// Styled drawer that expands/collapses smoothly
const StyledDrawer = styled(Drawer, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  '& .MuiDrawer-paper': {
    position: 'fixed', // This is correct, but z-index needs adjustment
    whiteSpace: 'nowrap',
    width: drawerWidth,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    boxSizing: 'border-box',
    ...(!open && {
      overflowX: 'hidden',
      transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
      width: theme.spacing(7),
      [theme.breakpoints.up('sm')]: {
        width: theme.spacing(9),
      },
    }),
  },
}));

// Sidebar navigation item
interface NavItem {
  title: string;
  path: string;
  icon: React.ReactNode;
  permissions?: string[];
  module?: Module;
  approvalLevel?: number;
  children?: Omit<NavItem, 'children'>[];
}

// Navigation items
const mainNavItems: NavItem[] = [
  {
    title: 'Admin Dashboard',
    path: '/admin/dashboard',
    icon: <DashboardIcon />,
    module: Module.ADMIN,
  },
  {
    title: 'Members',
    path: '/admin/members',
    icon: <GroupIcon />,
    permissions: ['VIEW_MEMBERS'],
    module: Module.ACCOUNT,
    children: [
      {
        title: 'All Members',
        path: '/admin/members',
        icon: <GroupIcon />,
        permissions: ['VIEW_MEMBERS'],
        module: Module.ACCOUNT,
      },
      {
        title: 'Register New Member',
        path: '/admin/members/register',
        icon: <GroupIcon />,
        permissions: ['CREATE_MEMBERS'],
        module: Module.USER,
        approvalLevel: 1,
      },
      // {
      //   title: 'Bank Accounts',
      //   path: '/admin/members/accounts',
      //   icon: <AccountBalanceIcon />,
      //   permissions: ['VIEW_ACCOUNTS'],
      //   module: Module.ACCOUNT,
      // },
    ],
  },
  {
    title: 'Financial',
    path: '/admin/financial',
    icon: <AccountBalanceIcon />,
    children: [
      {
        title: 'Savings & Shares',
        path: '/admin/financial/savings',
        icon: <SavingsIcon />,
        permissions: ['VIEW_SAVINGS'],
        module: Module.SAVINGS,
      },
      {
        title: 'Personal Savings',
        path: '/admin/financial/personal-savings',
        icon: <SavingsIcon />,
        permissions: ['VIEW_PERSONAL_SAVINGS'],
        module: Module.SAVINGS,
      },
      {
        title: 'Loans',
        path: '/admin/financial/loans',
        icon: <MoneyIcon />,
        permissions: ['VIEW_LOANS'],
        module: Module.LOAN,
      },
      // {
      //   title: 'Shares',
      //   path: '/admin/financial/shares',
      //   icon: <PieChartIcon />,
      //   permissions: ['VIEW_SHARES'],
      //   module: Module.SHARES,
      // },
      {
        title: 'Transactions',
        path: '/admin/financial/transactions',
        icon: <ReceiptLongIcon />,
        permissions: ['VIEW_TRANSACTIONS'],
        module: Module.TRANSACTION,
      },
    ],
  },
  {
    title: 'User Management',
    path: '/admin/users',
    icon: <PersonIcon />,
    permissions: ['VIEW_USERS'],
    module: Module.USER,
    approvalLevel: 1,
  },
  {
    title: 'Reports',
    path: '/admin/reports',
    icon: <AssessmentIcon />,
    permissions: ['VIEW_REPORTS', 'GENERATE_REPORTS'],
    module: Module.REPORTS,
    approvalLevel: 1,
  },
  {
    title: 'Roles & Permissions',
    path: '/admin/roles',
    icon: <SecurityIcon />,
    permissions: ['MANAGE_ROLES'],
    module: Module.ADMIN,
    approvalLevel: 2,
  },
  // Currently disabled until fully implemented
  // {
  //   title: 'Settings',
  //   path: '/admin/settings',
  //   icon: <SettingsIcon />,
  //   permissions: ['VIEW_SYSTEM_SETTINGS'],
  //   module: Module.SYSTEM,
  //   approvalLevel: 2,
  //   children: [
  //     {
  //       title: 'System Configuration',
  //       path: '/admin/settings/system',
  //       icon: <TuneIcon />,
  //       permissions: ['MANAGE_SYSTEM_SETTINGS'],
  //       module: Module.SYSTEM,
  //       approvalLevel: 2,
  //     },
  //   ],
  // },
  {
    title: 'Approvals',
    path: '/admin/approvals',
    icon: <ReceiptIcon />,
    children: [
      {
        title: 'Loan Approvals',
        path: '/admin/approvals/loans',
        icon: <ReceiptIcon />,
        permissions: ['VIEW_REQUESTS'],
        module: Module.LOAN,
        approvalLevel: 1,
      },
      {
        title: 'Member Approvals',
        path: '/admin/approvals/members',
        icon: <GroupAddIcon />,
        permissions: ['VIEW_REQUESTS'],
        module: Module.ACCOUNT,
        approvalLevel: 1,
      },
      {
        title: 'Withdrawal Approvals',
        path: '/admin/approvals/withdrawals',
        icon: <AccountBalanceWalletIcon />,
        permissions: ['REVIEW_WITHDRAWAL', 'VERIFY_WITHDRAWAL', 'APPROVE_WITHDRAWAL'],
        module: Module.SAVINGS,
        approvalLevel: 1,
      },
      {
        title: 'Personal Savings Approvals',
        path: '/admin/approvals/personal-savings',
        icon: <SavingsIcon />,
        permissions: ['PROCESS_PERSONAL_SAVINGS_WITHDRAWAL'],
        module: Module.SAVINGS,
        approvalLevel: 1,
      },
    ],
  },
];

interface AdminLayoutProps {
  children: ReactNode;
}

/**
 * Main layout component for authorized application pages
 */
export default function AdminLayout({ children }: AdminLayoutProps) {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, checkApprovalLevel } = useAuth();
  const { logout, isLoading: isLogoutLoading } = useAuthentication();
  const { isSidebarOpen, setSidebarOpen } = useUI();
  const { hasPermission, hasModuleAccess } = usePermissions();

  // States for dropdowns
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  const [anchorElNotifications, setAnchorElNotifications] = useState<null | HTMLElement>(null);
  const [expandedSubmenu, setExpandedSubmenu] = useState<string | null>(null);
  // Check if user is authenticated and has admin access
  React.useEffect(() => {
    if (!isAuthenticated && typeof window !== 'undefined') {
      router.push('/auth/login');
    } else if (isAuthenticated && user && !isAdminUser && typeof window !== 'undefined') {
      // If not an admin user, redirect to member dashboard
      router.push('/member/dashboard');
    }
    
    // Log user role information for debugging
    if (user) {
      // console.log('User Role Information:', {
      //   username: user.username,
      //   isAdmin: isAdminUser(user),
      //   role: user.role?.name,
      //   approvalLevel: user.approvalLevel,
      //   permissions: user.permissions?.slice(0, 10),
      // });
    }
  }, [isAuthenticated, user, router]);

  // Toggle submenu expansion
  const toggleSubmenu = (title: string) => {
    setExpandedSubmenu(expandedSubmenu === title ? null : title);
  };
  // Check if a nav item should be displayed based on permissions and approval level
  const shouldShowNavItem = (item: NavItem): boolean => {
    if (!item.permissions && !item.module && !item.approvalLevel) {
      // console.log(`Item ${item.title}: No restrictions`);
      return true;
    }
    
    const hasRequiredPermission = item.permissions 
      ? hasPermission(item.permissions) 
      : true;
    
    const hasRequiredModuleAccess = item.module
      ? hasModuleAccess(item.module)
      : true;

    const hasRequiredApprovalLevel = item.approvalLevel
      ? checkApprovalLevel(item.approvalLevel)
      : true;
    
    // console.log(`Item ${item.title}:`, { 
    //   permissions: item.permissions,
    //   userPermissions: user?.permissions, 
    //   hasPermission: hasRequiredPermission,
    //   module: item.module,
    //   userModules: user?.modules,
    //   hasModuleAccess: hasRequiredModuleAccess,
    //   approvalLevel: item.approvalLevel,
    //   userApprovalLevel: user?.approvalLevel,
    //   hasApprovalLevel: hasRequiredApprovalLevel,
    //   shouldShow: hasRequiredPermission && hasRequiredModuleAccess && hasRequiredApprovalLevel
    // });
    
    return hasRequiredPermission && hasRequiredModuleAccess && hasRequiredApprovalLevel;
  };

  // Filter nav items based on permissions
  const filteredNavItems = mainNavItems.filter(shouldShowNavItem);

  // Check if path is active
  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(`${path}/`);
  };

  // Handle user menu
  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  // Handle notifications menu
  const handleOpenNotificationsMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNotifications(event.currentTarget);
  };

  const handleCloseNotificationsMenu = () => {
    setAnchorElNotifications(null);
  };

  // Handle logout
  const handleLogout = async () => {
    handleCloseUserMenu();
    await logout();
  };

  if (!isAuthenticated) {
    return null; // Don't render anything until authentication check is complete
  }

  return (
    <Box sx={{ display: 'flex' }}>
      {/* App Bar */}
      <AppBar position="fixed" open={isSidebarOpen} elevation={1}>
        <Toolbar
          sx={{
            pr: '24px',
          }}
        >
          <IconButton
            edge="start"
            color="inherit"
            aria-label="toggle sidebar"
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            sx={{
              marginRight: '36px',
              ...(isSidebarOpen && { display: 'none' }),
            }}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            component="h1"
            variant="h6"
            color="inherit"
            noWrap
            sx={{ flexGrow: 1 }}
          >
            CoopNest
          </Typography>

          {/* Theme toggle */}
          <ThemeToggle />

          {/* Notifications */}
          <IconButton color="inherit" onClick={handleOpenNotificationsMenu}>
            <Badge badgeContent={3} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
          <Menu
            sx={{ mt: '45px' }}
            id="notifications-menu"
            anchorEl={anchorElNotifications}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorElNotifications)}
            onClose={handleCloseNotificationsMenu}
          >
            <MenuItem onClick={handleCloseNotificationsMenu}>
              <Typography textAlign="center">New member approval request</Typography>
            </MenuItem>
            <MenuItem onClick={handleCloseNotificationsMenu}>
              <Typography textAlign="center">System update completed</Typography>
            </MenuItem>
            <MenuItem onClick={handleCloseNotificationsMenu}>
              <Typography textAlign="center">Loan payment due reminder</Typography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleCloseNotificationsMenu}>
              <Typography textAlign="center" color="primary">View all notifications</Typography>
            </MenuItem>
          </Menu>

          {/* User menu */}
          <Box sx={{ ml: 2 }}>
            <Tooltip title="Open settings">
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                <Avatar 
                  alt={user?.username || 'User'} 
                  src="/profile-placeholder.png"
                  sx={{ 
                    bgcolor: theme.palette.primary.main,
                  }}
                >
                  {user?.username?.[0]?.toUpperCase() || 'U'}
                </Avatar>
              </IconButton>
            </Tooltip>
            <Menu
              sx={{ mt: '45px' }}
              id="menu-appbar"
              anchorEl={anchorElUser}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              <MenuItem>
                <Typography variant="subtitle1" fontWeight={500}>
                  {user?.username || 'User'}
                </Typography>
              </MenuItem>
              <MenuItem>
                <Typography variant="caption" color="text.secondary">
                  {user?.role?.name || 'Role'}
                </Typography>
              </MenuItem>
              <Divider />
              <MenuItem onClick={() => {
                router.push('/admin/profile');
                handleCloseUserMenu();
              }}>
                <ListItemIcon>
                  <PersonIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Profile</ListItemText>
              </MenuItem>
              <MenuItem onClick={handleCloseUserMenu}>
                <ListItemIcon>
                  <UserSettingsIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Account settings</ListItemText>
              </MenuItem>
              <MenuItem onClick={handleCloseUserMenu}>
                <ListItemIcon>
                  <HelpIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Help & support</ListItemText>
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout} disabled={isLogoutLoading}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Logout</ListItemText>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar for mobile (temporary drawer) */}
      <StyledDrawer
        variant="temporary"
        open={isSidebarOpen}
        onClose={() => setSidebarOpen(false)}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
        }}
      >
        {/* Drawer content */}
        <Toolbar
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            px: [1],
          }}
        >
          <Box 
            sx={{ 
              flexGrow: 1, 
              display: 'flex', 
              alignItems: 'center', 
              pl: 2,
              justifyContent: 'flex-start'
            }}
          >
            <Typography variant="h6" color="primary" noWrap>
              CoopNest
            </Typography>
          </Box>
          <IconButton onClick={() => setSidebarOpen(false)}>
            <ChevronLeftIcon />
          </IconButton>
        </Toolbar>
        <Divider />
        <List component="nav">
          {filteredNavItems.map((item) => (
            <React.Fragment key={item.title}>
              {item.children ? (
                // Nav item with children (submenu)
                <PermissionGate 
                  permissions={item.permissions} 
                  module={item.module}
                >
                  <ListItem disablePadding sx={{ display: 'block' }}>
                    <ListItemButton
                      onClick={() => toggleSubmenu(item.title)}
                      selected={isActive(item.path)}
                      sx={{
                        minHeight: 48,
                        justifyContent: isSidebarOpen ? 'initial' : 'center',
                        px: 2.5,
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 0,
                          mr: isSidebarOpen ? 3 : 'auto',
                          justifyContent: 'center',
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText 
                        primary={item.title} 
                        sx={{ 
                          opacity: isSidebarOpen ? 1 : 0,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }} 
                      />
                      {isSidebarOpen && (
                        expandedSubmenu === item.title ? <ExpandLessIcon /> : <ExpandMoreIcon />
                      )}
                    </ListItemButton>
                  </ListItem>
                  
                  {/* Submenu items */}
                  {isSidebarOpen && expandedSubmenu === item.title && (
                    <Box sx={{ pl: 4 }}>
                      {item.children.filter(shouldShowNavItem).map((child) => (
                        <PermissionGate 
                          key={child.title}
                          permissions={child.permissions} 
                          module={child.module}
                        >
                          <ListItem disablePadding>
                            <ListItemButton
                              component={Link}
                              href={child.path}
                              selected={isActive(child.path)}
                              sx={{
                                py: 1,
                              }}
                            >
                              <ListItemIcon sx={{ minWidth: 36 }}>
                                {child.icon}
                              </ListItemIcon>
                              <ListItemText 
                                primary={child.title} 
                                primaryTypographyProps={{ 
                                  variant: 'body2',
                                  sx: { 
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                  }
                                }} 
                              />
                            </ListItemButton>
                          </ListItem>
                        </PermissionGate>
                      ))}
                    </Box>
                  )}
                </PermissionGate>
              ) : (
                // Standard nav item
                <PermissionGate 
                  permissions={item.permissions} 
                  module={item.module}
                >
                  <ListItem disablePadding sx={{ display: 'block' }}>
                    <ListItemButton
                      component={Link}
                      href={item.path}
                      selected={isActive(item.path)}
                      sx={{
                        minHeight: 48,
                        justifyContent: isSidebarOpen ? 'initial' : 'center',
                        px: 2.5,
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 0,
                          mr: isSidebarOpen ? 3 : 'auto',
                          justifyContent: 'center',
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText 
                        primary={item.title} 
                        sx={{ 
                          opacity: isSidebarOpen ? 1 : 0,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }} 
                      />
                    </ListItemButton>
                  </ListItem>
                </PermissionGate>
              )}
            </React.Fragment>
          ))}
        </List>
      </StyledDrawer>

      {/* Sidebar for desktop (permanent drawer) */}
      <StyledDrawer
        variant="permanent"
        open={isSidebarOpen}
        sx={{
          display: { xs: 'none', sm: 'block' },
        }}
      >
        {/* Drawer content - same as mobile */}
        <Toolbar
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            px: [1],
          }}
        >
          <Box 
            sx={{ 
              flexGrow: 1, 
              display: 'flex', 
              alignItems: 'center', 
              pl: 2,
              ...(isSidebarOpen ? { justifyContent: 'flex-start' } : { justifyContent: 'center' })
            }}
          >
            <Typography variant="h6" color="primary" noWrap>
              {isSidebarOpen ? 'CoopNest' : 'CN'}
            </Typography>
          </Box>
          <IconButton onClick={() => setSidebarOpen(false)}>
            <ChevronLeftIcon />
          </IconButton>
        </Toolbar>
        <Divider />
        <List component="nav">
          {filteredNavItems.map((item) => (
            <React.Fragment key={item.title}>
              {item.children ? (
                // Nav item with children (submenu)
                <PermissionGate 
                  permissions={item.permissions} 
                  module={item.module}
                >
                  <ListItem disablePadding sx={{ display: 'block' }}>
                    <ListItemButton
                      onClick={() => toggleSubmenu(item.title)}
                      selected={isActive(item.path)}
                      sx={{
                        minHeight: 48,
                        justifyContent: isSidebarOpen ? 'initial' : 'center',
                        px: 2.5,
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 0,
                          mr: isSidebarOpen ? 3 : 'auto',
                          justifyContent: 'center',
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText 
                        primary={item.title} 
                        sx={{ 
                          opacity: isSidebarOpen ? 1 : 0,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }} 
                      />
                      {isSidebarOpen && (
                        expandedSubmenu === item.title ? <ExpandLessIcon /> : <ExpandMoreIcon />
                      )}
                    </ListItemButton>
                  </ListItem>
                  
                  {/* Submenu items */}
                  {isSidebarOpen && expandedSubmenu === item.title && (
                    <Box sx={{ pl: 4 }}>
                      {item.children.filter(shouldShowNavItem).map((child) => (
                        <PermissionGate 
                          key={child.title}
                          permissions={child.permissions} 
                          module={child.module}
                        >
                          <ListItem disablePadding>
                            <ListItemButton
                              component={Link}
                              href={child.path}
                              selected={isActive(child.path)}
                              sx={{
                                py: 1,
                              }}
                            >
                              <ListItemIcon sx={{ minWidth: 36 }}>
                                {child.icon}
                              </ListItemIcon>
                              <ListItemText 
                                primary={child.title} 
                                primaryTypographyProps={{ 
                                  variant: 'body2',
                                  sx: { 
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                  }
                                }} 
                              />
                            </ListItemButton>
                          </ListItem>
                        </PermissionGate>
                      ))}
                    </Box>
                  )}
                </PermissionGate>
              ) : (
                // Standard nav item
                <PermissionGate 
                  permissions={item.permissions} 
                  module={item.module}
                >
                  <ListItem disablePadding sx={{ display: 'block' }}>
                    <ListItemButton
                      component={Link}
                      href={item.path}
                      selected={isActive(item.path)}
                      sx={{
                        minHeight: 48,
                        justifyContent: isSidebarOpen ? 'initial' : 'center',
                        px: 2.5,
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 0,
                          mr: isSidebarOpen ? 3 : 'auto',
                          justifyContent: 'center',
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText 
                        primary={item.title} 
                        sx={{ 
                          opacity: isSidebarOpen ? 1 : 0,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }} 
                      />
                    </ListItemButton>
                  </ListItem>
                </PermissionGate>
              )}
            </React.Fragment>
          ))}
        </List>
      </StyledDrawer>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          backgroundColor: (theme) =>
            theme.palette.mode === 'light'
              ? theme.palette.grey[100]
              : theme.palette.grey[900],
          flexGrow: 1,
          height: '100vh',
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          width: { xs: '100%', sm: `calc(100% - ${isSidebarOpen ? drawerWidth : theme.spacing(9)})` }, // Updated this line
          ml: { xs: 0, sm: isSidebarOpen ? `${drawerWidth}px` : `${theme.spacing(9)}px` },
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar /> {/* This creates space below the AppBar */}
        <Container maxWidth="lg" sx={{ p: 3, flexGrow: 1 }}> {/* Adjusted padding */}
          {children}
        </Container>
      </Box>

      {/* Toast container for notifications */}
      <ToastContainer />
    </Box>
  );
}
