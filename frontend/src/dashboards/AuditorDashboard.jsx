import React from 'react';
import { Typography, Box } from '@mui/material';
import AnnouncementDisplay from '../components/AnnouncementDisplay.jsx';

const AuditorDashboard = () => (
  <Box p={4}>
    <Typography variant="h4" gutterBottom>Auditor Dashboard</Typography>
    <Typography sx={{ mb: 3 }}>Welcome, Auditor! Here you can review audit logs and system activity for compliance.</Typography>
    
    {/* Announcements Section */}
    <Box sx={{ mb: 4 }}>
      <AnnouncementDisplay maxDisplay={3} showBadge={true} />
    </Box>
    
    <Typography variant="h6" gutterBottom>Audit Features Coming Soon</Typography>
    <Typography variant="body2" color="textSecondary">
      This dashboard will include audit log review, compliance reporting, and system activity monitoring features.
    </Typography>
  </Box>
);

export default AuditorDashboard; 