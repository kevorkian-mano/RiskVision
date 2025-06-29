const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('📊 Connected to MongoDB for risk score update'))
  .catch(err => console.error('MongoDB connection error:', err));

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

// Update all existing transactions with risk scores
async function updateTransactionRiskScores() {
  try {
    console.log('🔄 Updating existing transactions with risk scores...');
    
    // Get all transactions without risk scores
    const transactions = await Transaction.find({ riskScore: { $exists: false } });
    console.log(`📊 Found ${transactions.length} transactions to update`);
    
    if (transactions.length === 0) {
      console.log('✅ All transactions already have risk scores');
      return;
    }
    
    let updatedCount = 0;
    
    for (const transaction of transactions) {
      const riskScore = calculateRiskScore(transaction.amount, transaction.country, transaction.timestamp);
      
      await Transaction.findByIdAndUpdate(transaction._id, { riskScore });
      updatedCount++;
      
      if (updatedCount % 100 === 0) {
        console.log(`✅ Updated ${updatedCount}/${transactions.length} transactions`);
      }
    }
    
    console.log(`✅ Successfully updated ${updatedCount} transactions with risk scores`);
    
    // Show some statistics
    const stats = await Transaction.aggregate([
      {
        $group: {
          _id: null,
          avgRiskScore: { $avg: '$riskScore' },
          maxRiskScore: { $max: '$riskScore' },
          minRiskScore: { $min: '$riskScore' },
          highRiskCount: { $sum: { $cond: [{ $gte: ['$riskScore', 70] }, 1, 0] } }
        }
      }
    ]);
    
    if (stats[0]) {
      console.log('\n📊 Risk Score Statistics:');
      console.log(`   Average Risk Score: ${Math.round(stats[0].avgRiskScore)}`);
      console.log(`   Highest Risk Score: ${stats[0].maxRiskScore}`);
      console.log(`   Lowest Risk Score: ${stats[0].minRiskScore}`);
      console.log(`   High Risk Transactions (>70): ${stats[0].highRiskCount}`);
    }
    
  } catch (error) {
    console.error('❌ Error updating risk scores:', error);
  }
}

// Run the update
updateTransactionRiskScores()
  .then(() => {
    console.log('✅ Risk score update complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Update failed:', error);
    process.exit(1);
  }); 