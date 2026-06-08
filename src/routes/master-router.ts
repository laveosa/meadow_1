import { Router } from "express";

import userRouter from "#src/routes/user-router.js";
import roomsRoutes from "#src/routes/rooms-routes.js";
import messagesRouter from "#src/routes/messages-router.js";

const masterRouter = Router();

masterRouter.use("/users", userRouter);
masterRouter.use("/rooms", roomsRoutes);
masterRouter.use("/messages", messagesRouter);

export default masterRouter;
