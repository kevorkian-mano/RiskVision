const app = require('./app');
const mongoose = require('mongoose');
const http = require('http');
const socketService = require('./services/socketService');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

console.log('Connecting to:', process.env.MONGO_URI); // Debug print

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    // Create HTTP server
    const server = http.createServer(app);
    
    // Initialize WebSocket service
    socketService.initialize(server);
    
    // Start server
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🔌 WebSocket server ready for real-time connections`);
    });
  })
  .catch(err => console.log(err));
