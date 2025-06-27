import io from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
  }

  connect(serverUrl = 'http://localhost:5000') {
    if (this.socket) {
      this.disconnect();
    }

    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
    });

    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.socket.on('connect', () => {
      console.log('🔌 Connected to WebSocket server');
      this.isConnected = true;
      this.emit('connection-established');
    });

    this.socket.on('disconnect', () => {
      console.log('🔌 Disconnected from WebSocket server');
      this.isConnected = false;
      this.emit('connection-lost');
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.emit('connection-error', error);
    });

    this.socket.on('auth-error', (error) => {
      console.error('WebSocket authentication error:', error);
      this.emit('auth-error', error);
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.emit('error', error);
    });
  }

  authenticate(userId, userRole) {
    if (!this.socket) {
      throw new Error('Socket not connected');
    }

    this.socket.emit('authenticate', { userId, userRole });
  }

  subscribeToTransactions() {
    if (!this.socket) {
      throw new Error('Socket not connected');
    }

    this.socket.emit('subscribe-transactions');
  }

  subscribeToAlerts() {
    if (!this.socket) {
      throw new Error('Socket not connected');
    }

    this.socket.emit('subscribe-alerts');
  }

  subscribeToCases() {
    if (!this.socket) {
      throw new Error('Socket not connected');
    }

    this.socket.emit('subscribe-cases');
  }

  // Event listeners
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);

    // Also listen to socket events
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }

    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  emit(event, data) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  getConnectionStatus() {
    return this.isConnected;
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService; 