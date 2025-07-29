# API Curl Examples

## Transactions

### Create Food Transaction
```bash
curl -X POST http://localhost:3000/transactions \
  -H "Content-Type: application/json" \
  -H "user-id: 550e8400-e29b-41d4-a716-446655440000" \
  -d '{
    "amount": 25.99,
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
    "text": "it"
  }'
```

## Reports

### Generate Short Report
```bash
curl -X POST http://localhost:3000/reports/short \
  -H "Content-Type: application/json" \
  -H "user-id: 550e8400-e29b-41d4-a716-446655440000"
```