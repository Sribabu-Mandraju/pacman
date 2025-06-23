const express = require("express");
const router = express.Router();
const User = require("../models/User");

router.post("/", async (req, res) => {
  const { telegram_id, name } = req.body;
  try {
    let user = await User.findOne({ telegram_id });
    if (user) {
      return res.json({ status: "success", data: user });
    } else {
      user = new User({ telegram_id, name });
      await user.save();
      return res.status(201).json({ status: "success", data: user });
    }
  } catch (err) {
    return res.status(500).json({ status: "error", message: err.message });
  }
});

router.put("/character", async (req, res) => {
  const { telegram_id, character } = req.body;
  try {
    const user = await User.findOneAndUpdate(
      { telegram_id },
      { $addToSet: { characters: character } },
      { new: true }
    );
    if (!user)
      return res
        .status(404)
        .json({ status: "error", message: "User not found" });
    return res.json({ status: "success", data: user });
  } catch (err) {
    return res.status(500).json({ status: "error", message: err.message });
  }
});

router.put("/wins", async (req, res) => {
  const { telegram_id, wins } = req.body;
  try {
    const user = await User.findOneAndUpdate(
      { telegram_id },
      { $inc: { no_of_wins: wins } },
      { new: true }
    );
    if (!user)
      return res
        .status(404)
        .json({ status: "error", message: "User not found" });
    return res.json({ status: "success", data: user });
  } catch (err) {
    return res.status(500).json({ status: "error", message: err.message });
  }
});

router.put("/progress", async (req, res) => {
  const { telegram_id, highScore, highest_level_reached } = req.body;
  try {
    const user = await User.findOne({ telegram_id });
    if (!user)
      return res
        .status(404)
        .json({ status: "error", message: "User not found" });

    if (highScore > user.highScore) {
      user.highScore = highScore;
    }
    if (highest_level_reached > user.highest_level_reached) {
      user.highest_level_reached = highest_level_reached;
    }

    await user.save();
    return res.json({ status: "success", data: user });
  } catch (err) {
    return res.status(500).json({ status: "error", message: err.message });
  }
});

module.exports = router;
