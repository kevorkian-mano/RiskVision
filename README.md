# RiskVision - Fraud Detection & Risk Management System

A comprehensive backend API for financial fraud detection and risk management, built with Node.js, Express, and MongoDB.

## 🎯 Features

### 🔐 Authentication & User Management
- JWT-based authentication
- Role-based access control (Admin, Compliance, Investigator, Auditor)
- User registration and management

### 💳 Transaction Monitoring
- Real-time transaction processing
- Automated risk scoring
- Fraud pattern detection
- Transaction history tracking

### 🚨 Alert Management
- Automatic alert generation for suspicious transactions
- Risk-based alert prioritization
- Alert resolution workflow

### 📁 Case Management
- Investigation case creation from alerts
- Investigator assignment
- Case status tracking
- Comments and evidence management

### 📊 Audit & Reporting
- Comprehensive audit logs
- System activity tracking
- Export capabilities (JSON/CSV)
- Compliance reporting

### ⚙️ Risk Rules Engine
- Configurable fraud detection rules
- Dynamic risk scoring
- Rule management interface

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   MongoDB       │
│   (React/Vue)   │◄──►│   (Node.js)     │◄──►│   Database      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Risk Engine   │
                       │   (Rules)       │
                       └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/RiskVision.git
   cd RiskVision/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the backend directory:
   ```env
   MONGO_URI=mongodb://localhost:27017/riskvision
   JWT_SECRET=your_jwt_secret_here
   PORT=5000
   ```

4. **Start MongoDB**
   ```bash
   # macOS (Homebrew)
   brew services start mongodb-community
   
   # Or manually
   mongod
   ```

5. **Seed the database (optional)**
   ```bash
   npm run seed-db
   ```

6. **Start the server**
   ```bash
   npm start
   ```

The API will be available at `http://localhost:5000`

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/users/register` - Register new user (Admin only)
- `POST /api/users/login` - User login
- `GET /api/users/me` - Get current user info
- `GET /api/users/` - Get all users (Admin only)
- `PUT /api/users/:id/role` - Update user role (Admin only)
- `DELETE /api/users/:id` - Delete user (Admin only)

### Transaction Endpoints
- `POST /api/transactions/` - Add new transaction
- `GET /api/transactions/` - Get all transactions
- `GET /api/transactions/user/:id` - Get transactions by user

### Alert Endpoints
- `GET /api/alerts/` - Get all alerts
- `GET /api/alerts/:id` - Get alert by ID
- `PUT /api/alerts/:id/resolve` - Resolve alert (Compliance)
- `DELETE /api/alerts/:id` - Delete alert (Admin)

### Case Endpoints
- `POST /api/cases/` - Create new case (Compliance)
- `GET /api/cases/` - Get all cases
- `GET /api/cases/:id` - Get case by ID
- `PUT /api/cases/:id/assign` - Assign investigator (Compliance)
- `PUT /api/cases/:id/status` - Update case status (Investigator)
- `POST /api/cases/:id/comment` - Add comment (Investigator)
- `POST /api/cases/:id/evidence` - Upload evidence (Investigator)
- `PUT /api/cases/:id/close` - Close case (Compliance)
- `DELETE /api/cases/:id` - Delete case (Admin)

### Log Endpoints
- `GET /api/logs/` - Get all logs (Admin/Auditor)
- `GET /api/logs/filter` - Filter logs (Admin/Auditor)
- `GET /api/logs/export` - Export logs (Admin/Auditor)

### Rule Endpoints
- `POST /api/rules/` - Add new rule (Admin)
- `GET /api/rules/` - Get all rules (Admin)
- `PUT /api/rules/:id` - Edit rule (Admin)
- `DELETE /api/rules/:id` - Delete rule (Admin)

## 🔐 Role-Based Access Control

### Admin
- Full system access
- User management
- Rule management
- System monitoring

### Compliance Officer
- Alert monitoring and resolution
- Case creation and management
- Investigator assignment
- Case closure

### Investigator
- Case investigation
- Evidence collection
- Status updates
- Comments and findings

### Auditor
- Log viewing and analysis
- Report generation
- Compliance monitoring
- Export capabilities

## 🧪 Testing

### Generate Test Data
```bash
# Generate JSON dataset
npm run generate-data

# Seed database with test data
npm run seed-db
```

### Test Credentials (after seeding)
- **Admin:** Any user with admin role
- **Compliance:** Any user with compliance role
- **Investigator:** Any user with investigator role
- **Auditor:** Any user with auditor role
- **Password:** `password123` (for all test users)

## 📊 Data Models

### User
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: ['admin', 'compliance', 'investigator', 'auditor']
}
```

### Transaction
```javascript
{
  userId: ObjectId,
  amount: Number,
  country: String,
  timestamp: Date
}
```

### Alert
```javascript
{
  transactionId: ObjectId,
  reason: String,
  riskScore: Number,
  resolved: Boolean
}
```

### Case
```javascript
{
  alertId: ObjectId,
  assignedTo: ObjectId,
  status: String,
  description: String,
  timeline: Array,
  comments: [ObjectId],
  evidence: [ObjectId]
}
```

## 🔧 Development

### Available Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run seed-db` - Seed database with test data
- `npm run generate-data` - Generate JSON dataset

### Project Structure
```
backend/
├── controllers/     # Route handlers
├── middleware/      # Authentication & authorization
├── models/         # MongoDB schemas
├── routes/         # API routes
├── scripts/        # Database seeding & utilities
├── app.js          # Express app setup
├── server.js       # Server entry point
└── package.json    # Dependencies & scripts
```

## 🚨 Risk Detection Patterns

The system detects various fraud patterns:
- High amount transactions (>$10,000)
- Suspicious countries (Nigeria, Russia, etc.)
- Late night transactions
- Rapid transaction sequences
- Micro-transactions (money laundering)
- Unusual user behavior

## 📈 Performance

- **Real-time risk assessment** on each transaction
- **Scalable architecture** for high transaction volumes
- **Efficient database queries** with proper indexing
- **Role-based caching** for improved response times

## 🔒 Security

- **JWT authentication** with secure token handling
- **Role-based access control** at API level
- **Password hashing** with bcrypt
- **Input validation** and sanitization
- **Audit logging** for all system activities

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team
- Check the documentation

## 🔮 Roadmap

- [ ] Machine learning-based risk assessment
- [ ] Real-time notifications
- [ ] Advanced reporting dashboard
- [ ] Integration with external fraud databases
- [ ] Mobile app for investigators
- [ ] API rate limiting and throttling
- [ ] Multi-tenant architecture
- [ ] Advanced analytics and insights

---

**Built with ❤️ for secure financial transactions** 