import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Currency, AccountType } from "../generated/prisma/client.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined in .env");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log("Seeding database...");

  const userOne = await prisma.user.upsert({
    where: {
      email: "ana.demo@fintech.test",
    },
    update: {},
    create: {
      email: "ana.demo@fintech.test",
      passwordHash: "demo_hash_not_for_production",
      documentNumber: "70000001",
      firstName: "Ana",
      lastName: "Torres",
      phone: "+51900000001",
      accounts: {
        create: {
          accountNumber: "001-0000000001",
          type: AccountType.WALLET,
          currency: Currency.PEN,
          balance: "1500.00",
        },
      },
    },
    include: {
      accounts: true,
    },
  });

  const userTwo = await prisma.user.upsert({
    where: {
      email: "luis.demo@fintech.test",
    },
    update: {},
    create: {
      email: "luis.demo@fintech.test",
      passwordHash: "demo_hash_not_for_production",
      documentNumber: "70000002",
      firstName: "Luis",
      lastName: "Ramirez",
      phone: "+51900000002",
      accounts: {
        create: {
          accountNumber: "001-0000000002",
          type: AccountType.WALLET,
          currency: Currency.PEN,
          balance: "850.00",
        },
      },
    },
    include: {
      accounts: true,
    },
  });

  console.log("Seed completed:");
  console.log({
    users: [
      {
        id: userOne.id,
        email: userOne.email,
        accounts: userOne.accounts.length,
      },
      {
        id: userTwo.id,
        email: userTwo.email,
        accounts: userTwo.accounts.length,
      },
    ],
  });
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
