const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Alert = require('../models/Alert');
const Case = require('../models/Case');
const Comment = require('../models/Comment');
const Evidence = require('../models/Evidence');
const Log = require('../models/Log');
const Rule = require('../models/Rule');

// Configuration
const NUM_USERS = 50;
const NUM_TRANSACTIONS = 200;
const NUM_RULES = 10;

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
}

// Generate test users
async function generateUsers() {
  console.log('👥 Generating users...');
  
  const users = [];
  const roles = ['admin', 'compliance', 'investigator', 'auditor'];
  
  for (let i = 0; i < NUM_USERS; i++) {
    const role = roles[Math.floor(Math.random() * roles.length)];
    const user = new User({
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password: await bcrypt.hash('password123', 10),
      role: role
    });
    users.push(user);
  }
  
  await User.insertMany(users);
  console.log(`✅ Generated ${users.length} users`);
  return users;
}

// Generate risk rules
async function generateRules() {
  console.log('📋 Generating risk rules...');
  
  const rules = [
    {
      name: 'High Amount Threshold',
      condition: 'amount > 10000',
      threshold: 10000,
      description: 'Flag transactions over $10,000'
    },
    {
      name: 'Suspicious Countries',
      condition: 'country in [Nigeria, Russia, Iran]',
      threshold: 0,
      description: 'Flag transactions from high-risk countries'
    },
    {
      name: 'Late Night Transactions',
      condition: 'hour(timestamp) in [0,1,2,3,4,5,22,23]',
      threshold: 0,
      description: 'Flag transactions during unusual hours'
    },
    {
      name: 'Rapid Transactions',
      condition: 'transactions_per_hour > 5',
      threshold: 5,
      description: 'Flag users with multiple transactions per hour'
    },
    {
      name: 'Micro Transactions',
      condition: 'amount < 20',
      threshold: 20,
      description: 'Flag suspicious micro-transactions'
    },
    {
      name: 'Large Amount',
      condition: 'amount > 50000',
      threshold: 50000,
      description: 'Flag very large transactions'
    },
    {
      name: 'International Transfer',
      condition: 'country != user_country',
      threshold: 0,
      description: 'Flag international transfers'
    },
    {
      name: 'New User High Amount',
      condition: 'user_age_days < 7 AND amount > 5000',
      threshold: 5000,
      description: 'Flag new users with high amounts'
    },
    {
      name: 'Unusual Device',
      condition: 'device_type != previous_device',
      threshold: 0,
      description: 'Flag transactions from new devices'
    },
    {
      name: 'High Frequency',
      condition: 'daily_transactions > 10',
      threshold: 10,
      description: 'Flag users with high daily transaction frequency'
    }
  ];
  
  await Rule.insertMany(rules);
  console.log(`✅ Generated ${rules.length} risk rules`);
  return rules;
}

// Generate transactions with risk assessment
async function generateTransactions(users) {
  console.log('💳 Generating transactions...');
  
  const transactions = [];
  const countries = ['United States', 'Canada', 'United Kingdom', 'Germany', 'France', 'Australia', 'Japan', 'Nigeria', 'Russia', 'Brazil'];
  
  // Customer names for transactions (separate from system users)
  const customerNames = [
    'John Smith', 'Sarah Johnson', 'Michael Brown', 'Emily Davis', 'David Wilson',
    'Lisa Anderson', 'Robert Taylor', 'Jennifer Martinez', 'William Garcia', 'Amanda Rodriguez',
    'James Lopez', 'Michelle White', 'Christopher Lee', 'Jessica Hall', 'Daniel Allen',
    'Ashley Young', 'Matthew King', 'Nicole Wright', 'Joshua Green', 'Stephanie Baker',
    'Andrew Adams', 'Rebecca Nelson', 'Kevin Carter', 'Laura Mitchell', 'Brian Perez',
    'Rachel Roberts', 'Steven Turner', 'Amber Phillips', 'Timothy Campbell', 'Megan Parker',
    'Jason Evans', 'Heather Edwards', 'Ryan Collins', 'Melissa Stewart', 'Jacob Morris',
    'Crystal Rogers', 'Eric Reed', 'Tiffany Cook', 'Stephen Morgan', 'Brandy Bell',
    'Gregory Murphy', 'Samantha Bailey', 'Frank Rivera', 'Vanessa Cooper', 'Raymond Richardson',
    'Tracy Cox', 'Lawrence Howard', 'Dawn Ward', 'Carlos Torres', 'Stacy Peterson'
  ];
  
  for (let i = 0; i < NUM_TRANSACTIONS; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const customerName = faker.helpers.arrayElement(customerNames);
    const amount = faker.number.int({ min: 10, max: 50000 });
    const country = faker.helpers.arrayElement(countries);
    const timestamp = faker.date.between({ from: '2024-01-01', to: '2024-12-31' });
    
    // Calculate risk score
    let riskScore = 0;
    if (amount > 10000) riskScore += 30;
    if (['Nigeria', 'Russia'].includes(country)) riskScore += 40;
    if (timestamp.getHours() < 6 || timestamp.getHours() > 22) riskScore += 15;
    riskScore += faker.number.int({ min: 0, max: 20 });
    
    const transaction = new Transaction({
      userId: user._id,
      customerName: customerName,
      amount: amount,
      country: country,
      timestamp: timestamp,
      riskScore: riskScore
    });
    
    transactions.push(transaction);
    
    // Create alert if risk score is high
    if (riskScore > 70) {
      const alert = new Alert({
        transactionId: transaction._id,
        reason: getAlertReason(amount, country, timestamp),
        riskScore: riskScore
      });
      await alert.save();
    }
  }
  
  await Transaction.insertMany(transactions);
  console.log(`✅ Generated ${transactions.length} transactions`);
  return transactions;
}

// Generate alert reason
function getAlertReason(amount, country, timestamp) {
  const reasons = [];
  if (amount > 10000) reasons.push('High amount');
  if (['Nigeria', 'Russia'].includes(country)) reasons.push('High-risk country');
  if (timestamp.getHours() < 6 || timestamp.getHours() > 22) reasons.push('Unusual time');
  return reasons.join(', ') || 'Suspicious activity';
}

// Generate sample cases
async function generateCases() {
  console.log('📁 Generating sample cases...');
  
  const alerts = await Alert.find().populate('transactionId');
  const complianceUsers = await User.find({ role: 'compliance' });
  const investigatorUsers = await User.find({ role: 'investigator' });
  
  for (let i = 0; i < Math.min(5, alerts.length); i++) {
    const alert = alerts[i];
    const complianceUser = faker.helpers.arrayElement(complianceUsers);
    const investigatorUser = faker.helpers.arrayElement(investigatorUsers);
    
    const case_ = new Case({
      alertId: alert._id,
      assignedTo: investigatorUser._id,
      status: faker.helpers.arrayElement(['Open', 'In Review', 'Escalated']),
      description: `Investigation case for suspicious transaction: ${alert.reason}`,
      timeline: [
        { action: 'Case created', user: complianceUser._id },
        { action: 'Investigator assigned', user: complianceUser._id }
      ]
    });
    
    await case_.save();
    
    // Add some comments
    const comment = new Comment({
      caseId: case_._id,
      userId: investigatorUser._id,
      text: 'Initial investigation started. Reviewing transaction details and user history.'
    });
    await comment.save();
    
    // Add some evidence
    const evidence = new Evidence({
      caseId: case_._id,
      filename: 'transaction_report.pdf',
      fileUrl: 'https://example.com/evidence/transaction_report.pdf',
      uploadedBy: investigatorUser._id
    });
    await evidence.save();
  }
  
  console.log('✅ Generated sample cases');
}

// Generate audit logs
async function generateLogs(users) {
  console.log('📝 Generating audit logs...');
  
  const logs = [];
  const actions = [
    'User login', 'Transaction created', 'Alert generated', 'Case created',
    'Investigator assigned', 'Case status updated', 'Comment added', 'Evidence uploaded'
  ];
  
  for (let i = 0; i < 100; i++) {
    const user = faker.helpers.arrayElement(users);
    const log = new Log({
      userId: user._id,
      action: faker.helpers.arrayElement(actions),
      details: { timestamp: new Date(), ip: faker.internet.ip() }
    });
    logs.push(log);
  }
  
  await Log.insertMany(logs);
  console.log(`✅ Generated ${logs.length} audit logs`);
}

// Main seeding function
async function seedDatabase() {
  try {
    await connectDB();
    
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await User.deleteMany({});
    await Transaction.deleteMany({});
    await Alert.deleteMany({});
    await Case.deleteMany({});
    await Comment.deleteMany({});
    await Evidence.deleteMany({});
    await Log.deleteMany({});
    await Rule.deleteMany({});
    
    // Generate data
    const users = await generateUsers();
    const rules = await generateRules();
    const transactions = await generateTransactions(users);
    await generateCases();
    await generateLogs(users);
    
    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Users: ${users.length}`);
    console.log(`   Rules: ${rules.length}`);
    console.log(`   Transactions: ${transactions.length}`);
    console.log(`   Alerts: ${await Alert.countDocuments()}`);
    console.log(`   Cases: ${await Case.countDocuments()}`);
    console.log(`   Logs: ${await Log.countDocuments()}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run the seeding
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase }; 