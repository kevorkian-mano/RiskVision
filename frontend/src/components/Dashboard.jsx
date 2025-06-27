import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  AccountBalance,
  Warning,
  Assignment,
  Assessment,
  Refresh,
  TrendingUp,
  TrendingDown,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext.jsx';
import { transactionAPI, alertAPI } from '../services/api.jsx';
import socketService from '../services/socket.jsx';

const Dashboard = () => {
  const { user, isAdmin, isCompliance, isInvestigator, isAuditor } = useAuth();
  const [stats, setStats] = useState({
    transactions: null,
    alerts: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [recentAlerts, setRecentAlerts] = useState([]);

  useEffect(() => {
    loadDashboardData();
    setupSocketListeners();
    
    return () => {
      // Cleanup socket listeners
      socketService.off('new-transaction', handleNewTransaction);
      socketService.off('new-alert', handleNewAlert);
    };
  }, []);

  const setupSocketListeners = () => {
    socketService.on('new-transaction', handleNewTransaction);
    socketService.on('new-alert', handleNewAlert);
  };

  const handleNewTransaction = (data) => {
    setRecentTransactions(prev => [data.data, ...prev.slice(0, 9)]);
    loadTransactionStats();
  };

  const handleNewAlert = (data) => {
    setRecentAlerts(prev => [data.data, ...prev.slice(0, 9)]);
    loadAlertStats();
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [transactionStats, alertStats, transactions, alerts] = await Promise.all([
        transactionAPI.getStats(),
        isCompliance() ? alertAPI.getStats() : Promise.resolve(null),
        transactionAPI.getAll({ limit: 10 }),
        isCompliance() ? alertAPI.getAll({ limit: 10 }) : Promise.resolve([]),
      ]);

      setStats({
        transactions: transactionStats.data,
        alerts: alertStats?.data || null,
      });

      setRecentTransactions(transactions.data);
      setRecentAlerts(alerts.data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadTransactionStats = async () => {
    try {
      const response = await transactionAPI.getStats();
      setStats(prev => ({ ...prev, transactions: response.data }));
    } catch (error) {
      console.error('Failed to load transaction stats:', error);
    }
  };

  const loadAlertStats = async () => {
    if (!isCompliance()) return;
    
    try {
      const response = await alertAPI.getStats();
      setStats(prev => ({ ...prev, alerts: response.data }));
    } catch (error) {
      console.error('Failed to load alert stats:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: 'error',
      compliance: 'warning',
      investigator: 'info',
      auditor: 'success',
    };
    return colors[role] || 'default';
  };

  const getRiskColor = (riskScore) => {
    if (riskScore >= 80) return 'error';
    if (riskScore >= 60) return 'warning';
    return 'success';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Welcome back, {user?.name}!
        </Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <Chip
            label={user?.role?.toUpperCase()}
            color={getRoleColor(user?.role)}
            size="small"
          />
          <Typography variant="body2" color="text.secondary">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Typography>
        </Box>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Transactions
                  </Typography>
                  <Typography variant="h4">
                    {stats.transactions?.totalTransactions || 0}
                  </Typography>
                </Box>
                <AccountBalance color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Amount
                  </Typography>
                  <Typography variant="h6">
                    {formatCurrency(stats.transactions?.totalAmount || 0)}
                  </Typography>
                </Box>
                <TrendingUp color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {isCompliance() && (
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Active Alerts
                    </Typography>
                    <Typography variant="h4">
                      {stats.alerts?.unresolvedAlerts || 0}
                    </Typography>
                  </Box>
                  <Warning color="warning" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Avg Transaction
                  </Typography>
                  <Typography variant="h6">
                    {formatCurrency(stats.transactions?.avgAmount || 0)}
                  </Typography>
                </Box>
                <Assessment color="info" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Activity */}
      <Grid container spacing={3}>
        {/* Recent Transactions */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Typography variant="h6">Recent Transactions</Typography>
              <IconButton onClick={loadDashboardData} size="small">
                <Refresh />
              </IconButton>
            </Box>
            
            {recentTransactions.length === 0 ? (
              <Typography color="textSecondary" align="center">
                No recent transactions
              </Typography>
            ) : (
              recentTransactions.map((transaction) => (
                <Box
                  key={transaction._id}
                  sx={{
                    p: 2,
                    mb: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Box>
                    <Typography variant="subtitle2">
                      {formatCurrency(transaction.amount)}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {transaction.userId?.name} • {transaction.country}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="textSecondary">
                    {new Date(transaction.timestamp).toLocaleTimeString()}
                  </Typography>
                </Box>
              ))
            )}
          </Paper>
        </Grid>

        {/* Recent Alerts */}
        {isCompliance() && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h6">Recent Alerts</Typography>
                <IconButton onClick={loadDashboardData} size="small">
                  <Refresh />
                </IconButton>
              </Box>
              
              {recentAlerts.length === 0 ? (
                <Typography color="textSecondary" align="center">
                  No recent alerts
                </Typography>
              ) : (
                recentAlerts.map((alert) => (
                  <Box
                    key={alert._id}
                    sx={{
                      p: 2,
                      mb: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Box>
                      <Typography variant="subtitle2">
                        {alert.reason}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Risk Score: {alert.riskScore}
                      </Typography>
                    </Box>
                    <Chip
                      label={alert.resolved ? 'Resolved' : 'Active'}
                      color={alert.resolved ? 'success' : getRiskColor(alert.riskScore)}
                      size="small"
                    />
                  </Box>
                ))
              )}
            </Paper>
          </Grid>
        )}
      </Grid>
    </Container>
  );
};

export default Dashboard; 