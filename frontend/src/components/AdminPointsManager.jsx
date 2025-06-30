import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Paper, Button, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, 
  CircularProgress, Alert, Snackbar, Chip, IconButton, Tooltip, Grid,
  TableSortLabel, FormControlLabel, Switch, Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as VisibilityIcon,
  EmojiEvents as TrophyIcon,
  TrendingUp as TrendingUpIcon,
  History as HistoryIcon,
  Star as StarIcon
} from '@mui/icons-material';
import pointsAPI from '../services/pointsAPI';

const AdminPointsManager = () => {
  const [usersPoints, setUsersPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('totalPoints');
  const [sortOrder, setSortOrder] = useState('desc');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showInactive, setShowInactive] = useState(false);
  
  // Bonus points dialog
  const [bonusDialog, setBonusDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [bonusForm, setBonusForm] = useState({
    points: '',
    reason: ''
  });
  const [bonusLoading, setBonusLoading] = useState(false);
  
  // Points history dialog
  const [historyDialog, setHistoryDialog] = useState(false);
  const [historyUser, setHistoryUser] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  
  // Notifications
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchUsersPoints();
  }, []);

  const fetchUsersPoints = async () => {
    try {
      setLoading(true);
      const response = await pointsAPI.getAllUsersPoints();
      setUsersPoints(response.data);
    } catch (err) {
      console.error('Error fetching users points:', err);
      setError('Failed to load users points data');
    } finally {
      setLoading(false);
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

  const handleAwardBonus = (user) => {
    setSelectedUser(user);
    setBonusForm({ points: '', reason: '' });
    setBonusDialog(true);
  };

  const handleBonusFormChange = (field, value) => {
    setBonusForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAwardBonusSubmit = async () => {
    if (!bonusForm.points || !bonusForm.reason) {
      setSnackbar({
        open: true,
        message: 'Please fill in all fields',
        severity: 'error'
      });
      return;
    }

    const points = parseInt(bonusForm.points);
    if (isNaN(points) || points <= 0) {
      setSnackbar({
        open: true,
        message: 'Points must be a positive number',
        severity: 'error'
      });
      return;
    }

    setBonusLoading(true);
    try {
      await pointsAPI.awardBonusPoints({
        userId: selectedUser.userId,
        points: points,
        reason: bonusForm.reason
      });

      setSnackbar({
        open: true,
        message: `Successfully awarded ${points} bonus points to ${selectedUser.name}`,
        severity: 'success'
      });

      setBonusDialog(false);
      fetchUsersPoints(); // Refresh the data
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.error || 'Failed to award bonus points',
        severity: 'error'
      });
    } finally {
      setBonusLoading(false);
    }
  };

  const handleViewHistory = async (user) => {
    setHistoryUser(user);
    setHistoryDialog(true);
    setHistoryLoading(true);
    
    try {
      const response = await pointsAPI.getPointsHistory(user.userId);
      setHistoryData(response.data);
    } catch (err) {
      console.error('Error fetching points history:', err);
      setSnackbar({
        open: true,
        message: 'Failed to load points history',
        severity: 'error'
      });
    } finally {
      setHistoryLoading(false);
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'error';
      case 'compliance': return 'primary';
      case 'investigator': return 'warning';
      case 'auditor': return 'info';
      default: return 'default';
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'CREATE_CASE': return 'primary';
      case 'CASE_CLOSED': return 'success';
      case 'MAKE_DECISION': return 'warning';
      case 'CLOSE_CASE': return 'info';
      case 'BONUS_POINTS': return 'secondary';
      default: return 'default';
    }
  };

  // Filter and sort users
  const filteredUsers = usersPoints
    .filter(user => {
      if (roleFilter !== 'all' && user.role !== roleFilter) return false;
      if (!showInactive && !user.lastActive) return false;
      return true;
    })
    .sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'lastActive') {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header with stats */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Points Management Dashboard
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="primary">
                  {usersPoints.length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Users
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="success.main">
                  {usersPoints.reduce((sum, user) => sum + user.totalPoints, 0)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Points Awarded
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="warning.main">
                  {Math.round(usersPoints.reduce((sum, user) => sum + user.totalPoints, 0) / usersPoints.length)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Average Points per User
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="info.main">
                  {usersPoints.filter(user => user.totalPoints > 0).length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Users with Points
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Filters */}
      <Box display="flex" gap={2} mb={3} alignItems="center">
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Filter by Role</InputLabel>
          <Select
            value={roleFilter}
            label="Filter by Role"
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <MenuItem value="all">All Roles</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="compliance">Compliance</MenuItem>
            <MenuItem value="investigator">Investigator</MenuItem>
            <MenuItem value="auditor">Auditor</MenuItem>
          </Select>
        </FormControl>
        
        <FormControlLabel
          control={
            <Switch
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
            />
          }
          label="Show Inactive Users"
        />
        
        <Button
          variant="outlined"
          startIcon={<TrophyIcon />}
          onClick={fetchUsersPoints}
        >
          Refresh
        </Button>
      </Box>

      {/* Users Points Table */}
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
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === 'totalPoints'}
                  direction={sortBy === 'totalPoints' ? sortOrder : 'asc'}
                  onClick={() => handleSort('totalPoints')}
                >
                  Total Points
                </TableSortLabel>
              </TableCell>
              <TableCell>Recent Activity</TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === 'lastActive'}
                  direction={sortBy === 'lastActive' ? sortOrder : 'asc'}
                  onClick={() => handleSort('lastActive')}
                >
                  Last Active
                </TableSortLabel>
              </TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.map(user => (
              <TableRow key={user.userId}>
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
                    color={getRoleColor(user.role)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="h6" color="primary" fontWeight="bold">
                      {user.totalPoints}
                    </Typography>
                    <TrophyIcon color="primary" fontSize="small" />
                  </Box>
                </TableCell>
                <TableCell>
                  <Box>
                    {user.recentActivity?.slice(0, 2).map((activity, index) => (
                      <Chip
                        key={index}
                        label={`${activity.action.replace('_', ' ')} (+${activity.points})`}
                        color={getActionColor(activity.action)}
                        size="small"
                        variant="outlined"
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))}
                  </Box>
                </TableCell>
                <TableCell>
                  {user.lastActive ? (
                    <Typography variant="body2" color="textSecondary">
                      {new Date(user.lastActive).toLocaleDateString()}
                    </Typography>
                  ) : (
                    <Chip label="Inactive" color="default" size="small" />
                  )}
                </TableCell>
                <TableCell>
                  <Box display="flex" gap={1}>
                    <Tooltip title="View Points History">
                      <IconButton
                        size="small"
                        onClick={() => handleViewHistory(user)}
                        color="primary"
                      >
                        <HistoryIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Award Bonus Points">
                      <IconButton
                        size="small"
                        onClick={() => handleAwardBonus(user)}
                        color="secondary"
                      >
                        <AddIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Bonus Points Dialog */}
      <Dialog open={bonusDialog} onClose={() => setBonusDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Award Bonus Points
          {selectedUser && (
            <Typography variant="subtitle2" color="textSecondary">
              To: {selectedUser.name} ({selectedUser.role})
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Points to Award"
              type="number"
              value={bonusForm.points}
              onChange={(e) => handleBonusFormChange('points', e.target.value)}
              margin="normal"
              required
              helperText="Enter the number of bonus points to award"
            />
            <TextField
              fullWidth
              label="Reason for Bonus"
              value={bonusForm.reason}
              onChange={(e) => handleBonusFormChange('reason', e.target.value)}
              margin="normal"
              required
              multiline
              rows={3}
              helperText="Explain why these bonus points are being awarded"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBonusDialog(false)} disabled={bonusLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleAwardBonusSubmit}
            variant="contained"
            color="secondary"
            disabled={bonusLoading || !bonusForm.points || !bonusForm.reason}
          >
            {bonusLoading ? 'Awarding...' : 'Award Bonus Points'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Points History Dialog */}
      <Dialog open={historyDialog} onClose={() => setHistoryDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Points History
          {historyUser && (
            <Typography variant="subtitle2" color="textSecondary">
              {historyUser.name} ({historyUser.role}) - Total: {historyUser.totalPoints} points
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {historyLoading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : historyData ? (
            <Box sx={{ mt: 2 }}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Action</TableCell>
                      <TableCell>Points</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Awarded By</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {historyData.history.map((entry, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {new Date(entry.earnedAt).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={entry.action.replace('_', ' ')}
                            color={getActionColor(entry.action)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold" color="primary">
                            +{entry.points}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {entry.description}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {entry.awardedByName ? (
                            <Typography variant="body2" color="textSecondary">
                              {entry.awardedByName}
                            </Typography>
                          ) : (
                            <Typography variant="body2" color="textSecondary">
                              System
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryDialog(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
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

export default AdminPointsManager; 