import "dotenv/config";
import { app } from "./app.js";
import { prisma } from "./config/prisma.js";

const PORT = Number(process.env.PORT) || 3000;

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
