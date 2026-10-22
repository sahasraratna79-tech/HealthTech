# StudyMate AI

A focused exam preparation assistant for undergraduate students. It combines marks-aware AI answers, searchable guest conversations, local saved answers, text-based question paper extraction, a Mermaid diagram workspace, and PDF export.

## Requirements

- Node.js 20 or later and npm.
- An API key for an OpenAI-compatible chat completions service to generate live answers.

## Run locally

```sh
npm install
cp .env.example .env
# Set OPENAI_API_KEY in .env (server-side only)
npm run dev
```

The app runs at `http://localhost:5173`; its API runs at `http://localhost:8787`. Vite proxies `/api` requests to the local API. To use a compatible provider, set `OPENAI_BASE_URL` and `OPENAI_MODEL`. Never put provider secrets in a `VITE_` variable or browser code.

For a no-install visual preview of the website, run `node website/serve.mjs` and open `http://127.0.0.1:4173`. This preview has the interactive interface and local browser storage. Live AI answers and PDF extraction require the full app and API started with `npm run dev`.

For a production frontend build, run `npm run build`; start the API with `npm start`. Serve the generated `dist/` directory from a static host configured to proxy `/api` to the Express server. Configure HTTPS, CORS restrictions, request rate limiting, and provider usage limits before exposing the service publicly.

## Features and behavior

- Marks selector (Auto, 2, 5, 10, 15) and subject/preferences are included in the server-side tutor prompt.
- Chat history and saved answers persist in browser local storage in guest mode. They are not synchronized or private to a user account on a shared browser profile.
- PDF upload accepts PDF files up to 15 MB. Text extraction happens on the server in memory. Extracted question candidates can be selected and edited before they are placed in the chat composer. Scanned PDFs are reported as unsupported; OCR is not configured.
- PDF export creates a print-friendly document from the actual answer text. Diagrams are not embedded into answer exports in this first version.
- Diagram Studio previews Mermaid diagrams and includes an editable flowchart starter. It does not claim to infer and render a diagram from every answer automatically.
- No authentication, database, cloud file storage, streaming, or multi-question batch generation is configured in this guest-mode version.
- AI responses are provider-generated only. When `OPENAI_API_KEY` is missing, the API returns a setup error rather than a sample answer.

## Sample question

**Question:** Explain Kruskal's algorithm in 5 marks.

Choose **5 marks** and submit the question. With a configured API key, the server asks the selected provider for an exam-ready explanation. The returned content can be copied, saved locally, sent to PDF export, or used to open Diagram Studio.

## API

- `GET /api/health` — service readiness and whether an API key is configured.
- `POST /api/answer` — validates marks, subject, preferences, question, and bounded chat history, then calls the configured chat completions API.
- `POST /api/pdf/extract` — validates PDF MIME type and size, extracts selectable text, and reports empty/scanned/unreadable documents.

## Checks

`npm test` runs unit tests for marks-aware prompt construction, numbered question parsing, and chat title generation. `npm run build` type-checks and builds the frontend.

## Data and security notes

The API key stays in the server process. Uploaded PDFs are processed in memory and are not written to storage. Guest chats and saved answers are stored in local storage. Before a public deployment, add authentication and per-user authorization, rate limits, stricter origin allowlists, upload malware/content controls, deletion flows, and an audited storage policy if server-side persistence is introduced.
