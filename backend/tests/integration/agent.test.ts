import request from "supertest";
import { fastify } from "../../index";

describe("Agent API Integration", () => {
  beforeAll(async () => {
    await fastify.ready();
  });

  afterAll(async () => {
    await fastify.close();
  });

  it("should reject unauthenticated requests", async () => {
    const response = await request(fastify.server)
      .post("/api/v1/agent/confirm-payment")
      .send({
        billId: "some-id",
        amount: 999999,
        paymentMethod: "CASH",
      });

    expect(response.status).toBe(401);
  });
});
