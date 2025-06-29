import React, { useEffect, useState } from 'react';
import {
  Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  TableSortLabel, Select, MenuItem, FormControl, InputLabel, CircularProgress, IconButton,
  Tabs, Tab, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Alert, Snackbar, Chip, Tooltip
} from '@mui/material';
import { authAPI, ruleAPI } from '../services/api.jsx';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import EmailIcon from '@mui/icons-material/Email';
import { useAuth } from '../contexts/AuthContext.jsx';

const roleOptions = ['admin', 'compliance', 'investigator', 'auditor'];

// Rule condition templates for easier rule creation
const ruleTemplates = [
  { name: 'High Amount Transaction', condition: 'amount > threshold', description: 'Detect transactions above a certain amount' },
  { name: 'Suspicious Country', condition: 'country in suspicious_countries', description: 'Detect transactions from high-risk countries' },
  { name: 'Late Night Transaction', condition: 'hour >= 23 || hour <= 5', description: 'Detect transactions during late night hours' },
  { name: 'Micro Transaction', condition: 'amount < threshold', description: 'Detect very small transactions (potential money laundering)' },
  { name: 'Rapid Succession', condition: 'transactions_in_last_hour > threshold', description: 'Detect multiple transactions in short time' }
];

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rulesLoading, setRulesLoading] = useState(true);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [roleFilter, setRoleFilter] = useState('all');
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [roleUpdate, setRoleUpdate] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const { user: currentUser } = useAuth();

  // Rule management state
  const [ruleDialog, setRuleDialog] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [ruleForm, setRuleForm] = useState({
    name: '',
    condition: '',
    threshold: '',
    description: ''
  });
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // User deletion state
  const [deleteUserDialog, setDeleteUserDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // User creation state
  const [createUserDialog, setCreateUserDialog] = useState(false);
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'investigator'
  });
  const [createUserLoading, setCreateUserLoading] = useState(false);

  // Email state
  const [emailDialog, setEmailDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [emailForm, setEmailForm] = useState({
    subject: '',
    message: ''
  });
  const [emailLoading, setEmailLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchRules();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await authAPI.getAllUsers();
      setUsers(res.data);
    } catch (err) {
      console.error('Error fetching users:', err);
      setSnackbar({
        open: true,
        message: 'Error fetching users',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRules = async () => {
    setRulesLoading(true);
    try {
      const res = await ruleAPI.getAll();
      setRules(res.data);
    } catch (err) {
      console.error('Error fetching rules:', err);
      setSnackbar({
        open: true,
        message: 'Error fetching rules',
        severity: 'error'
      });
    } finally {
      setRulesLoading(false);
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleRoleFilter = (e) => {
    setRoleFilter(e.target.value);
  };

  const handleEditRole = (userId, currentRole) => {
    setEditingRoleId(userId);
    setRoleUpdate(currentRole);
  };

  const handleRoleChange = (e) => {
    setRoleUpdate(e.target.value);
  };

  const handleRoleSave = async (userId) => {
    try {
      await authAPI.updateUserRole(userId, roleUpdate);
      setEditingRoleId(null);
      fetchUsers();
      setSnackbar({
        open: true,
        message: 'User role updated successfully',
        severity: 'success'
      });
    } catch (err) {
      if (err.response?.data?.error) {
        setSnackbar({
          open: true,
          message: err.response.data.error,
          severity: 'error'
        });
      }
      setEditingRoleId(null);
    }
  };

  // Rule management functions
  const handleCreateRule = () => {
    setEditingRule(null);
    setRuleForm({
      name: '',
      condition: '',
      threshold: '',
      description: ''
    });
    setRuleDialog(true);
  };

  const handleEditRule = (rule) => {
    setEditingRule(rule);
    setRuleForm({
      name: rule.name,
      condition: rule.condition,
      threshold: rule.threshold.toString(),
      description: rule.description || ''
    });
    setRuleDialog(true);
  };

  const handleDeleteRule = (rule) => {
    setRuleToDelete(rule);
    setDeleteDialog(true);
  };

  const handleRuleFormChange = (field, value) => {
    setRuleForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRuleTemplateSelect = (template) => {
    setRuleForm(prev => ({
      ...prev,
      name: template.name,
      condition: template.condition,
      description: template.description
    }));
  };

  const handleRuleSubmit = async () => {
    try {
      const ruleData = {
        ...ruleForm,
        threshold: parseFloat(ruleForm.threshold)
      };

      if (editingRule) {
        await ruleAPI.update(editingRule._id, ruleData);
        setSnackbar({
          open: true,
          message: 'Rule updated successfully',
          severity: 'success'
        });
      } else {
        await ruleAPI.create(ruleData);
        setSnackbar({
          open: true,
          message: 'Rule created successfully',
          severity: 'success'
        });
      }

      setRuleDialog(false);
      fetchRules();
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Error saving rule';
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await ruleAPI.delete(ruleToDelete._id);
      setSnackbar({
        open: true,
        message: 'Rule deleted successfully',
        severity: 'success'
      });
      setDeleteDialog(false);
      setRuleToDelete(null);
      fetchRules();
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Error deleting rule';
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    }
  };

  // User deletion functions
  const handleDeleteUser = (user) => {
    setUserToDelete(user);
    setDeleteUserDialog(true);
  };

  const handleConfirmDeleteUser = async () => {
    try {
      await authAPI.deleteUser(userToDelete._id);
      setSnackbar({
        open: true,
        message: `User "${userToDelete.name}" deleted successfully`,
        severity: 'success'
      });
      setDeleteUserDialog(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Error deleting user';
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    }
  };

  // User creation functions
  const handleCreateUser = () => {
    setUserForm({
      name: '',
      email: '',
      password: '',
      role: 'investigator'
    });
    setCreateUserDialog(true);
  };

  const handleUserFormChange = (field, value) => {
    setUserForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleUserSubmit = async () => {
    if (!userForm.name || !userForm.email || !userForm.password || !userForm.role) {
      setSnackbar({
        open: true,
        message: 'Please fill in all required fields',
        severity: 'error'
      });
      return;
    }

    setCreateUserLoading(true);
    try {
      const response = await authAPI.register(userForm);
      setSnackbar({
        open: true,
        message: `User "${userForm.name}" created successfully! ${response.data.emailSent ? 'Welcome email sent.' : 'Email could not be sent.'}`,
        severity: 'success'
      });
      setCreateUserDialog(false);
      setUserForm({
        name: '',
        email: '',
        password: '',
        role: 'investigator'
      });
      fetchUsers();
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Error creating user';
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      setCreateUserLoading(false);
    }
  };

  // Email functions
  const handleSendEmail = (user) => {
    setSelectedUser(user);
    setEmailForm({
      subject: '',
      message: ''
    });
    setEmailDialog(true);
  };

  const handleEmailFormChange = (field, value) => {
    setEmailForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEmailSubmit = async () => {
    if (!emailForm.subject || !emailForm.message) {
      setSnackbar({
        open: true,
        message: 'Please fill in both subject and message',
        severity: 'error'
      });
      return;
    }

    setEmailLoading(true);
    try {
      const response = await authAPI.sendEmail({
        userId: selectedUser._id,
        subject: emailForm.subject,
        message: emailForm.message
      });
      setSnackbar({
        open: true,
        message: response.data.message,
        severity: 'success'
      });
      setEmailDialog(false);
      setEmailForm({
        subject: '',
        message: ''
      });
      setSelectedUser(null);
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Error sending email';
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      setEmailLoading(false);
    }
  };

  // Sorting and filtering logic
  const filteredUsers = users.filter(user =>
    roleFilter === 'all' ? true : user.role === roleFilter
  );

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let aValue = a[sortBy] || '';
    let bValue = b[sortBy] || '';
    if (sortBy === 'lastActive') {
      aValue = a.lastActive ? new Date(a.lastActive) : new Date(0);
      bValue = b.lastActive ? new Date(b.lastActive) : new Date(0);
    } else {
      aValue = aValue.toString().toLowerCase();
      bValue = bValue.toString().toLowerCase();
    }
    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Sorting logic for rules
  const sortedRules = [...rules].sort((a, b) => {
    const aValue = a.name.toLowerCase();
    const bValue = b.name.toLowerCase();
    if (aValue < bValue) return -1;
    if (aValue > bValue) return 1;
    return 0;
  });

  return (
    <Box p={4}>
      <Typography variant="h4" gutterBottom>Admin Dashboard</Typography>
      <Typography sx={{ mb: 3 }}>Manage users, rules, and system configuration.</Typography>

      <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="User Management" />
        <Tab label="Risk Rules" />
        <Tab label="Email Communication" />
      </Tabs>

      {/* User Management Tab */}
      {activeTab === 0 && (
        <Box>
          <Box mb={2} display="flex" justifyContent="space-between" alignItems="center">
        <FormControl size="small">
          <InputLabel>Filter by Role</InputLabel>
          <Select
            value={roleFilter}
            label="Filter by Role"
            onChange={handleRoleFilter}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="all">All</MenuItem>
            {roleOptions.map(role => (
              <MenuItem key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</MenuItem>
            ))}
          </Select>
        </FormControl>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateUser}
            >
              Create New User
            </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={sortBy === 'name'}
                  direction={sortBy === 'name' ? sortOrder : 'asc'}
                  onClick={() => handleSort('name')}
                >
                  Name
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === 'email'}
                  direction={sortBy === 'email' ? sortOrder : 'asc'}
                  onClick={() => handleSort('email')}
                >
                  Email
                </TableSortLabel>
              </TableCell>
              <TableCell>Role</TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === 'lastActive'}
                  direction={sortBy === 'lastActive' ? sortOrder : 'asc'}
                  onClick={() => handleSort('lastActive')}
                >
                  Last Active
                </TableSortLabel>
              </TableCell>
              <TableCell>Switch Role</TableCell>
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
              sortedUsers.map(user => (
                <TableRow key={user._id}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip 
                          label={user.role} 
                          color={user.role === 'admin' ? 'error' : 'default'}
                          size="small"
                        />
                      </TableCell>
                  <TableCell>{user.lastActive ? new Date(user.lastActive).toLocaleString() : 'N/A'}</TableCell>
                  <TableCell>
                    {editingRoleId === user._id ? (
                      <>
                        <Select
                          value={roleUpdate}
                          onChange={handleRoleChange}
                          size="small"
                          sx={{ minWidth: 120 }}
                          disabled={user._id === currentUser._id}
                        >
                          {roleOptions.map(role => (
                            <MenuItem key={role} value={role}>{role}</MenuItem>
                          ))}
                        </Select>
                        <IconButton
                          onClick={() => handleRoleSave(user._id)}
                          color="primary"
                          size="small"
                          disabled={user._id === currentUser._id}
                        >
                          <EditIcon />
                        </IconButton>
                      </>
                    ) : (
                      <>
                        <Typography component="span" sx={{ mr: 1 }}>{user.role}</Typography>
                        <IconButton
                          onClick={() => handleEditRole(user._id, user.role)}
                          size="small"
                          disabled={user._id === currentUser._id}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </>
                    )}
                  </TableCell>
                      <TableCell>
                        <Tooltip title="Send Email">
                          <IconButton
                            onClick={() => handleSendEmail(user)}
                            color="primary"
                            size="small"
                            sx={{ mr: 1 }}
                          >
                            <EmailIcon />
                          </IconButton>
                        </Tooltip>
                        {user.role !== 'admin' && user._id !== currentUser._id ? (
                          <Tooltip title="Delete User">
                            <IconButton
                              onClick={() => handleDeleteUser(user)}
                              color="error"
                              size="small"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Typography variant="caption" color="textSecondary">
                            {user.role === 'admin' ? 'Admin' : 'Current User'}
                          </Typography>
                        )}
                      </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
        </Box>
      )}

      {/* Risk Rules Tab */}
      {activeTab === 1 && (
        <Box>
          <Box mb={2} display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Risk Detection Rules</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateRule}
            >
              Create New Rule
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Rule Name</TableCell>
                  <TableCell>Condition</TableCell>
                  <TableCell>Threshold</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rulesLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <CircularProgress size={32} />
                    </TableCell>
                  </TableRow>
                ) : sortedRules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography color="textSecondary">No rules found. Create your first rule to get started.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedRules.map(rule => (
                    <TableRow key={rule._id}>
                      <TableCell>
                        <Typography fontWeight="medium">{rule.name}</Typography>
                      </TableCell>
                      <TableCell>
                        <code style={{ backgroundColor: '#f5f5f5', padding: '2px 6px', borderRadius: '4px' }}>
                          {rule.condition}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Chip label={rule.threshold} size="small" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="textSecondary">
                          {rule.description || 'No description'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {new Date(rule.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Edit Rule">
                          <IconButton
                            onClick={() => handleEditRule(rule)}
                            color="primary"
                            size="small"
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Rule">
                          <IconButton
                            onClick={() => handleDeleteRule(rule)}
                            color="error"
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Email Communication Tab */}
      {activeTab === 2 && (
        <Box>
          <Box mb={2} display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">User Communication</Typography>
            <Typography variant="body2" color="textSecondary">
              Send emails to users directly from the dashboard
            </Typography>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <TableSortLabel
                      active={sortBy === 'name'}
                      direction={sortBy === 'name' ? sortOrder : 'asc'}
                      onClick={() => handleSort('name')}
                    >
                      Name
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortBy === 'email'}
                      direction={sortBy === 'email' ? sortOrder : 'asc'}
                      onClick={() => handleSort('email')}
                    >
                      Email Address
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortBy === 'lastActive'}
                      direction={sortBy === 'lastActive' ? sortOrder : 'asc'}
                      onClick={() => handleSort('lastActive')}
                    >
                      Last Active
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Contact</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <CircularProgress size={32} />
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedUsers.map(user => (
                    <TableRow key={user._id}>
                      <TableCell>
                        <Typography fontWeight="medium">{user.name}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {user.email}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={user.role} 
                          color={user.role === 'admin' ? 'error' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {user.lastActive ? new Date(user.lastActive).toLocaleString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outlined"
                          startIcon={<EmailIcon />}
                          onClick={() => handleSendEmail(user)}
                          size="small"
                          color="primary"
                        >
                          Send Email
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Rule Creation/Edit Dialog */}
      <Dialog open={ruleDialog} onClose={() => setRuleDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingRule ? 'Edit Risk Rule' : 'Create New Risk Rule'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Rule Templates</Typography>
            <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {ruleTemplates.map((template, index) => (
                <Chip
                  key={index}
                  label={template.name}
                  onClick={() => handleRuleTemplateSelect(template)}
                  variant="outlined"
                  clickable
                />
              ))}
            </Box>

            <TextField
              fullWidth
              label="Rule Name"
              value={ruleForm.name}
              onChange={(e) => handleRuleFormChange('name', e.target.value)}
              margin="normal"
              required
            />
            
            <TextField
              fullWidth
              label="Condition"
              value={ruleForm.condition}
              onChange={(e) => handleRuleFormChange('condition', e.target.value)}
              margin="normal"
              required
              helperText="JavaScript-like condition (e.g., amount > 10000, country === 'Nigeria')"
            />
            
            <TextField
              fullWidth
              label="Threshold"
              type="number"
              value={ruleForm.threshold}
              onChange={(e) => handleRuleFormChange('threshold', e.target.value)}
              margin="normal"
              required
              helperText="Numeric threshold value for the condition"
            />
            
            <TextField
              fullWidth
              label="Description"
              value={ruleForm.description}
              onChange={(e) => handleRuleFormChange('description', e.target.value)}
              margin="normal"
              multiline
              rows={3}
              helperText="Optional description of what this rule detects"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRuleDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleRuleSubmit} 
            variant="contained"
            disabled={!ruleForm.name || !ruleForm.condition || !ruleForm.threshold}
          >
            {editingRule ? 'Update Rule' : 'Create Rule'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the rule "{ruleToDelete?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* User Delete Confirmation Dialog */}
      <Dialog open={deleteUserDialog} onClose={() => setDeleteUserDialog(false)}>
        <DialogTitle>Confirm Delete User</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the user "{userToDelete?.name}" ({userToDelete?.email})? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteUserDialog(false)}>Cancel</Button>
          <Button onClick={handleConfirmDeleteUser} color="error" variant="contained">
            Delete User
          </Button>
        </DialogActions>
      </Dialog>

      {/* User Creation Dialog */}
      <Dialog open={createUserDialog} onClose={() => setCreateUserDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New User</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Full Name"
              value={userForm.name}
              onChange={(e) => handleUserFormChange('name', e.target.value)}
              margin="normal"
              required
              helperText="Enter the user's full name"
            />
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={userForm.email}
              onChange={(e) => handleUserFormChange('email', e.target.value)}
              margin="normal"
              required
              helperText="Enter a valid email address"
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={userForm.password}
              onChange={(e) => handleUserFormChange('password', e.target.value)}
              margin="normal"
              required
              helperText="Minimum 6 characters"
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Role</InputLabel>
              <Select
                value={userForm.role}
                onChange={(e) => handleUserFormChange('role', e.target.value)}
                label="Role"
              >
                <MenuItem value="admin">Admin - Full system access</MenuItem>
                <MenuItem value="compliance">Compliance - Monitor transactions and create cases</MenuItem>
                <MenuItem value="investigator">Investigator - Handle fraud cases and investigations</MenuItem>
                <MenuItem value="auditor">Auditor - View system logs and audit trails</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateUserDialog(false)} disabled={createUserLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleUserSubmit} 
            variant="contained"
            disabled={!userForm.name || !userForm.email || !userForm.password || !userForm.role || createUserLoading}
            startIcon={createUserLoading ? <CircularProgress size={16} /> : <AddIcon />}
          >
            {createUserLoading ? 'Creating...' : 'Create User'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Email Dialog */}
      <Dialog open={emailDialog} onClose={() => setEmailDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Send Email to {selectedUser?.name}
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            {selectedUser?.email}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Subject"
              value={emailForm.subject}
              onChange={(e) => handleEmailFormChange('subject', e.target.value)}
              margin="normal"
              required
              placeholder="Enter email subject..."
            />
            <TextField
              fullWidth
              label="Message"
              value={emailForm.message}
              onChange={(e) => handleEmailFormChange('message', e.target.value)}
              margin="normal"
              multiline
              rows={6}
              required
              placeholder="Enter your message here..."
              helperText="Your message will be sent as an administrative communication from the RiskVision system."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEmailDialog(false)} disabled={emailLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleEmailSubmit} 
            variant="contained"
            disabled={!emailForm.subject || !emailForm.message || emailLoading}
            startIcon={emailLoading ? <CircularProgress size={16} /> : <EmailIcon />}
          >
            {emailLoading ? 'Sending...' : 'Send Email'}
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
    </Box>
  );
};

export default AdminDashboard; 