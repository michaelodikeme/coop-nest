'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { 
  Typography, 
  Box, 
  Paper, 
  Grid, 
  Button, 
  Tabs, 
  Tab,
  Divider,
  Chip 
} from '@mui/material';
import { TabPanel } from '@/components/atoms/TabPanel';
import { MemberStatusBadge } from '@/components/atoms/MemberStatusBadge';
import PermissionGate from '@/components/atoms/PermissionGate';
import { apiService } from '@/lib/api/apiService';
import { memberService } from '@/lib/api/services/memberService';
import { Module } from '@/types/permissions.types';

type TabPanelType = 'overview' | 'financial' | 'documents' | 'activity';

export default function MemberDetailPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState<TabPanelType>('overview');
  const router = useRouter();
  
  // Fetch member data using memberService instead of direct apiService call
  const { 
    data: member, 
    isLoading: isMemberLoading,
    error: memberError 
  } = useQuery({
    queryKey: ['member', params.id],
    queryFn: async () => {
      return await memberService.getBiodataById(params.id);
    }
  });
  
  // Fetch financial data
  const { 
    data: financialData, 
    isLoading: isFinancialLoading 
  } = useQuery({
    queryKey: ['member-financial', params.id],
    queryFn: async () => {
      const response = await apiService.get(`/financial/member/${params.id}`);
      return response.data.data;
    },
    enabled: activeTab === 'financial'
  });
  
  // Fetch member's loans
  const { 
    data: loanData,
    isLoading: isLoanLoading 
  } = useQuery({
    queryKey: ['member-loans', params.id],
    queryFn: async () => {
      return await memberService.getMemberLoans(params.id, 1, 10);
    },
    enabled: activeTab === 'financial'
  });
  
  // Fetch documents
  const { 
    data: documents, 
    isLoading: isDocumentsLoading 
  } = useQuery({
    queryKey: ['member-documents', params.id],
    queryFn: async () => {
      const response:any = await apiService.get(`/documents/member/${params.id}`);
      return response.data.data;
    },
    enabled: activeTab === 'documents'
  });
  
  // Fetch activity logs
  const { 
    data: activityLogs, 
    isLoading: isActivityLoading 
  } = useQuery({
    queryKey: ['member-activity', params.id],
    queryFn: async () => {
      const response = await apiService.get(`/activity/member/${params.id}`);
      return response.data.data;
    },
    enabled: activeTab === 'activity'
  });

  // Handle status update
  const handleStatusUpdate = async (status: string) => {
    try {
      await memberService.updateMembershipStatus(
        params.id, 
        status as 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',
        `Status updated to ${status} from admin panel`
      );
      // Refresh member data
      setTimeout(() => {
        // Refetch member data
      }, 1000);
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };
  
  if (isMemberLoading) {
    return (
      <Box sx={{ maxWidth: '100%', width: '100%' }}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      </Box>
    );
  }

  if (memberError) {
    return (
      <Box sx={{ maxWidth: '100%', width: '100%' }}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="error">
            Error loading member data
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
            There was a problem fetching the member information.
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => router.push('/admin/members')}
          >
            Back to Members
          </Button>
        </Paper>
      </Box>
    );
  }
  
  if (!member) {
    return (
      <Box sx={{ maxWidth: '100%', width: '100%' }}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="error">
            Member not found
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            sx={{ mt: 2 }}
            onClick={() => router.push('/admin/members')}
          >
            Back to Members
          </Button>
        </Paper>
      </Box>
    );
  }
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: TabPanelType) => {
    setActiveTab(newValue);
  };

  // Format dates properly with fallbacks
  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return 'Not provided';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      return 'Invalid date';
    }
  };
  
  return (
    <Box sx={{ maxWidth: '100%', width: '100%' }}>
      {/* Header with actions */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start' 
        }}>
          <Box>
            <Typography variant="h5" component="h1" gutterBottom>
              {member.firstName} {member.lastName}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
              <Chip 
                label={`ERP ID: ${member.erpId}`}
                size="small"
                variant="outlined"
              />
              <MemberStatusBadge 
                status={member.membershipStatus} 
                type="membership" 
              />
              <MemberStatusBadge 
                status={member.isVerified ? 'VERIFIED' : 'UNVERIFIED'} 
                type="verification" 
              />
              <Chip
                label={`Approved: ${member.isApproved ? 'Yes' : 'No'}`}
                size="small"
                color={member.isApproved ? 'success' : 'warning'}
                variant="outlined"
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              Member since {formatDate(member.createdAt)}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <PermissionGate permissions={['EDIT_MEMBERS']}>
              <Button 
                variant="outlined"
                onClick={() => router.push(`/admin/members/${params.id}/edit`)}
              >
                Edit Member
              </Button>
            </PermissionGate>
            
            <PermissionGate permissions={['VIEW_ACCOUNTS']}>
              <Button
                variant="outlined"
                onClick={() => router.push(`/admin/members/${params.id}/accounts`)}
              >
                Bank Accounts
              </Button>
            </PermissionGate>

            <PermissionGate permissions={['MANAGE_MEMBERS']} module={Module.ACCOUNT} approvalLevel={2}>
              <Button
                variant="outlined"
                color={member.membershipStatus === 'ACTIVE' ? 'error' : 'success'}
                onClick={() => handleStatusUpdate(member.membershipStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE')}
              >
                {member.membershipStatus === 'ACTIVE' ? 'Suspend Member' : 'Activate Member'}
              </Button>
            </PermissionGate>
          </Box>
        </Box>
      </Paper>
      
      {/* Tabs and content */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            aria-label="member details tabs"
            textColor="primary"
            indicatorColor="primary"
          >
            <Tab label="Overview" value="overview" />
            <Tab label="Financial" value="financial" />
            <Tab label="Documents" value="documents" />
            <Tab label="Activity" value="activity" />
          </Tabs>
        </Box>
        
        <Box sx={{ py: 2 }}>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper sx={{ p: 3, height: '100%' }}>
                  <Typography variant="h6" gutterBottom>
                    Personal Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="body2" color="text.secondary">
                        Full Name
                      </Typography>
                      <Typography variant="body1">
                        {member.firstName} {member.middleName ? member.middleName + ' ' : ''}{member.lastName}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="body2" color="text.secondary">
                        Email
                      </Typography>
                      <Typography variant="body1">
                        {member.emailAddress || 'Not provided'}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="body2" color="text.secondary">
                        Phone
                      </Typography>
                      <Typography variant="body1">
                        {member.phoneNumber || 'Not provided'}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="body2" color="text.secondary">
                        Date of Birth
                      </Typography>
                      <Typography variant="body1">
                        {formatDate(member.dateOfBirth)}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="body2" color="text.secondary">
                        Address
                      </Typography>
                      <Typography variant="body1">
                        {member.residentialAddress || 'Not provided'}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
              
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper sx={{ p: 3, height: '100%' }}>
                  <Typography variant="h6" gutterBottom>
                    Employment Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="body2" color="text.secondary">
                        IPPIS ID
                      </Typography>
                      <Typography variant="body1">
                        {member.ippisId || 'Not provided'}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="body2" color="text.secondary">
                        Staff Number
                      </Typography>
                      <Typography variant="body1">
                        {member.staffNo || 'Not provided'}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="body2" color="text.secondary">
                        Department
                      </Typography>
                      <Typography variant="body1">
                        {member.department || 'Not provided'}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="body2" color="text.secondary">
                        Employment Date
                      </Typography>
                      <Typography variant="body1">
                        {formatDate(member.dateOfEmployment)}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
              
              <Grid size={{ xs: 12 }}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Next of Kin
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        Name
                      </Typography>
                      <Typography variant="body1">
                        {member.nextOfKin || 'Not provided'}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        Relationship
                      </Typography>
                      <Typography variant="body1">
                        {member.relationshipOfNextOfKin || 'Not provided'}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        Contact
                      </Typography>
                      <Typography variant="body1">
                        {member.nextOfKinPhoneNumber || 'Not provided'}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
          )}
          
          {/* Financial Tab */}
          {activeTab === 'financial' && (
            <Box>
              {isFinancialLoading || isLoanLoading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
                  <div className="space-y-4">
                    <div className="h-12 bg-gray-200 rounded"></div>
                    <div className="h-12 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ) : (
                <PermissionGate 
                  // permissions={['VIEW_FINANCIAL']}
                  module={Module.ACCOUNT}
                  fallback={
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                      <Typography variant="body1" color="text.secondary">
                        You don't have permission to view financial information.
                      </Typography>
                    </Box>
                  }
                >
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="h6" gutterBottom>
                        Financial Summary
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                    </Grid>
                    
                    {/* Loans section */}
                    <Grid size={{ xs: 12 }}>
                      <Paper sx={{ p: 3 }}>
                        <Typography variant="subtitle1" gutterBottom fontWeight={500}>
                          Loans
                        </Typography>
                        
                        {loanData?.data?.length > 0 ? (
                          <Box sx={{ mt: 2 }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                              <thead>
                                <tr>
                                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Amount</th>
                                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Status</th>
                                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Date</th>
                                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Balance</th>
                                </tr>
                              </thead>
                              <tbody>
                                {loanData.data.map((loan: any) => (
                                  <tr key={loan.id}>
                                    <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{loan.amount}</td>
                                    <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{loan.status}</td>
                                    <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{formatDate(loan.createdAt)}</td>
                                    <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{loan.balance || loan.amount}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            No active loans found for this member.
                          </Typography>
                        )}
                      </Paper>
                    </Grid>
                    
                    {/* Accounts section */}
                    <Grid size={{ xs: 12 }}>
                      <Paper sx={{ p: 3 }}>
                        <Typography variant="subtitle1" gutterBottom fontWeight={500}>
                          Bank Accounts
                        </Typography>
                        
                        {member.accountInfo && member.accountInfo.length > 0 ? (
                          <Box sx={{ mt: 2 }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                              <thead>
                                <tr>
                                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Bank</th>
                                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Account Number</th>
                                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Account Name</th>
                                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Verified</th>
                                </tr>
                              </thead>
                              <tbody>
                                {member.accountInfo.map((account: any) => (
                                  <tr key={account.id}>
                                    <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{account.bank?.name || 'Unknown Bank'}</td>
                                    <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{account.accountNumber}</td>
                                    <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{account.accountName}</td>
                                    <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                                      {account.isVerified ? 
                                        <Chip size="small" color="success" label="Verified" /> : 
                                        <Chip size="small" color="warning" label="Unverified" />
                                      }
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            No bank accounts registered for this member.
                          </Typography>
                        )}
                        
                        <Box sx={{ mt: 3 }}>
                          <Button 
                            variant="outlined" 
                            size="small" 
                            onClick={() => router.push(`/admin/members/${params.id}/accounts`)}
                          >
                            Manage Bank Accounts
                          </Button>
                        </Box>
                      </Paper>
                    </Grid>
                  </Grid>
                </PermissionGate>
              )}
            </Box>
          )}
          
          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <Box>
              {isDocumentsLoading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
                  <div className="space-y-4">
                    <div className="h-12 bg-gray-200 rounded"></div>
                    <div className="h-12 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ) : (
                <PermissionGate 
                  // permissions={['VIEW_DOCUMENTS']}
                  module={Module.ACCOUNT}
                  fallback={
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                      <Typography variant="body1" color="text.secondary">
                        You don't have permission to view member documents.
                      </Typography>
                    </Box>
                  }
                >
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="h6" gutterBottom>
                        Member Documents
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      
                      {documents && documents.length > 0 ? (
                        <Box sx={{ mt: 2 }}>
                          {/* Document list content */}
                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr>
                                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Document Type</th>
                                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Uploaded</th>
                                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Status</th>
                                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {documents.map((doc: any) => (
                                <tr key={doc.id}>
                                  <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{doc.type}</td>
                                  <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{formatDate(doc.uploadedAt)}</td>
                                  <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                                    {doc.status === 'VERIFIED' ? 
                                      <Chip size="small" color="success" label="Verified" /> : 
                                      <Chip size="small" color="warning" label={doc.status} />
                                    }
                                  </td>
                                  <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                                    <Button size="small" variant="text">View</Button>
                                    <Button size="small" variant="text" color="error">Delete</Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          No documents uploaded for this member.
                        </Typography>
                      )}
                      
                      <Box sx={{ mt: 3 }}>
                          <Button variant="outlined" size="small">
                            Upload Document
                          </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </PermissionGate>
              )}
            </Box>
          )}
          
          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <Box>
              {isActivityLoading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
                  <div className="space-y-4">
                    <div className="h-12 bg-gray-200 rounded"></div>
                    <div className="h-12 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ) : (
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="h6" gutterBottom>
                      Activity Log
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    
                    {activityLogs && activityLogs.length > 0 ? (
                      <Box sx={{ mt: 2 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr>
                              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Activity</th>
                              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Date</th>
                              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Performed By</th>
                              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Details</th>
                            </tr>
                          </thead>
                          <tbody>
                            {activityLogs.map((log: any) => (
                              <tr key={log.id}>
                                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{log.action}</td>
                                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{formatDate(log.timestamp)}</td>
                                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{log.performedBy}</td>
                                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{log.details}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        No activity records found for this member.
                      </Typography>
                    )}
                  </Grid>
                </Grid>
              )}
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
}