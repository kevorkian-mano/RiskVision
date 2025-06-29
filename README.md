# RiskVision - Financial Fraud Detection System

A comprehensive financial fraud detection and case management system built with Node.js/Express backend and React frontend. The system provides real-time transaction monitoring, automated risk scoring, case management workflows, and role-based access control for financial institutions.

## 🚀 Features

### 🔐 Authentication & Authorization
- JWT-based authentication system
- Role-based access control (Admin, Compliance, Investigator, Auditor)
- Secure password hashing and validation
- Session management and token refresh

### 📊 Real-time Transaction Monitoring
- Live transaction processing and analysis
- Automated risk scoring based on configurable rules
- Real-time alerts for suspicious activities
- Transaction cleanup and maintenance tools

### 🕵️ Case Management System
- **Compliance Officers**: Create cases from suspicious transactions, assign to investigators
- **Investigators**: Handle assigned cases, make decisions, add evidence and comments
- **Real-time Updates**: Case status changes, assignments, and notifications
- **Decision Workflow**: Multiple fraud decision options with automated status updates

### 👥 User Management
- **Admin Dashboard**: Create users, assign roles, manage system configuration
- **Email Integration**: Welcome emails for new users, custom email communications
- **User Activity Tracking**: Monitor user actions and system usage

### ⚙️ Risk Rules Engine
- Configurable risk detection rules
- Rule templates for common fraud patterns
- Dynamic threshold management
- Rule creation, editing, and deletion

### 📈 Dashboard Analytics
- **Admin Dashboard**: System overview, user management, rule management
- **Compliance Dashboard**: Transaction monitoring, case creation, assignment management
- **Investigator Dashboard**: Assigned cases, available cases, decision making
- **Auditor Dashboard**: System logs, audit trails, compliance reporting

### 🔔 Real-time Notifications
- Socket.io integration for live updates
- Email notifications for case assignments
- System-wide announcements and alerts

## 🛠️ Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **nodemailer** - Email service
- **Socket.io** - Real-time communications
- **cors** - Cross-origin resource sharing

### Frontend
- **React** - UI framework
- **Material-UI** - Component library
- **Axios** - HTTP client
- **React Router** - Navigation
- **Context API** - State management

## 📋 Prerequisites

Before running this application, make sure you have the following installed:
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn package manager

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/RiskVision.git
cd RiskVision
```

### 2. Backend Setup
```bash
cd backend
npm install
```

### 3. Environment Configuration
Create a `.env` file in the backend directory:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/riskvision

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=24h

# Email Configuration (Gmail Example)
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
FRONTEND_URL=http://localhost:3000

# Optional: For production
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/riskvision
```

### 4. Frontend Setup
```bash
cd ../frontend
npm install
```

### 5. Database Setup
Make sure MongoDB is running on your system:
```bash
# Start MongoDB (macOS with Homebrew)
brew services start mongodb-community

# Or start MongoDB manually
mongod
```

### 6. Seed Data (Optional)
```bash
cd backend
npm run seed
```

## 🏃‍♂️ Running the Application

### Development Mode

1. **Start Backend Server**
```bash
cd backend
npm run dev
```
The backend will run on `http://localhost:5000`

2. **Start Frontend Development Server**
```bash
cd frontend
npm start
```
The frontend will run on `http://localhost:3000`

### Production Mode

1. **Build Frontend**
```bash
cd frontend
npm run build
```

2. **Start Production Server**
```bash
cd backend
npm start
```

## 👤 Default Users

After running the seed script, you can log in with these default accounts:

| Role | Email | Password | Description |
|------|-------|----------|-------------|
| Admin | admin@riskvision.com | admin123 | Full system access |
| Compliance | compliance@riskvision.com | compliance123 | Case creation and management |
| Investigator | investigator@riskvision.com | investigator123 | Case investigation |
| Auditor | auditor@riskvision.com | auditor123 | System auditing |

## 📱 Usage Guide

### Admin Dashboard
- **User Management**: Create, edit, delete users and assign roles
- **Risk Rules**: Create and manage fraud detection rules
- **Email Communication**: Send emails to users directly from the dashboard
- **System Overview**: Monitor system statistics and user activity

### Compliance Dashboard
- **Transaction Monitoring**: View real-time transactions with risk scores
- **Case Creation**: Create fraud cases from suspicious transactions
- **Case Assignment**: Assign cases to investigators during creation or later
- **Case Management**: Monitor open cases, reassign, and close cases

### Investigator Dashboard
- **My Assigned Cases**: View and work on cases assigned to you
- **Available Cases**: See unassigned cases and claim them
- **Case Decisions**: Make fraud decisions with multiple action options
- **Evidence Management**: Add comments and evidence to cases

### Case Decision Options
Investigators can make the following decisions:
- **Confirm Fraud**: Officially label the case as fraud
- **Freeze Account**: Temporarily block the user/account
- **Reverse Transaction**: Mark transaction for reversal
- **Report to Compliance**: Escalate to compliance team
- **Add to Watchlist**: Flag for future monitoring
- **Escalate Case**: Send to senior investigator
- **Request Verification**: Ask customer to confirm transaction

## 🔧 Configuration

### Email Setup
1. **Gmail Setup**:
   - Enable 2-factor authentication
   - Generate an App Password
   - Use the App Password in EMAIL_PASSWORD

2. **Other Email Providers**:
   - Update the email service configuration in `backend/services/emailService.js`
   - Modify SMTP settings as needed

### Risk Rules Configuration
- Rules are stored in MongoDB and managed through the Admin Dashboard
- Each rule has a condition, threshold, and description
- Rules are evaluated against transaction data in real-time

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 📁 Project Structure

```
RiskVision/
├── backend/
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Authentication & authorization
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Helper functions
│   └── server.js        # Main server file
├── frontend/
│   ├── public/          # Static files
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── contexts/    # React contexts
│   │   ├── dashboards/  # Role-specific dashboards
│   │   ├── services/    # API services
│   │   └── utils/       # Helper functions
│   └── package.json
└── README.md
```

## 🔒 Security Features

- JWT token-based authentication
- Password hashing with bcrypt
- Role-based access control
- Input validation and sanitization
- CORS configuration
- Environment variable management

## 🚀 Deployment

### Heroku Deployment
1. Create a Heroku account and install Heroku CLI
2. Create a new Heroku app
3. Add MongoDB add-on (MongoDB Atlas)
4. Set environment variables in Heroku dashboard
5. Deploy using Git

```bash
heroku create your-riskvision-app
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=your_mongodb_uri
heroku config:set JWT_SECRET=your_jwt_secret
git push heroku main
```

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up --build
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/yourusername/RiskVision/issues) page
2. Create a new issue with detailed description
3. Contact the development team

## 🔄 Version History

- **v1.0.0** - Initial release with core functionality
- **v1.1.0** - Added email integration and user management
- **v1.2.0** - Enhanced case management and decision workflow
- **v1.3.0** - Added real-time notifications and improved UI

## 🙏 Acknowledgments

- Material-UI for the component library
- MongoDB for the database solution
- Express.js community for the web framework
- React team for the frontend framework

---

**RiskVision** - Empowering financial institutions with intelligent fraud detection and case management. 