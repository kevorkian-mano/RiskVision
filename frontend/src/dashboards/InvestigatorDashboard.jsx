import React, { useEffect, useState } from 'react';
import {
  Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, IconButton, Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, Alert, Snackbar, Card, CardContent, Grid, Divider
} from '@mui/material';
import { caseAPI, userAPI } from '../services/api.jsx';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CommentIcon from '@mui/icons-material/Comment';
import { useAuth } from '../contexts/AuthContext';

// Case status color coding
const getCaseStatusColor = (status) => {
  switch (status) {
    case 'Open': return 'info';
    case 'Assigned': return 'warning';
    case 'In Review': return 'primary';
    case 'Escalated': return 'error';
    case 'Closed': return 'success';
    case 'Confirmed Fraud': return 'error';
    case 'Dismissed': return 'default';
    case 'Account Frozen': return 'warning';
    case 'Transaction Reversed': return 'info';
    case 'Reported to Compliance': return 'secondary';
    case 'Added to Watchlist': return 'default';
    case 'Customer Verification Requested': return 'info';
    default: return 'default';
  }
};

// Priority color coding
const getPriorityColor = (priority) => {
  switch (priority) {
    case 'Critical': return 'error';
    case 'High': return 'warning';
    case 'Medium': return 'info';
    case 'Low': return 'success';
    default: return 'default';
  }
};

// Investigator decision options
const decisionOptions = [
  {
    value: 'confirm_fraud',
    label: 'Confirm Fraud',
    description: 'Officially label the case as fraud',
    example: '"Yes, this $15,000 transfer from Russia was not made by the customer."',
    color: 'error'
  },
  {
    value: 'freeze_account',
    label: 'Freeze User Account',
    description: 'Temporarily block the user/account',
    example: 'Prevent the fraudster from making more actions.',
    color: 'warning'
  },
  {
    value: 'reverse_transaction',
    label: 'Reverse Transaction',
    description: 'Mark the transaction as reversed or send it to be reversed manually',
    example: 'Bank manually cancels a fake payment.',
    color: 'info'
  },
  {
    value: 'report_compliance',
    label: 'Report to Compliance',
    description: 'Send the case to the compliance team or regulator',
    example: 'For suspicious high-value or AML-related activity.',
    color: 'secondary'
  },
  {
    value: 'add_watchlist',
    label: 'Add to Watchlist',
    description: 'Flag the user or account for future monitoring',
    example: 'Keep the account under surveillance.',
    color: 'default'
  },
  {
    value: 'escalate_case',
    label: 'Escalate Case',
    description: 'Send to a senior investigator or fraud manager',
    example: 'Complex fraud with large amount or international links.',
    color: 'error'
  },
  {
    value: 'request_verification',
    label: 'Request Customer Verification',
    description: 'Send message/email asking the user to confirm the transaction',
    example: '"Was this you?" alert like banks do.',
    color: 'info'
  }
];

const InvestigatorDashboard = () => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [investigators, setInvestigators] = useState([]);
  
  // Case details dialog
  const [selectedCase, setSelectedCase] = useState(null);
  const [caseDetailsDialog, setCaseDetailsDialog] = useState(false);
  const [commentText, setCommentText] = useState('');
  
  // Case decision dialog
  const [decisionDialog, setDecisionDialog] = useState(false);
  const [selectedDecision, setSelectedDecision] = useState('');
  const [decisionNotes, setDecisionNotes] = useState('');
  const [decisionLoading, setDecisionLoading] = useState(false);
  const [hasDecision, setHasDecision] = useState(false);
  
  // Notifications
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const { user } = useAuth();

  useEffect(() => {
    fetchCases();
    fetchStats();
    fetchInvestigators();
    // eslint-disable-next-line
  }, []);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const res = await caseAPI.getAll();
      setCases(res.data);
    } catch (err) {
      console.error('Error fetching cases:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await caseAPI.getStats();
      setStats(res.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchInvestigators = async () => {
    try {
      const res = await userAPI.getAllUsers();
      const investigatorUsers = res.data.filter(user => user.role === 'investigator');
      setInvestigators(investigatorUsers);
    } catch (err) {
      console.error('Error fetching investigators:', err);
    }
  };

  const handleViewCase = async (caseData) => {
    setSelectedCase(caseData);
    setCaseDetailsDialog(true);
    
    // If case is still "Open" or "Assigned", mark it as "In Review" to show it's been opened
    if (caseData.status === 'Open' || caseData.status === 'Assigned') {
      try {
        await caseAPI.updateStatus(caseData._id, 'In Review', 'Case opened by investigator');
        // Update the case data to reflect the new status
        const res = await caseAPI.getById(caseData._id);
        setSelectedCase(res.data);
        fetchCases(); // Refresh the cases list
      } catch (err) {
        console.error('Error updating case status:', err);
        // Don't show error to user, just log it
      }
    }
  };

  const handleUpdateStatus = async (caseId, newStatus, notes = '') => {
    try {
      await caseAPI.updateStatus(caseId, newStatus, notes);
      setSnackbar({
        open: true,
        message: 'Case status updated successfully!',
        severity: 'success'
      });
      fetchCases();
      fetchStats();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.error || 'Failed to update status',
        severity: 'error'
      });
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !selectedCase) return;
    
    try {
      await caseAPI.addComment(selectedCase._id, commentText);
      setCommentText('');
      setSnackbar({
        open: true,
        message: 'Comment added successfully!',
        severity: 'success'
      });
      // Refresh case data
      const res = await caseAPI.getById(selectedCase._id);
      setSelectedCase(res.data);
      fetchCases();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.error || 'Failed to add comment',
        severity: 'error'
      });
    }
  };

  const handleMakeDecision = (caseData) => {
    setSelectedCase(caseData);
    setSelectedDecision('');
    setDecisionNotes('');
    
    // Check if case already has a decision (status other than Open, Assigned, In Review)
    const hasExistingDecision = !['Open', 'Assigned', 'In Review'].includes(caseData.status);
    setHasDecision(hasExistingDecision);
    
    if (hasExistingDecision) {
      // If decision exists, try to extract it from timeline or status
      const decisionStatus = caseData.status;
      const matchingDecision = decisionOptions.find(d => {
        switch (d.value) {
          case 'confirm_fraud': return decisionStatus === 'Confirmed Fraud';
          case 'freeze_account': return decisionStatus === 'Account Frozen';
          case 'reverse_transaction': return decisionStatus === 'Transaction Reversed';
          case 'report_compliance': return decisionStatus === 'Reported to Compliance';
          case 'add_watchlist': return decisionStatus === 'Added to Watchlist';
          case 'escalate_case': return decisionStatus === 'Escalated';
          case 'request_verification': return decisionStatus === 'Customer Verification Requested';
          default: return false;
        }
      });
      
      if (matchingDecision) {
        setSelectedDecision(matchingDecision.value);
      }
    }
    
    setDecisionDialog(true);
  };

  const handleConfirmDecision = async () => {
    if (!selectedDecision || !selectedCase) return;
    
    setDecisionLoading(true);
    try {
      const decision = decisionOptions.find(d => d.value === selectedDecision);
      
      // Map decision to status
      let status;
      switch (selectedDecision) {
        case 'confirm_fraud':
          status = 'Confirmed Fraud';
          break;
        case 'freeze_account':
          status = 'Account Frozen';
          break;
        case 'reverse_transaction':
          status = 'Transaction Reversed';
          break;
        case 'report_compliance':
          status = 'Reported to Compliance';
          break;
        case 'add_watchlist':
          status = 'Added to Watchlist';
          break;
        case 'escalate_case':
          status = 'Escalated';
          break;
        case 'request_verification':
          status = 'Customer Verification Requested';
          break;
        default:
          status = 'In Review';
      }
      
      const notes = `Decision: ${decision.label}\n${decisionNotes ? `Notes: ${decisionNotes}` : ''}`;
      
      await caseAPI.updateStatus(selectedCase._id, status, notes);
      
      setSnackbar({
        open: true,
        message: `Decision "${decision.label}" applied successfully!`,
        severity: 'success'
      });
      
      setDecisionDialog(false);
      setSelectedDecision('');
      setDecisionNotes('');
      
      // Refresh case data
      const res = await caseAPI.getById(selectedCase._id);
      setSelectedCase(res.data);
      fetchCases();
      fetchStats();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.error || 'Failed to apply decision',
        severity: 'error'
      });
    } finally {
      setDecisionLoading(false);
    }
  };

  const handleCloseCase = async () => {
    if (!selectedCase) return;
    
    setDecisionLoading(true);
    try {
      await caseAPI.updateStatus(selectedCase._id, 'Closed', 'Case closed by investigator after decision');
      
      setSnackbar({
        open: true,
        message: 'Case closed successfully!',
        severity: 'success'
      });
      
      setDecisionDialog(false);
      setSelectedDecision('');
      setDecisionNotes('');
      setHasDecision(false);
      
      // Refresh case data
      const res = await caseAPI.getById(selectedCase._id);
      setSelectedCase(res.data);
      fetchCases();
      fetchStats();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.error || 'Failed to close case',
        severity: 'error'
      });
    } finally {
      setDecisionLoading(false);
    }
  };

  const assignedCases = cases.filter(c => c.assignedTo && c.assignedTo._id === user._id);
  const availableCases = cases.filter(c => c.status !== 'Closed' && (!c.assignedTo || c.assignedTo._id !== user._id));

  const handleAssignToMe = async (caseData) => {
    try {
      await caseAPI.assignToSelf(caseData._id);
      setSnackbar({
        open: true,
        message: 'Case assigned to you successfully!',
        severity: 'success'
      });
      fetchCases();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.error || 'Failed to assign case',
        severity: 'error'
      });
    }
  };

  return (
    <Box p={4}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>Investigator Dashboard</Typography>
          <Typography sx={{ mb: 0 }}>Manage assigned fraud cases and investigations</Typography>
        </Box>
        <IconButton onClick={fetchCases} color="primary" size="large" aria-label="Refresh cases">
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                My Assigned Cases
              </Typography>
              <Typography variant="h4">
                {assignedCases.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                My Open Cases
              </Typography>
              <Typography variant="h4" color="warning.main">
                {assignedCases.filter(c => c.status !== 'Closed').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                High Priority Cases
              </Typography>
              <Typography variant="h4" color="error.main">
                {assignedCases.filter(c => ['High', 'Critical'].includes(c.priority)).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Avg Risk Score
              </Typography>
              <Typography variant="h4" color="info.main">
                {assignedCases.length > 0 
                  ? Math.round(assignedCases.reduce((sum, c) => sum + (c.riskScore || 0), 0) / assignedCases.length)
                  : 0
                }
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Assigned Cases */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        My Assigned Cases ({assignedCases.length})
      </Typography>
      <TableContainer component={Paper} sx={{ mb: 4 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Risk Score</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created By</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <CircularProgress size={32} />
                </TableCell>
              </TableRow>
            ) : assignedCases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No assigned cases
                </TableCell>
              </TableRow>
            ) : (
              assignedCases.map(c => (
                <TableRow key={c._id}>
                  <TableCell>{c.title}</TableCell>
                  <TableCell>
                    <Chip
                      label={c.riskScore}
                      color={c.riskScore >= 70 ? 'error' : c.riskScore >= 40 ? 'warning' : 'success'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={c.priority}
                      color={getPriorityColor(c.priority)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={c.status}
                      color={getCaseStatusColor(c.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{c.createdBy?.name || 'N/A'}</TableCell>
                  <TableCell>{new Date(c.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      startIcon={<VisibilityIcon />}
                      onClick={() => handleViewCase(c)}
                      variant="outlined"
                      sx={{ mr: 1 }}
                    >
                      View
                    </Button>
                    {c.status !== 'Closed' && (
                      <Button
                        size="small"
                        startIcon={<CommentIcon />}
                        onClick={() => handleMakeDecision(c)}
                        variant="contained"
                        color="primary"
                        sx={{ mr: 1 }}
                      >
                        {!['Open', 'Assigned', 'In Review'].includes(c.status) ? 'Change Decision' : 'Make Decision'}
                      </Button>
                    )}
                    {c.status !== 'Closed' && !['Open', 'Assigned', 'In Review'].includes(c.status) && (
                      <Button
                        size="small"
                        startIcon={<CommentIcon />}
                        onClick={() => {
                          setSelectedCase(c);
                          handleCloseCase();
                        }}
                        variant="contained"
                        color="success"
                      >
                        Close Case
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Available Cases */}
      <Typography variant="h5" gutterBottom>
        Available Cases ({availableCases.length})
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
        Open cases that are unassigned or assigned to other investigators
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Risk Score</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created By</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <CircularProgress size={32} />
                </TableCell>
              </TableRow>
            ) : availableCases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No available cases
                </TableCell>
              </TableRow>
            ) : (
              availableCases.map(c => (
                <TableRow key={c._id}>
                  <TableCell>{c.title}</TableCell>
                  <TableCell>
                    <Chip
                      label={c.riskScore}
                      color={c.riskScore >= 70 ? 'error' : c.riskScore >= 40 ? 'warning' : 'success'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={c.priority}
                      color={getPriorityColor(c.priority)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={c.status}
                      color={getCaseStatusColor(c.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{c.createdBy?.name || 'N/A'}</TableCell>
                  <TableCell>{new Date(c.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      startIcon={<VisibilityIcon />}
                      onClick={() => handleViewCase(c)}
                      variant="outlined"
                      sx={{ mr: 1 }}
                    >
                      View
                    </Button>
                    {!c.assignedTo && (
                      <Button
                        size="small"
                        startIcon={<AssignmentIcon />}
                        onClick={() => handleAssignToMe(c)}
                        variant="contained"
                        color="primary"
                      >
                        Assign to Me
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Case Details Dialog */}
      <Dialog open={caseDetailsDialog} onClose={() => setCaseDetailsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Case Details: {selectedCase?.title}
        </DialogTitle>
        <DialogContent>
          {selectedCase && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>Case Information</Typography>
                  <Typography><strong>Title:</strong> {selectedCase.title}</Typography>
                  <Typography><strong>Description:</strong> {selectedCase.description}</Typography>
                  <Typography><strong>Risk Score:</strong> {selectedCase.riskScore}</Typography>
                  <Typography><strong>Priority:</strong> {selectedCase.priority}</Typography>
                  <Typography><strong>Status:</strong> {selectedCase.status}</Typography>
                  <Typography><strong>Created By:</strong> {selectedCase.createdBy?.name} ({selectedCase.createdBy?.email})</Typography>
                  <Typography><strong>Created:</strong> {new Date(selectedCase.createdAt).toLocaleString()}</Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>Transaction Details</Typography>
                  {selectedCase.transactionId ? (
                    <>
                      <Typography><strong>Amount:</strong> ${selectedCase.transactionId.amount?.toLocaleString()}</Typography>
                      <Typography><strong>Country:</strong> {selectedCase.transactionId.country}</Typography>
                      <Typography><strong>User:</strong> {selectedCase.transactionId.userId?.name || 'N/A'}</Typography>
                      <Typography><strong>Timestamp:</strong> {new Date(selectedCase.transactionId.timestamp).toLocaleString()}</Typography>
                    </>
                  ) : (
                    <Typography color="textSecondary">No transaction details available</Typography>
                  )}
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              {/* Comments Section */}
              <Typography variant="h6" gutterBottom>
                Comments ({selectedCase.comments?.length || 0})
              </Typography>
              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  sx={{ mb: 1 }}
                />
                <Button
                  variant="contained"
                  startIcon={<CommentIcon />}
                  onClick={handleAddComment}
                  disabled={!commentText.trim()}
                >
                  Add Comment
                </Button>
              </Box>
              
              <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                {selectedCase.comments?.map((comment, index) => (
                  <Box key={index} sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="subtitle2" color="primary">
                      {comment.userId?.name} ({comment.userId?.role})
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {comment.text}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {new Date(comment.createdAt).toLocaleString()}
                    </Typography>
                  </Box>
                ))}
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Timeline */}
              <Typography variant="h6" gutterBottom>
                Timeline
              </Typography>
              <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                {selectedCase.timeline?.map((event, index) => (
                  <Box key={index} sx={{ mb: 1, p: 1, borderLeft: '3px solid #1976d2' }}>
                    <Typography variant="body2">
                      <strong>{event.action}</strong>
                    </Typography>
                    {event.details && (
                      <Typography variant="caption" color="textSecondary">
                        {event.details}
                      </Typography>
                    )}
                    <Typography variant="caption" color="textSecondary" display="block">
                      {new Date(event.date).toLocaleString()}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCaseDetailsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Case Decision Dialog */}
      <Dialog open={decisionDialog} onClose={() => setDecisionDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Make Investigator Decision
          {selectedCase && (
            <Typography variant="subtitle2" color="textSecondary">
              Case: {selectedCase.title}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Select Decision Action
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 2, mb: 3 }}>
              {decisionOptions.map((decision) => (
                <Card 
                  key={decision.value}
                  sx={{ 
                    cursor: 'pointer',
                    border: selectedDecision === decision.value ? 2 : 1,
                    borderColor: selectedDecision === decision.value ? `${decision.color}.main` : 'divider',
                    '&:hover': { borderColor: `${decision.color}.main` }
                  }}
                  onClick={() => setSelectedDecision(decision.value)}
                >
                  <CardContent>
                    <Typography variant="h6" color={`${decision.color}.main`} gutterBottom>
                      {decision.label}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      {decision.description}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      <strong>Example:</strong> {decision.example}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
            
            {selectedDecision && (
              <TextField
                fullWidth
                label="Additional Notes (Optional)"
                value={decisionNotes}
                onChange={(e) => setDecisionNotes(e.target.value)}
                multiline
                rows={3}
                placeholder="Add any additional details about this decision..."
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDecisionDialog(false)} disabled={decisionLoading}>
            Cancel
          </Button>
          {hasDecision && selectedDecision && (
            <Button 
              onClick={handleCloseCase} 
              variant="contained"
              color="success"
              disabled={decisionLoading}
            >
              {decisionLoading ? 'Closing...' : 'Close Case'}
            </Button>
          )}
          <Button 
            onClick={handleConfirmDecision} 
            variant="contained"
            disabled={!selectedDecision || decisionLoading}
            color={selectedDecision ? decisionOptions.find(d => d.value === selectedDecision)?.color : 'primary'}
          >
            {decisionLoading ? 'Applying Decision...' : hasDecision ? 'Change Decision' : 'Apply Decision'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InvestigatorDashboard; 