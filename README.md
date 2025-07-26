# Banking AI Coach

An AI-powered banking coach that helps users understand their spending patterns and make better financial decisions through intelligent transaction analysis and automated report generation.

## Features

- **Transaction Management**: Create and track financial transactions with contextual information
- **AI-Powered Analysis**: Generate relevant questions and insights based on transaction patterns
- **Report Generation**: Automated short reports and comprehensive life reports
- **Modular Architecture**: Clean, scalable codebase with separate modules
- **Database Integration**: PostgreSQL with Prisma ORM for robust data management

## Tech Stack

- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **AI**: Langchain with AWS Bedrock (Claude 3 Sonnet)
- **Containerization**: Docker for database setup

## Project Structure

```
src/
├── configs/
│   └── db.ts                 # Centralized Prisma client
├── entities/
│   ├── transaction.ts        # Transaction entity and types
│   ├── user.ts              # User entity
│   └── message.ts           # Message entity
└── modules/
    ├── transaction/
    │   ├── types.ts         # Module-specific type exports
    │   ├── service.ts       # Transaction business logic
    │   └── routes.ts        # Transaction API endpoints
    ├── messages/
    │   ├── types.ts         # Module-specific type exports
    │   ├── service.ts       # Message business logic
    │   └── routes.ts        # Message API endpoints
    ├── reports/
    │   ├── types.ts         # Report summary interfaces
    │   ├── service.ts       # Report generation logic
    │   └── routes.ts        # API endpoints
    └── ai/
        ├── types.ts         # AI-related types
        ├── service.ts       # AI service
        └── routes.ts        # AI endpoints
```

## Quick Start

For detailed setup instructions and API examples, see:
- **[Curl Examples](docs/curl-examples.md)** - Ready-to-use curl commands

### Basic Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Environment setup**:
   ```bash
   # Create .env file with database and OpenAI API key
   DATABASE_URL="postgresql://postgres:password@localhost:5432/banking_ai_coach?schema=public"
   OPENAI_API_KEY="your-openai-api-key"
   ```

3. **Database setup**:
   ```bash
   npm run db:generate
   npm run db:push
   npm run db:seed  # Creates test user and sample data
   ```

4. **Start development server**:
   ```bash
   npm run watch
   ```

## Database Schema

The application uses PostgreSQL with the following models:

### User Model
- **id**: UUID primary key
- **whatsAppId**: String field for WhatsApp integration
- **balance**: Decimal field for account balance

### Transaction Model
- **id**: UUID primary key
- **userId**: Foreign key to User
- **amount**: Decimal amount
- **category**: Transaction category
- **type**: TransactionType enum (CREDIT, DEBIT)
- **store_name**: Optional store name
- **isConversationClosed**: Boolean (default: false)
- **isReported**: Boolean (default: false)

### Message Model
- **id**: UUID primary key
- **userId**: Foreign key to User
- **text**: Message content

### ShortReport Model
- **id**: UUID primary key
- **userId**: Foreign key to User
- **summary**: JSON field for report data

### LifeReport Model
- **id**: UUID primary key
- **userId**: Unique foreign key to User (one-to-one)
- **summary**: JSON field for comprehensive life report data

## API Endpoints

### Transaction Endpoints

#### `POST /transactions`
Create a new transaction and get AI-generated context questions.

**Request Body**:
```json
{
  "amount": 25.50,
  "category": "Food & Dining",
  "store_name": "Restaurant Name"
}
```

**Response**:
```json
{
  "transaction": {
    "id": "uuid",
    "userId": "user-123",
    "amount": 25.50,
    "category": "Food & Dining",
    "type": "DEBIT",
    "date": "2024-01-01T12:00:00.000Z"
  },
  "contextQuestions": [
    "Was this for a special occasion or regular meal?",
    "Did you dine alone or with others?",
    "Would you consider this a necessary or discretionary expense?"
  ],
  "message": "Transaction created successfully..."
}
```

#### `POST /messages`
WhatsApp webhook

**Request Body**:
```json
{
  "text": "How much did I spend on food this month?"
}
```

### Report Endpoints

#### `POST /short-reports/:userId`
Generate a short report for a specific user.

**Response**:
```json
{
  "shortReport": {
    "id": "report-456",
    "userId": "user-123",
    "summary": {
      "totalTransactions": 15,
      "totalAmount": 1250.50,
      "creditAmount": 500.00,
      "debitAmount": 750.50,
      "categoryBreakdown": {
        "Food & Dining": 300.00,
        "Transportation": 150.50,
        "Entertainment": 200.00
      },
      "period": {
        "from": "2025-01-01T00:00:00Z",
        "to": "2025-01-25T00:00:00Z"
      }
    }
  },
  "message": "Short report generated successfully. AI analysis initiated in background."
}
```

#### `GET /short-reports/:userId`
Retrieve all short reports for a user.

### Other Endpoints

#### `GET /health`
Health check endpoint.

## Available Categories

- Food & Dining
- Groceries
- Transportation
- Gas & Fuel
- Shopping
- Entertainment
- Bills & Utilities
- Healthcare
- Education
- Travel
- Home & Garden
- Personal Care
- Gifts & Donations
- Business Services
- Fees & Charges
- Investments
- Income
- Transfer
- Other

## Architecture Benefits

- **Modular**: Each module is self-contained with its own routes, services, and types
- **Centralized Database**: Single Prisma client instance shared across modules
- **Clean Separation**: Entities are separate from business logic
- **Scalable**: Easy to add new modules or extend existing ones
- **Type-Safe**: Full TypeScript support with Prisma-generated types

## Report Generation Features

### Short Reports
- Analyze unreported transactions
- Calculate summary statistics (total amount, credit/debit breakdown)
- Category-wise spending analysis
- Time period coverage
- Automatic transaction marking as reported

### Life Reports
- Comprehensive financial analysis
- Long-term spending patterns
- Personalized insights and recommendations

## Development

### Database Management
```bash
# Generate Prisma client after schema changes
npm run db:generate

# Push schema changes to database
npm run db:push

# Reset database (development only)
npm run db:reset
```

### Testing
```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Next Steps

- Implement advanced AI analysis for reports
- Add user authentication and authorization
- Create web interface for better user experience
- Implement WhatsApp integration
- Add scheduled insights generation
- Enhance AI coaching capabilities
- Implement automated financial recommendations
