import { prisma } from "../config/prisma.js";
import { Prisma } from "../../generated/prisma/client.js";

type TransferRequest = {
  fromAccountIdentifier: string;
  toAccountIdentifier: string;
  amount: string;
  currency: string;
  description?: string;
};

export class TransferError extends Error {
  public readonly isTransferError = true;
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = "TransferError";
  }
}

const isUUID = (str: string) => 
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);

const buildAccountWhere = (identifier: string) => {
  return isUUID(identifier) ? { id: identifier } : { accountNumber: identifier };
};

export const executeTransfer = async (data: TransferRequest) => {
  if (!["PEN", "USD", "EUR"].includes(data.currency)) {
    throw new TransferError(400, "Invalid currency");
  }

  let transferAmount: Prisma.Decimal;
  try {
    transferAmount = new Prisma.Decimal(data.amount);
  } catch (e) {
    throw new TransferError(400, "Invalid amount format");
  }

  if (transferAmount.lte(0)) {
    throw new TransferError(400, "Amount must be strictly greater than zero");
  }

  const [fromAccount, toAccount] = await Promise.all([
    prisma.account.findFirst({ where: buildAccountWhere(data.fromAccountIdentifier) }),
    prisma.account.findFirst({ where: buildAccountWhere(data.toAccountIdentifier) }),
  ]);

  if (!fromAccount || !toAccount) {
    throw new TransferError(404, "One or both accounts do not exist");
  }

  if (fromAccount.id === toAccount.id) {
    throw new TransferError(400, "Cannot transfer to the same account");
  }

  if (fromAccount.status !== "ACTIVE" || toAccount.status !== "ACTIVE") {
    throw new TransferError(409, "Both accounts must be ACTIVE");
  }

  if (fromAccount.currency !== toAccount.currency) {
    throw new TransferError(409, "Currency mismatch between source and destination accounts");
  }

  if (fromAccount.currency !== data.currency) {
    throw new TransferError(409, "Requested currency does not match account currency");
  }

  if (fromAccount.balance.lt(transferAmount)) {
    throw new TransferError(409, "Insufficient funds");
  }

  const description = data.description?.trim() || null;

  const result = await prisma.$transaction(async (tx) => {
    const updatedFromAccount = await tx.account.updateMany({
      where: {
        id: fromAccount.id,
        balance: { gte: transferAmount }
      },
      data: {
        balance: { decrement: transferAmount }
      }
    });

    if (updatedFromAccount.count === 0) {
      throw new TransferError(409, "Insufficient funds or account modified concurrently");
    }

    const sourceAccountUpdated = await tx.account.findUnique({ where: { id: fromAccount.id } });
    if (!sourceAccountUpdated) {
      throw new TransferError(500, "Failed to retrieve source account after update");
    }

    const updatedToAccount = await tx.account.update({
      where: { id: toAccount.id },
      data: { balance: { increment: transferAmount } }
    });

    const transfer = await tx.transfer.create({
      data: {
        fromAccountId: fromAccount.id,
        toAccountId: toAccount.id,
        amount: transferAmount,
        currency: data.currency as "PEN" | "USD" | "EUR",
        status: "COMPLETED",
        description: description,
      }
    });

    const debitTransaction = await tx.transaction.create({
      data: {
        accountId: fromAccount.id,
        transferId: transfer.id,
        type: "DEBIT",
        amount: transferAmount,
        currency: data.currency as "PEN" | "USD" | "EUR",
        balanceAfter: sourceAccountUpdated.balance,
      }
    });

    const creditTransaction = await tx.transaction.create({
      data: {
        accountId: toAccount.id,
        transferId: transfer.id,
        type: "CREDIT",
        amount: transferAmount,
        currency: data.currency as "PEN" | "USD" | "EUR",
        balanceAfter: updatedToAccount.balance,
      }
    });

    return {
      transfer,
      transactions: [debitTransaction, creditTransaction]
    };
  });

  return {
    id: result.transfer.id,
    amount: result.transfer.amount,
    currency: result.transfer.currency,
    status: result.transfer.status,
    fromAccountId: result.transfer.fromAccountId,
    toAccountId: result.transfer.toAccountId,
    createdAt: result.transfer.createdAt,
    transactions: result.transactions.map((t) => ({
      id: t.id,
      type: t.type,
      accountId: t.accountId,
      amount: t.amount,
      balanceAfter: t.balanceAfter
    }))
  };
};
