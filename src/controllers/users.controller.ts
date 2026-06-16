import type { Request, Response, NextFunction } from "express";
import { prisma } from "../config/prisma.js";

export const getUsers = async (_req: Request, res: Response, next: NextFunction) => {
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
};
