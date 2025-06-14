'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box, Button, Typography, CircularProgress, Paper, Divider, Grid, 
  TextField, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  List, ListItem, ListItemText, ListItemIcon, Avatar
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import HomeIcon from '@mui/icons-material/Home';
import BadgeIcon from '@mui/icons-material/Badge';
import WorkIcon from '@mui/icons-material/Work';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';
import { 
  useApprovalDetails, 
  useApprovalHistory, 
  useApproveRequest, 
  useRejectRequest 
} from '@/lib/hooks/admin/useApprovals';
import { useAuth } from '@/lib/api/contexts/AuthContext';
import PermissionGate from '@/components/atoms/PermissionGate';
import { Module } from '@/types/permissions.types';

// Define your enums if not already imported
enum MembershipStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED'
}

// Define the Member interface that represents the request data
interface Member {
  id: string;
  biodata?: {
    firstName?: string;
    lastName?: string;
    emailAddress?: string;
    phoneNumber?: string;
    residentialAddress?: string;
    erpId?: string;
    ippisId?: string;
    department?: string;
    staffNo?: string;
    nextOfKin?: string;
    relationshipOfNextOfKin?: string;
    nextOfKinPhoneNumber?: string;
    nextOfKinEmailAddress?: string;
    [key: string]: any; // For any other potential fields
  };
  membershipStatus: MembershipStatus;
  metadata: {
    biodata?: any; // This can be further typed based on your actual data structure
    [key: string]: any; // For any other potential metadata fields
  };
  comments?: string;
  updatedAt: string;
  createdAt: string;
}

// Define a request interface that extends the member interface
interface MemberRequest {
  id: string;
  requestedBy?: string;
  createdAt: string;
  status: string;
  actionBy?: string;
  notes?: string;
  member?: Member;
  biodata?: any;
  membershipStatus?: MembershipStatus;
  [key: string]: any; // For any other potential fields
}

// Define the history entry interface
interface ApprovalHistoryEntry {
  id: string;
  requestId: string;
  approverName?: string;
  action: string;
  comment?: string;
  timestamp: string;
}

export default function MemberApprovalDetailPage() {
  const { id } = useParams();
  const { data: request, isLoading, error } = useApprovalDetails(id as string);
  const { data: history, isLoading: isHistoryLoading } = useApprovalHistory(id as string);
  
  // Mutations
  const { mutate: approve, isPending: isApproving } = useApproveRequest();
  const { mutate: reject, isPending: isRejecting } = useRejectRequest();

  // UI state
  const [comments, setComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  
  const router = useRouter();
  const { checkApprovalLevel } = useAuth();
  
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !request) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: 400, justifyContent: 'center' }}>
        <Typography variant="h6" color="error" gutterBottom>
          Error loading member registration request
        </Typography>
        <Button 
          variant="outlined" 
          startIcon={<ArrowBackIcon />}
          onClick={() => router.back()}
        >
          Go Back
        </Button>
      </Box>
    );
  }
  
  // Cast the request to our typed interface
  const typedRequest = request as unknown as MemberRequest;
  const member = typedRequest as unknown as Member;

  // Extract member data
  const memberData = member.metadata.biodata || {};
  
  // Check if user can approve (requires Treasurer or Chairman level - Level 2+)
  const canApprove = checkApprovalLevel(2) && member.membershipStatus === MembershipStatus.PENDING;
  
  // Handle approval
  const handleApprove = () => {
    approve({ 
      requestId: id as string, 
      notes: comments 
    });
  };
  
  // Handle rejection
  const handleReject = () => {
    reject({ 
      requestId: id as string, 
      reason: rejectionReason 
    });
    setIsRejectDialogOpen(false);
  };
  
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button 
          variant="outlined" 
          startIcon={<ArrowBackIcon />} 
          sx={{ mr: 2 }}
          onClick={() => router.back()}
        >
          Back
        </Button>
        <Typography variant="h4" fontWeight={600}>
          Member Registration Approval
        </Typography>
      </Box>
      
      <Grid container spacing={3}>
        {/* Left column - Member details */}
        <Grid size={{ xs: 12, md: 7, lg: 8 }}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Typography variant="h6" fontWeight={600}>
                Member Information
              </Typography>
              <Chip 
                label={member.membershipStatus} 
                color={
                  member.membershipStatus === MembershipStatus.PENDING ? 'warning' :
                  member.membershipStatus === MembershipStatus.APPROVED ? 'success' :
                  member.membershipStatus === MembershipStatus.REJECTED ? 'error' : 'default'
                }
              />
            </Box>
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <List dense disablePadding>
                  <ListItem disableGutters>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <PersonIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Full Name" 
                      secondary={`${memberData.fullName || ''} ${memberData.lastName || ''}`.trim() || 'Not provided'}
                    />
                  </ListItem>
                  
                  <ListItem disableGutters>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <EmailIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Email Address" 
                      secondary={memberData.emailAddress || 'Not provided'} 
                    />
                  </ListItem>
                  
                  <ListItem disableGutters>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <PhoneIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Phone Number" 
                      secondary={memberData.phoneNumber || 'Not provided'} 
                    />
                  </ListItem>
                  
                  <ListItem disableGutters>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <HomeIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Residential Address" 
                      secondary={memberData.residentialAddress || 'Not provided'} 
                    />
                  </ListItem>
                </List>
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6 }}>
                <List dense disablePadding>
                  <ListItem disableGutters>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <BadgeIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="ERP ID" 
                      secondary={memberData.erpId || 'Not provided'} 
                    />
                  </ListItem>
                  
                  <ListItem disableGutters>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <BadgeIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="IPPIS ID" 
                      secondary={memberData.ippisId || 'Not provided'} 
                    />
                  </ListItem>
                  
                  <ListItem disableGutters>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <WorkIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Department" 
                      secondary={memberData.department || 'Not provided'} 
                    />
                  </ListItem>
                  
                  <ListItem disableGutters>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <WorkIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Staff Number" 
                      secondary={memberData.staffNo || 'Not provided'} 
                    />
                  </ListItem>
                </List>
              </Grid>
              
              <Grid size={{xs: 12 }}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" fontWeight={500} gutterBottom>
                  Next of Kin Information
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <List dense disablePadding>
                      <ListItem disableGutters>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <FamilyRestroomIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Next of Kin" 
                          secondary={memberData.nextOfKin || 'Not provided'} 
                        />
                      </ListItem>
                      
                      <ListItem disableGutters>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <FamilyRestroomIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Relationship" 
                          secondary={memberData.relationshipOfNextOfKin || 'Not provided'} 
                        />
                      </ListItem>
                    </List>
                  </Grid>
                  
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <List dense disablePadding>
                      <ListItem disableGutters>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <PhoneIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Phone Number" 
                          secondary={memberData.nextOfKinPhoneNumber || 'Not provided'} 
                        />
                      </ListItem>
                      
                      <ListItem disableGutters>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <EmailIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Email Address" 
                          secondary={memberData.nextOfKinEmailAddress || 'Not provided'} 
                        />
                      </ListItem>
                    </List>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Paper>
          
          {/* Approval history */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Approval History
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            {isHistoryLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress size={30} />
              </Box>
            ) : Array.isArray(history) && history.length > 0 ? (
              <Box>
                {history.map((entry: any, index: number) => (
                  <Box key={index} sx={{ mb: 2, display: 'flex', alignItems: 'flex-start' }}>
                    <Avatar 
                      sx={{ 
                        width: 36, 
                        height: 36, 
                        mr: 2,
                        bgcolor: entry.action === 'APPROVED' ? 'success.main' : 
                                entry.action === 'REJECTED' ? 'error.main' : 'primary.main'
                      }}
                    >
                      {entry.approverName?.[0] || 'U'}
                    </Avatar>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="body2" fontWeight={500}>
                          {entry.approverName || 'System'}
                        </Typography>
                        <Chip 
                          label={entry.action} 
                          size="small" 
                          sx={{ ml: 1 }}
                          color={
                            entry.action === 'APPROVED' ? 'success' :
                            entry.action === 'REJECTED' ? 'error' : 'default'
                          }
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(entry.timestamp).toLocaleString()}
                      </Typography>
                      {entry.comment && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          {entry.comment}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                No approval history available
              </Typography>
            )}
          </Paper>
        </Grid>
        
        {/* Right column - Action panel */}
        <Grid size={{ xs: 12, md: 5, lg: 4 }}>
          {/* Actions - only show if can approve based on role level */}
          <PermissionGate permissions={['APPROVE_MEMBERS']} module={Module.ACCOUNT} approvalLevel={2}>
            {canApprove && (
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Take Action
                </Typography>
                <Divider sx={{ mb: 3 }} />
                
                <TextField
                  label="Comments"
                  multiline
                  rows={4}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  variant="outlined"
                  fullWidth
                  placeholder="Add your comments for this approval decision here (optional)"
                  sx={{ mb: 3 }}
                />
                
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between' }}>
                  <Button
                    variant="contained"
                    color="success"
                    fullWidth
                    disabled={isApproving}
                    onClick={handleApprove}
                    sx={{ py: 1.5 }}
                  >
                    {isApproving ? <CircularProgress size={24} color="inherit" /> : 'Approve'}
                  </Button>
                  
                  <Button
                    variant="outlined"
                    color="error"
                    fullWidth
                    disabled={isRejecting}
                    onClick={() => setIsRejectDialogOpen(true)}
                    sx={{ py: 1.5 }}
                  >
                    Reject
                  </Button>
                </Box>
              </Paper>
            )}
          </PermissionGate>
          
          {/* Status info for already processed requests */}
          {member.membershipStatus !== MembershipStatus.PENDING && (
            <Paper sx={{ p: 3, mb: 3, bgcolor: member.membershipStatus === MembershipStatus.APPROVED ? 'success.50' : 'error.50' }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Request Status
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Chip 
                  label={member.membershipStatus} 
                  color={member.membershipStatus === MembershipStatus.APPROVED ? 'success' : 'error'}
                  sx={{ mr: 1 }}
                />
                <Typography>
                  on {new Date(member.updatedAt).toLocaleDateString()}
                </Typography>
              </Box>
              
              {member.comments && (
                <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                  "{member.comments}"
                </Typography>
              )}
            </Paper>
          )}
          
          {/* Request details sidebar */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Request Details
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <List dense disablePadding>
              <ListItem disableGutters>
                <ListItemText 
                  primary="Requested By" 
                  secondary={typedRequest.requestedBy || 'System'} 
                />
              </ListItem>
              <ListItem disableGutters>
                <ListItemText 
                  primary="Request Date" 
                  secondary={new Date(typedRequest.createdAt).toLocaleString()} 
                />
              </ListItem>
              {typedRequest.status !== 'PENDING' && (
                <ListItem disableGutters>
                  <ListItemText 
                    primary={typedRequest.status === 'APPROVED' ? 'Approved By' : 'Rejected By'} 
                    secondary={typedRequest.actionBy || 'N/A'} 
                  />
                </ListItem>
              )}
              <ListItem disableGutters>
                <ListItemText 
                  primary="Request ID" 
                  secondary={typedRequest.id} 
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Rejection reason dialog */}
      <Dialog
        open={isRejectDialogOpen}
        onClose={() => setIsRejectDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Reject Member Registration</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Please provide a reason for rejecting this member registration request.
          </Typography>
          <TextField
            autoFocus
            label="Rejection Reason"
            multiline
            rows={4}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            variant="outlined"
            fullWidth
            required
            error={!rejectionReason.trim()}
            helperText={!rejectionReason.trim() ? 'Reason is required for rejection' : ''}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsRejectDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleReject} 
            color="error" 
            variant="contained"
            disabled={!rejectionReason.trim() || isRejecting}
          >
            {isRejecting ? <CircularProgress size={24} color="inherit" /> : 'Confirm Rejection'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}