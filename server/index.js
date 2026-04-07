/* global process, Buffer */

import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';
const ELEVENLABS_KEY_ENV_CANDIDATES = [
  'ELEVENLABS_API_KEY',
  'ELEVEN_LABS_API_KEY',
  'VITE_ELEVENLABS_API_KEY',
];

function resolveElevenLabsConfig() {
  for (const name of ELEVENLABS_KEY_ENV_CANDIDATES) {
    const value = String(process.env[name] || '').trim();
    if (value && !value.startsWith('your_')) {
      return {
        key: value,
        source: name,
      };
    }
  }

  return {
    key: '',
    source: null,
  };
}

app.use(cors());
app.use(express.json());

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1/sound-generation';
const MINIMAX_API_URL = process.env.VITE_LLM_API_ENDPOINT || 'https://api.minimax.chat/v1/text/chatcompletion_v2';
const MINIMAX_MODEL = process.env.VITE_LLM_MODEL || 'MiniMax-M2.7';
const SYSTEM_PROMPT = `你是一位音效设计师。用户输入中文音效描述，将其翻译并扩展为简洁的英文音效提示词。

规则：
- 保持简洁，1-2句话
- 添加具体细节（材质、空间、氛围）
- 可组合多个声音元素
- 不加解释，不加引号，只输出提示词本身

示例：
- 雷声 → Thunder rumbling in the distance with light rain, cinematic atmosphere
- 开门 → Heavy wooden door creaking open slowly, rusty hinges
- 爆炸 → Massive cinematic explosion with deep bass boom and debris scattering
- 脚步 → Footsteps on stone floor, medium pace, slight echo
- ui点击 → Soft mechanical button click, satisfying tactile feedback

直接输出提示词，不要任何标记。`;

// MiniMax translation endpoint
app.post('/api/translate', async (req, res) => {
  const { text } = req.body;
  const minimaxApiKey = process.env.VITE_LLM_API_KEY;

  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  if (!minimaxApiKey || minimaxApiKey.startsWith('your_')) {
    return res.status(500).json({
      error: 'Server configuration error',
      details: 'VITE_LLM_API_KEY is not configured',
    });
  }

  try {
    console.log('Proxying translation to MiniMax:', text.substring(0, 30));

    const response = await fetch(MINIMAX_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${minimaxApiKey}`,
      },
      body: JSON.stringify({
        model: MINIMAX_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: text },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('MiniMax API error:', response.status, errorText);
      return res.status(response.status).json({
        error: `MiniMax API error: ${response.status}`,
        details: errorText,
      });
    }

    const data = await response.json();
    const translated = data.choices?.[0]?.message?.content?.trim();
    if (!translated) {
      return res.status(500).json({ error: 'No translation returned from MiniMax' });
    }

    return res.json({ translated });
  } catch (error) {
    console.error('Translation proxy error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/generate', async (req, res) => {
  const { text, modelId, durationSeconds, promptInfluence, loop } = req.body;
  const { key: elevenLabsApiKey, source: keySource } = resolveElevenLabsConfig();

  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  if (!elevenLabsApiKey) {
    return res.status(500).json({
      error: 'Server configuration error',
      details: 'ELEVENLABS_API_KEY is not configured',
    });
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

    console.log('Proxying request to ElevenLabs:', {
      text: text.substring(0, 50),
      keySource,
      ...body,
    });

    const response = await fetch(ELEVENLABS_API_URL, {
      method: 'POST',
      headers: {
        'xi-api-key': elevenLabsApiKey,
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
      } catch {
        // Keep raw response text when ElevenLabs returns non-JSON errors.
      }
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
  const { key: elevenLabsApiKey, source: keySource } = resolveElevenLabsConfig();
  const minimaxKey = process.env.VITE_LLM_API_KEY || '';

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    hasElevenLabsKey: Boolean(elevenLabsApiKey),
    keySource,
    hasMinimaxKey: Boolean(minimaxKey && !minimaxKey.startsWith('your_')),
  });
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

  const { key: elevenLabsApiKey, source: keySource } = resolveElevenLabsConfig();
  if (elevenLabsApiKey) {
    console.log(`[config] ElevenLabs key loaded from ${keySource}.`);
  } else {
    console.warn('[config] Missing ElevenLabs key. Set ELEVENLABS_API_KEY in server environment variables.');
  }

  const minimaxKey = process.env.VITE_LLM_API_KEY || '';
  if (minimaxKey && !minimaxKey.startsWith('your_')) {
    console.log('[config] MiniMax key loaded.');
  } else {
    console.warn('[config] Missing MiniMax key. Set VITE_LLM_API_KEY in server environment variables.');
  }
});
