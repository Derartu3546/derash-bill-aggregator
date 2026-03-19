import { http, HttpResponse } from "msw";

export const authHandlers = [

  http.post("/api/login", async () => {
    return HttpResponse.json({
      id: "1",
      name: "Admin User",
      role: "admin",
      token: "fake-jwt-token"
    });
  }),

];