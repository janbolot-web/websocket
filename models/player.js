const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema({
  nickname: {
    type: String,
    trim: true,
  },
  socketID: {
    type: String,
  },
  points: {
    type: Number,
    default: 0,
  },
  hasAnswered: { type: Boolean, default: false },
  playerType: {
    required: true,
    type: String,
  },
  correctAnswer: {
    default: 0,
    type: String,
  },
});

module.exports = playerSchema;
