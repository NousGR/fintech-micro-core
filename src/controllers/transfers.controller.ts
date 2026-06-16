import type { Request, Response, NextFunction } from "express";
import { executeTransfer, TransferError } from "../services/transfers.service.js";

export const createTransfer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fromAccountIdentifier, toAccountIdentifier, amount, currency, description } = req.body;

    if (!fromAccountIdentifier || !toAccountIdentifier || !amount || !currency) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = await executeTransfer({
      fromAccountIdentifier,
      toAccountIdentifier,
      amount,
      currency,
      description
    });

    res.json({
      data: result
    });
  } catch (error) {
    if (error instanceof Error && (error as TransferError).isTransferError) {
      return res.status((error as TransferError).statusCode).json({ error: error.message });
    }
    next(error);
  }
};
