const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5000/api';
const TEST_USER = {
  email: 'Emilia.Raynor33@hotmail.com',
  password: 'password123'
};

async function testTransactionAPI() {
  try {
    console.log('🔐 Step 1: Logging in to get token...');
    
    // Login to get token
    const loginResponse = await axios.post(`${BASE_URL}/users/login`, TEST_USER);
    const token = loginResponse.data.token;
    
    console.log('✅ Login successful!');
    console.log(`🔑 Token: ${token.substring(0, 50)}...`);
    
    // Test creating a transaction
    console.log('\n💳 Step 2: Creating test transaction...');
    
    const transactionData = {
      amount: Math.floor(Math.random() * 5000) + 100,
      customerName: 'Test Customer',
      country: 'United States'
    };
    
    const transactionResponse = await axios.post(`${BASE_URL}/transactions`, transactionData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Transaction created successfully!');
    console.log('📊 Transaction details:');
    console.log(`   Amount: $${transactionResponse.data.transaction.amount}`);
    console.log(`   Customer: ${transactionResponse.data.transaction.customerName}`);
    console.log(`   Country: ${transactionResponse.data.transaction.country}`);
    console.log(`   ML Fraud Detection: ${transactionResponse.data.transaction.isFraud ? 'FRAUD' : 'NOT FRAUD'}`);
    
    if (transactionResponse.data.alertGenerated) {
      console.log('🚨 Alert generated for this transaction!');
    }
    
    // Test getting all transactions
    console.log('\n📋 Step 3: Fetching all transactions...');
    
    const transactionsResponse = await axios.get(`${BASE_URL}/transactions`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log(`✅ Retrieved ${transactionsResponse.data.length} transactions`);
    
    // Show recent transactions
    const recentTransactions = transactionsResponse.data.slice(-5);
    console.log('\n📈 Recent transactions:');
    recentTransactions.forEach((tx, index) => {
      console.log(`${index + 1}. $${tx.amount} - ${tx.customerName} (${tx.country}) - Fraud: ${tx.isFraud}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 Token authentication failed. Possible solutions:');
      console.log('   1. Make sure the backend server is running');
      console.log('   2. Check if the user exists in the database');
      console.log('   3. Verify the password is correct');
    }
  }
}

// Run the test
testTransactionAPI();
