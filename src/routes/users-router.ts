import { Router } from "express";

import UsersDbService from "#src/services/users-db-service.js";
import { getRoutErrorMessageFunc } from "#src/utils/helpers/api-helper.js";
import type { UserModel } from "#src/const/models/UserModel.js";

const usersRouter = Router();
const onError = getRoutErrorMessageFunc("User Router");

usersRouter.get("/all", async (req, res, next) => {
  try {
    const users: UserModel[] = await UsersDbService.getAllUsers();

    if (!users) return res.status(404).json(onError("Error to get all users"));

    res.json(users);
  } catch (e) {
    next(e);
  }
});

usersRouter.get("/:id", async (req, res, next) => {
  const userId: number = parseInt(req.params.id, 10);

  if (isNaN(userId))
    return res.status(400).json(onError(`Invalid user ID:${userId}`));

  try {
    const user = await UsersDbService.getUserById(userId);

    if (!user)
      return res.status(404).json(onError(`Error to find user ID:${userId}`));

    res.json(user);
  } catch (e) {
    next(e);
  }
});

usersRouter.post("/", async (req, res, next) => {
  const bodyData: UserModel = JSON.parse(req.body);

  if (!bodyData) return res.status(400).json(onError("Invalid body data"));

  try {
    const user: UserModel = await UsersDbService.addUser(bodyData);

    if (!user) return res.status(404).json(onError("Error to add new user"));

    res.json(user);
  } catch (e) {
    next(e);
  }
});

usersRouter.put("/", async (req, res, next) => {
  const bodyData: UserModel = JSON.parse(req.body);

  if (!bodyData) return res.status(400).json(onError("Invalid body data"));

  try {
    const user: UserModel = await UsersDbService.updateUser(bodyData);

    if (!user)
      return res
        .status(404)
        .json(onError(`Error to updated user ID:${bodyData.id}`));

    res.json(user);
  } catch (e) {
    next(e);
  }
});

usersRouter.delete("/:id", async (req, res, next) => {
  const userId: number = parseInt(req.params.id, 10);

  if (isNaN(userId))
    return res.status(400).json(onError(`Invalid user ID:${userId}`));

  try {
    const user = await UsersDbService.removeUser(userId);

    if (!user)
      return res.status(404).json(onError(`Error to delete user ID:${userId}`));

    res.json(user);
  } catch (e) {
    next(e);
  }
});

export default usersRouter;
