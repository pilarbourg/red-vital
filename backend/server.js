// HTTP + SOCKET.IO SERVER --> SEPARACIÓN DE RESPONSABILIDADES
require('dotenv').config();
const app = require("./app");
const { sequelize } = require("./db");
const { seedAll } = require("./seed");
const http = require("http");
const { Server } = require("socket.io");

const PORT = 3000;
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.set("io", io);

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);
  socket.on("disconnect", () => console.log("Socket disconnected:", socket.id));
});

sequelize.sync().then(async () => {
  console.log("Database synced");
  await seedAll();
  server.listen(PORT, () =>
    console.log(`Server listening on http://localhost:${PORT}`)
  );
});
