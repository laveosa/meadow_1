import { Router } from "express";
import type { RoomModel } from "#src/const/models/RoomModel.js";

const roomsRoutes = Router();

roomsRoutes.get("/all", (req, res) => {
  const rooms: RoomModel[] = [];
  res.json(rooms);
});

export default roomsRoutes;
