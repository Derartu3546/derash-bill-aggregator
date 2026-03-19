import { authHandlers } from "./auth.handlers";
import { adminHandlers } from "./admin.handlers";

export const handlers = [
  ...authHandlers,
  ...adminHandlers,
];