const SYSTEM_PROMPT = '你是一个专业的游戏音效翻译助手，将中文翻译成简洁的英文音效描述，用于AI音频生成。只需返回英文描述，不要解释。';

export async function translateText(text) {
  const apiKey = import.meta.env.VITE_LLM_API_KEY;
  const endpoint = import.meta.env.VITE_LLM_API_ENDPOINT;
  const model = import.meta.env.VITE_LLM_MODEL || 'gpt-4o-mini';

  // Fallback to mock if no API key configured
  if (!apiKey || apiKey === 'your_llm_api_key') {
    return mockTranslate(text);
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: text }
      ],
      temperature: 0.3,
    })
  });

  if (!response.ok) {
    throw new Error(`Translation API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

async function mockTranslate(text) {
  // Simulate 1.5s network delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  return `${text} (translated to English)`;
}
