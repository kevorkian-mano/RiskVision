# RiskVision - Scripts Documentation

This document provides a comprehensive overview of all scripts in the RiskVision financial fraud detection system.

## 📁 Scripts Directory Structure

```
backend/scripts/
├── CRITICAL/           # Essential scripts for project flow
├── DEVELOPMENT/        # Development and testing scripts  
└── UTILITY/           # Optional utility scripts
```

## 🚨 CRITICAL SCRIPTS (Essential for Project Flow)

### 1. `seedDatabase.js` ⭐⭐⭐⭐⭐
**Purpose**: Creates initial database with users, transactions, rules, and sample data  
**Importance**: **CRITICAL** - Required for first-time setup  
**Usage**: `npm run seed-db`  
**What it does**: 
- Creates 50 random users with different roles (admin, compliance, investigator, auditor)
- Generates 200 sample transactions with realistic data
- Creates 10 risk rules for fraud detection
- Sets up sample cases and audit logs
- Establishes the foundation for the entire system

**Example Output**:
```
✅ Connected to MongoDB
👥 Generating users...
✅ Generated 50 users
📋 Generating risk rules...
✅ Generated 10 risk rules
💳 Generating transactions...
✅ Generated 200 transactions
```

### 2. `liveTransactionGenerator.js` ⭐⭐⭐⭐⭐
**Purpose**: Continuously generates live transactions for real-time testing  
**Importance**: **CRITICAL** - Provides live data for ML model testing  
**Usage**: `npm run live-transactions`  
**What it does**:
- Creates 1 transaction per minute automatically
- Sends transactions through ML API for fraud detection
- Broadcasts real-time updates via WebSocket
- Handles authentication automatically (login and token refresh)
- Generates realistic transaction data with various risk levels

**Features**:
- Automatic token management (login at startup, refresh when expired)
- Real-time WebSocket broadcasting
- ML model integration for fraud detection
- Configurable transaction patterns and amounts

**Example Output**:
```
🚀 Starting live transaction generation...
📊 Transactions will be generated at exactly 1 per minute
🔌 Real-time updates will be broadcast via WebSocket
✅ Fresh token obtained for transaction generation
💳 Created transaction via API: $234 from United States by John Smith | isFraud: true
```

## 🟡 DEVELOPMENT SCRIPTS (Important for Development/Testing)

### 3. `generateTransactions.js` ⭐⭐⭐⭐
**Purpose**: Generates bulk transaction data for testing  
**Importance**: **HIGH** - Creates realistic transaction datasets  
**Usage**: `npm run generate-data`  
**What it does**:
- Creates 1000 realistic transactions with user profiles
- Includes risk patterns and country-based risk levels
- Generates comprehensive transaction metadata
- Exports to JSON file for analysis and testing

**Features**:
- User profile generation with device types, browsers, locations
- Country-based risk assessment
- Realistic transaction timing patterns
- Comprehensive transaction metadata

### 4. `generateFraudTransactions.js` ⭐⭐⭐⭐
**Purpose**: Creates fraudulent transaction data for ML model training  
**Importance**: **HIGH** - Essential for ML model accuracy  
**Usage**: Run manually  
**What it does**:
- Generates 100 fraudulent transactions with realistic patterns
- Uses high-risk countries (Nigeria, Russia, Iran, etc.)
- Creates suspicious transaction amounts and timing
- Implements money laundering and fraud patterns

**Fraud Patterns**:
- High amounts: $50,000 - $500,000
- Micro-transactions: $1 - $20 (money laundering)
- Suspicious amounts: Just under thresholds ($9,999, $19,999)
- Unusual hours: Late night transactions (12 AM - 5 AM)
- Rapid transactions: Multiple transactions in short intervals

### 5. `testEmail.js` ⭐⭐⭐
**Purpose**: Tests email functionality  
**Importance**: **MEDIUM** - Verifies email notifications work  
**Usage**: `npm run test-email`  
**What it does**:
- Tests welcome email sending functionality
- Validates email configuration (SMTP settings)
- Checks environment variables for email setup
- Provides detailed error reporting for email issues

**Configuration Check**:
- EMAIL_USER (Gmail address)
- EMAIL_PASSWORD (App password)
- FRONTEND_URL (for email links)

## 🟢 UTILITY SCRIPTS (Optional/Development Tools)

### 6. `listUsers.js` ⭐⭐
**Purpose**: Lists all users in the database  
**Importance**: **LOW** - Development/debugging tool  
**Usage**: Run manually  
**What it does**: 
- Displays all users with their emails, names, and roles
- Useful for finding login credentials
- Helps with user management and debugging

**Example Output**:
```
✅ Found 10 users:

1. Name: Dr. Milton Wintheiser
   Email: Emilia.Raynor33@hotmail.com
   Role: investigator

2. Name: Ricardo Schoen
   Email: Dameon.MacGyver@gmail.com
   Role: admin
```

### 7. `testTransactionAPI.js` ⭐⭐
**Purpose**: Tests transaction API endpoints  
**Importance**: **LOW** - Development/debugging tool  
**Usage**: Run manually  
**What it does**:
- Tests user login and token generation
- Creates test transactions via API
- Retrieves transaction lists
- Validates ML model integration
- Shows recent transaction history

**Test Flow**:
1. Login to get fresh token
2. Create test transaction
3. Verify ML fraud detection
4. Fetch all transactions
5. Display recent transaction history

### 8. `updateTransactionRiskScores.js` ⭐
**Purpose**: Updates existing transactions with risk scores  
**Importance**: **LOW** - Legacy script (rule-based scoring removed)  
**Usage**: Run manually  
**What it does**: 
- **DEPRECATED** - Rule-based scoring replaced by ML model
- Sets placeholder risk scores for existing transactions
- Provides risk score statistics
- Legacy functionality for backward compatibility

### 9. `exportTransactions.js` ⭐
**Purpose**: Exports transactions to JSON file  
**Importance**: **LOW** - Data export utility  
**Usage**: Run manually  
**What it does**: 
- Exports all transactions from database to `transactions.json`
- Useful for data analysis and backup
- Creates portable transaction datasets

## 🎯 Recommended Usage Order

### **First-Time Setup:**
```bash
# 1. Seed the database with initial data
npm run seed-db

# 2. Test email functionality
npm run test-email

# 3. Start live transaction generation
npm run live-transactions
```

### **Development/Testing:**
```bash
# 1. Generate bulk test data
npm run generate-data

# 2. Create fraud data for ML training
node scripts/generateFraudTransactions.js

# 3. Test API functionality
node scripts/testTransactionAPI.js

# 4. List users for debugging
node scripts/listUsers.js
```

### **Production Deployment:**
```bash
# 1. Setup production database
npm run seed-db

# 2. Enable live transaction monitoring
npm run live-transactions

# 3. Monitor system with utility scripts as needed
```

## 🔧 Script Dependencies

### **Required Environment Variables:**
```env
MONGO_URI=mongodb://localhost:27017/riskvision
JWT_SECRET=your_jwt_secret_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
FRONTEND_URL=http://localhost:3000
```

### **Required Services:**
- **MongoDB**: Running on localhost:27017
- **Backend Server**: Running on localhost:5000
- **ML API**: Running on localhost:8000 (for fraud detection)
- **Email Service**: Configured SMTP settings

## 🚨 Troubleshooting

### **Common Issues:**

1. **"Token is not valid" Error**:
   - Ensure backend server is running
   - Check if users exist in database (run `seed-db`)
   - Verify JWT_SECRET is set in .env file

2. **MongoDB Connection Error**:
   - Ensure MongoDB is running
   - Check MONGO_URI in .env file
   - Verify database permissions

3. **Email Test Failures**:
   - Check EMAIL_USER and EMAIL_PASSWORD
   - Ensure 2FA is enabled on Gmail
   - Use App Password, not regular password

4. **ML API Connection Issues**:
   - Ensure ML API is running on port 8000
   - Check if fraud_model.pkl and country_encoder.pkl exist
   - Verify Python dependencies are installed

### **Script-Specific Issues:**

- **liveTransactionGenerator.js**: Authentication issues fixed with automatic token refresh
- **seedDatabase.js**: May fail if database already has data (safe to re-run)
- **generateTransactions.js**: Creates files in backend/data/ directory
- **testEmail.js**: Requires proper Gmail app password setup

## 📊 Script Performance

### **Resource Usage:**
- **seedDatabase.js**: ~30 seconds for full database setup
- **liveTransactionGenerator.js**: 1 transaction per minute, minimal CPU usage
- **generateTransactions.js**: ~10 seconds for 1000 transactions
- **generateFraudTransactions.js**: ~5 seconds for 100 fraud transactions

### **Database Impact:**
- **seedDatabase.js**: Creates ~500 documents (users, transactions, rules, cases)
- **liveTransactionGenerator.js**: Adds 1 transaction per minute
- **generateTransactions.js**: Creates 1000 additional transactions
- **generateFraudTransactions.js**: Creates 100 fraud transactions

## 🔄 Maintenance

### **Regular Tasks:**
- Monitor live transaction generator logs
- Check email functionality monthly
- Update fraud patterns in generateFraudTransactions.js
- Backup transaction data using exportTransactions.js

### **Updates:**
- Scripts are designed to be idempotent (safe to re-run)
- Database seeding can be run multiple times safely
- Live transaction generator automatically handles token refresh
- All scripts include proper error handling and logging

---

**RiskVision Scripts** - Empowering financial institutions with intelligent fraud detection and comprehensive testing tools.
