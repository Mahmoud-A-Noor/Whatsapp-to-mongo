const mongoose = require('mongoose');

// Each chat document represents a conversation with a contact
const messageSchema = new mongoose.Schema({
  waId: { type: String }, // WhatsApp message id
  direction: { type: String, enum: ['incoming', 'outgoing'], required: true },
  body: String,
  media: String,
  mimeType: String,
  timestamp: { type: Date, default: Date.now },
  ack: Number // WhatsApp acknowledgment status
});

const chatSchema = new mongoose.Schema({
  contactNumber: { type: String, required: true, unique: true },
  messages: [messageSchema]
});

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;
