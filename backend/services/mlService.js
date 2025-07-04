const axios = require('axios');

async function getFraudPrediction({ amount, country, timestamp }) {
  try {
    const hour = new Date(timestamp).getHours();
    const payload = { amount, country, hour };
    const response = await axios.post('http://localhost:8000/predict', payload);
    return response.data; // { isFraud: 0 or 1 }
  } catch (error) {
    console.error('ML API error:', error.message);
    return { isFraud: 0 }; // fallback: not fraud
  }
}

module.exports = { getFraudPrediction }; 