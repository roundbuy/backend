const { Paddle, Environment } = require('@paddle/paddle-node-sdk');

// Initialize Paddle client
const getPaddleClient = () => {
  const apiKey = process.env.PADDLE_API_KEY;
  const environment = process.env.PADDLE_ENVIRONMENT === 'production' 
    ? Environment.production 
    : Environment.sandbox;

  if (!apiKey) {
    throw new Error('PADDLE_API_KEY is not configured');
  }

  return new Paddle(apiKey, {
    environment
  });
};

module.exports = {
  getPaddleClient
};