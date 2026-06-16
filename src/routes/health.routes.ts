import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { getServiceInfo, checkHealth } from "../controllers/health.controller.js";

export const healthRoutes: ExpressRouter = Router();

healthRoutes.get("/", getServiceInfo);
healthRoutes.get("/health", checkHealth);
