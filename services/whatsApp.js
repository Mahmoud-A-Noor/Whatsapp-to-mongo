require('dotenv').config();
const mongoose = require('mongoose');
const { Client, RemoteAuth } = require('whatsapp-web.js');
const { MongoStore } = require('wwebjs-mongo');
const { saveMessage, updateMessageAck } = require('../services/whatapp-helper');
const { checkIsPrivateMessage, checkMedia } = require('../utils/messageUtils');
const { parsePhoneNumber } = require('../utils/phoneUtils');
const qrcode = require('qrcode-terminal');

const store = new MongoStore({ mongoose: mongoose });
const client = new Client({
    authStrategy: new RemoteAuth({
        store: store,
        backupSyncIntervalMs: 300000
    }),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        // add this in case you want to send videos and gifs
        // executablePath: process.env.EXECUTABLE_PATH
    }
});

client.on('remote_session_saved', () => {
    console.log('Remote session saved');
});

client.on('qr', (qr) => {
    console.log('QR Code:', qr);
    qrcode.generate(qr, { small: true });
});

client.on('ready', async() => {
    console.log('WhatsApp Web is ready');
});

client.on('message', async (message) => {
    try{
      if (!await checkIsPrivateMessage(message)){
        return;
      };

      let direction = message.fromMe ? 'outgoing' : 'incoming';
      let contactNumber;
      try {
        let number = message.from || message.to;
        contactNumber = parsePhoneNumber(number);
      } catch(error) {
        console.error(error);
        return;
      }

      let mediaInfo = await checkMedia(message);
      
      await saveMessage({
        contactNumber,
        direction,
        body: message.body || '',
        media: mediaInfo && mediaInfo.media ? mediaInfo.media.data : null,
        mimeType: mediaInfo && mediaInfo.media ? mediaInfo.media.mimetype : null,
        timestamp: message.timestamp ? new Date(message.timestamp * 1000) : new Date(),
        ack: message.ack,
        waId: message.id && message.id.id ? message.id.id : undefined,
        rawMessage: message
      });
      console.log('Message saved')
    }catch (error) {
      console.error('Error saving message:', error);
    }
});

client.on('message_ack', async (message, ack) => {
    try{
      if (await !checkIsPrivateMessage(message)) {
        return;
      }
      let contactNumber;
      try {
        contactNumber = parsePhoneNumber(message.from || message.to);
      } catch(error){
        console.error(error)
        return;
      }

      await updateMessageAck({
        contactNumber,
        messageId: message.id.id,
        ack
      });
    }catch (error) {
      console.error('Error updating message ack:', error);
    }
});

module.exports = { client };
