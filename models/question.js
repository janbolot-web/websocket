const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
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
  questionType: {
    required: true,
    type: String,
  },
});

module.exports = questionSchema;