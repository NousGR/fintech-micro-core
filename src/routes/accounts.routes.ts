import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { getAccounts } from "../controllers/accounts.controller.js";

export const accountsRoutes: ExpressRouter = Router();

accountsRoutes.get("/", getAccounts);
