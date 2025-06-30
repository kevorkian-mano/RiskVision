import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Chip, List, ListItem, ListItemText,
  CircularProgress, Alert, Snackbar, Grid, Divider, Avatar, Tooltip
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  TrendingUp as TrendingUpIcon,
  History as HistoryIcon,
  Star as StarIcon
} from '@mui/icons-material';
import pointsAPI from '../services/pointsAPI';

const PointsDisplay = ({ compact = false }) => {
  const [pointsData, setPointsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPoints();
  }, []);

  const fetchPoints = async () => {
    try {
      setLoading(true);
      const response = await pointsAPI.getMyPoints();
      setPointsData(response.data);
    } catch (err) {
      console.error('Error fetching points:', err);
      setError('Failed to load points data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 3 }}>
          <CircularProgress size={32} />
          <Typography variant="body2" sx={{ mt: 1 }}>
            Loading points...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  if (!pointsData) {
    return null;
  }

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'error';
      case 'compliance': return 'primary';
      case 'investigator': return 'warning';
      case 'auditor': return 'info';
      default: return 'default';
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'CREATE_CASE': return '📋';
      case 'CASE_CLOSED': return '✅';
      case 'MAKE_DECISION': return '🎯';
      case 'CLOSE_CASE': return '🔒';
      default: return '⭐';
    }
  };

  if (compact) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center">
              <TrophyIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">
                {pointsData.totalPoints} Points
              </Typography>
            </Box>
            <Chip
              label={pointsData.role}
              color={getRoleColor(pointsData.role)}
              size="small"
            />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      {/* Points Summary */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Box display="flex" alignItems="center">
              <TrophyIcon color="primary" sx={{ mr: 1, fontSize: 32 }} />
              <Box>
                <Typography variant="h4" fontWeight="bold">
                  {pointsData.totalPoints}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Points
                </Typography>
              </Box>
            </Box>
            <Box textAlign="right">
              <Chip
                label={pointsData.role}
                color={getRoleColor(pointsData.role)}
                size="medium"
              />
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                {pointsData.name}
              </Typography>
            </Box>
          </Box>

          {/* Points by Action */}
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" gutterBottom>
            Points by Action
          </Typography>
          <Grid container spacing={2}>
            {Object.entries(pointsData.pointsByAction).map(([action, points]) => (
              <Grid item xs={6} sm={3} key={action}>
                <Box textAlign="center" p={1}>
                  <Typography variant="h6" color="primary">
                    {points}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {action.replace('_', ' ')}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <HistoryIcon sx={{ mr: 1 }} />
            <Typography variant="h6">
              Recent Activity
            </Typography>
          </Box>
          
          {pointsData.recentActivity.length === 0 ? (
            <Typography variant="body2" color="textSecondary" textAlign="center" py={2}>
              No recent activity
            </Typography>
          ) : (
            <List dense>
              {pointsData.recentActivity.map((activity, index) => (
                <ListItem key={index} sx={{ px: 0 }}>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center">
                        <Typography sx={{ mr: 1 }}>
                          {getActionIcon(activity.action)}
                        </Typography>
                        <Typography variant="body2">
                          {activity.description}
                        </Typography>
                        <Chip
                          label={`+${activity.points}`}
                          color="success"
                          size="small"
                          sx={{ ml: 'auto' }}
                        />
                      </Box>
                    }
                    secondary={
                      <Typography variant="caption" color="textSecondary">
                        {new Date(activity.earnedAt).toLocaleString()}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default PointsDisplay; 