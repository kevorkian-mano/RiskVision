import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, List, ListItem, ListItemText,
  ListItemAvatar, Avatar, Chip, FormControl, InputLabel, Select, MenuItem,
  CircularProgress, Alert, Grid
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  MilitaryTech as MedalIcon,
  Star as StarIcon
} from '@mui/icons-material';
import pointsAPI from '../services/pointsAPI';

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => {
    fetchLeaderboard();
  }, [roleFilter]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await pointsAPI.getLeaderboard(roleFilter || null);
      setLeaderboard(response.data);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Failed to load leaderboard');
    } finally {
      setLoading(false);
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

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return <TrophyIcon sx={{ color: '#FFD700', fontSize: 24 }} />;
      case 2: return <MedalIcon sx={{ color: '#C0C0C0', fontSize: 24 }} />;
      case 3: return <MedalIcon sx={{ color: '#CD7F32', fontSize: 24 }} />;
      default: return <StarIcon sx={{ color: 'text.secondary', fontSize: 20 }} />;
    }
  };

  const getRankColor = (rank) => {
    switch (rank) {
      case 1: return '#FFD700';
      case 2: return '#C0C0C0';
      case 3: return '#CD7F32';
      default: return 'text.secondary';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 3 }}>
          <CircularProgress size={32} />
          <Typography variant="body2" sx={{ mt: 1 }}>
            Loading leaderboard...
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

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
          <Box display="flex" alignItems="center">
            <TrophyIcon color="primary" sx={{ mr: 1, fontSize: 28 }} />
            <Typography variant="h5">
              Points Leaderboard
            </Typography>
          </Box>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Filter by Role</InputLabel>
            <Select
              value={roleFilter}
              label="Filter by Role"
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <MenuItem value="">All Roles</MenuItem>
              <MenuItem value="compliance">Compliance</MenuItem>
              <MenuItem value="investigator">Investigator</MenuItem>
              <MenuItem value="auditor">Auditor</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {leaderboard.length === 0 ? (
          <Typography variant="body2" color="textSecondary" textAlign="center" py={3}>
            No users found
          </Typography>
        ) : (
          <List>
            {leaderboard.map((user, index) => (
              <ListItem key={user.userId} sx={{ px: 0, py: 1 }}>
                <ListItemAvatar>
                  <Avatar sx={{ 
                    bgcolor: getRankColor(user.rank),
                    width: 40,
                    height: 40,
                    fontSize: '1rem',
                    fontWeight: 'bold'
                  }}>
                    {getRankIcon(user.rank)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Typography variant="subtitle1" fontWeight="medium">
                        #{user.rank} {user.name}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Chip
                          label={user.role}
                          color={getRoleColor(user.role)}
                          size="small"
                          variant="outlined"
                        />
                        <Typography variant="h6" color="primary" fontWeight="bold">
                          {user.points} pts
                        </Typography>
                      </Box>
                    </Box>
                  }
                  secondary={
                    <Typography variant="body2" color="textSecondary">
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)} • Rank #{user.rank}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
};

export default Leaderboard; 