# WhatsApp Messages For Mongo

A Node.js-based backend service for sending and receiving bulk WhatsApp messages, storing all chat history in MongoDB. This project leverages WhatsApp Web automation for programmatic messaging, robust number validation, and media support, making it ideal for CRM, marketing, or chat archiving solutions.

---

## Features
- **Send bulk WhatsApp messages** (with optional media attachments)
- **All messages stored in MongoDB** as chat conversations (import-ready, chat-friendly format)
- **Robust international phone number validation**
- **Media support:** Send images, videos, and other files
- **QR code authentication** for WhatsApp Web
- **RESTful API endpoints** for integration

---

## Project Structure
```
Whatsapp-to-mongo/
├── controllers/      # Business logic (message handling)
├── models/           # Mongoose models (chat schema)
├── routes/           # Express API routes
├── services/         # WhatsApp client, helpers
├── utils/            # Validation, phone utils, helpers
├── config/           # Database and environment config
├── temp/             # Temporary file storage (media uploads)
├── server.js         # Main entry point
├── .env.example      # Example environment config
└── package.json      # Project dependencies and scripts
```

---

## Getting Started

### Prerequisites
- Node.js (v16 or higher recommended)
- MongoDB instance (local or remote)
- WhatsApp account (for QR authentication)

### Installation
1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd Whatsapp-to-mongo
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Configure environment variables:**
   - Copy `.env.example` to `.env` and set:
     - `MONGODB_URI` (MongoDB connection string)
     - `PORT` (server port, default 3000)
     - `EXECUTABLE_PATH` (optional: Chrome path for advanced media support)
4. **Start the server:**
   ```bash
   npm start
   ```
   - On first run, scan the QR code with your WhatsApp mobile app.

---

## API Endpoints

### `POST /send-bulk-messages`
Send a message (with optional media) to multiple WhatsApp numbers.
- **Body (form-data):**
  - `phoneNumbers`: JSON array of phone numbers (international format, e.g. `["+1234567890", "+1987654321"]`)
  - `message`: Text message (optional if sending media)
  - `file`: Media file (optional)

### `POST /send-message`
Send a single message (with optional media) to one number.
- **Body (form-data):**
  - `phoneNumber`: Phone number (international format)
  - `message`: Text message (optional if sending media)
  - `file`: Media file (optional)

### `POST /save-message`
Store a message in the database (used internally).

---

## Message Storage Format
Each chat document in MongoDB:
```json
{
  "contactNumber": "+1234567890",
  "messages": [
    {
      "waId": "...",           // WhatsApp message id
      "direction": "incoming", // or "outgoing"
      "body": "Hello!",
      "media": null,
      "mimeType": null,
      "timestamp": "2025-04-24T17:57:47.000Z",
      "ack": 2
    },
    ...
  ]
}
```

---

## Notes & Best Practices
- **Phone numbers must be in international format** (e.g., `+1234567890`).
- **QR code authentication required** on first run (scan with WhatsApp mobile app).
- **All messages (sent and received) are stored** in a chat-friendly structure in MongoDB.
- **Media files** are temporarily stored in `/temp` and deleted after sending.

---

## Technologies Used
- **Node.js** & **Express** (RESTful API)
- **whatsapp-web.js** (WhatsApp automation)
- **MongoDB** & **Mongoose** (NoSQL storage)
- **Multer** (file uploads)
- **dotenv** (environment config)
- **libphonenumber-js** (phone validation)

---

## License
This project is licensed under the ISC License.

---

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

---

## Disclaimer
This project is intended for educational and legitimate business use only. Use responsibly and in compliance with WhatsApp's Terms of Service.
