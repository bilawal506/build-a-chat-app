import http from "http";
import fs from "fs";
import { WebSocketServer, WebSocket } from "ws";

const PORT = 3001;

const server = http.createServer((req, res) => {
  fs.readFile("./public/index.html", (err, data) => {
    if (err) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Error reading index.html");
      return;
    }

    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(data);
  });
});

const wss = new WebSocketServer({ server });

wss.on("connection", (socket, req) => {
  console.log("A client connected");

  const username = new URL(req.url, "http://localhost").searchParams.get(
    "username",
  );

  const systemMessage = JSON.stringify({
    type: "system",
    text: `${username} joined`
  });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(systemMessage);
    }
  });

  socket.on("message", (message) => {
    console.log("Client said:", message.toString());

    const data = JSON.parse(message.toString());

    const chatMessage = JSON.stringify({
      type: "chat",
      username: data.username,
      text: data.text
    });

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(chatMessage);
      }
    });
  });

  socket.on("close", () => {
    console.log("Client disconnected");

    const leftMessage = JSON.stringify({
      type: "system",
      text: `${username} left`
    });

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(leftMessage);
      }
    });
  });
});

server.listen(PORT, () => {
  console.log("Chat server running at http://localhost:3001");
});