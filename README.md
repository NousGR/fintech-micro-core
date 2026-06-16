# Fintech Micro-Core

A backend-focused fintech project built with TypeScript, Express, Prisma and PostgreSQL.

The goal of this project is to build a small but solid financial core that models users, accounts, balances, transfers and transaction history. It is designed as a portfolio project, but the implementation follows backend practices used in real-world systems: typed code, database migrations, environment-based configuration, Dockerized persistence and a clear API foundation.

## Current Status

The project currently includes:

- Express API built with TypeScript
- PostgreSQL 16 running through Docker
- Prisma ORM with an initial migration
- Financial domain models for users, accounts, transfers and transactions
- Seed script with demo users and accounts
- Health check endpoint connected to the database
- Basic users endpoint for development verification
- pnpm-based dependency management
- GitHub-ready project structure

## Tech Stack

- Node.js
- TypeScript
- Express
- Prisma ORM
- PostgreSQL
- Docker
- pnpm

## Project Structure

```text
.
├── generated/
│   └── prisma/
├── prisma/
│   ├── migrations/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   └── index.ts
├── .env.example
├── .gitignore
├── package.json
├── pnpm-lock.yaml
├── prisma.config.ts
└── tsconfig.json
