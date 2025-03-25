## Project Structure

This project is organized as a monorepo with the following packages:

- `frontend`: Vue.js application with TailwindCSS
- `backend`: Bun-powered API server
- `shared`: Common types and schemas shared between packages

## Prerequisites

- [Bun](https://bun.sh/) 1.0.0 or higher
- MongoDB (for development, or use the Docker setup)
- API keys for at least one of: OpenAI, Anthropic, Groq, or XAI

## Development Setup

1. Clone the repository:
   ```
   git clone <repository-url>
   cd <repo-name>
   ```

2. Install dependencies:
   ```
   bun install
   ```

3. Create a `.env` file in the project root with the following variables (at minimum one provider API key is required):
   ```
   DATABASE_URL=mongodb://root:pass@localhost:27017
   OPENAI_API_KEY=your_openai_key
   ANTHROPIC_API_KEY=your_anthropic_key
   XAI_API_KEY=your_xai_key
   GROQ_API_KEY=your_groq_key
   # Optional API keys for tools
   FIRECRAWL_API_KEY=your_firecrawl_key
   FIRECRAWL_API_URL=your_firecrawl_url
   WEATHER_API_KEY=your_weather_key
   SERP_API_KEY=your_serp_key
   GITHUB_PAT=your_github_personal_access_token
   LOG_LEVEL=debug # Optional, defaults to info
   ```

4. Start the development servers:
   ```
   bun run dev
   ```

5. Access the application:
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3000

## Running Individual Services

- Frontend only:
  ```
  bun run --filter frontend dev
  ```

- Backend only:
  ```
  bun run --filter backend dev
  ```

- Type checking:
  ```
  bun run type-check
  ```

## Production Deployment

### Using Docker Compose (Recommended)

1. Ensure Docker and Docker Compose are installed on your system

2. Create a `.env` file with your API keys (as outlined above)

3. Build and start the containers:
   ```
   docker-compose up -d
   ```

4. Access the application at http://localhost

### Manual Deployment

For manual deployment:

1. Build the frontend:
   ```
   cd packages/frontend
   bun run build
   ```

2. Host the static files from `packages/frontend/dist` using a web server like Nginx 

3. Configure your web server to proxy API requests to the backend

4. Deploy the backend:
   ```
   cd packages/backend
   # Set environment variables
   bun run src/index.ts
   ```

## Additional Commands

- Format code:
  ```
  bunx prettier --write .
  ```

- Lint code:
  ```
  bunx eslint .
  ```

- Fix linting issues:
  ```
  bunx eslint . --fix
  ```

## License

See the LICENSE file for details.