import type { Request, Response, NextFunction } from "express";
import { executeTransfer, TransferError } from "../services/transfers.service.js";

export const createTransfer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fromAccountIdentifier, toAccountIdentifier, amount, currency, description } = req.body;

    if (typeof fromAccountIdentifier !== "string" || !fromAccountIdentifier.trim()) {
      return res.status(400).json({ error: "fromAccountIdentifier must be a non-empty string" });
    }

    if (typeof toAccountIdentifier !== "string" || !toAccountIdentifier.trim()) {
      return res.status(400).json({ error: "toAccountIdentifier must be a non-empty string" });
    }

    if (typeof amount !== "string" || !amount.trim()) {
      return res.status(400).json({ error: "amount must be a string" });
    }

    if (typeof currency !== "string" || !["PEN", "USD", "EUR"].includes(currency)) {
      return res.status(400).json({ error: "currency must be one of: PEN, USD, EUR" });
    }

    if (description !== undefined && typeof description !== "string") {
      return res.status(400).json({ error: "description must be a string if provided" });
    }

    const result = await executeTransfer({
      fromAccountIdentifier,
      toAccountIdentifier,
      amount,
      currency,
      description
    });

    res.status(201).json({
      data: result
    });
  } catch (error) {
    if (error instanceof Error && (error as TransferError).isTransferError) {
      return res.status((error as TransferError).statusCode).json({ error: error.message });
    }
    next(error);
  }
};
