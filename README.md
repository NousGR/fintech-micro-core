# Fintech Micro-Core

A backend portfolio project that implements a small financial core API. This project is educational and portfolio-oriented. It carefully models financial operations, but it is not a real banking system and is not designed for production use.

## Project Overview

The project provides a small financial core API for managing users, accounts, and transferring funds between them. It focuses on demonstrating ledger consistency, relational database schema design, and transactional processing.

## Current Features

- Relational database schema containing users, accounts, transfers, and transactions.
- Atomic transfer transactions with ledger entries (double-entry model).
- Input and state validation for currency matching, account statuses, and balance checks.
- Health monitoring endpoints.
- Seed data script for developer testing.
- Local PostgreSQL persistence using Docker.

## Tech Stack

- TypeScript
- Node.js
- Express
- Prisma ORM
- PostgreSQL
- Docker
- pnpm

## Project Structure

```text
.
├── prisma/
│   ├── migrations/         # Database migration history
│   ├── schema.prisma       # Prisma schema defining the database models
│   └── seed.ts             # Script to seed the database with test users and accounts
├── src/
│   ├── config/
│   │   └── prisma.ts       # Database client initialization
│   ├── controllers/
│   │   ├── accounts.controller.ts
│   │   ├── health.controller.ts
│   │   ├── transfers.controller.ts
│   │   └── users.controller.ts
│   ├── routes/
│   │   ├── accounts.routes.ts
│   │   ├── health.routes.ts
│   │   ├── transfers.routes.ts
│   │   └── users.routes.ts
│   ├── services/
│   │   └── transfers.service.ts  # Business logic for fund transfer
│   ├── app.ts              # Express application and routing setup
│   └── index.ts            # Entry point to start the HTTP server
├── .env.example            # Environment variables template
├── .gitignore
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── prisma.config.ts        # Prisma configurations
└── tsconfig.json           # TypeScript configuration
```

## Data Model Summary

The database uses PostgreSQL with the following relations:

- **User**: Represents a client. Stores basic details (first name, last name, document number, email, phone, status). Has a one-to-many relationship with accounts.
- **Account**: Represents a financial account. Holds a balance (with 4 decimal places precision), type (CHECKING, SAVINGS, WALLET), status (ACTIVE, FROZEN, CLOSED), currency (PEN, USD, EUR), and belongs to a single user.
- **Transfer**: Represents a payment or fund movement request between two accounts. Tracks from/to accounts, amount, currency, status (PENDING, COMPLETED, FAILED, REVERSED), description, and execution metadata.
- **Transaction**: Serves as the ledger. Every transfer creates a pair of transactions: a DEBIT for the sender's account and a CREDIT for the receiver's account. Tracks the amount, currency, and the balance of the account immediately after the transaction.

## API Endpoints

### Health Check

- `GET /` - Returns basic service metadata (name, status, version).
- `GET /health` - Performs a database query to verify database connection health.

### Users

- `GET /users` - Lists up to 10 users with their associated accounts, ordered by creation date.

### Accounts

- `GET /accounts` - Lists up to 10 accounts with their associated user details, ordered by creation date.

### Transfers

- `GET /transfers` - Lists the most recent transfers. Returns up to 20 records ordered by creation date descending. Each item includes the `id`, `amount`, `currency`, `status`, `description`, `processedAt`, `createdAt`, `fromAccount`, and `toAccount`. To protect sensitive data, the `fromAccount` and `toAccount` objects expose only their `id` and `accountNumber`.
- `POST /transfers` - Initiates a fund transfer from one account to another.

## Transfer Flow

The `POST /transfers` endpoint handles transferring funds between two accounts.

### Required Request Body

```json
{
  "fromAccountIdentifier": "string (UUID or account number)",
  "toAccountIdentifier": "string (UUID or account number)",
  "amount": "string (positive decimal amount)",
  "currency": "string (PEN, USD, or EUR)",
  "description": "string (optional)"
}
```

### Example Request

```json
{
  "fromAccountIdentifier": "001-000000000001",
  "toAccountIdentifier": "001-000000000002",
  "amount": "150.00",
  "currency": "PEN",
  "description": "Invoice payment"
}
```

### Successful Response Status

- **Status**: `201 Created`
- **Example Response**:
```json
{
  "data": {
    "id": "7b8e19ad-7b64-4e2b-be24-b1c28ab6c3a1",
    "amount": "150.0000",
    "currency": "PEN",
    "status": "COMPLETED",
    "fromAccountId": "8d3e215f-d239-44be-81dc-4927b140cd5d",
    "toAccountId": "f1d044ea-88f5-46aa-ab56-de7a898b1bde",
    "createdAt": "2026-06-18T08:15:00.000Z",
    "transactions": [
      {
        "id": "2b3149c0-67df-4be2-a567-9c9820f18bdc",
        "type": "DEBIT",
        "accountId": "8d3e215f-d239-44be-81dc-4927b140cd5d",
        "amount": "150.0000",
        "balanceAfter": "1350.0000"
      },
      {
        "id": "89df1a23-4b71-46da-bc81-229dcf1082bd",
        "type": "CREDIT",
        "accountId": "f1d044ea-88f5-46aa-ab56-de7a898b1bde",
        "amount": "150.0000",
        "balanceAfter": "1000.0000"
      }
    ]
  }
}
```

### Main Validations

The service performs several checks before completing a transfer:

- **Account existence**: Both source and destination accounts must exist.
- **Active accounts**: Both accounts must be in the `ACTIVE` status.
- **Matching currency**: The requested currency must match the currency of both accounts.
- **Positive decimal string amount**: The amount must be a valid positive number represented as a string.
- **Max 4 decimal places**: The amount cannot exceed four decimal places of precision.
- **Sufficient funds**: The source account must have enough balance to cover the transfer amount.
- **No self-transfers**: Transfers between the same account are blocked.

### Ledger Behavior

All changes run inside a database transaction to ensure consistency:

- The source account balance is decremented.
- The destination account balance is incremented.
- A `Transfer` record is saved with status `COMPLETED`.
- One `DEBIT` transaction record is created for the source account with the new balance.
- One `CREDIT` transaction record is created for the destination account with the new balance.

## Local Development

Follow these steps to run the application in a local environment:

1. **Spin up the database**:
   Run the PostgreSQL container using the docker-compose file in the infrastructure folder:
   ```bash
   docker compose -f ../docker-infra/docker-compose.yml up -d
   ```

2. **Configure environment variables**:
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   Note: The database connection URL password inside `.env` must match the password in the database container configuration (`super_secure_password_123`).

3. **Install dependencies**:
   ```bash
   pnpm install
   ```

4. **Run database migrations**:
   Apply migrations to create database tables:
   ```bash
   pnpm exec prisma migrate dev
   ```

5. **Seed the database**:
   Populate the database with test users and accounts:
   ```bash
   pnpm seed
   ```

6. **Start the application**:
   Start the development server with live reload:
   ```bash
   pnpm dev
   ```

## Environment Variables

- `DATABASE_URL`: Connection string for PostgreSQL (e.g., `postgresql://fintech_admin:super_secure_password_123@localhost:5432/fintech_core?schema=public`).
- `PORT`: Port on which the Express server listens (defaults to `3000`).

## Useful Scripts

- `pnpm dev`: Runs the application in development mode with `tsx watch`.
- `pnpm start`: Runs the application using `tsx`.
- `pnpm seed`: Seeds the database with test data.
- `pnpm prisma:studio`: Opens Prisma Studio GUI in the browser.
- `pnpm prisma:status`: Checks the current database migration status.

## Roadmap

- Implement user authentication and session management.
- Allow users to open multiple accounts.
- Add support for cross-currency transfers and exchange rates.
- Implement idempotency keys to prevent duplicate transfer requests.
- Add search and page controls to GET endpoints.
- Set up integration and unit test coverage.

## Disclaimer

This project is an educational and portfolio-oriented backend. While financial operations and ledger logic are designed carefully, it is not a real banking system and lacks the security certifications and auditing capabilities required for actual operations.
