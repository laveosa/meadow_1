import { Router } from "express";

import UsersDbService from "#src/services/users-db-service.js";
import type { UserModel } from "#src/const/models/UserModel.js";

const userRouter = Router();

userRouter.get("/all", async (req, res) => {
  const users: UserModel[] = await UsersDbService.getAllUsers();
  res.json(users);
});

export default userRouter;
