import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";

const app = express();
const server = createServer(app);
const io = new Server(server);

const PORT = 5000;

app.get("api", (req, res) => {
  res.json({
    message: "hello",
  });
});

app.listen(PORT, () => console.log(`Server runing on prot: ${PORT}`));
