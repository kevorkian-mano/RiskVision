const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('../models/User');

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

// List all users
async function listUsers() {
  console.log('👥 Listing all users in database...\n');
  
  const users = await User.find({}).select('name email role');
  
  if (users.length === 0) {
    console.log('❌ No users found in database');
    console.log('💡 Run: npm run seed-db to create users');
  } else {
    console.log(`✅ Found ${users.length} users:\n`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. Name: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log('');
    });
  }
}

// Main function
async function main() {
  try {
    await connectDB();
    await listUsers();
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to list users:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { listUsers };
