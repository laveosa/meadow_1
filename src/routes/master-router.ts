import { Router } from "express";

import usersRouter from "#src/routes/users-router.js";
import roomsRoutes from "#src/routes/rooms-routes.js";
import messagesRouter from "#src/routes/messages-router.js";

const masterRouter = Router();

masterRouter.use("/users", usersRouter as Router);
masterRouter.use("/rooms", roomsRoutes as Router);
masterRouter.use("/messages", messagesRouter as Router);

export default masterRouter;
