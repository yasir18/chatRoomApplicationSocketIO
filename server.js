const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const formatMessage = require("./utils/messages");
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
} = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Set static folder
app.use(express.static(path.join(__dirname, "public")));

const botName = "ChatApp Bot";

// Run when client connects
io.on("connection", (socket) => {
  //console.log("hi");
  //console.log(socket);
  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    //to join particular room
    socket.join(user.room);

    // Welcome current user
    socket.emit(
      "message",
      formatMessage(botName, `Welcome to ChatApp, ${user.username} !`)
    );

    // Broadcast when a user connects
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage(botName, `${user.username} has joined the chat`)
      );

    // Send users and room info
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

  //socket.emit() -> to only the client connecting
  //socket.broadcast -> to all the clients except the user connecting
  //io.to -> all the clients in general

  // Listen for chatMessage
  socket.on("chatMessage", (msg) => {
    console.log(socket.id);
    const user = getCurrentUser(socket.id);
    console.log(user);
    io.to(user.room).emit("message", formatMessage(user.username, msg));
  });

  // Runs when client disconnects
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);

    if (user) {
      //I think we can write socket.broadcast().to , but since the current user left, it wont go that
      io.to(user.room).emit(
        "message",
        formatMessage(botName, `${user.username} has left the chat`)
      );

      // Send users and room info
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
