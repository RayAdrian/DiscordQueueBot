const mongoose = require('mongoose');

const quoteSchema = mongoose.Schema({
  message: String
});

module.exports = mongoose.model('Quote', quoteSchema);