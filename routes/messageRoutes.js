const express = require('express');
const router = express.Router();
const multer = require('multer');
const { saveMessage, sendSingleMessage, sendBulkMessages } = require('../controllers/messageController');
const { client } = require('../services/whatsApp');

// configure multer for this router
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'temp/');
  },
  filename: function (req, file, cb) {
    const extension = require('path').extname(file.originalname);
    cb(null, `${Date.now()}${extension}`);
  },
});
const upload = multer({ storage: storage });

router.post('/save-message', saveMessage);

router.post('/send-message', upload.single('file'), (req, res) => sendSingleMessage(req, res, client));

router.post('/send-bulk-messages', upload.single('file'), (req, res) => sendBulkMessages(req, res, client));

module.exports = router;
