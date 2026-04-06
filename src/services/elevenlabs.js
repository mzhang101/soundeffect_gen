const PROXY_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/generate';

export async function generateAudio({ text, modelId = 'eleven_text_to_sound_v2', durationSeconds, promptInfluence = 0.3, loop = false }, onProgress) {
  const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;

  // Fallback to mock if no API key configured
  if (!apiKey || apiKey === 'your_elevenlabs_api_key') {
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
      apiKey,
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

  // Return mock audio URL
  return {
    url: 'https://www.soundjay.com/buttons/sounds/button-09a.mp3',
    blob: null,
    filename: `sound_${Date.now()}.mp3`
  };
}
