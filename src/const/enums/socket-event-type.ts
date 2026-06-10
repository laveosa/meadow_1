export const SocketEventType = {
  usersEv: {
    add: "[USERS]:add",
    added: "[USERS]:added _successful",
    updated: "[USERS]:updated",
    disconnected: "[USERS]:disconnected",
    removed: "[USERS]:removed",
    error: "[USERS]:error",
    typing: "[USERS]:typing",
  },
  roomsEv: {},
  msgEv: {
    newMsg: "[MSG]:new_message",
  },
};
