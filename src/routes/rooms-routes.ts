import { Router } from "express";

import RoomsDbService from "#src/services/rooms-db-service.js";
import { getRoutErrorMessageFunc } from "#src/utils/helpers/api-helper.js";
import type { RoomModel } from "#src/const/models/RoomModel.js";

const roomsRoutes = Router();
const onError = getRoutErrorMessageFunc("Rooms Router");

roomsRoutes.get("/all", async (req, res, next) => {
  try {
    const rooms: RoomModel[] = await RoomsDbService.getAllRooms();

    if (!rooms) return res.status(404).json(onError("Error to get all rooms"));

    res.json(rooms);
  } catch (e) {
    next(e);
  }
});

roomsRoutes.get("/:id", async (req, res, next) => {
  const roomId: number = parseInt(req.params.id, 10);

  if (isNaN(roomId))
    return res.status(400).json(onError(`Invalid room ID:${roomId}`));

  try {
    const room = await RoomsDbService.getRoomById(roomId);

    if (!room)
      return res.status(404).json({ error: `Error to find room ID:${roomId}` });

    res.json(room);
  } catch (e) {
    next(e);
  }
});

roomsRoutes.post("/", async (req, res, next) => {
  const bodyData: RoomModel = JSON.parse(req.body);

  if (!bodyData) return res.status(400).json(onError("Invalid body data"));

  try {
    const room: RoomModel = await RoomsDbService.addRoom(bodyData);

    if (!room) return res.status(404).json(onError("Error to add new room"));

    res.json(room);
  } catch (e) {
    next(e);
  }
});

roomsRoutes.put("/", async (req, res, next) => {
  const bodyData: RoomModel = JSON.parse(req.body);

  if (!bodyData) return res.status(400).json(onError("Invalid body data"));

  try {
    const room: RoomModel = await RoomsDbService.updateRoom(bodyData);

    if (!room)
      return res
        .status(404)
        .json(onError(`Error to updated room ID:${bodyData.id}`));

    res.json(room);
  } catch (e) {
    next(e);
  }
});

roomsRoutes.delete("/:id", async (req, res, next) => {
  const roomId: number = parseInt(req.params.id, 10);

  if (isNaN(roomId)) return res.status(400).json(onError("Invalid room id"));

  try {
    const room = await RoomsDbService.removeRoom(roomId);

    if (!room)
      return res.status(404).json(onError(`Error to delete room ID:${roomId}`));

    res.json(room);
  } catch (e) {
    next(e);
  }
});

export default roomsRoutes;
