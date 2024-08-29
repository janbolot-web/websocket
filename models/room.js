const mongoose = require("mongoose");
const playerSchema = require("./player");

const roomSchema = new mongoose.Schema({
  occupncy: {
    type: Number,
    default: 2,
  },
  maxRounds: {
    type: Number,
    default: 6,
  },
  currentRound: {
    required: true,
    type: Number,
    default: 1,
  },
  players: [playerSchema],
  isJoin: {
    type: Boolean,
    default: true,
  },
  questions: [],
  playersCount: { type: Number, default: 0 },
  time: { type: String },
  turnIndex: {
    type: Number,
    default: 0,
  },
});

const roomModel = mongoose.model("Room", roomSchema);
module.exports = roomModel;
