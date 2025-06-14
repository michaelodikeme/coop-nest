"use client"

import { useState, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/api/contexts/AuthContext';
import { usePermissions } from '@/lib/hooks/auth/usePermissions';
import ThemeToggle from '@/components/atoms/ThemeToggle';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  Dashboard as DashboardIcon,
  Savings as SavingsIcon,
  AccountBalance as SharesIcon,
  Money as LoansIcon,
  People as MembersIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';

const drawerWidth = 280;

interface NavItem {
  title: string;
  path: string;
  children?: Omit<NavItem, 'children'>[];
  icon: React.ReactElement;
  requiredPermission?: string;
  requiredApprovalLevel?: number;
}

const memberNavItems: NavItem[] = [
  { title: 'Dashboard', path: '/member/dashboard', icon: <DashboardIcon /> },
  { 
    title: 'Savings', 
    path: '/member/savings', 
    icon: <SavingsIcon />,
    children: [
      { title: 'Regular Savings', path: '/member/savings', icon: <SavingsIcon /> },
      { title: 'Personal Savings', path: '/member/savings/personal', icon: <SavingsIcon /> },
    ]
  },
  { title: 'Loans', path: '/member/loans', icon: <LoansIcon /> },
  // { 
  //   title: 'Reports', 
  //   path: '/member/transactions', 
  //   icon: <SharesIcon />,
  //   children: [
  //     { title: 'All Reports', path: '/member/transactions', icon: <SavingsIcon /> },
  //     { title: 'Savings Reports', path: '/member/transactions/savings', icon: <SavingsIcon /> },
  //     { title: 'Loan Reports', path: '/member/transactions/loans', icon: <LoansIcon /> },
  //     { title: 'Shares Reports', path: '/member/transactions/shares', icon: <SharesIcon /> },
  //   ]
  // },
]

const adminNavItems: NavItem[] = [
  { title: 'Dashboard', path: '/admin/dashboard', icon: <DashboardIcon /> },
  { title: 'Members', path: '/admin/members', icon: <MembersIcon /> },
  { title: 'Savings', path: '/admin/savings', icon: <SavingsIcon /> },
  { title: 'Loans', path: '/admin/loans', icon: <LoansIcon /> },
  { title: 'Settings', path: '/admin/settings', icon: <SettingsIcon /> },
];

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  // Add a state to track expanded nav items
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { hasPermission, checkApprovalLevel } = usePermissions();
  
  // States for dropdowns
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  const [anchorElNotifications, setAnchorElNotifications] = useState<null | HTMLElement>(null);

  const navItems = useMemo(() => {
    const items = user?.isMember ? memberNavItems : adminNavItems ;
    // Filter items based on permissions
    return items.filter(item => 
      (!item.requiredPermission || hasPermission(item.requiredPermission)) &&
      (!item.requiredApprovalLevel || checkApprovalLevel(item.requiredApprovalLevel))
    );
  }, [user?.isMember, hasPermission, checkApprovalLevel]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // Handle notifications menu
  const handleOpenNotificationsMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNotifications(event.currentTarget);
  };

  const handleCloseNotificationsMenu = () => {
    setAnchorElNotifications(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleToggleExpand = (path: string) => {
    setExpandedItems(prev => 
      prev.includes(path) 
        ? prev.filter(item => item !== path)
        : [...prev, path]
    );
  };

  const drawer = (
    <Box>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" noWrap component="div">
          Coop Nest
        </Typography>
        <IconButton onClick={handleDrawerToggle} sx={{ display: { sm: '3' } }}>
          <ChevronLeftIcon />
        </IconButton>
      </Box>
      <Divider />
      <List>
        {navItems.map((item) => (
          <Box key={item.path}>
            <ListItem disablePadding>
              <ListItemButton
                selected={pathname === item.path}
                onClick={() => {
                  if (item.children?.length) {
                    handleToggleExpand(item.path);
                  } else {
                    router.push(item.path);
                    setMobileOpen(false);
                  }
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.title} />
                {item.children?.length && (
                  expandedItems.includes(item.path) ? 
                  <ChevronLeftIcon /> : 
                  <IconButton edge="end"><ChevronLeftIcon sx={{ transform: 'rotate(180deg)' }} /></IconButton>
                )}
              </ListItemButton>
            </ListItem>
            
            {/* Nested navigation items */}
            {item.children?.length && expandedItems.includes(item.path) && (
              <List disablePadding>
                {item.children.map((child) => (
                  <ListItem key={child.path} disablePadding>
                    <ListItemButton
                      selected={pathname === child.path}
                      onClick={() => {
                        router.push(child.path);
                        setMobileOpen(false);
                      }}
                      sx={{ pl: 4 }}
                    >
                      <ListItemIcon>{child.icon}</ListItemIcon>
                      <ListItemText primary={child.title} />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        ))}
      </List>
    </Box>
  );

  console.log("MemberLayout rendering", {
    userIsMember: user?.isMember,
    pathname,
    expandedItems,
  });

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"  // Change from "absolute" to "fixed"
        elevation={2}     // Add slight elevation for better visual separation
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          zIndex: (theme) => theme.zIndex.drawer + 1, // Ensure AppBar stays above drawer
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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

            <Tooltip title={user?.biodata?.firstName || 'User'}>
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
              >
                <Avatar 
                  alt={user?.biodata?.firstName || 'User'} 
                  src={user?.biodata?.profilePhoto || undefined}
                  sx={{ width: 32, height: 32 }}
                />
              </IconButton>
            </Tooltip>
          </Box>
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            <MenuItem onClick={() => {
              router.push(user?.isMember ?  '/member/profile' : '/admin/profile');
              handleClose();
            }}>
              Profile
            </MenuItem>
            <MenuItem onClick={() => {
              handleLogout();
              handleClose();
            }}>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: { xs: '64px', sm: '64px' },  // Set to exact AppBar height
          paddingTop: 3,  // Add additional top padding for content
        }}
      >
        {children}
      </Box>
    </Box>
  );
}