'use client';

import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TextField,
  InputAdornment,
  Skeleton,
  Grid
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { withRoleGuard as ProtectedRoute } from '@/hooks/auth/withRoleGuard';
import MemberForm from '@/components/features/members/MemberForm';
import LoadingScreen from '@/components/common/LoadingScreen';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { membersApi } from '@/services/api/features/members/membersApi';
import type { Biodata } from '@/types/types';
// import type { Member } from '@/services/api/features/members/membersApi';

export default function MembersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<Biodata | undefined>();
  const [isMemberFormOpen, setIsMemberFormOpen] = useState(false);

  const { 
    data: summary,
    isLoading: summaryLoading,
    error: summaryError 
  } = useQuery({
    queryKey: ['members-summary'],
    queryFn: () => membersApi.getSummary()
  });

  const {
    data: members,
    isLoading: membersLoading,
    error: membersError,
    refetch: refetchMembers
  } = useQuery({
    queryKey: ['members', searchQuery],
    queryFn: () => membersApi.getAllBiodata({ search: searchQuery }),
    staleTime: 300 // Cache results for 300ms
  });

  const handleMemberSuccess = () => {
    refetchMembers();
    setSelectedMember(undefined);
  };

  const handleEditMember = (member: Biodata) => {
    setSelectedMember(member);
    setIsMemberFormOpen(true);
  };

  if (summaryLoading && membersLoading) {
    return (
      <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
        <DashboardLayout>
          <LoadingScreen message="Loading member information..." />
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (summaryError || membersError) {
    throw summaryError || membersError;
  }

  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
      <DashboardLayout>
        <Box sx={{ mb: 4 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Typography variant="h4" gutterBottom>
                Members
              </Typography>
              <Typography color="textSecondary">
                Manage cooperative members and their accounts
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }} sx={{ textAlign: 'right' }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                sx={{ mb: 2 }}
                onClick={() => {
                  setSelectedMember(undefined);
                  setIsMemberFormOpen(true);
                }}
              >
                Add Member
              </Button>
            </Grid>
          </Grid>
        </Box>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 3, width: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Members Summary
              </Typography>
              {summaryLoading ? (
                <>
                  <Box sx={{ mt: 2 }}>
                    <Typography color="textSecondary">Total Members</Typography>
                    <Skeleton variant="text" width={100} height={48} />
                  </Box>
                  <Box sx={{ mt: 2 }}>
                    <Typography color="textSecondary">Active Members</Typography>
                    <Skeleton variant="text" width={80} height={32} />
                  </Box>
                  <Box sx={{ mt: 2 }}>
                    <Typography color="textSecondary">With Active Loans</Typography>
                    <Skeleton variant="text" width={80} height={32} />
                  </Box>
                </>
              ) : (
                <>
                  <Box sx={{ mt: 2 }}>
                    <Typography color="textSecondary">Total Members</Typography>
                    <Typography variant="h4">
                      {summary?.totalMembers ?? 0}
                    </Typography>
                  </Box>
                  <Box sx={{ mt: 2 }}>
                    <Typography color="textSecondary">Active Members</Typography>
                    <Typography variant="h6" color="success.main">
                      {summary?.activeMembers ?? 0}
                    </Typography>
                  </Box>
                  <Box sx={{ mt: 2 }}>
                    <Typography color="textSecondary">With Active Loans</Typography>
                    <Typography variant="h6" color="info.main">
                      {summary?.membersWithLoans ?? 0}
                    </Typography>
                  </Box>
                </>
              )}
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 8 }}>
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Member</TableCell>
                    <TableCell>Join Date</TableCell>
                    <TableCell align="right">Shares</TableCell>
                    <TableCell align="right">Savings</TableCell>
                    <TableCell align="right">Active Loans</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {membersLoading ? (
                    [...Array(5)].map((_, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Skeleton variant="circular" width={24} height={24} />
                            <Box>
                              <Skeleton variant="text" width={120} />
                              <Skeleton variant="text" width={180} />
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell><Skeleton variant="text" width={80} /></TableCell>
                        <TableCell align="right"><Skeleton variant="text" width={80} /></TableCell>
                        <TableCell align="right"><Skeleton variant="text" width={80} /></TableCell>
                        <TableCell align="right"><Skeleton variant="text" width={40} /></TableCell>
                        <TableCell><Skeleton variant="text" width={60} /></TableCell>
                      </TableRow>
                    ))
                  ) : members?.data?.map((member: Biodata) => (
                    <TableRow 
                      key={member.id}
                      onClick={() => handleEditMember(member)}
                      sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PersonIcon color="action" />
                          <Box>
                            <Typography variant="body2">{member.name}</Typography>
                            <Typography variant="caption" color="textSecondary">
                              {member.emailAddress}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {new Date(member.dateOfEmployment).toLocaleDateString()}
                      </TableCell>
                      <TableCell align="right">
                        {member.accountInfo ? '₱' + (0).toLocaleString() : '₱0'}
                      </TableCell>
                      <TableCell align="right">
                        {member.accountInfo ? '₱' + (0).toLocaleString() : '₱0'}
                      </TableCell>
                      <TableCell align="right">
                        0
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={member.isApproved ? 'ACTIVE' : 'PENDING'}
                          color={member.isApproved ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {!membersLoading && (!members?.data || members.data.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography color="textSecondary">
                          {searchQuery ? 'No members found matching your search' : 'No members found'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>

        <MemberForm
          open={isMemberFormOpen}
          onClose={() => setIsMemberFormOpen(false)}
          onSuccess={handleMemberSuccess}
          member={selectedMember}
        />
      </DashboardLayout>
    </ProtectedRoute>
  );
}