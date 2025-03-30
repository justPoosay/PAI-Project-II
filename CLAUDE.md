# AI Chat App - Development Guide

## Build & Development Commands

- `bun run dev` - Start both frontend and backend with hot-reloading
- `bun run dev:frontend` - Start frontend only
- `bun run dev:backend` - Start backend only
- `bun run type-check` - Run TypeScript type checking
- `bun run prettier` - Check code formatting
- `bun run prettier:fix` - Fix code formatting
- `bun run lint` - Run ESLint
- `bun run lint:fix` - Fix ESLint issues

## Code Style Guidelines

- **TypeScript**: Strict mode enabled, with ESNext target
- **Formatting**: Prettier with 100 char line width, single quotes, 2-space indentation
- **Imports**: Use organize-imports plugin, imports are automatically sorted
- **Components**: Vue 3 composition API with <script setup> pattern
- **Error Handling**: Use try/catch blocks with specific error messages
- **Naming**:
  - Stores: use`$` prefix for store actions
  - Types: PascalCase for interfaces/types
  - Variables: camelCase
- **Organization**: Monorepo structure with packages for frontend, backend, common
- **Testing**: Not implemented yet

See README.md for more detailed setup instructions including Docker environment.
