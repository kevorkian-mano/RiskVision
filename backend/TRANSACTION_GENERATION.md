# Transaction Generation Configuration

## Overview

The RiskVision system includes a live transaction generator that creates realistic transaction data for testing and demonstration purposes.

## Configuration

### Environment Variables

You can configure the transaction generation rate using environment variables:

```env
# Transaction generation interval in seconds (default: 60)
TRANSACTION_INTERVAL_SECONDS=60
```

### Examples

```env
# Generate 1 transaction per minute (default)
TRANSACTION_INTERVAL_SECONDS=60

# Generate 1 transaction every 30 seconds
TRANSACTION_INTERVAL_SECONDS=30

# Generate 1 transaction every 2 minutes
TRANSACTION_INTERVAL_SECONDS=120

# Generate 1 transaction every 5 minutes
TRANSACTION_INTERVAL_SECONDS=300
```

## Usage

### Start Live Generation

```bash
# Start with default interval (60 seconds = 1 per minute)
node scripts/liveTransactionGenerator.js

# Or set custom interval
TRANSACTION_INTERVAL_SECONDS=30 node scripts/liveTransactionGenerator.js
```

### Generate Test Bursts

```bash
# Generate 5 transactions quickly (for testing)
node scripts/liveTransactionGenerator.js burst

# Generate 10 transactions quickly
node scripts/liveTransactionGenerator.js burst 10
```

### Generate Single Transaction

```bash
# Generate just one transaction
node scripts/liveTransactionGenerator.js single
```

## Transaction Characteristics

Each generated transaction includes:

- **Amount**: Realistic amounts from $10 to $50,000
- **Country**: Mix of low-risk and high-risk countries
- **Customer Name**: Separate customer names (different from system users)
- **Risk Score**: Calculated based on amount, country, and time
- **System User**: Randomly selected from existing system users (for tracking)
- **Timestamp**: Current time when generated

## Customer Names

Transactions use separate customer names that are different from system users:
- System users: admin, compliance, investigator, auditor roles
- Customer names: John Smith, Sarah Johnson, Michael Brown, etc.

This separation ensures that transaction data represents actual customer transactions, not system user activities.

## Risk Scoring

Transactions are scored based on:

- **Amount**: Higher amounts = higher risk
- **Country**: Suspicious countries (Nigeria, Russia, etc.) = higher risk
- **Time**: Late night transactions = higher risk
- **Random variation**: ±10 points for realism

## Real-time Updates

Generated transactions are:

1. Saved to the database
2. Broadcast via WebSocket to connected clients
3. Displayed in real-time on the dashboard
4. Processed by the risk engine for alerts

## Stopping Generation

Press `Ctrl+C` to stop the live transaction generator gracefully.

## Notes

- The generator requires existing users in the database
- Run `npm run seed` first to populate the database
- High-risk transactions (score > 70) automatically generate alerts
- All transactions are broadcast to connected WebSocket clients
- Transactions are generated at exactly 1 per minute by default 