import React, { useEffect, useState } from 'react';
import {
  Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, IconButton, FormControl, InputLabel, Select, MenuItem, Slider, Chip, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Tabs, Tab, Alert, Snackbar, Tooltip, TableSortLabel, Grid
} from '@mui/material';
import { transactionAPI, caseAPI } from '../services/api.jsx';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useAuth } from '../contexts/AuthContext';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AnnouncementDisplay from '../components/AnnouncementDisplay.jsx';
import PointsDisplay from '../components/PointsDisplay.jsx';

const sortOptions = [
  { value: 'timestamp', label: 'Timestamp (Newest First)' },
  { value: 'amount', label: 'Amount' },
  { value: 'riskScore', label: 'Risk Score' },
];

// Risk score color coding
const getRiskScoreColor = (score) => {
  if (score >= 70) return 'error';
  if (score >= 40) return 'warning';
  return 'success';
};

const getRiskScoreLabel = (score) => {
  if (score >= 70) return 'High';
  if (score >= 40) return 'Medium';
  return 'Low';
};

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

const ComplianceDashboard = () => {
  const [transactions, setTransactions] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [casesLoading, setCasesLoading] = useState(true);
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState('desc');
  const [countryFilter, setCountryFilter] = useState('all');
  const [amountFilter, setAmountFilter] = useState(0);
  const [maxAmount, setMaxAmount] = useState(10000);
  const [newTransactionIds, setNewTransactionIds] = useState([]);
  const [firstLoad, setFirstLoad] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [transactionsWithCases, setTransactionsWithCases] = useState(new Set());
  const [newlyCreatedCases, setNewlyCreatedCases] = useState(new Set());
  
  // Case creation dialog
  const [createCaseDialog, setCreateCaseDialog] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [caseForm, setCaseForm] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    assignedInvestigator: ''
  });
  
  // Cleanup confirmation dialog
  const [cleanupDialog, setCleanupDialog] = useState(false);
  
  // Notifications
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [cleanupLoading, setCleanupLoading] = useState(false);
  
  // Investigator assignment state
  const [investigators, setInvestigators] = useState([]);
  const [assigningCase, setAssigningCase] = useState(null);
  const [selectedInvestigator, setSelectedInvestigator] = useState('');
  const [assignmentLoading, setAssignmentLoading] = useState(false);

  const auth = useAuth();

  useEffect(() => {
    fetchTransactions();
    fetchCases();
    fetchInvestigators();
    // eslint-disable-next-line
  }, []);

  // Clear newly created cases highlight after 5 seconds
  useEffect(() => {
    if (newlyCreatedCases.size > 0) {
      const timer = setTimeout(() => {
        setNewlyCreatedCases(new Set());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [newlyCreatedCases]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      // Fetch transactions without cleanup
      const res = await transactionAPI.getAll({ limit: 100 });
      const newTxs = res.data;
      const max = newTxs.length > 0 ? Math.max(...newTxs.map(tx => tx.amount)) : 10000;
      setMaxAmount(max);
      setAmountFilter(max);
      // Highlight new transactions only after the first load
      if (!firstLoad) {
        const prevIds = new Set(transactions.map(tx => tx._id));
        const newIds = newTxs.filter(tx => !prevIds.has(tx._id)).map(tx => tx._id);
        setNewTransactionIds(newIds);
      } else {
        setNewTransactionIds([]);
        setFirstLoad(false);
      }
      setTransactions(newTxs);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setSnackbar({
        open: true,
        message: 'Error fetching transactions',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCases = async () => {
    setCasesLoading(true);
    try {
      const res = await caseAPI.getAll();
      setCases(res.data);
      
      // Update transactions with cases set
      const caseTransactionIds = new Set(res.data.map(c => c.transactionId?._id).filter(Boolean));
      setTransactionsWithCases(caseTransactionIds);
    } catch (err) {
      console.error('Error fetching cases:', err);
    } finally {
      setCasesLoading(false);
    }
  };

  const fetchInvestigators = async () => {
    try {
      const res = await caseAPI.getInvestigators();
      setInvestigators(res.data);
    } catch (err) {
      console.error('Error fetching investigators:', err);
    }
  };

  const handleCreateCase = (transaction) => {
    setSelectedTransaction(transaction);
    setCaseForm({
      title: `High Risk Transaction - $${transaction.amount} from ${transaction.country}`,
      description: `Transaction ID: ${transaction._id}\nAmount: $${transaction.amount}\nCountry: ${transaction.country}\nRisk Score: ${transaction.riskScore}\nUser: ${transaction.customerName || transaction.userId?.name || 'N/A'}`,
      priority: transaction.riskScore >= 70 ? 'High' : 'Medium',
      assignedInvestigator: ''
    });
    setCreateCaseDialog(true);
  };

  const handleSubmitCase = async () => {
    try {
      const response = await caseAPI.createFromTransaction({
        transactionId: selectedTransaction._id,
        title: caseForm.title,
        description: caseForm.description,
        priority: caseForm.priority
      });
      
      console.log('Case creation response:', response);
      console.log('Selected transaction ID:', selectedTransaction._id);
      
      // Add transaction to the set of transactions with cases
      setTransactionsWithCases(prev => {
        const newSet = new Set([...prev, selectedTransaction._id]);
        console.log('Updated transactionsWithCases:', Array.from(newSet));
        return newSet;
      });
      
      // Add the new case to the set of newly created cases
      if (response.data && response.data._id) {
        setNewlyCreatedCases(prev => new Set([...prev, response.data._id]));
        
        // If an investigator was selected, assign them immediately
        if (caseForm.assignedInvestigator) {
          try {
            await caseAPI.assignInvestigator(response.data._id, caseForm.assignedInvestigator);
            const assignedInvestigator = investigators.find(inv => inv._id === caseForm.assignedInvestigator);
            console.log('Investigator assigned immediately:', assignedInvestigator?.name);
          } catch (assignmentError) {
            console.error('Error assigning investigator:', assignmentError);
            // Don't fail the case creation if assignment fails
          }
        }
      }
      
      setCreateCaseDialog(false);
      
      // Update success message based on whether investigator was assigned
      const assignedInvestigator = investigators.find(inv => inv._id === caseForm.assignedInvestigator);
      const successMessage = caseForm.assignedInvestigator 
        ? `Case "${caseForm.title}" created and assigned to ${assignedInvestigator?.name}!`
        : `Case "${caseForm.title}" created successfully! Check the Open Cases tab to assign an investigator.`;
      
      setSnackbar({
        open: true,
        message: successMessage,
        severity: 'success'
      });
      
      // Refresh cases and switch to Open Cases tab
      await fetchCases();
      setActiveTab(1); // Switch to Open Cases tab
    } catch (err) {
      console.error('Error creating case:', err);
      setSnackbar({
        open: true,
        message: err.response?.data?.error || 'Failed to create case',
        severity: 'error'
      });
    }
  };

  const handleCloseCase = async (caseId, resolution) => {
    try {
      await caseAPI.closeCase(caseId, resolution);
      setSnackbar({
        open: true,
        message: 'Case closed successfully!',
        severity: 'success'
      });
      fetchCases();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.error || 'Failed to close case',
        severity: 'error'
      });
    }
  };

  const handleAssignInvestigator = (caseData) => {
    setAssigningCase(caseData);
    setSelectedInvestigator(caseData.assignedTo?._id || '');
  };

  const handleConfirmAssignment = async () => {
    if (!selectedInvestigator || !assigningCase) return;
    
    setAssignmentLoading(true);
    try {
      await caseAPI.assignInvestigator(assigningCase._id, selectedInvestigator);
      setSnackbar({
        open: true,
        message: 'Investigator assigned successfully!',
        severity: 'success'
      });
      setAssigningCase(null);
      setSelectedInvestigator('');
      fetchCases();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.error || 'Failed to assign investigator',
        severity: 'error'
      });
    } finally {
      setAssignmentLoading(false);
    }
  };

  const countryOptions = Array.from(new Set(transactions.map(tx => tx.country).filter(Boolean)));

  // Filtering
  const filteredTransactions = transactions.filter(tx =>
    (countryFilter === 'all' || tx.country === countryFilter) &&
    (tx.amount <= amountFilter)
  );

  // Sorting
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    if (sortBy === 'user') {
      aValue = a.customerName || a.userId?.name || '';
      bValue = b.customerName || b.userId?.name || '';
    }
    if (sortBy === 'timestamp') {
      aValue = new Date(a.timestamp);
      bValue = new Date(b.timestamp);
    }
    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder(field === 'timestamp' ? 'desc' : 'asc');
    }
  };

  const handleAmountChange = (e, value) => {
    setAmountFilter(value);
  };

  const openCases = cases.filter(c => c.status !== 'Closed');
  const closedCases = cases.filter(c => c.status === 'Closed');

  // Helper function to check if a transaction has a case
  const hasCase = (transactionId) => {
    return transactionsWithCases.has(transactionId);
  };

  // Debug logging
  console.log('Current transactionsWithCases:', Array.from(transactionsWithCases));
  console.log('Current transactions:', transactions.map(tx => ({ id: tx._id, riskScore: tx.riskScore })));

  const handleManualCleanup = async () => {
    setCleanupDialog(true);
  };

  const confirmCleanup = async () => {
    setCleanupDialog(false);
    setCleanupLoading(true);
    try {
      console.log('Starting cleanup...');
      const cleanupRes = await transactionAPI.deleteOld(20);
      console.log('Cleanup response:', cleanupRes);
      
      setSnackbar({
        open: true,
        message: cleanupRes.data.deletedCount > 0 
          ? `Cleaned up ${cleanupRes.data.deletedCount} old transactions` 
          : 'No old transactions to clean up',
        severity: 'success'
      });
      
      // Refresh transactions after cleanup
      await fetchTransactions();
    } catch (err) {
      console.error('Error during manual cleanup:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      
      let errorMessage = 'Error during cleanup';
      if (err.response?.status === 403) {
        errorMessage = 'Access denied. Compliance role required.';
      } else if (err.response?.status === 401) {
        errorMessage = 'Authentication required. Please log in again.';
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      setCleanupLoading(false);
    }
  };

  return (
    <Box p={4}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Box>
          <Typography variant="h4" gutterBottom>Compliance Dashboard</Typography>
          <Typography sx={{ mb: 0 }}>Monitor transactions and manage fraud cases. Use the cleanup button to delete old transactions.</Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Current user: {auth.user?.name} ({auth.user?.role}) | 
            Cases created: {transactionsWithCases.size} of {transactions.filter(tx => tx.riskScore >= 40).length} eligible transactions
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Tooltip title="Manual cleanup (keep last 20 transactions)">
            <IconButton 
              onClick={handleManualCleanup} 
              color="secondary" 
              size="large" 
              disabled={cleanupLoading}
              aria-label="Manual cleanup"
            >
              {cleanupLoading ? <CircularProgress size={24} /> : <DeleteSweepIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Refresh transactions">
            <IconButton 
              onClick={fetchTransactions} 
              color="primary" 
              size="large" 
              disabled={loading}
              aria-label="Refresh transactions"
            >
              {loading ? <CircularProgress size={24} /> : <RefreshIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Announcements Section */}
      <Box sx={{ mb: 3 }}>
        <AnnouncementDisplay maxDisplay={2} showBadge={true} />
      </Box>

      {/* Points Section */}
      <Box sx={{ mb: 3 }}>
        <PointsDisplay compact={true} />
      </Box>

      <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab label={`Transactions (${transactions.length})`} />
        <Tab label={`Open Cases (${openCases.length})`} />
        <Tab label={`Closed Cases (${closedCases.length})`} />
      </Tabs>

      {/* Transactions Tab */}
      {activeTab === 0 && (
        <>
          <Box mb={2} display="flex" gap={2} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Country</InputLabel>
              <Select value={countryFilter} label="Country" onChange={e => setCountryFilter(e.target.value)}>
                <MenuItem value="all">All Countries</MenuItem>
                {countryOptions.map(country => (
                  <MenuItem key={country} value={country}>{country}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box flex={1}>
              <Typography gutterBottom>Max Amount: {amountFilter}</Typography>
              <Slider
                value={amountFilter}
                min={0}
                max={maxAmount}
                step={1}
                onChange={handleAmountChange}
                valueLabelDisplay="auto"
                sx={{ width: 250 }}
              />
            </Box>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Sort By</InputLabel>
              <Select value={sortBy} label="Sort By" onChange={e => handleSort(e.target.value)}>
                {sortOptions.map(opt => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Amount</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Country</TableCell>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Risk Score</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <CircularProgress size={32} />
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedTransactions.map(tx => (
                    <TableRow
                      key={tx._id}
                      sx={newTransactionIds.includes(tx._id) ? { backgroundColor: '#d4edda' } : {}}
                    >
                      <TableCell>${tx.amount.toLocaleString()}</TableCell>
                      <TableCell>{tx.customerName || tx.userId?.name || 'N/A'}</TableCell>
                      <TableCell>{tx.country}</TableCell>
                      <TableCell>{new Date(tx.timestamp).toLocaleString()}</TableCell>
                      <TableCell>
                        <Chip
                          label={`${tx.riskScore || 0} - ${getRiskScoreLabel(tx.riskScore || 0)}`}
                          color={getRiskScoreColor(tx.riskScore || 0)}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        {tx.riskScore >= 40 && !hasCase(tx._id) && (
                          <Tooltip title="Create a new fraud case for this transaction">
                            <span>
                              <Button
                                size="small"
                                startIcon={<AddIcon />}
                                onClick={() => handleCreateCase(tx)}
                                variant="outlined"
                                color="warning"
                              >
                                Create Case
                              </Button>
                            </span>
                          </Tooltip>
                        )}
                        {tx.riskScore >= 40 && hasCase(tx._id) && (
                          <Tooltip title="A fraud case has been created for this transaction. Check the Open Cases tab to view details.">
                            <Chip
                              label="Case Created"
                              color="success"
                              size="small"
                              icon={<CheckCircleIcon />}
                            />
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* Open Cases Tab */}
      {activeTab === 1 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Risk Score</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Assigned To</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Assign</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {casesLoading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <CircularProgress size={32} />
                  </TableCell>
                </TableRow>
              ) : openCases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No open cases
                  </TableCell>
                </TableRow>
              ) : (
                openCases.map(c => (
                  <TableRow 
                    key={c._id}
                    sx={newlyCreatedCases.has(c._id) ? { backgroundColor: '#e8f5e8' } : {}}
                  >
                    <TableCell>{c.title}</TableCell>
                    <TableCell>
                      <Chip
                        label={`${c.riskScore} - ${getRiskScoreLabel(c.riskScore)}`}
                        color={getRiskScoreColor(c.riskScore)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={c.status}
                        color={getCaseStatusColor(c.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{c.assignedTo?.name || 'Unassigned'}</TableCell>
                    <TableCell>{new Date(c.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {!c.assignedTo && (
                        <Button
                          size="small"
                          startIcon={<AssignmentIcon />}
                          onClick={() => handleAssignInvestigator(c)}
                          variant="contained"
                          color="primary"
                        >
                          Assign
                        </Button>
                      )}
                      {c.assignedTo && (
                      <Button
                        size="small"
                          startIcon={<AssignmentIcon />}
                          onClick={() => handleAssignInvestigator(c)}
                        variant="outlined"
                          color="secondary"
                      >
                          Reassign
                      </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Closed Cases Tab */}
      {activeTab === 2 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Risk Score</TableCell>
                <TableCell>Closed By</TableCell>
                <TableCell>Closed Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {casesLoading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <CircularProgress size={32} />
                  </TableCell>
                </TableRow>
              ) : closedCases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No closed cases
                  </TableCell>
                </TableRow>
              ) : (
                closedCases.map(c => (
                  <TableRow key={c._id}>
                    <TableCell>{c.title}</TableCell>
                    <TableCell>
                      <Chip
                        label={`${c.riskScore} - ${getRiskScoreLabel(c.riskScore)}`}
                        color={getRiskScoreColor(c.riskScore)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{c.closedBy?.name || 'N/A'}</TableCell>
                    <TableCell>{new Date(c.closedAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        startIcon={<VisibilityIcon />}
                        onClick={() => {/* TODO: Open case details */}}
                        variant="outlined"
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create Case Dialog */}
      <Dialog open={createCaseDialog} onClose={() => setCreateCaseDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Case</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Case Title"
              value={caseForm.title}
              onChange={(e) => setCaseForm({ ...caseForm, title: e.target.value })}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Priority</InputLabel>
              <Select
                value={caseForm.priority}
                label="Priority"
                onChange={(e) => setCaseForm({ ...caseForm, priority: e.target.value })}
              >
                <MenuItem value="Low">Low</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="High">High</MenuItem>
                <MenuItem value="Critical">Critical</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Assign to Investigator (Optional)</InputLabel>
              <Select
                value={caseForm.assignedInvestigator}
                label="Assign to Investigator (Optional)"
                onChange={(e) => setCaseForm({ ...caseForm, assignedInvestigator: e.target.value })}
              >
                <MenuItem value="">
                  <em>No assignment - assign later</em>
                </MenuItem>
                {investigators.map(investigator => (
                  <MenuItem key={investigator._id} value={investigator._id}>
                    {investigator.name} ({investigator.email})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Description"
              value={caseForm.description}
              onChange={(e) => setCaseForm({ ...caseForm, description: e.target.value })}
              multiline
              rows={4}
            />
            {selectedTransaction && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>Transaction Details:</Typography>
                <Typography variant="body2">Amount: ${selectedTransaction.amount.toLocaleString()}</Typography>
                <Typography variant="body2">Country: {selectedTransaction.country}</Typography>
                <Typography variant="body2">Risk Score: {selectedTransaction.riskScore}</Typography>
                <Typography variant="body2">User: {selectedTransaction.customerName || selectedTransaction.userId?.name || 'N/A'}</Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateCaseDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmitCase} variant="contained" color="primary">
            Create Case
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cleanup Confirmation Dialog */}
      <Dialog open={cleanupDialog} onClose={() => setCleanupDialog(false)}>
        <DialogTitle>Confirm Transaction Cleanup</DialogTitle>
        <DialogContent>
          <Typography>
            This will permanently delete all transactions except the last 20 most recent ones. 
            This action cannot be undone.
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Current transactions: {transactions.length}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCleanupDialog(false)}>Cancel</Button>
          <Button onClick={confirmCleanup} variant="contained" color="error">
            Clean Up Transactions
          </Button>
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

      {/* Investigator Assignment Dialog */}
      <Dialog open={!!assigningCase} onClose={() => setAssigningCase(null)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Assign Investigator
          {assigningCase && (
            <Typography variant="subtitle2" color="textSecondary">
              Case: {assigningCase.title}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Select Investigator</InputLabel>
              <Select
                value={selectedInvestigator}
                onChange={(e) => setSelectedInvestigator(e.target.value)}
                label="Select Investigator"
              >
                <MenuItem value="">
                  <em>Select an investigator...</em>
                </MenuItem>
                {investigators.map(investigator => (
                  <MenuItem key={investigator._id} value={investigator._id}>
                    {investigator.name} ({investigator.email})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {investigators.length === 0 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                No investigators available. Please create investigator accounts first.
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssigningCase(null)} disabled={assignmentLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmAssignment} 
            variant="contained"
            disabled={!selectedInvestigator || assignmentLoading}
            startIcon={assignmentLoading ? <CircularProgress size={16} /> : <AssignmentIcon />}
          >
            {assignmentLoading ? 'Assigning...' : 'Assign Investigator'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ComplianceDashboard; 