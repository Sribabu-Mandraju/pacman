const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  telegram_id: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  highScore: {
    type: Number,
    default: 0,
  },
  characters: {
    type: [String],
    default: [],
  },
  no_of_wins: {
    type: Number,
    default: 0,
  },
  highest_level_reached: {
    type: Number,
    default: 0,
  },
});

module.exports = mongoose.model("User", UserSchema);
