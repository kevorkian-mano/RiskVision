import React from 'react';
import { Box, AppBar, Toolbar, Typography, Button } from '@mui/material';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import AdminDashboard from '../dashboards/AdminDashboard.jsx';
import ComplianceDashboard from '../dashboards/ComplianceDashboard.jsx';
import InvestigatorDashboard from '../dashboards/InvestigatorDashboard.jsx';
import AuditorDashboard from '../dashboards/AuditorDashboard.jsx';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const renderDashboard = () => {
    switch (user.role) {
      case 'admin':
        return <AdminDashboard />;
      case 'compliance':
        return <ComplianceDashboard />;
      case 'investigator':
        return <InvestigatorDashboard />;
      case 'auditor':
        return <AuditorDashboard />;
      default:
        return <div>Unknown role</div>;
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            RiskVision® - {user.name} ({user.role})
          </Typography>
          <Button color="inherit" onClick={handleLogout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      <Box sx={{ mt: 2 }}>
        {renderDashboard()}
      </Box>
    </Box>
  );
};

export default Dashboard; 