const { faker } = require('@faker-js/faker');
const fs = require('fs');
const path = require('path');

// Configuration
const NUM_TRANSACTIONS = 1000;
const OUTPUT_FILE = path.join(__dirname, '../data/transactions.json');

// Risk patterns and thresholds
const RISK_PATTERNS = {
  HIGH_AMOUNT: 10000,
  SUSPICIOUS_COUNTRIES: ['Nigeria', 'Russia', 'North Korea', 'Iran', 'Syria'],
  UNUSUAL_TIMES: [0, 1, 2, 3, 4, 5, 22, 23], // Late night hours
  RAPID_TRANSACTIONS: 5, // Multiple transactions in short time
  SMALL_AMOUNTS: [1, 2, 5, 10, 15, 20], // Micro-transactions
  LARGE_AMOUNTS: [50000, 75000, 100000, 150000, 200000], // Large amounts
};

// Transaction types
const TRANSACTION_TYPES = [
  'purchase', 'transfer', 'withdrawal', 'deposit', 'payment',
  'refund', 'fee', 'interest', 'dividend', 'loan'
];

// Countries with risk levels
const COUNTRIES = {
  'United States': { risk: 0.1, currency: 'USD' },
  'Canada': { risk: 0.1, currency: 'CAD' },
  'United Kingdom': { risk: 0.15, currency: 'GBP' },
  'Germany': { risk: 0.12, currency: 'EUR' },
  'France': { risk: 0.13, currency: 'EUR' },
  'Australia': { risk: 0.11, currency: 'AUD' },
  'Japan': { risk: 0.08, currency: 'JPY' },
  'Singapore': { risk: 0.09, currency: 'SGD' },
  'Switzerland': { risk: 0.07, currency: 'CHF' },
  'Netherlands': { risk: 0.12, currency: 'EUR' },
  'Nigeria': { risk: 0.8, currency: 'NGN' },
  'Russia': { risk: 0.7, currency: 'RUB' },
  'Brazil': { risk: 0.4, currency: 'BRL' },
  'India': { risk: 0.3, currency: 'INR' },
  'China': { risk: 0.25, currency: 'CNY' },
  'Mexico': { risk: 0.35, currency: 'MXN' },
  'South Africa': { risk: 0.45, currency: 'ZAR' },
  'Turkey': { risk: 0.5, currency: 'TRY' },
  'Argentina': { risk: 0.6, currency: 'ARS' }
};

// Generate realistic transaction data
function generateTransactions() {
  const transactions = [];
  const userTransactionCounts = new Map();
  const userLastTransactionTime = new Map();

  for (let i = 0; i < NUM_TRANSACTIONS; i++) {
    const userId = faker.string.uuid();
    const timestamp = faker.date.between({
      from: '2024-01-01',
      to: '2024-12-31'
    });
    
    // Track user behavior for risk assessment
    const userCount = userTransactionCounts.get(userId) || 0;
    const lastTime = userLastTransactionTime.get(userId);
    const timeDiff = lastTime ? timestamp - lastTime : Infinity;
    
    // Update user tracking
    userTransactionCounts.set(userId, userCount + 1);
    userLastTransactionTime.set(userId, timestamp);

    // Generate amount based on risk patterns
    let amount = generateAmount(userCount, timeDiff);
    
    // Select country and assess risk
    const country = selectCountry();
    const riskScore = calculateRiskScore(amount, country, userCount, timeDiff, timestamp);
    
    // Generate transaction
    const transaction = {
      id: faker.string.uuid(),
      userId: userId,
      amount: amount,
      currency: country.currency,
      country: country.name,
      timestamp: timestamp.toISOString(),
      type: faker.helpers.arrayElement(TRANSACTION_TYPES),
      merchant: faker.company.name(),
      description: generateDescription(amount, country.name),
      riskScore: riskScore,
      isSuspicious: riskScore > 70,
      metadata: {
        ipAddress: faker.internet.ip(),
        deviceType: faker.helpers.arrayElement(['mobile', 'desktop', 'tablet']),
        browser: faker.helpers.arrayElement(['Chrome', 'Firefox', 'Safari', 'Edge']),
        userAgent: faker.internet.userAgent(),
        location: {
          latitude: faker.location.latitude(),
          longitude: faker.location.longitude()
        }
      }
    };

    transactions.push(transaction);
  }

  return transactions.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}

// Generate amount based on user behavior and risk patterns
function generateAmount(userCount, timeDiff) {
  const rand = Math.random();
  
  // High-risk patterns
  if (rand < 0.05) {
    // Large suspicious amounts
    return faker.helpers.arrayElement(RISK_PATTERNS.LARGE_AMOUNTS);
  } else if (rand < 0.1) {
    // Micro-transactions (potential money laundering)
    return faker.helpers.arrayElement(RISK_PATTERNS.SMALL_AMOUNTS);
  } else if (rand < 0.15) {
    // High amount threshold
    return faker.number.int({ min: RISK_PATTERNS.HIGH_AMOUNT, max: 50000 });
  } else if (userCount > 10 && timeDiff < 300000) { // 5 minutes
    // Rapid transactions
    return faker.number.int({ min: 100, max: 5000 });
  } else {
    // Normal transactions
    return faker.number.int({ min: 10, max: 5000 });
  }
}

// Select country with risk weighting
function selectCountry() {
  const countries = Object.entries(COUNTRIES);
  const weights = countries.map(([name, data]) => data.risk);
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  
  let random = Math.random() * totalWeight;
  for (let i = 0; i < countries.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return { name: countries[i][0], ...countries[i][1] };
    }
  }
  
  return { name: 'United States', ...COUNTRIES['United States'] };
}

// Calculate risk score based on multiple factors
function calculateRiskScore(amount, country, userCount, timeDiff, timestamp) {
  let score = 0;
  
  // Amount-based risk
  if (amount > RISK_PATTERNS.HIGH_AMOUNT) score += 30;
  if (amount > 50000) score += 20;
  if (RISK_PATTERNS.SMALL_AMOUNTS.includes(amount)) score += 25;
  
  // Country-based risk
  score += country.risk * 40;
  
  // Time-based risk (late night transactions)
  const hour = timestamp.getHours();
  if (RISK_PATTERNS.UNUSUAL_TIMES.includes(hour)) score += 15;
  
  // Frequency-based risk
  if (userCount > 20) score += 20;
  if (timeDiff < 60000) score += 30; // Less than 1 minute
  if (timeDiff < 300000) score += 15; // Less than 5 minutes
  
  // Random variation
  score += faker.number.int({ min: -5, max: 10 });
  
  return Math.min(100, Math.max(0, Math.round(score)));
}

// Generate realistic transaction description
function generateDescription(amount, country) {
  const descriptions = [
    `Online purchase from ${faker.company.name()}`,
    `Transfer to ${faker.person.fullName()}`,
    `Payment for ${faker.commerce.productName()}`,
    `ATM withdrawal at ${faker.location.city()}`,
    `Deposit from ${faker.company.name()}`,
    `International transfer to ${country}`,
    `Payment for ${faker.commerce.department()} services`,
    `Refund from ${faker.company.name()}`,
    `Subscription payment for ${faker.commerce.productName()}`,
    `Utility payment for ${faker.location.city()} services`
  ];
  
  return faker.helpers.arrayElement(descriptions);
}

// Generate and save the dataset
function main() {
  console.log('Generating realistic transaction dataset...');
  
  // Create data directory if it doesn't exist
  const dataDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  const transactions = generateTransactions();
  
  // Add dataset metadata
  const dataset = {
    metadata: {
      generatedAt: new Date().toISOString(),
      totalTransactions: transactions.length,
      dateRange: {
        start: transactions[0].timestamp,
        end: transactions[transactions.length - 1].timestamp
      },
      riskDistribution: {
        low: transactions.filter(t => t.riskScore < 30).length,
        medium: transactions.filter(t => t.riskScore >= 30 && t.riskScore < 70).length,
        high: transactions.filter(t => t.riskScore >= 70).length
      },
      suspiciousTransactions: transactions.filter(t => t.isSuspicious).length
    },
    transactions: transactions
  };
  
  // Save to file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(dataset, null, 2));
  
  console.log(`✅ Generated ${transactions.length} transactions`);
  console.log(`📊 Risk distribution:`, dataset.metadata.riskDistribution);
  console.log(`🚨 Suspicious transactions: ${dataset.metadata.suspiciousTransactions}`);
  console.log(`💾 Saved to: ${OUTPUT_FILE}`);
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { generateTransactions }; 