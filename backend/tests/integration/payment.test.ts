import request from "supertest";
import { fastify } from "../../index";


describe("Payment Integration Flow", () => {
  beforeAll(async () => {
    await fastify.ready();
  });

  afterAll(async () => {
    await fastify.close();
  });

  it("should check if API is online", async () => {
    const response = await request(fastify.server).get("/");
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("online");
  });

  it("should return 404 for a non-existent reference", async () => {
    const response = await request(fastify.server)
      .get("/api/v1/agent/inquiry")
      .query({
        billReference: "NON_EXISTENT_REF",
        agentCode: "AGENT01",
      });

    
    expect(response.status).toBe(404);
  });

    

  it("should reject unauthenticated payment attempts with 401", async () => {
    const response = await request(fastify.server)
      .post("/api/v1/agent/confirm-payment")
      .send({
        billId: "some-id",
        amount: 10,
        paymentMethod: "CASH",
        agentId: "agent-123",
      });

    // Your middleware is correctly returning 401!
    expect(response.status).toBe(401);
  });
    

  it("should block admin reports with 403 when secret is missing", async () => {
    const response = await request(fastify.server).get(
      "/api/v1/admin/global-report",
    );

    // Your x-admin-secret middleware returns 403
    expect(response.status).toBe(403);
  });
});
