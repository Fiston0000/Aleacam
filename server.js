const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, "public")));

// Gestion des rooms de 2
let waiting = null;

io.on("connection", (socket) => {
  console.log(`🟢 Utilisateur connecté : ${socket.id}`);

  // Attribution room
  let room;
  if (waiting) {
    room = waiting;
    socket.join(room);
    io.to(room).emit("message", { user: "Système", msg: "Un partenaire a rejoint la room." });
    waiting = null;
  } else {
    room = `room-${socket.id}`;
    socket.join(room);
    waiting = room;
  }

  // Messages
  socket.on("message", (msg) => {
    socket.to(room).emit("message", { user: "Partenaire", msg });
  });

  // Descriptions
  socket.on("description", (desc) => {
    socket.to(room).emit("description", desc);
  });

  // Boutons
  socket.on("skip", () => {
    io.to(room).emit("message", { user: "Système", msg: "L'autre utilisateur a passé." });
  });

  socket.on("stop", () => {
    socket.to(room).emit("message", { user: "Système", msg: "L'autre utilisateur a arrêté sa caméra." });
  });

  socket.on("play", () => {
    socket.to(room).emit("message", { user: "Système", msg: "L'autre utilisateur a relancé sa caméra." });
  });

  // Déconnexion
  socket.on("disconnect", () => {
    console.log(`🔴 Utilisateur déconnecté : ${socket.id}`);
    socket.to(room).emit("message", { user: "Système", msg: "L'autre utilisateur s'est déconnecté." });
    if (waiting === room) waiting = null;
  });
});

server.listen(PORT, () => {
  console.log(`✅ Serveur Aleacam lancé sur http://localhost:${PORT}`);
});
