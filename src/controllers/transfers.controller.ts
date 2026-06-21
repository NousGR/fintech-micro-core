import type { Request, Response, NextFunction } from "express";
import { executeTransfer, getRecentTransfers, TransferError, type GetTransfersFilters } from "../services/transfers.service.js";

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

export const listTransfers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit, status, accountIdentifier } = req.query;

    let parsedLimit: number | undefined;
    if (limit !== undefined) {
      if (typeof limit !== "string" || !/^\d+$/.test(limit)) {
        return res.status(400).json({ error: "limit must be a positive integer" });
      }
      parsedLimit = parseInt(limit, 10);
      if (parsedLimit < 1 || parsedLimit > 50) {
        return res.status(400).json({ error: "limit must be between 1 and 50" });
      }
    }

    let parsedStatus: "PENDING" | "COMPLETED" | "FAILED" | "REVERSED" | undefined;
    if (status !== undefined) {
      const validStatuses = ["PENDING", "COMPLETED", "FAILED", "REVERSED"];
      if (typeof status !== "string" || !validStatuses.includes(status)) {
        return res.status(400).json({ error: "status must be one of: PENDING, COMPLETED, FAILED, REVERSED" });
      }
      parsedStatus = status as "PENDING" | "COMPLETED" | "FAILED" | "REVERSED";
    }

    let parsedAccountIdentifier: string | undefined;
    if (accountIdentifier !== undefined) {
      if (typeof accountIdentifier !== "string" || !accountIdentifier.trim()) {
        return res.status(400).json({ error: "accountIdentifier must be a non-empty string" });
      }
      parsedAccountIdentifier = accountIdentifier.trim();
    }

    const filters: GetTransfersFilters = {};
    if (parsedLimit !== undefined) filters.limit = parsedLimit;
    if (parsedStatus !== undefined) filters.status = parsedStatus;
    if (parsedAccountIdentifier !== undefined) filters.accountIdentifier = parsedAccountIdentifier;

    const transfers = await getRecentTransfers(filters);

    res.status(200).json({ data: transfers });
  } catch (error) {
    if (error instanceof Error && (error as TransferError).isTransferError) {
      return res.status((error as TransferError).statusCode).json({ error: error.message });
    }
    next(error);
  }
};
