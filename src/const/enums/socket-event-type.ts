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
  roomsEv: {
    change: "[ROOM]:change",
    leave: "[ROOM]:leave",
    join: "[ROOM]:join",
  },
  msgEv: {
    newMsg: "[MSG]:new_message",
    updated: "[MSG]:updated",
  },
};
