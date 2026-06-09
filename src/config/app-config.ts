import { pathResolve } from "#src/utils/helpers/quick-helper.js";

export const APP_CONFIG = {
  serverConf: {
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
    origin: process.env.ORIGIN || "http://localhost:8080",
  },
  dbConf: {
    roomsPath: pathResolve(process.env.DB_ROOMS_PATH || "./db/rooms.json"),
    usersPath: pathResolve(process.env.DB_USERS_PATH || "./db/users.json"),
    messagesPath: pathResolve(
      process.env.DB_MESSAGES_PATH || "./db/messages.json",
    ),
  },
} as const;

export const SERVER_CONF = {
  expressCors: {
    origin: APP_CONFIG.serverConf.origin,
  },
  socketIo: {
    cors: {
      origin: APP_CONFIG.serverConf.origin,
    },
  },
} as const;

export function globalErrorHandler(err: any, req: any, res: any, next: any) {
  console.error("GLOBAL SERVER ERROR LAYER:", err.stack || err);

  res.status(err.status || 500).json({
    error: err.name || "InternalServerError",
    message: err.message || "An unexpected error occurred on the server.",
  });
}
