const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
  id: String,
  games: [String]
});

module.exports = mongoose.model('User', userSchema);