const express = require("express");
const http = require("http");
const mongoose = require("mongoose");

const app = express();

const port = process.env.PORT || 3000;

var server = http.createServer(app);
const Room = require("./models/room");
const playerSchema = require("./models/player");
var io = require("socket.io")(server);

app.use(express.json());

const DB =
  "mongodb+srv://janbolot:janbolot@cluster0.janqu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

io.on("connection", (socket) => {
  console.log("connected!");
  socket.on("createRoom", async ({ nickname, response }) => {
    try {
      const data = JSON.parse(response);
      let room = new Room();
      let player = {
        socketID: socket.id,
        nickname,
        playerType: "X",
        correctAnswer: "0",
      };
      room.players.push(player);
      room.questions = data.questions;
      room.time = data.time;
      room = await room.save();
      const roomId = room._id.toString();
      socket.join(roomId);
      var roomData = [{ room, playerId: socket.id }];
      io.to(roomId).emit("createRoomSuccess", roomData);
      // console.log('response');
    } catch (error) {
      console.log(error);
    }
  });
  socket.on("joinRoom", async ({ nickname, roomId }) => {
    try {
      if (!roomId.match(/^[0-9a-fA-F]{24}$/)) {
        socket.emit("errorOccured", "please enter a valid code room ID");
        return;
      }

      let room = await Room.findById(roomId);

      if (room.isJoin) {
        // Проверка на наличие игрока с тем же socketID
        let existingPlayer = room.players.find(
          (player) => player.socketID === socket.id
        );

        if (existingPlayer) {
          socket.emit(
            "errorOccured",
            "Player with this socketID already exists in the room"
          );
          return;
        }

        let player = {
          nickname,
          socketID: socket.id, // Уникальный socketID
          playerType: "O",
          correctAnswer: "0",
          points: 0, // Инициализация очков
        };
        socket.join(roomId);
        room.players.push(player);
        room = await room.save();
        // Отправка обновленного игрока и socketID клиенту
        var roomData = [{ room, playerId: socket.id }];
        io.to(roomId).emit("joinRoomSuccess", roomData);
        io.to(roomId).emit("updateRoom", room);
      } else {
        socket.emit(
          "errorOccured",
          "Игра уже началось, вы не можете присоединиться"
        );
        return;
      }
    } catch (error) {
      console.log(error);
    }
  });

  socket.on("startGame", async ({ roomId }) => {
    try {
      if (!roomId.match(/^[0-9a-fA-F]{24}$/)) {
        socket.emit("errorOccured", "please enter a valid code room ID");
        console.log("err");
        return;
      }
      let room = await Room.findById(roomId);
      room.isJoin = false;
      room = await room.save();
      var roomData = [{ room, playerId: null }];

      io.to(roomId).emit("updateRoom", room);
      console.log(roomId);
    } catch (error) {
      console.log(error);
    }
  });

  socket.on("tap", async ({ points, roomId, playerId, correct }) => {
    try {
      let room = await Room.findById(roomId);
      let player = room.players.find((player) => player.socketID === playerId);
      player.hasAnswered = true;
      console.log(player);

      if (correct) {
        if (player) {
          player.points = player.points + points;
          player.correctAnswer = player.correctAnswer + 1;
        } else {
          console.log("Player not found in the room");
          // res.status(404).json({ message: "Player not found in the room" });
        }
        var roomData = [{ room, playerId: null }];
        io.to(roomId).emit("updateRoom", room);
      }

      var roomData = [{ room, playerId: null }];
      io.to(roomId).emit("updateRoom", room);
      await room.save();

      // console.log(player);
      // let choice = room.turn.playerType;
      // if (room.turnIndex == 0) {
      //   room.turn = room.players[1];
      //   room.turnIndex = 1;
      // } else {
      //   room.turn = room.players[0];
      //   room.turnIndex = 0;
      // }
      // let player = await playerSchema.findOne({ socketID: "1qpCufsDBAVfqyGLAAAt" });
      // console.log(player);
      // room = await room.save();
      // io.to(roomId).emit("tapped", {
      //   index,
      //   choice,
      //   room,
      // });
    } catch (error) {
      console.log(error);
    }
  });
  socket.on("hasAnswers", async ({ roomId }) => {
    try {
      let room = await Room.findById(roomId);
      let player = room.players.find((player) => (player.hasAnswered = false));
      await room.save();
      io.to(roomId).emit("updateRoom", room);
    } catch (error) {
      console.log(error);
    }
  });

  socket.on("winner", async ({ winnerSocketId, roomId }) => {
    try {
      let room = await Room.findById(roomId);
      let player = room.players.find(
        (playerr) => playerr.socketID == winnerSocketId
      );
      player.points += 1;
      room = await room.save();

      if (player.points >= room.maxRounds) {
        io.to(roomId).emit("endGame", player);
      } else {
        io.to(roomId).emit("pointIncrease", player);
      }
    } catch (e) {
      console.log(e);
    }
  });
});

mongoose
  .connect(DB)
  .then(() => {
    console.log("Connection successfuly!");
  })
  .catch((e) => {
    console.log(e);
  });

server.listen(port, "0.0.0.0", () => {
  console.log("server started AIANA -" + port);
});
