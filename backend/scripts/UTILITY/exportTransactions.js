const mongoose = require('mongoose');
const fs = require('fs');
const Transaction = require('../models/Transaction'); // Adjust path if needed

const MONGO_URI = 'mongodb://localhost:27017/riskvision'; // Update this to your DB name

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

mongoose.connection.once('open', async () => {
  try {
    const transactions = await Transaction.find({});
    fs.writeFileSync('transactions.json', JSON.stringify(transactions, null, 2));
    console.log('Exported', transactions.length, 'transactions.');
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.connection.close();
  }
}); 