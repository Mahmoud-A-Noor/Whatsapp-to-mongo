const Chat = require('../models/Chat');

// Save a message (incoming or outgoing) to the chat collection
async function saveMessage({ contactNumber, direction, body, media, mimeType, timestamp, ack, waId, rawMessage }) {
  let finalWaId = waId;
  if (!finalWaId && rawMessage) {
    if (rawMessage.id && rawMessage.id.id) finalWaId = rawMessage.id.id;
    else if (rawMessage._data && rawMessage._data.id && rawMessage._data.id.id) finalWaId = rawMessage._data.id.id;
  }
  if (!finalWaId) {
    console.warn('No waId found for message:', { contactNumber, direction, body });
  }
  const message = { direction, body, media, mimeType, timestamp, ack };
  if (finalWaId) message.waId = finalWaId;
  let chat = await Chat.findOne({ contactNumber: contactNumber });
  if (!chat) {
    chat = new Chat({ contactNumber: contactNumber, messages: [message] });
    console.log('[saveMessage] Creating new chat document.');
  } else {
    // Deduplication logic: check for existing message with same waId and timestamp
    let exists = false;
    if (finalWaId && timestamp) {
      const existingMsg = chat.messages.find(m => m.waId === finalWaId && new Date(m.timestamp).getTime() === new Date(timestamp).getTime());
      if (existingMsg) {
        // Update fields if needed (e.g. ack)
        exists = true;
        existingMsg.ack = ack;
        existingMsg.body = body;
        existingMsg.media = media;
        existingMsg.mimeType = mimeType;
        existingMsg.direction = direction;
        existingMsg.timestamp = timestamp;
        console.log('[saveMessage] Updated existing message with same waId and timestamp.');
      }
    }
    if (!exists) {
      chat.messages.push(message);
      console.log('[saveMessage] Adding message to existing chat.');
    }
  }
  try {
    await chat.save();
    console.log('[saveMessage] Chat saved successfully.');
  } catch (err) {
    console.error('[saveMessage] Error saving chat:', err);
  }
}

// Update the ack status of an outgoing message by WhatsApp message ID (waId)
async function updateMessageAck({ contactNumber, messageId, ack }) {
  const chat = await Chat.findOne({ contactNumber: contactNumber });
  if (!chat) return;
  const msg = chat.messages.find(m => m.waId === messageId);
  if (msg) {
    msg.ack = ack;
    await chat.save();
  }
}

module.exports = { saveMessage, updateMessageAck };
