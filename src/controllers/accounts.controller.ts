import type { Request, Response, NextFunction } from "express";
import { prisma } from "../config/prisma.js";

export const getAccounts = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const accounts = await prisma.account.findMany({
      take: 10,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        accountNumber: true,
        type: true,
        status: true,
        currency: true,
        balance: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    res.json({
      data: accounts,
    });
  } catch (error) {
    next(error);
  }
};
