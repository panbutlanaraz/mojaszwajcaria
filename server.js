// voice_ai_callcenter_server/server.js

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Endpoint Twilio Voice Webhook
app.post('/voice', (req, res) => {
  const response = `<?xml version="1.0" encoding="UTF-8"?>
    <Response>
      <Start>
        <Stream url="wss://${process.env.RENDER_EXTERNAL_HOSTNAME}/stream" />
      </Start>
      <Say language="pl-PL" voice="Polly.Agnieszka">Witaj w Moja Szwajcaria. Proszę powiedzieć, w czym możemy pomóc.</Say>
      <Pause length="60"/>
    </Response>`;

  res.type('text/xml');
  res.send(response);
});

// Start serwera
app.listen(PORT, () => {
  console.log(`Voice AI Call Center server listening on port ${PORT}`);
});
