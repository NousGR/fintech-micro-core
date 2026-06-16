import "dotenv/config";
import express from "express";
import type { Request, Response, NextFunction } from "express";
import cors from "cors";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

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

const app = express();

const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (_req: Request, res: Response) => {
  res.json({
    service: "Fintech Micro-Core",
    status: "running",
    version: "0.1.0",
  });
});

app.get("/health", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await prisma.$queryRaw<{ now: Date }[]>`
      SELECT NOW() as now
    `;

    res.json({
      status: "ok",
      database: "connected",
      timestamp: result[0]?.now,
    });
  } catch (error) {
    next(error);
  }
});

app.get("/users", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      take: 10,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        email: true,
        documentNumber: true,
        firstName: true,
        lastName: true,
        phone: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        accounts: {
          select: {
            id: true,
            accountNumber: true,
            type: true,
            status: true,
            currency: true,
            balance: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    res.json({
      data: users,
    });
  } catch (error) {
    next(error);
  }
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: "Route not found",
  });
});

app.use(
  (error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error(error);

    res.status(500).json({
      error: "Internal server error",
    });
  }
);

const server = app.listen(PORT, () => {
  console.log(`Fintech Micro-Core running on http://localhost:${PORT}`);
});

const shutdown = async () => {
  console.log("Shutting down server...");

  await prisma.$disconnect();

  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
