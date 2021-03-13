const mongoose = require('mongoose');

const messageSchema = mongoose.Schema({
  message: String
});

module.exports = mongoose.model('Message', messageSchema);