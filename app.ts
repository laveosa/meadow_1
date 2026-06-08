import { createServer } from "node:http";
import { Server } from "socket.io";
import express from "express";
import cors from "cors";

import { APP_CONFIG, SERVER_CONF } from "#src/config/app-config.js";
import masterRouter from "#src/routes/master-router.js";

const app = express();
app.use(cors(SERVER_CONF.expressCors));
app.use("/api", masterRouter);
const server = createServer(app);
const io = new Server(server, SERVER_CONF.socketIo);

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

server.listen(APP_CONFIG.serverConf.port, () =>
  console.log(`Server running on port: ${APP_CONFIG.serverConf.port}`),
);
