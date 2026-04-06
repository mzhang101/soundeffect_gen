import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

app.use(cors());
app.use(express.json());

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1/sound-generation';

app.post('/api/generate', async (req, res) => {
  const { text, modelId, durationSeconds, promptInfluence, loop, apiKey } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  if (!apiKey) {
    return res.status(400).json({ error: 'API key is required' });
  }

  try {
    const body = {
      text,
      model_id: modelId || 'eleven_text_to_sound_v2',
      prompt_influence: promptInfluence ?? 0.3,
    };

    if (durationSeconds && durationSeconds > 0) {
      body.duration_seconds = durationSeconds;
    }

    if (loop) {
      body.loop = true;
    }

    console.log('Proxying request to ElevenLabs:', { text: text.substring(0, 50), ...body, api_key: apiKey.substring(0, 10) + '...' });

    const response = await fetch(ELEVENLABS_API_URL, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', response.status, errorText);
      let errorDetail = errorText;
      try {
        const errorJson = JSON.parse(errorText);
        errorDetail = errorJson.detail?.message || errorJson.detail || errorText;
      } catch (e) {}
      return res.status(response.status).json({
        error: `ElevenLabs API error: ${response.status}`,
        details: errorDetail
      });
    }

    // ElevenLabs returns audio directly as binary MP3
    const audioBuffer = await response.arrayBuffer();
    console.log('ElevenLabs response received, audio size:', audioBuffer.byteLength, 'bytes');

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.byteLength,
    });
    return res.send(Buffer.from(audioBuffer));
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files in production
if (isProduction) {
  const staticPath = join(__dirname, '../dist');
  app.use(express.static(staticPath));

  // Handle client-side routing
  app.get('*', (req, res) => {
    res.sendFile(join(staticPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
