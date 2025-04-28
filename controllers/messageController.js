const { MessageMedia } = require('whatsapp-web.js');
const { parsePhoneNumber } = require('../utils/phoneUtils');
const fs = require('fs');
const { saveMessage: saveMessageService } = require('../services/whatapp-helper');


async function sendBulkMessages(req, res, client) {
    const { phoneNumbers, message } = req.body;
    const file = req.file;
    let phoneNumbersArray;
    try {
      phoneNumbersArray = JSON.parse(phoneNumbers);
    } catch {
      return res.status(400).send('Invalid phoneNumbers format.');
    }
    if (!Array.isArray(phoneNumbersArray) || phoneNumbersArray.length === 0) {
      return res.status(400).send('Phone numbers must be a non-empty array.');
    }
    if (!message && !file) {
      return res.status(400).send('At least one of message or media is required.');
    }
    try {
      let messageMedia = null;
      if (file) {
        messageMedia = MessageMedia.fromFilePath(file.path);
      }
      for (const phoneNumber of phoneNumbersArray) {
        let contactNumber;
        try {
          contactNumber = parsePhoneNumber(phoneNumber);
        } catch (err) {
          continue; // skip invalid numbers
        }
        const chatId = contactNumber.replace('+', '') + '@c.us';
        let sentMessage;
        if (messageMedia) {
          sentMessage = await client.sendMessage(chatId, messageMedia, { caption: message });
        } else {
          sentMessage = await client.sendMessage(chatId, message);
        }
        // Save outgoing message to DB, including WhatsApp message id
        await saveMessageService({
          contactNumber: contactNumber,
          direction: 'outgoing',
          body: message,
          media: messageMedia ? messageMedia.data : null,
          mimeType: messageMedia ? messageMedia.mimetype : null,
          timestamp: new Date(),
          ack: 1, // Sent to server
          waId: sentMessage.id && sentMessage.id.id ? sentMessage.id.id : undefined
        });
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      if (file) {
        fs.unlink(file.path, err => {
          if (err) console.error('Error deleting file:', err.message);
        });
      }
      return res.status(200).send({ success: true, message: 'Messages sent successfully' });
    } catch (error) {
      console.error('Error sending bulk messages:', error.message);
      return res.status(500).send('Failed to send messages: ' + error.message);
    }
};

async function saveMessage(req, res) {
  try {
    const { phoneNumber, message, media, mimeType, messageTimestamp, direction, ack } = req.body;
    if (!phoneNumber) return res.status(400).json({ error: 'phoneNumber required' });
    // Validate phone number
    const formattedNumber = parsePhoneNumber(phoneNumber);
    await saveMessageService({
      contactNumber: formattedNumber,
      direction: direction || 'incoming',
      body: message,
      media,
      mimeType,
      timestamp: messageTimestamp ? new Date(messageTimestamp) : new Date(),
      ack: typeof ack === 'number' ? ack : undefined
    });
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function sendSingleMessage(req, res, client) {
  try {
    const { phoneNumber, message } = req.body;
    let mediaId = null;
    let mediaMimeType = null;
    let mediaPath = null;
    if (!phoneNumber || !message) {
      return res.status(400).json({ error: 'phoneNumber and message are required' });
    }
    const formattedNumber = parsePhoneNumber(phoneNumber);
    let sentMessage;
    // Handle media if provided (via multipart/form-data)
    if (req.file) {
      mediaPath = req.file.path;
      mediaMimeType = req.file.mimetype;
      const mediaObj = MessageMedia.fromFilePath(mediaPath);
      sentMessage = await client.sendMessage(formattedNumber, mediaObj, { caption: message });
      // Optionally delete temp file after sending
      fs.unlink(mediaPath, err => { if (err) console.error('Error deleting file:', err.message); });
    } else {
      sentMessage = await client.sendMessage(formattedNumber, message);
    }
    // Save the sent message to DB
    await saveMessageService({
      contactNumber: formattedNumber,
      direction: 'outgoing',
      body: message,
      media: req.file ? fs.readFileSync(mediaPath, { encoding: 'base64' }) : null,
      mimeType: req.file ? mediaMimeType : null,
      timestamp: new Date(),
      ack: sentMessage.ack,
      waId: sentMessage.id.id,
      rawMessage: sentMessage
    });
    res.status(200).json({ success: true, id: sentMessage.id.id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = { sendBulkMessages, sendSingleMessage, saveMessage };

