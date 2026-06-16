import express from "express";
import type { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import { healthRoutes } from "./routes/health.routes.js";
import { usersRoutes } from "./routes/users.routes.js";
import { accountsRoutes } from "./routes/accounts.routes.js";

export const app: Express = express();

app.use(cors());
app.use(express.json());

app.use("/", healthRoutes);
app.use("/users", usersRoutes);
app.use("/accounts", accountsRoutes);

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
