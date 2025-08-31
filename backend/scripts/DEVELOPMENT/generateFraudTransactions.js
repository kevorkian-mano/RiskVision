const { faker } = require('@faker-js/faker');
const fs = require('fs');
const path = require('path');

// Configuration
const NUM_FRAUD_TRANSACTIONS = 100;
const OUTPUT_FILE = path.join(__dirname, 'fraud_transactions.json');

// High-risk countries for fraud
const FRAUD_COUNTRIES = [
  'Nigeria', 'Russia', 'Ukraine', 'Belarus', 'Iran', 'Syria', 
  'North Korea', 'Venezuela', 'Myanmar', 'Cuba'
];

// Fraud patterns
const FRAUD_PATTERNS = {
  HIGH_AMOUNTS: [50000, 75000, 100000, 150000, 200000, 300000, 500000],
  MICRO_AMOUNTS: [1, 2, 5, 10, 15, 20], // Money laundering pattern
  SUSPICIOUS_AMOUNTS: [9999, 19999, 49999], // Just under thresholds
  UNUSUAL_HOURS: [0, 1, 2, 3, 4, 5, 22, 23], // Late night
  RAPID_INTERVALS: [1000, 2000, 5000] // Milliseconds between transactions
};

// Generate fraudulent transaction data
function generateFraudTransactions() {
  const transactions = [];
  const userTransactionCounts = new Map();
  const userLastTransactionTime = new Map();

  for (let i = 0; i < NUM_FRAUD_TRANSACTIONS; i++) {
    const userId = faker.string.uuid();
    const timestamp = faker.date.between({
      from: '2024-01-01',
      to: '2024-12-31'
    });
    
    // Track user behavior for fraud patterns
    const userCount = userTransactionCounts.get(userId) || 0;
    const lastTime = userLastTransactionTime.get(userId);
    const timeDiff = lastTime ? timestamp - lastTime : Infinity;
    
    // Update user tracking
    userTransactionCounts.set(userId, userCount + 1);
    userLastTransactionTime.set(userId, timestamp);

    // Generate amount based on fraud patterns
    let amount = generateFraudAmount(userCount, timeDiff);
    
    // Select high-risk country
    const country = faker.helpers.arrayElement(FRAUD_COUNTRIES);
    
    // Generate high risk score (fraudulent transactions)
    // const riskScore = generateFraudRiskScore(amount, country, userCount, timeDiff, timestamp);
    const riskScore = 80; // Placeholder for ML model
    
    // Generate transaction
    const transaction = {
      _id: faker.string.uuid(),
      userId: userId,
      amount: amount,
      country: country,
      timestamp: timestamp.toISOString(),
      riskScore: riskScore,
      __v: 0
    };

    transactions.push(transaction);
  }

  return transactions.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}

// Generate amount based on fraud patterns
function generateFraudAmount(userCount, timeDiff) {
  const rand = Math.random();
  
  if (rand < 0.3) {
    // Large suspicious amounts
    return faker.helpers.arrayElement(FRAUD_PATTERNS.HIGH_AMOUNTS);
  } else if (rand < 0.5) {
    // Micro-transactions (money laundering)
    return faker.helpers.arrayElement(FRAUD_PATTERNS.MICRO_AMOUNTS);
  } else if (rand < 0.7) {
    // Just under threshold amounts
    return faker.helpers.arrayElement(FRAUD_PATTERNS.SUSPICIOUS_AMOUNTS);
  } else if (userCount > 5 && timeDiff < 60000) { // Less than 1 minute
    // Rapid transactions
    return faker.number.int({ min: 1000, max: 10000 });
  } else {
    // Other suspicious amounts
    return faker.number.int({ min: 10000, max: 50000 });
  }
}

// Commented out: Rule-based fraud risk scoring (replaced by ML model)
/*
function generateFraudRiskScore(amount, country, userCount, timeDiff, timestamp) {
  let score = 80; // Start with base score of 80 for fraud
  
  // Amount-based risk
  if (amount > 100000) score += 5;
  if (FRAUD_PATTERNS.MICRO_AMOUNTS.includes(amount)) score += 3;
  if (FRAUD_PATTERNS.SUSPICIOUS_AMOUNTS.includes(amount)) score += 2;
  
  // Country-based risk (all are high-risk)
  score += 5;
  
  // Time-based risk (late night transactions)
  const hour = timestamp.getHours();
  if (FRAUD_PATTERNS.UNUSUAL_HOURS.includes(hour)) score += 3;
  
  // Frequency-based risk
  if (userCount > 10) score += 5;
  if (timeDiff < 30000) score += 5; // Less than 30 seconds
  if (timeDiff < 60000) score += 3; // Less than 1 minute
  
  // Random variation to create variety
  score += faker.number.int({ min: 0, max: 10 });
  
  return Math.min(100, Math.max(80, Math.round(score))); // Keep between 80-100
}
*/

// Get currency for country
function getCurrencyForCountry(country) {
  const currencies = {
    'Nigeria': 'NGN',
    'Russia': 'RUB',
    'Ukraine': 'UAH',
    'Belarus': 'BYN',
    'Iran': 'IRR',
    'Syria': 'SYP',
    'North Korea': 'KPW',
    'Venezuela': 'VES',
    'Myanmar': 'MMK',
    'Cuba': 'CUP'
  };
  return currencies[country] || 'USD';
}

// Generate fraud description
function generateFraudDescription(amount, country) {
  const descriptions = [
    `International transfer to ${country}`,
    `Payment for suspicious services`,
    `Transfer to unknown recipient`,
    `ATM withdrawal at ${faker.location.city()}`,
    `Online purchase from suspicious merchant`,
    `Payment for ${faker.commerce.productName()} (suspicious)`,
    `Transfer to ${faker.person.fullName()} in ${country}`,
    `Payment for ${faker.commerce.department()} (high risk)`,
    `International payment to ${country}`,
    `Suspicious transaction at ${faker.location.city()}`
  ];
  
  return faker.helpers.arrayElement(descriptions);
}

// Generate and save the dataset
function main() {
  console.log('Generating fraudulent transaction dataset...');
  
  const transactions = generateFraudTransactions();
  
  // Add dataset metadata
  const dataset = {
    metadata: {
      generatedAt: new Date().toISOString(),
      totalTransactions: transactions.length,
      fraudRate: 100, // All transactions are fraud
      dateRange: {
        start: transactions[0].timestamp,
        end: transactions[transactions.length - 1].timestamp
      },
      riskDistribution: {
        high: transactions.filter(t => t.riskScore >= 80).length,
        veryHigh: transactions.filter(t => t.riskScore >= 90).length
      }
    },
    transactions: transactions
  };
  
  // Save to file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(dataset, null, 2));
  
  console.log(`✅ Generated ${transactions.length} fraudulent transactions`);
  console.log(`📊 Risk distribution:`, dataset.metadata.riskDistribution);
  console.log(`💾 Saved to: ${OUTPUT_FILE}`);
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { generateFraudTransactions }; 