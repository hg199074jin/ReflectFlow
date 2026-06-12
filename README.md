# Daily Check-in Timeline

A local-first browser app for daily check-ins, timeline review, AI summaries, and Markdown/PNG export.

## Features

- **Daily Recording**: Log work, study, and side project bullets each day
- **Timeline Views**: Cards (default), Gantt by project, Stats dashboard
- **AI Integration**: Generate daily reflections, weekly summaries, and project classification via OpenAI-compatible API
- **Export**: Markdown zip (per-day .md files) and PNG of current view
- **Local Storage**: All data stored in IndexedDB - no account, no backend

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Open the printed local URL (usually `http://localhost:5173`).

## Commands

```bash
npm run dev        # Start development server
npm run build      # Type-check and build for production
npm run preview    # Preview production build
npm test           # Run unit tests
npm run test:watch # Run tests in watch mode
npm run e2e        # Run end-to-end tests (requires dev server)
```

## Configuration

### LLM Provider

The app uses an OpenAI-compatible API. Configure in Settings:

- **Base URL**: API endpoint (default: `https://api.openai.com/v1`)
  - Official OpenAI: `https://api.openai.com/v1`
  - Local gateway: `http://localhost:8080/v1`
  - Any compatible proxy
- **API Key**: Your API key (stored locally in browser)
- **Model**: Model name (e.g., `gpt-4o-mini`, `llama3`)

### Export

- **Folder Structure**: Flat (`journal/YYYY-MM-DD.md`) or Year/Month (`journal/YYYY/MM/YYYY-MM-DD.md`)
- **Include AI**: Whether to include AI-generated reflections in exports

## Storage Warning

All data is stored locally in your browser's IndexedDB. Clearing browser data will destroy your records. **Export regularly as Markdown backup.**

## Tech Stack

- React 18 + TypeScript + Vite
- Zustand (state management)
- idb (IndexedDB wrapper)
- date-fns, zod, react-markdown, jszip, html-to-image

## License

MIT
