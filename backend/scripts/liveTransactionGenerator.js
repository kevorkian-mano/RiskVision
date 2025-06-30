const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const socketService = require('../services/socketService');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('📊 Connected to MongoDB for live transaction generation'))
  .catch(err => console.error('MongoDB connection error:', err));

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

// Countries for realistic transaction data
const countries = [
  'United States', 'Canada', 'United Kingdom', 'Germany', 'France', 
  'Australia', 'Japan', 'Singapore', 'Netherlands', 'Switzerland',
  'Nigeria', 'Russia', 'Ukraine', 'Belarus', 'Brazil', 'India', 
  'China', 'Mexico', 'South Africa', 'Argentina'
];

// Transaction amounts (with some high-risk amounts)
const amountRanges = [
  { min: 10, max: 100, weight: 40 },      // Small transactions
  { min: 100, max: 1000, weight: 30 },    // Medium transactions
  { min: 1000, max: 5000, weight: 20 },   // Large transactions
  { min: 5000, max: 15000, weight: 8 },   // High-risk transactions
  { min: 15000, max: 50000, weight: 2 }   // Very high-risk transactions
];

// Calculate risk score based on transaction characteristics
function calculateRiskScore(amount, country, timestamp) {
  let score = 0;
  
  // Amount-based risk
  if (amount > 10000) score += 30;
  if (amount > 50000) score += 20;
  if (amount < 20) score += 25; // Micro-transactions
  
  // Country-based risk
  const suspiciousCountries = ['nigeria', 'russia', 'ukraine', 'belarus', 'iran', 'syria', 'north korea'];
  if (suspiciousCountries.includes(country.toLowerCase())) {
    score += 40;
  }
  
  // Time-based risk (late night transactions)
  const hour = new Date(timestamp).getHours();
  if (hour >= 23 || hour <= 5) {
    score += 15;
  }
  
  // Random variation to make it more realistic
  score += Math.floor(Math.random() * 20) - 10;
  
  return Math.min(100, Math.max(0, Math.round(score)));
}

// Generate random amount based on weighted ranges
function generateAmount() {
  const totalWeight = amountRanges.reduce((sum, range) => sum + range.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const range of amountRanges) {
    random -= range.weight;
    if (random <= 0) {
      return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
    }
  }
  
  return Math.floor(Math.random() * 100) + 10; // Fallback
}

// Generate random country
function generateCountry() {
  return countries[Math.floor(Math.random() * countries.length)];
}

// Generate random customer name for transaction
function generateCustomerName() {
  return customerNames[Math.floor(Math.random() * customerNames.length)];
}

// Generate random user ID from existing users (for system tracking)
async function getRandomUserId() {
  const users = await User.find().select('_id');
  if (users.length === 0) {
    throw new Error('No users found in database. Please seed the database first.');
  }
  return users[Math.floor(Math.random() * users.length)]._id;
}

// Generate a single transaction
async function generateTransaction() {
  try {
    const userId = await getRandomUserId();
    const customerName = generateCustomerName();
    const amount = generateAmount();
    const country = generateCountry();
    const timestamp = new Date();
    
    // Calculate risk score
    const riskScore = calculateRiskScore(amount, country, timestamp);
    
    // Create transaction with customer name and timestamp
    const transaction = await Transaction.create({
      userId,
      customerName, // Add customer name field
      amount,
      country,
      timestamp,
      riskScore
    });
    
    // Populate user info for system tracking
    await transaction.populate('userId', 'name email');
    
    // Broadcast to WebSocket subscribers
    socketService.broadcastTransaction({
      ...transaction.toObject(),
      alertGenerated: riskScore > 70 // High risk transactions generate alerts
    });
    
    console.log(`💳 Generated transaction: $${amount} from ${country} by ${customerName} (Risk: ${riskScore})`);
    
    return transaction;
  } catch (error) {
    console.error('Error generating transaction:', error.message);
  }
}

// Generate transactions at exactly 1 per minute
function startLiveGeneration() {
  console.log('🚀 Starting live transaction generation...');
  console.log('📊 Transactions will be generated at exactly 1 per minute');
  console.log('🔌 Real-time updates will be broadcast via WebSocket');
  console.log('⏹️  Press Ctrl+C to stop\n');
  
  // Generate first transaction immediately
  generateTransaction();
    
  // Then generate every minute (60000 milliseconds)
  setInterval(async () => {
      await generateTransaction();
  }, 60000); // Exactly 1 minute
}

// Generate burst of transactions (for testing)
async function generateBurst(count = 5) {
  console.log(`💥 Generating burst of ${count} transactions...`);
  
  for (let i = 0; i < count; i++) {
    await generateTransaction();
    await new Promise(resolve => setTimeout(resolve, 500)); // 500ms between transactions
  }
  
  console.log(`✅ Burst generation complete!\n`);
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // Default: continuous generation at 1 per minute
    startLiveGeneration();
  } else if (args[0] === 'burst') {
    // Generate burst of transactions
    const count = parseInt(args[1]) || 5;
    await generateBurst(count);
    process.exit(0);
  } else if (args[0] === 'single') {
    // Generate single transaction
    await generateTransaction();
    process.exit(0);
  } else {
    console.log('Usage:');
    console.log('  node liveTransactionGenerator.js          # Start continuous generation (1 per minute)');
    console.log('  node liveTransactionGenerator.js burst    # Generate 5 transactions');
    console.log('  node liveTransactionGenerator.js burst 10 # Generate 10 transactions');
    console.log('  node liveTransactionGenerator.js single   # Generate 1 transaction');
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping live transaction generation...');
  process.exit(0);
});

// Start the generator
main().catch(console.error); 