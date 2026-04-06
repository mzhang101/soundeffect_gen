const DEV_PROXY_URL = 'http://localhost:3001/api/generate';
const SAME_ORIGIN_PROXY_PATH = '/api/generate';
const PROXY_URL = resolveProxyUrl();
const USE_MOCK_AUDIO = String(import.meta.env.VITE_USE_MOCK_AUDIO || '').toLowerCase() === 'true';

function resolveProxyUrl() {
  const configured = String(import.meta.env.VITE_API_URL || '').trim();

  if (!configured) {
    return import.meta.env.DEV ? DEV_PROXY_URL : SAME_ORIGIN_PROXY_PATH;
  }

  // This app serves frontend and API from the same Railway service in production.
  if (!import.meta.env.DEV) {
    try {
      const parsed = new URL(configured, window.location.origin);
      if (parsed.origin !== window.location.origin) {
        console.warn('[audio] Ignoring cross-origin VITE_API_URL in production, using same-origin /api/generate');
        return SAME_ORIGIN_PROXY_PATH;
      }
    } catch {
      return SAME_ORIGIN_PROXY_PATH;
    }
  }

  return configured;
}

export async function generateAudio({ text, modelId = 'eleven_text_to_sound_v2', durationSeconds, promptInfluence = 0.3, loop = false }, onProgress) {
  // Explicit mock mode avoids accidental third-party URLs and CORS issues.
  if (USE_MOCK_AUDIO) {
    return mockGenerate(text, durationSeconds, onProgress);
  }

  try {
    onProgress(10);

    // Only include durationSeconds if it's > 0 (auto mode sends 0)
    const body = {
      text,
      modelId,
      promptInfluence,
      loop,
    };

    if (durationSeconds && durationSeconds > 0) {
      body.durationSeconds = durationSeconds;
    }

    // Call the local proxy instead of ElevenLabs directly
    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    onProgress(60);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      if (response.status === 500 && String(errorData.details || '').includes('ELEVENLABS_API_KEY')) {
        throw new Error('Server is missing ELEVENLABS_API_KEY. Please configure it in backend environment variables.');
      }
      throw new Error(`Proxy error: ${response.status} - ${errorData.error || errorData.details || 'Unknown'}`);
    }

    onProgress(80);

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    onProgress(100);

    return {
      url,
      blob,
      filename: `sound_${Date.now()}.mp3`
    };
  } catch (error) {
    throw new Error(`Failed to generate audio: ${error.message}`);
  }
}

async function mockGenerate(text, duration, onProgress) {
  // Simulate generation time
  const generationTime = Math.max(2000, (duration || 5) * 400);
  const steps = 20;
  const stepTime = generationTime / steps;

  for (let i = 0; i <= steps; i++) {
    await new Promise(resolve => setTimeout(resolve, stepTime));
    onProgress(Math.round((i / steps) * 100));
  }

  const blob = createMockWavBlob(duration || 5);

  // Return same-origin blob URL so playback/download behave like real generation.
  return {
    url: URL.createObjectURL(blob),
    blob,
    filename: `sound_${Date.now()}.wav`
  };
}

function createMockWavBlob(durationSeconds = 5) {
  const sampleRate = 44100;
  const channelCount = 1;
  const bitsPerSample = 16;
  const frameCount = Math.max(1, Math.floor(durationSeconds * sampleRate));
  const byteRate = (sampleRate * channelCount * bitsPerSample) / 8;
  const blockAlign = (channelCount * bitsPerSample) / 8;
  const dataSize = frameCount * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeAscii(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(view, 8, 'WAVE');
  writeAscii(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channelCount, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeAscii(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Simple decaying tone as local mock output.
  const frequency = 440;
  const amplitude = 0.2;
  const fadeOutStart = Math.floor(frameCount * 0.9);
  let offset = 44;

  for (let i = 0; i < frameCount; i++) {
    const t = i / sampleRate;
    const envelope = i > fadeOutStart ? Math.max(0, 1 - (i - fadeOutStart) / (frameCount - fadeOutStart)) : 1;
    const sample = Math.sin(2 * Math.PI * frequency * t) * amplitude * envelope;
    const pcm = Math.max(-1, Math.min(1, sample)) * 32767;
    view.setInt16(offset, pcm, true);
    offset += 2;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

function writeAscii(view, offset, text) {
  for (let i = 0; i < text.length; i++) {
    view.setUint8(offset + i, text.charCodeAt(i));
  }
}
