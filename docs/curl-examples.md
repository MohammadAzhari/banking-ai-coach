# API Curl Examples

## Setup
```bash
npm run db:seed
npm run watch
```

## Transactions

### Create Food Transaction
```bash
curl -X POST http://localhost:3000/transactions \
  -H "Content-Type: application/json" \
  -H "user-id: 550e8400-e29b-41d4-a716-446655440000" \
  -d '{
    "amount": 45.99,
    "category": "food",
    "type": "DEBIT",
    "storeName": "McDonald'\''s"
  }'
```

### Create Transportation Transaction
```bash
curl -X POST http://localhost:3000/transactions \
  -H "Content-Type: application/json" \
  -H "user-id: 550e8400-e29b-41d4-a716-446655440000" \
  -d '{
    "amount": 25.50,
    "category": "transportation",
    "type": "DEBIT",
    "storeName": "Uber"
  }'
```

### Create Shopping Transaction
```bash
curl -X POST http://localhost:3000/transactions \
  -H "Content-Type: application/json" \
  -H "user-id: 550e8400-e29b-41d4-a716-446655440000" \
  -d '{
    "amount": 89.99,
    "category": "shopping",
    "type": "DEBIT",
    "storeName": "Amazon"
  }'
```

### Create Bills Transaction
```bash
curl -X POST http://localhost:3000/transactions \
  -H "Content-Type: application/json" \
  -H "user-id: 550e8400-e29b-41d4-a716-446655440000" \
  -d '{
    "amount": 120.00,
    "category": "bills",
    "type": "DEBIT",
    "storeName": "Electric Company"
  }'
```

### Create Credit Transaction
```bash
curl -X POST http://localhost:3000/transactions \
  -H "Content-Type: application/json" \
  -H "user-id: 550e8400-e29b-41d4-a716-446655440000" \
  -d '{
    "amount": 2500.00,
    "category": "other",
    "type": "CREDIT",
    "storeName": "Salary Deposit"
  }'
```

## Messages

### Send Message
```bash
curl -X POST http://localhost:3000/messages \
  -H "Content-Type: application/json" \
  -H "user-id: 550e8400-e29b-41d4-a716-446655440000" \
  -d '{
    "text": "I ordered for more people this time"
  }'
```

### Send Follow-up Message
```bash
curl -X POST http://localhost:3000/messages \
  -H "Content-Type: application/json" \
  -H "user-id: 550e8400-e29b-41d4-a716-446655440000" \
  -d '{
    "text": "That was for a family dinner"
  }'
```

## Reports

### Generate Short Report
```bash
curl -X POST http://localhost:3000/reports \
  -H "Content-Type: application/json" \
  -H "user-id: 550e8400-e29b-41d4-a716-446655440000"
```

## Test Conversation Flow

### 1. Create a transaction (triggers AI conversation)
```bash
curl -X POST http://localhost:3000/transactions \
  -H "Content-Type: application/json" \
  -H "user-id: 550e8400-e29b-41d4-a716-446655440000" \
  -d '{
    "amount": 45.99,
    "category": "food",
    "type": "DEBIT",
    "storeName": "Starbucks"
  }'
```

### 2. Send follow-up message (related to transaction)
```bash
curl -X POST http://localhost:3000/messages \
  -H "Content-Type: application/json" \
  -H "user-id: 550e8400-e29b-41d4-a716-446655440000" \
  -d '{
    "text": "It was for a business meeting with my client"
  }'
```

### 3. Send unrelated message
```bash
curl -X POST http://localhost:3000/messages \
  -H "Content-Type: application/json" \
  -H "user-id: 550e8400-e29b-41d4-a716-446655440000" \
  -d '{
    "text": "Can you show me my spending report?"
  }'
```

### 4. Send message when no open conversations
```bash
curl -X POST http://localhost:3000/messages \
  -H "Content-Type: application/json" \
  -H "user-id: 550e8400-e29b-41d4-a716-446655440000" \
  -d '{
    "text": "Hello, I need help with my finances"
  }'
```

## Test Multiple Categories
```bash
# Food
curl -X POST http://localhost:3000/transactions -H "Content-Type: application/json" -H "user-id: 550e8400-e29b-41d4-a716-446655440000" -d '{"amount": 35.50, "category": "food", "type": "DEBIT", "storeName": "Pizza Hut"}'

# Transportation  
curl -X POST http://localhost:3000/transactions -H "Content-Type: application/json" -H "user-id: 550e8400-e29b-41d4-a716-446655440000" -d '{"amount": 15.75, "category": "transportation", "type": "DEBIT", "storeName": "Metro"}'

# Entertainment
curl -X POST http://localhost:3000/transactions -H "Content-Type: application/json" -H "user-id: 550e8400-e29b-41d4-a716-446655440000" -d '{"amount": 22.00, "category": "entertainment", "type": "DEBIT", "storeName": "Cinema"}'

# Shopping
curl -X POST http://localhost:3000/transactions -H "Content-Type: application/json" -H "user-id: 550e8400-e29b-41d4-a716-446655440000" -d '{"amount": 67.99, "category": "shopping", "type": "DEBIT", "storeName": "Target"}'

# Health
curl -X POST http://localhost:3000/transactions -H "Content-Type: application/json" -H "user-id: 550e8400-e29b-41d4-a716-446655440000" -d '{"amount": 45.00, "category": "health", "type": "DEBIT", "storeName": "Pharmacy"}'

# Education
curl -X POST http://localhost:3000/transactions -H "Content-Type: application/json" -H "user-id: 550e8400-e29b-41d4-a716-446655440000" -d '{"amount": 199.99, "category": "education", "type": "DEBIT", "storeName": "Online Course"}'

# Travel
curl -X POST http://localhost:3000/transactions -H "Content-Type: application/json" -H "user-id: 550e8400-e29b-41d4-a716-446655440000" -d '{"amount": 350.00, "category": "travel", "type": "DEBIT", "storeName": "Airline"}'
```
