# AI Chat Interface 💬

A full-stack AI chat application featuring a Vue 3 frontend and a Bun-powered Express.js backend. It leverages ArkType for schema validation, supports multiple LLMs, tool usage, authentication, subscription tiers, and streams responses in real-time.

## ✨ Key Features

- **Robust Schemas:** Uses ArkType for strong schema validation and type safety in API communications.
- **Multi-Model Support:** Connects to OpenAI, Anthropic, Groq, XAI, and OpenRouter models via the Vercel AI SDK and dedicated provider packages.
- **Tool Integration:** Empowers models with tools for web search, webpage content extraction (scraping), weather lookups, and GitHub repository interaction.
- **Streaming Responses:** Utilizes Express.js for streaming responses from the backend, enabling real-time message generation.
- **Authentication:** Secure user authentication powered by `better-auth`, including GitHub social login.
- **Subscription & Rate Limiting:** Integrates Stripe for managing pro subscription tiers and message limits.
- **Rich Frontend:** Vue 3 interface with Markdown rendering (including code highlighting & KaTeX support), conversation management, and planned image upload capabilities.
- **Modern Backend:** Built with Bun, TypeScript, and Express.js, using MongoDB for persistent storage and Valkey/Redis for caching and session management.
- **Persistent Storage:** Uses MongoDB to store conversation history.
- **Caching & KV Store:** Leverages Valkey (Redis compatible) for caching user limits, Stripe customer data, and potentially other KV storage needs.
- **Containerized:** Includes Docker configuration for easy setup and deployment of all services.

## 🚀 Tech Stack

- **Frontend:** Vue 3, Vite, Pinia, Tailwind CSS, TypeScript
- **Backend:** Bun, TypeScript, Express.js, Vercel AI SDK, MongoDB, Valkey/Redis, `better-auth`
- **Common:** ArkType (for schema validation), SuperJSON (for data serialization)
- **Deployment:** Docker, Nginx (for frontend serving/proxying)

## 🏁 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (v1.2.9 or higher)
- [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/) (Recommended for easy setup)
- API Keys for at least one supported AI provider (OpenAI, Anthropic, Groq, XAI, OpenRouter).
- A Valkey/Redis instance (Docker Compose handles this automatically).

### 1. Clone the Repository

```bash
git clone https://git.averi.me/averithefox/ai-chat-app.git
cd ai-chat-app
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

- `DATABASE_URL`: Connection string for your MongoDB instance (defaults to `mongodb://root:pass@db:27017` for Docker).
- `VALKEY_URL`: Connection string for your Valkey/Redis instance (defaults to `redis://kv:6379` for Docker).
- `BETTER_AUTH_SECRET`: A strong secret string for `better-auth`.
- `BASE_URL`: The base URL of your application (e.g., `http://localhost` if using Docker, or `http://localhost:5173` for local frontend dev). Used for OAuth redirects and Stripe.
- At least one provider API key:
  - `OPENAI_API_KEY`
  - `ANTHROPIC_API_KEY`
  - `XAI_API_KEY`
  - `GROQ_API_KEY`
  - `OPENROUTER_API_KEY`
- **GitHub Authentication (Social Login):**
  - `GITHUB_CLIENT_ID`
  - `GITHUB_CLIENT_SECRET`
- **Stripe Subscriptions:**
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `STRIPE_PRICE_ID`
- **Application Behavior:**
  - `VITE_MESSAGES_PER_MONTH_FREE`: Message limit for free tier.
  - `VITE_MESSAGES_PER_MONTH_PAID`: Message limit for paid/pro tier.
  - `LOG_LEVEL`: Logging level for the backend (e.g., `info`, `debug`).

**Optional (for Tools):**

- `EXA_API_KEY`: For web search and webpage content tools.
- `WEATHER_API_KEY`: For the weather tool.
- `GITHUB_PAT`: For GitHub repository interaction tool.

### 4. Run the Application

**Option A: Using Docker Compose (Recommended)**

This starts the frontend, backend, a MongoDB database, and a Valkey (Redis) instance.

```bash
docker-compose up -d
```

Access the application at `http://localhost` (or your `BASE_URL` if configured differently for Docker).

**Option B: Running Services Manually**

Ensure you have MongoDB and Valkey/Redis instances running and accessible via the `DATABASE_URL` and `VALKEY_URL` in your `.env` file.

```bash
# Start backend (port 3000) and frontend (port 5173) with hot-reloading
bun run dev
```

Access the frontend at `http://localhost:5173`. The Vite dev server proxies `/api/*` requests to the backend running on port 3000.
Specifically, requests to `/api/auth/*` are proxied as-is, while other requests like `/api/chat` are rewritten to `/chat` before being sent to the backend.

## 🛠️ Development

- **Type Check:** `bun run type-check`
- **Format Code (Check):** `bun prettier`
- **Format Code (Fix):** `bun prettier:fix`
- **Lint Code (ESLint):** `bun lint:eslint`
- **Lint Code (OxLint):** `bun lint:oxlint`

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
