import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { Server } from "socket.io";
import express from "express";
import cors from "cors";

import { CONFIG } from "#src/config/app-config.js";
import FsService from "#src/utils/services/fs-service.js";
import type { RoomModel } from "#src/const/models/RoomModel.js";
import type { MessageModel } from "#src/const/models/MessageModel.js";
import type { UserModel } from "#src/const/models/UserModel.js";
import UsersDbService from "#src/services/users-db-service.js";

const app = express();
app.use(
  cors({
    origin: CONFIG.serverConf.origin,
  }),
);
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: CONFIG.serverConf.origin,
  },
});

const { usersPath, roomsPath, messagesPath } = CONFIG.dbConf;

// ============================================ API

app.get("/api/room/all", async (req, res) => {
  const rawData = await FsService.readFile(roomsPath);
  const rooms: RoomModel[] = JSON.parse(rawData);
  res.json(rooms);
});

app.get("/api/message/all", async (req, res) => {
  /*const rawData = await FsService.readFile(MESSAGES_PATH);
  const messages: MessageModel[] = JSON.parse(rawData);
  res.json(messages);*/
});

app.get("/api/user/all", async (req, res) => {
  const users: UserModel[] = UsersDbService;
  res.json(users);
});

// ============================================ WEB-SOCKET

io.on("connect", (socket) => {
  console.log(`${socket.id}: user is connected`);

  // ==================================================================== ACTION

  socket.on("add_user", (data) => {
    if (!data || !data.id) {
      socket.emit("error", `ERROR: user validation: ${data}`);
      return;
    }

    console.log("USER TO ADD: ", data);
  });

  socket.on("chat_message", (data) => {
    console.log("chat message: ", data);
  });

  // ==================================================================== ACTION

  socket.on("disconnect", () => {
    console.log(`${socket.id}: user was disconnected`);
  });
});

server.listen(CONFIG.serverConf.port, () =>
  console.log(`Server running on port: ${CONFIG.serverConf.port}`),
);
