import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Chip, IconButton, Collapse,
  Alert, Snackbar, Badge, Tooltip, Dialog, DialogTitle, DialogContent,
  DialogActions, Button
} from '@mui/material';
import {
  Announcement as AnnouncementIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Close as CloseIcon,
  Schedule as ScheduleIcon,
  PriorityHigh as PriorityHighIcon
} from '@mui/icons-material';
import announcementAPI from '../services/announcementAPI';

const announcementTypes = {
  meeting: { icon: '📅', label: 'Meeting' },
  alert: { icon: '🚨', label: 'Alert' },
  update: { icon: '🔄', label: 'Update' },
  reminder: { icon: '⏰', label: 'Reminder' },
  general: { icon: '📢', label: 'General' }
};

const priorityColors = {
  low: 'success',
  medium: 'info',
  high: 'warning',
  urgent: 'error'
};

const AnnouncementDisplay = ({ maxDisplay = 3, showBadge = true }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [expandedAnnouncements, setExpandedAnnouncements] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const response = await announcementAPI.getAnnouncements();
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

  const handleToggleExpand = (announcementId) => {
    setExpandedAnnouncements(prev => {
      const newSet = new Set(prev);
      if (newSet.has(announcementId)) {
        newSet.delete(announcementId);
      } else {
        newSet.add(announcementId);
      }
      return newSet;
    });
  };

  const handleMarkAsRead = async (announcementId) => {
    try {
      await announcementAPI.markAsRead(announcementId);
      // Refresh announcements to update read status
      fetchAnnouncements();
    } catch (err) {
      console.error('Error marking announcement as read:', err);
    }
  };

  const getTypeInfo = (type) => {
    return announcementTypes[type] || { icon: '📢', label: 'General' };
  };

  const isExpired = (announcement) => {
    if (!announcement.expiresAt) return false;
    return new Date(announcement.expiresAt) < new Date();
  };

  const activeAnnouncements = announcements.filter(announcement => 
    announcement.isActive && !isExpired(announcement)
  );

  const displayedAnnouncements = activeAnnouncements.slice(0, maxDisplay);
  const unreadCount = activeAnnouncements.filter(announcement => 
    !announcement.readBy || announcement.readBy.length === 0
  ).length;

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography>Loading announcements...</Typography>
        </CardContent>
      </Card>
    );
  }

  if (activeAnnouncements.length === 0) {
    return null; // Don't show anything if no announcements
  }

  return (
    <Box>
      {/* Announcements Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Box display="flex" alignItems="center">
          {showBadge && unreadCount > 0 ? (
            <Badge badgeContent={unreadCount} color="error">
              <AnnouncementIcon color="primary" />
            </Badge>
          ) : (
            <AnnouncementIcon color="primary" />
          )}
          <Typography variant="h6" sx={{ ml: 1 }}>
            Announcements
          </Typography>
        </Box>
        {activeAnnouncements.length > maxDisplay && (
          <Typography variant="body2" color="textSecondary">
            Showing {maxDisplay} of {activeAnnouncements.length}
          </Typography>
        )}
      </Box>

      {/* Announcements List */}
      <Box>
        {displayedAnnouncements.map((announcement) => {
          const typeInfo = getTypeInfo(announcement.type);
          const isExpanded = expandedAnnouncements.has(announcement._id);
          const isUnread = !announcement.readBy || announcement.readBy.length === 0;

          return (
            <Card 
              key={announcement._id} 
              sx={{ 
                mb: 2,
                border: isUnread ? '2px solid #1976d2' : '1px solid #e0e0e0',
                backgroundColor: isUnread ? '#f3f8ff' : 'white'
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="flex-start" justifyContent="space-between">
                  <Box flex={1}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <Typography sx={{ mr: 1 }}>{typeInfo.icon}</Typography>
                      <Typography variant="subtitle1" fontWeight="medium">
                        {announcement.title}
                      </Typography>
                      {isUnread && (
                        <Chip 
                          label="New" 
                          size="small" 
                          color="primary" 
                          sx={{ ml: 1 }}
                        />
                      )}
                    </Box>
                    
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Chip
                        label={announcement.priority}
                        color={priorityColors[announcement.priority]}
                        size="small"
                        variant="outlined"
                      />
                      <Typography variant="caption" color="textSecondary">
                        by {announcement.createdBy?.name}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {new Date(announcement.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>

                    <Collapse in={isExpanded}>
                      <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
                        {announcement.content}
                      </Typography>
                    </Collapse>

                    {!isExpanded && (
                      <Typography 
                        variant="body2" 
                        color="textSecondary"
                        sx={{ 
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}
                      >
                        {announcement.content}
                      </Typography>
                    )}
                  </Box>

                  <Box display="flex" alignItems="center" gap={0.5}>
                    <Tooltip title={isExpanded ? "Show less" : "Show more"}>
                      <IconButton
                        size="small"
                        onClick={() => handleToggleExpand(announcement._id)}
                      >
                        {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </Tooltip>
                    
                    {isUnread && (
                      <Tooltip title="Mark as read">
                        <IconButton
                          size="small"
                          onClick={() => handleMarkAsRead(announcement._id)}
                          color="primary"
                        >
                          <CloseIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          );
        })}
      </Box>

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

export default AnnouncementDisplay; 