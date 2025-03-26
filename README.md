# AI Chat Interface 💬

A full-stack AI chat application featuring a Vue 3 frontend and a Bun backend. It supports multiple LLMs, tool usage, and real-time updates.

## ✨ Key Features

- **Multi-Model Support:** Connects to OpenAI, Anthropic, Groq, and XAI models.
- **Tool Integration:** Empowers models with tools for web search, web scraping, weather lookups, and GitHub repository interaction.
- **Real-time Updates:** Uses Server-Sent Events (SSE) for live updates (e.g., conversation renaming).
- **Rich Frontend:** Vue 3 interface with Markdown rendering (including code highlighting & KaTeX), image uploads, and conversation management.
- **Modern Backend:** Built with Bun, TypeScript, and the Vercel AI SDK.
- **Persistent Storage:** Uses MongoDB to store conversation history.
- **Containerized:** Includes Docker configuration for easy setup and deployment.

## 🚀 Tech Stack

- **Frontend:** Vue 3, Vite, Pinia, Tailwind CSS, TypeScript
- **Backend:** Bun, Hono, Vercel AI SDK, MongoDB, TypeScript
- **Common:** ArkType (for schema validation)
- **Deployment:** Docker, Nginx (for frontend serving/proxying)

## 🏁 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (v1.2.x or higher recommended)
- [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/) (Recommended for easy setup)
- API Keys for at least one supported AI provider (OpenAI, Anthropic, Groq, XAI).

### 1. Clone the Repository

```bash
git clone <repository-url>
cd <repository-name>
```

### 2. Install Dependencies

```bash
bun install
```

### 3. Configure Environment Variables

Copy the `.env.example` file to `.env` and fill in the required values:

```bash
cp .env.example .env
# Edit .env with your details
```

**Required:**

- `DATABASE_URL`: Connection string for your MongoDB instance (defaults to `mongodb://root:pass@localhost:27017` for Docker).
- At least one provider API key (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `XAI_API_KEY`, `GROQ_API_KEY`).

**Optional (for Tools):**

- `FIRECRAWL_API_KEY` / `FIRECRAWL_API_URL`
- `WEATHER_API_KEY`
- `SERP_API_KEY`
- `GITHUB_PAT`

### 4. Run the Application

**Option A: Using Docker Compose (Recommended)**

This starts the frontend, backend, and a MongoDB database.

```bash
docker-compose up -d
```

Access the application at `http://localhost`.

**Option B: Running Services Manually**

Ensure you have a MongoDB instance running and accessible via the `DATABASE_URL` in your `.env` file.

```bash
# Start backend (port 3000) and frontend (port 5173) with hot-reloading
bun run dev
```

Access the frontend at `http://localhost:5173`.

## 🛠️ Development

- **Type Check:** `bun run type-check`
- **Format Code:** `bunx prettier --write .`
- **Lint Code:** `bunx eslint .`

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
