const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const socketService = require('../services/socketService');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('📊 Connected to MongoDB for live transaction generation'))
  .catch(err => console.error('MongoDB connection error:', err));

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

// Generate random user ID from existing users
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
    const amount = generateAmount();
    const country = generateCountry();
    
    // Create transaction with timestamp
    const transaction = await Transaction.create({
      userId,
      amount,
      country,
      timestamp: new Date()
    });
    
    // Populate user info
    await transaction.populate('userId', 'name email');
    
    // Broadcast to WebSocket subscribers
    socketService.broadcastTransaction({
      ...transaction.toObject(),
      alertGenerated: false // Will be determined by risk engine
    });
    
    console.log(`💳 Generated transaction: $${amount} from ${country} by ${transaction.userId.name}`);
    
    return transaction;
  } catch (error) {
    console.error('Error generating transaction:', error.message);
  }
}

// Generate transactions at random intervals
function startLiveGeneration() {
  console.log('🚀 Starting live transaction generation...');
  console.log('📊 Transactions will be generated at random intervals (1-10 seconds)');
  console.log('🔌 Real-time updates will be broadcast via WebSocket');
  console.log('⏹️  Press Ctrl+C to stop\n');
  
  function generateNext() {
    const delay = Math.random() * 9000 + 1000; // 1-10 seconds
    
    setTimeout(async () => {
      await generateTransaction();
      generateNext(); // Schedule next transaction
    }, delay);
  }
  
  generateNext();
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
    // Default: continuous generation
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
    console.log('  node liveTransactionGenerator.js          # Start continuous generation');
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