import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { createTransfer } from "../controllers/transfers.controller.js";

export const transfersRoutes: ExpressRouter = Router();

transfersRoutes.post("/", createTransfer);
