import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { getUsers } from "../controllers/users.controller.js";

export const usersRoutes: ExpressRouter = Router();

usersRoutes.get("/", getUsers);
