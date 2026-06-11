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
import RoomsDbService from "#src/services/rooms-db-service.js";
import { SocketEventType } from "#src/const/enums/socket-event-type.js";
import type { RoomModel } from "#src/const/models/RoomModel.js";
import type { UserModel } from "#src/const/models/UserModel.js";
import type { MessageModel } from "#src/const/models/MessageModel.js";
import MessagesDbService from "#src/services/messages-db-service.js";

const app = express();
app.use(cors(SERVER_CONFIG.expressCors));
app.use(globalErrorHandler);
app.use("/api", masterRouter as Router);

const server = createServer(app);
const io = new Server(server, SERVER_CONFIG.socketIo);

const { usersEv, roomsEv, msgEv } = SocketEventType;
const REFRESH_GRACE_PERIOD_MS = 2000;

io.on("connect", (socket) => {
  console.log(`${socket.id}: user is connected`);

  //================================================================================= USERS

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
    socket.data = {
      user,
      room,
    };
    socket.join(room.name);
    socket.broadcast.to(room.name).emit(usersEv.updated, user);
    socket.emit(usersEv.added, user);

    // just another approach to send approval of successful new user adding to all including sender
    // io.to(room.name).emit("[USERS]:updated", user);
  });

  socket.on(usersEv.disconnected, async (user: UserModel) => {
    if (!user || !user.id)
      return socket.emit(usersEv.error, `ERROR: user validation: ${user}`);

    const room = (await RoomsDbService.getRoomById(user.roomId)) as RoomModel;

    if (!room)
      return socket.emit(
        usersEv.error,
        `ERROR: invalid room ID: ${user.roomId}`,
      );

    socket.data = {
      ...socket.data,
      isGracefulLogout: true,
    };

    await UsersDbService.removeUser(user.id);
    io.to(room.name).emit(usersEv.removed, user);
    socket.leave(room.name);
  });

  socket.on(usersEv.typing, async (user: UserModel) => {
    if (!user || !user.id)
      return socket.emit(usersEv.error, `ERROR: user validation: ${user}`);

    try {
      const room = (await RoomsDbService.getRoomById(user.roomId)) as RoomModel;

      if (!room)
        return socket.emit(
          usersEv.error,
          `ERROR: invalid room ID: ${user.roomId}`,
        );

      socket.broadcast.to(room.name).emit(usersEv.typing, user);
    } catch (error) {
      socket.emit(
        usersEv.error,
        "Internal server error during room migration.",
      );
    }
  });

  //================================================================================= MESSAGES

  socket.on(msgEv.newMsg, async (message: MessageModel) => {
    if (!message || !message.id || message.message.length === 0)
      return socket.emit(
        usersEv.error,
        `ERROR: message validation: ${message}`,
      );

    try {
      await MessagesDbService.addMessage(message);

      const roomMsg = (await MessagesDbService.getAllMessagesInRoom(
        message.roomId,
      )) as MessageModel[];

      io.to(message.rooName).emit(msgEv.updated, roomMsg);
    } catch (error) {
      socket.emit(
        usersEv.error,
        "Internal server error during room migration.",
      );
    }
  });

  //================================================================================= ROOMS

  socket.on(
    roomsEv.change,
    async ({ user, room }: { user: UserModel; room: RoomModel }) => {
      if (!user || !user.id)
        return socket.emit(usersEv.error, `ERROR: user validation: ${user}`);
      if (!room || !room.id)
        return socket.emit(usersEv.error, `ERROR: room validation: ${room}`);

      try {
        const freshUser = (await UsersDbService.getUserById(
          user.id,
        )) as UserModel;
        const oldRoom = (await RoomsDbService.getRoomById(
          user.roomId,
        )) as RoomModel;
        const selectedRoom = (await RoomsDbService.getRoomById(
          room.id,
        )) as RoomModel;

        if (!freshUser || !oldRoom || !selectedRoom)
          return socket.emit(
            usersEv.error,
            `ERROR: invalid data: ${user} ${room}`,
          );

        socket.leave(oldRoom.name);
        socket.broadcast.to(oldRoom.name).emit(usersEv.removed, freshUser);

        freshUser.roomId = selectedRoom.id;
        await UsersDbService.updateUser(freshUser);
        socket.data.user = freshUser;
        socket.data.room = selectedRoom;

        socket.join(selectedRoom.name);
        socket.broadcast.to(selectedRoom.name).emit(usersEv.updated, freshUser);
        socket.emit(usersEv.added, freshUser);

        console.log(
          `[ROOM SWITCH] ${freshUser.name} migrated to room: ${selectedRoom.name}`,
        );
      } catch (error) {
        console.error("CRITICAL: Error during room switch execution:", error);
        socket.emit(
          usersEv.error,
          "Internal server error during room migration.",
        );
      }
    },
  );

  // ==================================================================== DISCONNECT

  socket.on("disconnect", async () => {
    if (socket.data.isGracefulLogout) {
      console.log(`${socket.id}: Clean explicit logout. Skipping ghost sweep.`);
      return;
    }

    const userWhoLeft: UserModel | undefined = socket.data?.user;
    if (!userWhoLeft) return;

    console.log(
      `${socket.id}: Native pipeline dropped abruptly. Running ghost cleanup sweep...`,
    );

    setTimeout(async () => {
      try {
        const activeSockets = await io.fetchSockets();
        let isUserStillConnected = false;

        for (const s of activeSockets) {
          if (s.data?.user?.id === userWhoLeft.id) {
            isUserStillConnected = true;
            break;
          }
        }

        if (isUserStillConnected) {
          console.log(
            `[GHOST BUSTER] Smooth recovery! ${userWhoLeft.name} reconnected successfully. Record preserved.`,
          );
        } else {
          console.log(
            `[GHOST BUSTER] Grace period expired for ${userWhoLeft.name}. Purging orphan record.`,
          );

          await UsersDbService.removeUser(userWhoLeft.id);
          const room = (await RoomsDbService.getRoomById(
            userWhoLeft.roomId,
          )) as RoomModel;

          if (room) {
            io.to(room.name).emit(usersEv.removed, userWhoLeft);
          }
        }
      } catch (error) {
        console.error("Failed running precise ghost buster routine:", error);
      }
    }, REFRESH_GRACE_PERIOD_MS);
  });
});

server.listen(APP_CONFIG.serverConf.port, () =>
  console.log(`Server running on port: ${APP_CONFIG.serverConf.port}`),
);
