const socketIo = require('socket.io');

class SocketService {
    constructor() {
        this.io = null;
        this.connectedUsers = new Map(); // userId -> socketId
        this.userRooms = new Map(); // userId -> [room1, room2, ...]
    }

    initialize(server) {
        this.io = socketIo(server, {
            cors: {
                origin: "*", // In production, specify your frontend URL
                methods: ["GET", "POST"]
            }
        });

        this.setupEventHandlers();
        console.log('🔌 WebSocket server initialized');
    }

    setupEventHandlers() {
        this.io.on('connection', (socket) => {
            console.log(`🔌 User connected: ${socket.id}`);

            // Handle user authentication
            socket.on('authenticate', (data) => {
                this.handleAuthentication(socket, data);
            });

            // Handle joining role-specific rooms
            socket.on('join-rooms', (data) => {
                this.handleJoinRooms(socket, data);
            });

            // Handle transaction streaming subscription
            socket.on('subscribe-transactions', (data) => {
                this.handleTransactionSubscription(socket, data);
            });

            // Handle alert streaming subscription
            socket.on('subscribe-alerts', (data) => {
                this.handleAlertSubscription(socket, data);
            });

            // Handle case updates subscription
            socket.on('subscribe-cases', (data) => {
                this.handleCaseSubscription(socket, data);
            });

            // Handle disconnection
            socket.on('disconnect', () => {
                this.handleDisconnection(socket);
            });

            // Handle error
            socket.on('error', (error) => {
                console.error('Socket error:', error);
            });
        });
    }

    handleAuthentication(socket, data) {
        const { userId, userRole } = data;
        
        if (!userId || !userRole) {
            socket.emit('auth-error', { message: 'Invalid authentication data' });
            return;
        }

        // Store user connection info
        this.connectedUsers.set(userId, socket.id);
        socket.userId = userId;
        socket.userRole = userRole;

        // Join user to their personal room
        socket.join(`user-${userId}`);
        
        // Join role-specific rooms
        this.joinRoleRooms(socket, userRole);

        socket.emit('authenticated', { 
            message: 'Successfully authenticated',
            userId,
            userRole
        });

        console.log(`✅ User ${userId} (${userRole}) authenticated`);
    }

    joinRoleRooms(socket, userRole) {
        const rooms = [];

        // All users can see general updates
        rooms.push('general');

        // Role-specific rooms
        switch (userRole) {
            case 'admin':
                rooms.push('admin', 'transactions', 'alerts', 'cases', 'logs', 'rules');
                break;
            case 'compliance':
                rooms.push('compliance', 'alerts', 'cases');
                break;
            case 'investigator':
                rooms.push('investigator', 'cases');
                break;
            case 'auditor':
                rooms.push('auditor', 'logs');
                break;
        }

        // Join all applicable rooms
        rooms.forEach(room => {
            socket.join(room);
        });

        // Store user's rooms
        this.userRooms.set(socket.userId, rooms);

        console.log(`🏠 User ${socket.userId} joined rooms: ${rooms.join(', ')}`);
    }

    handleTransactionSubscription(socket, data) {
        const { userId, userRole } = socket;
        
        if (!userId) {
            socket.emit('error', { message: 'Not authenticated' });
            return;
        }

        // All authenticated users can subscribe to transactions
        socket.join('transaction-stream');
        socket.emit('subscribed', { 
            type: 'transactions',
            message: 'Subscribed to transaction stream'
        });

        console.log(`📊 User ${userId} subscribed to transaction stream`);
    }

    handleAlertSubscription(socket, data) {
        const { userId, userRole } = socket;
        
        if (!userId) {
            socket.emit('error', { message: 'Not authenticated' });
            return;
        }

        // Only admin and compliance can subscribe to alerts
        if (userRole === 'admin' || userRole === 'compliance') {
            socket.join('alert-stream');
            socket.emit('subscribed', { 
                type: 'alerts',
                message: 'Subscribed to alert stream'
            });
            console.log(`🚨 User ${userId} subscribed to alert stream`);
        } else {
            socket.emit('error', { message: 'Insufficient permissions for alert stream' });
        }
    }

    handleCaseSubscription(socket, data) {
        const { userId, userRole } = socket;
        
        if (!userId) {
            socket.emit('error', { message: 'Not authenticated' });
            return;
        }

        // Admin, compliance, and investigators can subscribe to cases
        if (['admin', 'compliance', 'investigator'].includes(userRole)) {
            socket.join('case-stream');
            socket.emit('subscribed', { 
                type: 'cases',
                message: 'Subscribed to case stream'
            });
            console.log(`📁 User ${userId} subscribed to case stream`);
        } else {
            socket.emit('error', { message: 'Insufficient permissions for case stream' });
        }
    }

    handleDisconnection(socket) {
        const { userId } = socket;
        
        if (userId) {
            this.connectedUsers.delete(userId);
            this.userRooms.delete(userId);
            console.log(`🔌 User ${userId} disconnected`);
        }
    }

    // Broadcast methods for different events
    broadcastTransaction(transaction) {
        if (this.io) {
            this.io.to('transaction-stream').emit('new-transaction', {
                type: 'transaction',
                data: transaction,
                timestamp: new Date()
            });
        }
    }

    broadcastTransactionDeletion(transactionId) {
        if (this.io) {
            this.io.to('transaction-stream').emit('transaction-deleted', {
                type: 'transaction-deleted',
                transactionId: transactionId,
                timestamp: new Date()
            });
        }
    }

    broadcastTransactionCleanup(deletedCount) {
        if (this.io) {
            this.io.to('transaction-stream').emit('transaction-cleanup', {
                type: 'transaction-cleanup',
                deletedCount: deletedCount,
                timestamp: new Date()
            });
        }
    }

    broadcastAlert(alert) {
        if (this.io) {
            this.io.to('alert-stream').emit('new-alert', {
                type: 'alert',
                data: alert,
                timestamp: new Date()
            });
        }
    }

    broadcastCaseUpdate(caseUpdate) {
        if (this.io) {
            this.io.to('case-stream').emit('case-update', {
                type: 'case',
                data: caseUpdate,
                timestamp: new Date()
            });
        }
    }

    broadcastCase(newCase, targetRole = null) {
        if (this.io) {
            const eventData = {
                type: 'new-case',
                data: newCase,
                timestamp: new Date()
            };

            if (targetRole) {
                // Send to specific role room
                this.io.to(targetRole).emit('new-case', eventData);
            } else {
                // Send to case stream (all case subscribers)
                this.io.to('case-stream').emit('new-case', eventData);
            }
        }
    }

    broadcastSystemMessage(message, room = 'general', userId = null) {
        if (this.io) {
            const eventData = {
                type: 'system',
                message,
                timestamp: new Date()
            };

            if (userId) {
                // Send to specific user
                this.sendToUser(userId, 'system-message', eventData);
            } else {
                // Send to room
                this.io.to(room).emit('system-message', eventData);
            }
        }
    }

    // Send message to specific user
    sendToUser(userId, event, data) {
        if (this.io && this.connectedUsers.has(userId)) {
            const socketId = this.connectedUsers.get(userId);
            this.io.to(socketId).emit(event, data);
        }
    }

    // Get connected users count
    getConnectedUsersCount() {
        return this.connectedUsers.size;
    }

    // Get users in a specific room
    getUsersInRoom(room) {
        if (this.io) {
            const roomSockets = this.io.sockets.adapter.rooms.get(room);
            return roomSockets ? roomSockets.size : 0;
        }
        return 0;
    }
}

module.exports = new SocketService(); 