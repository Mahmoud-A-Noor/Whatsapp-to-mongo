require('dotenv').config();
const express = require('express');
const { client } = require('./services/whatsApp');
const { initializeDBConnection } = require('./config/db');
const messageRoutes = require('./routes/messageRoutes');

// Initialize DB and WhatsApp client
(async () => {
  await initializeDBConnection();
  console.log('DB initialized');
  await client.initialize();
  console.log('WhatsApp client initialized');
})();

const app = express();
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ limit: '15mb', extended: true }));

// Register chat/message-related routes (e.g., /save-message)
app.use('/', messageRoutes);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
