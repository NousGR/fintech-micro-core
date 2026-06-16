import type { Request, Response, NextFunction } from "express";
import { prisma } from "../config/prisma.js";

export const getServiceInfo = (_req: Request, res: Response) => {
  res.json({
    service: "Fintech Micro-Core",
    status: "running",
    version: "0.1.0",
  });
};

export const checkHealth = async (_req: Request, res: Response, next: NextFunction) => {
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
};
