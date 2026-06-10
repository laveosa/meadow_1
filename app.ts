import { createServer } from "node:http";
import express, { Router } from "express";
import { Server } from "socket.io";
import cors from "cors";

import {
  APP_CONFIG,
  SERVER_CONFIG,
  globalErrorHandler,
} from "#src/config/app-config.js";
import masterRouter from "#src/routes/master-router.js";
import UsersDbService from "#src/services/users-db-service.js";
import type { RoomModel } from "#src/const/models/RoomModel.js";
import RoomsDbService from "#src/services/rooms-db-service.js";
import type { UserModel } from "#src/const/models/UserModel.js";
import { SocketEventType } from "#src/const/enums/socket-event-type.js";

const app = express();
app.use(cors(SERVER_CONFIG.expressCors));
app.use(globalErrorHandler);
app.use("/api", masterRouter as Router);
const server = createServer(app);
const io = new Server(server, SERVER_CONFIG.socketIo);

const { usersEv, msgEv } = SocketEventType;

io.on("connect", (socket) => {
  console.log(`${socket.id}: user is connected`);

  // ==================================================================== ACTION

  socket.on(usersEv.add, async (user: UserModel) => {
    if (!user || !user.id) {
      socket.emit(usersEv.error, `ERROR: User validation: ${user}`);
      return;
    }

    const room = (await RoomsDbService.getRoomById(user.roomId)) as RoomModel;

    if (!room) {
      socket.emit(usersEv.error, `ERROR: Invalid room ID: ${user.roomId}`);
      return;
    }

    await UsersDbService.addUser(user);
    (socket as any).userData = { ...user, roomName: room.name };
    socket.join(room.name);
    socket.broadcast.to(room.name).emit(usersEv.updated, user);
    socket.emit(usersEv.added, user);

    // just another approach to send approval of successful new user adding to all including sender
    // io.to(room.name).emit("[USERS]:updated", user);
  });

  socket.on(usersEv.disconnected, async (user: UserModel) => {
    if (!user || !user.id) {
      socket.emit(usersEv.error, `ERROR: user validation: ${user}`);
      return;
    }

    const room = (await RoomsDbService.getRoomById(user.roomId)) as RoomModel;

    if (!room) {
      socket.emit(usersEv.error, `ERROR: invalid room ID: ${user.roomId}`);
      return;
    }

    await UsersDbService.removeUser(user.id);
    io.to(room.name).emit(usersEv.removed, user);
    socket.leave(room.name);
  });

  socket.on(msgEv.newMsg, (data) => {
    console.log("chat message: ", data);
  });

  // ==================================================================== ACTION

  socket.on("disconnect", async () => {
    console.log(
      `${socket.id}: Native pipeline dropped abruptly. Running ghost cleanup sweep...`,
    );

    // TODO this logic need to be fixed (remove ghost users in json which is not exist in rooms any more)
    /*try {
      const databaseUsers = await UsersDbService.getAllUsers();
      if (!databaseUsers || databaseUsers.length === 0) return;

      const activeSockets = await io.fetchSockets();
      const activeUserIds = new Set<number>();

      activeSockets.forEach((s: any) => {
        if (s.userData?.id && !s.isGracefulLogout) {
          activeUserIds.add(s.userData.id);
        }
      });

      for (const dbUser of databaseUsers) {
        if (!activeUserIds.has(dbUser.id)) {
          console.log(
            `[GHOST BUSTER] Removing orphan user record: ${dbUser.name} (ID: ${dbUser.id})`,
          );

          try {
            await UsersDbService.removeUser(dbUser.id);

            const room = (await RoomsDbService.getRoomById(
              dbUser.roomId,
            )) as RoomModel;
            if (room) {
              io.to(room.name).emit(usersEv.removed, dbUser);
            }
          } catch (fileError) {
            console.warn(
              `[GHOST BUSTER] File write conflict bypassed for user ${dbUser.name}. Will clean up on next cycle.`,
            );
          }
        }
      }
    } catch (error) {
      console.error("Failed running ghost_buster routine safely:", error);
    }*/
  });
});

server.listen(APP_CONFIG.serverConf.port, () =>
  console.log(`Server running on port: ${APP_CONFIG.serverConf.port}`),
);
