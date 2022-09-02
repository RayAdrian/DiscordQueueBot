const mongoose = require('mongoose');

const reportSchema = mongoose.Schema({
  game: String,
  gameId: String,
  playerCount: Number
});

module.exports = mongoose.model('Report', reportSchema);