// voice_ai_callcenter_server/server.js

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Endpoint Twilio Voice Webhook
app.post('/voice', (req, res) => {
  const response = `<?xml version="1.0" encoding="UTF-8"?>
    <Response>
      <Start>
        <Stream url=\"wss://${process.env.RENDER_EXTERNAL_HOSTNAME}/stream\" />
      </Start>
      <Say language=\"pl-PL\" voice=\"Polly.Agnieszka\">Witaj w Moja Szwajcaria. Proszę powiedzieć, w czym możemy pomóc.</Say>
      <Pause length=\"60\"/>
    </Response>`;

  res.type('text/xml');
  res.send(response);
});

// Twilio Media Stream WebSocket
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/stream' });

wss.on('connection', (ws) => {
  console.log('🎧 Nowe połączenie głosowe z Twilio');
  let audioBuffer = [];

  ws.on('message', async (msg) => {
    const message = JSON.parse(msg);
    if (message.event === 'media') {
      const audioData = Buffer.from(message.media.payload, 'base64');
      audioBuffer.push(audioData);
    }
    if (message.event === 'stop') {
      console.log('🛑 Koniec rozmowy – analizuję...');

      const fullAudio = Buffer.concat(audioBuffer);
      const transcription = await transcribeAudio(fullAudio);
      const gptResponse = await askGPT(transcription);
      const audioUrl = await synthesizeVoice(gptResponse);

      console.log('🎤 AI odpowiedziało:', gptResponse);
      // tu możesz dodać wysyłanie odpowiedzi głosowej do klienta
    }
  });
});

async function transcribeAudio(buffer) {
  try {
    const response = await axios.post('https://api.openai.com/v1/audio/transcriptions',
      buffer,
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'audio/mpeg'
        },
        params: { model: 'whisper-1' }
      }
    );
    return response.data.text;
  } catch (err) {
    console.error('Błąd transkrypcji:', err.response?.data || err.message);
    return '';
  }
}

async function askGPT(prompt) {
  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'Jesteś doradcą Moja Szwajcaria, prowadź rozmowę naturalnie i sprzedażowo.' },
        { role: 'user', content: prompt }
      ]
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data.choices[0].message.content;
  } catch (err) {
    console.error('Błąd GPT:', err.response?.data || err.message);
    return 'Przepraszam, nie zrozumiałem.';
  }
}

async function synthesizeVoice(text) {
  // Tu możesz dodać Google TTS lub ElevenLabs
  console.log('🔊 [TTS] Symulacja mowy:', text);
  return null;
}

server.listen(PORT, () => {
  console.log(`Voice AI Call Center server listening on port ${PORT}`);
});
