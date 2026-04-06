# Sound Effect Generator

A React + Vite app with an Express backend proxy for ElevenLabs sound generation.

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Configure frontend variables in `.env`:

```dotenv
VITE_API_URL=http://localhost:3001/api/generate
VITE_USE_MOCK_AUDIO=false

VITE_LLM_API_KEY=your_minimax_api_key
VITE_LLM_API_ENDPOINT=https://api.minimax.chat/v1/text/chatcompletion_v2
VITE_LLM_MODEL=MiniMax-M2.7
```

3. Configure backend ElevenLabs key (server-side only):

```bash
export ELEVENLABS_API_KEY=your_elevenlabs_api_key
```

4. Start backend:

```bash
npm run server
```

5. Start frontend in another terminal:

```bash
npm run dev
```

## Environment Variables

Frontend (Vite):
- `VITE_API_URL`: backend endpoint for generation
- `VITE_USE_MOCK_AUDIO`: set `true` to use local mock audio blob generation
- `VITE_LLM_API_KEY`, `VITE_LLM_API_ENDPOINT`, `VITE_LLM_MODEL`: translation settings

Production recommendation:
- Set `VITE_API_URL=/api/generate` so frontend and backend stay same-origin.

Backend (Node/Express):
- `ELEVENLABS_API_KEY`: required for real audio generation

## Security Notes

- Frontend no longer sends ElevenLabs API keys.
- Backend reads `ELEVENLABS_API_KEY` from server environment.
- If an API key was previously stored in frontend variables, rotate it immediately.

## Railway Deployment

Set these variables in Railway service settings:

- `ELEVENLABS_API_KEY` (backend runtime)
- `NODE_ENV=production`

Use `.env.production` only for frontend build-time `VITE_*` values.
