import "dotenv/config";
import { describe, it, expect, afterAll } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { prisma } from "../src/config/prisma.js";

describe("GET /health", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("should return HTTP 200 and health status details", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
    expect(response.body.database).toBe("connected");
    expect(typeof response.body.timestamp).toBe("string");
  });
});
