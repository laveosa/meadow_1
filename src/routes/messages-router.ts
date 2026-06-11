import { Router } from "express";

import { getRoutErrorMessageFunc } from "#src/utils/helpers/api-helper.js";
import MessagesDbService from "#src/services/messages-db-service.js";
import type { MessageModel } from "#src/const/models/MessageModel.js";

const messagesRouter = Router();
const onError = getRoutErrorMessageFunc("Messages Router");

messagesRouter.get("/all", async (req, res, next) => {
  try {
    const { roomId, userId } = req.query;
    let messages: MessageModel[];

    if (roomId) {
      const parsedRoomId = parseInt(roomId as string, 10);
      messages = await MessagesDbService.getAllMessagesInRoom(parsedRoomId);
    } else if (userId) {
      const parsedUserId = parseInt(userId as string, 10);
      messages = await MessagesDbService.getAllMessagesForUser(parsedUserId);
    } else {
      messages = await MessagesDbService.getAllMessages();
    }

    if (!messages)
      return res.status(404).json(onError("Error to get all messages"));

    res.json(messages);
  } catch (e) {
    next(e);
  }
});

messagesRouter.get("/:id", async (req, res, next) => {
  const messageId: number = parseInt(req.params.id, 10);

  if (isNaN(messageId))
    return res.status(400).json(onError(`Invalid message ID:${messageId}`));

  try {
    const message = await MessagesDbService.getMessageById(messageId);

    if (!message)
      return res
        .status(404)
        .json(onError(`Error to find message ID:${messageId}`));

    res.json(message);
  } catch (e) {
    next(e);
  }
});

messagesRouter.post("/", async (req, res, next) => {
  const bodyData: MessageModel = JSON.parse(req.body);

  if (!bodyData) return res.status(400).json(onError("Invalid body data"));

  try {
    const message: MessageModel = await MessagesDbService.addMessage(bodyData);

    if (!message)
      return res.status(404).json(onError("Error to add new message"));

    res.json(message);
  } catch (e) {
    next(e);
  }
});

messagesRouter.put("/", async (req, res, next) => {
  const bodyData: MessageModel = JSON.parse(req.body);

  if (!bodyData) return res.status(400).json(onError("Invalid body data"));

  try {
    const message: MessageModel =
      await MessagesDbService.updateMessage(bodyData);

    if (!message)
      return res
        .status(404)
        .json(onError(`Error to updated message ID:${bodyData.id}`));

    res.json(message);
  } catch (e) {
    next(e);
  }
});

messagesRouter.delete("/:id", async (req, res, next) => {
  const messageId: number = parseInt(req.params.id, 10);

  if (isNaN(messageId))
    return res.status(400).json(onError(`Invalid message ID:${messageId}`));

  try {
    const message = await MessagesDbService.removeMessage(messageId);

    if (!message)
      return res
        .status(404)
        .json(onError(`Error to delete message ID:${messageId}`));

    res.json(message);
  } catch (e) {
    next(e);
  }
});

export default messagesRouter;
