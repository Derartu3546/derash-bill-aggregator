import { http, HttpResponse } from "msw";

export const adminHandlers = [

  http.get("/admin/stats", () => {
    return HttpResponse.json({
      totalUsers: 120,
      totalAgents: 35,
      totalBillers: 12,
      totalTransactions: 5400
    });
  }),

  http.get("/admin/users", () => {
    return HttpResponse.json([
      { id: "1", name: "John Doe", email: "john@example.com", role: "Admin" },
      { id: "2", name: "Sara Agent", email: "sara@example.com", role: "Agent" },
      { id: "3", name: "Mike Biller", email: "mike@example.com", role: "Biller" }
    ]);
  })

];