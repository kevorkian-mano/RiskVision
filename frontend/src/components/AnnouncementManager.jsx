import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem, Chip, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Alert, Snackbar, Tooltip, Card, CardContent, Grid, Switch, FormControlLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Announcement as AnnouncementIcon,
  Schedule as ScheduleIcon,
  PriorityHigh as PriorityHighIcon
} from '@mui/icons-material';
import announcementAPI from '../services/announcementAPI';

const announcementTypes = [
  { value: 'meeting', label: 'Meeting', icon: '📅' },
  { value: 'alert', label: 'Alert', icon: '🚨' },
  { value: 'update', label: 'Update', icon: '🔄' },
  { value: 'reminder', label: 'Reminder', icon: '⏰' },
  { value: 'general', label: 'General', icon: '📢' }
];

const priorityOptions = [
  { value: 'low', label: 'Low', color: 'success' },
  { value: 'medium', label: 'Medium', color: 'info' },
  { value: 'high', label: 'High', color: 'warning' },
  { value: 'urgent', label: 'Urgent', color: 'error' }
];

const targetRoleOptions = [
  { value: 'compliance', label: 'Compliance' },
  { value: 'investigator', label: 'Investigator' },
  { value: 'auditor', label: 'Auditor' },
  { value: 'admin', label: 'Admin' }
];

const AnnouncementManager = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'general',
    priority: 'medium',
    targetRoles: ['compliance', 'investigator', 'auditor'],
    isActive: true,
    expiresAt: ''
  });

  useEffect(() => {
    fetchAnnouncements();
    fetchStats();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const response = await announcementAPI.getAllAnnouncements();
      setAnnouncements(response.data);
    } catch (err) {
      console.error('Error fetching announcements:', err);
      setSnackbar({
        open: true,
        message: 'Error fetching announcements',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await announcementAPI.getStats();
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleCreateAnnouncement = () => {
    setEditingAnnouncement(null);
    setFormData({
      title: '',
      content: '',
      type: 'general',
      priority: 'medium',
      targetRoles: ['compliance', 'investigator', 'auditor'],
      isActive: true,
      expiresAt: ''
    });
    setDialogOpen(true);
  };

  const handleEditAnnouncement = (announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      priority: announcement.priority,
      targetRoles: announcement.targetRoles,
      isActive: announcement.isActive,
      expiresAt: announcement.expiresAt ? new Date(announcement.expiresAt).toISOString().slice(0, 16) : ''
    });
    setDialogOpen(true);
  };

  const handleDeleteAnnouncement = (announcement) => {
    setAnnouncementToDelete(announcement);
    setDeleteDialog(true);
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      const submitData = {
        ...formData,
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null
      };

      if (editingAnnouncement) {
        await announcementAPI.updateAnnouncement(editingAnnouncement._id, submitData);
        setSnackbar({
          open: true,
          message: 'Announcement updated successfully',
          severity: 'success'
        });
      } else {
        await announcementAPI.createAnnouncement(submitData);
        setSnackbar({
          open: true,
          message: 'Announcement created successfully',
          severity: 'success'
        });
      }

      setDialogOpen(false);
      fetchAnnouncements();
      fetchStats();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.error || 'Error saving announcement',
        severity: 'error'
      });
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await announcementAPI.deleteAnnouncement(announcementToDelete._id);
      setSnackbar({
        open: true,
        message: 'Announcement deleted successfully',
        severity: 'success'
      });
      setDeleteDialog(false);
      setAnnouncementToDelete(null);
      fetchAnnouncements();
      fetchStats();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.error || 'Error deleting announcement',
        severity: 'error'
      });
    }
  };

  const getPriorityColor = (priority) => {
    const option = priorityOptions.find(opt => opt.value === priority);
    return option ? option.color : 'default';
  };

  const getTypeIcon = (type) => {
    const option = announcementTypes.find(opt => opt.value === type);
    return option ? option.icon : '📢';
  };

  return (
    <Box>
      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Announcements
              </Typography>
              <Typography variant="h4">
                {stats.totalAnnouncements || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active Announcements
              </Typography>
              <Typography variant="h4" color="success.main">
                {stats.activeAnnouncements || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                High Priority
              </Typography>
              <Typography variant="h4" color="warning.main">
                {stats.highPriorityAnnouncements || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Urgent
              </Typography>
              <Typography variant="h4" color="error.main">
                {stats.urgentAnnouncements || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Announcement Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateAnnouncement}
        >
          Create Announcement
        </Button>
      </Box>

      {/* Announcements Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Target Roles</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : announcements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No announcements found
                </TableCell>
              </TableRow>
            ) : (
              announcements.map(announcement => (
                <TableRow key={announcement._id}>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <Typography sx={{ mr: 1 }}>{getTypeIcon(announcement.type)}</Typography>
                      <Typography variant="body2">{announcement.type}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2">{announcement.title}</Typography>
                    <Typography variant="caption" color="textSecondary">
                      {announcement.content.substring(0, 50)}...
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={announcement.priority}
                      color={getPriorityColor(announcement.priority)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={0.5} flexWrap="wrap">
                      {announcement.targetRoles.map(role => (
                        <Chip
                          key={role}
                          label={role}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={announcement.isActive ? 'Active' : 'Inactive'}
                      color={announcement.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(announcement.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Edit Announcement">
                      <IconButton
                        onClick={() => handleEditAnnouncement(announcement)}
                        color="primary"
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Announcement">
                      <IconButton
                        onClick={() => handleDeleteAnnouncement(announcement)}
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Title"
              value={formData.title}
              onChange={(e) => handleFormChange('title', e.target.value)}
              margin="normal"
              required
            />
            
            <TextField
              fullWidth
              label="Content"
              value={formData.content}
              onChange={(e) => handleFormChange('content', e.target.value)}
              margin="normal"
              multiline
              rows={4}
              required
            />
            
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={formData.type}
                    onChange={(e) => handleFormChange('type', e.target.value)}
                    label="Type"
                  >
                    {announcementTypes.map(type => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={formData.priority}
                    onChange={(e) => handleFormChange('priority', e.target.value)}
                    label="Priority"
                  >
                    {priorityOptions.map(priority => (
                      <MenuItem key={priority.value} value={priority.value}>
                        {priority.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            
            <FormControl fullWidth margin="normal">
              <InputLabel>Target Roles</InputLabel>
              <Select
                multiple
                value={formData.targetRoles}
                onChange={(e) => handleFormChange('targetRoles', e.target.value)}
                label="Target Roles"
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
                {targetRoleOptions.map(role => (
                  <MenuItem key={role.value} value={role.value}>
                    {role.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              label="Expires At (Optional)"
              type="datetime-local"
              value={formData.expiresAt}
              onChange={(e) => handleFormChange('expiresAt', e.target.value)}
              margin="normal"
              InputLabelProps={{ shrink: true }}
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={(e) => handleFormChange('isActive', e.target.checked)}
                />
              }
              label="Active"
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={!formData.title || !formData.content}
          >
            {editingAnnouncement ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the announcement "{announcementToDelete?.title}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Delete
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

export default AnnouncementManager; 