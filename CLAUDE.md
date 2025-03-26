# CLAUDE.md - Development Guide

## Commands

- `bun run dev` - Start development servers for all packages
- `bun run --filter frontend dev` - Start frontend development server only
- `bun run --filter backend dev` - Start backend server in watch mode
- `bun run type-check` - Type check all packages
- `bunx prettier --check .` - Check formatting
- `bunx prettier --write .` - Fix formatting issues
- `bunx eslint .` - Check for linting issues
- `bunx eslint . --fix` - Fix linting issues

## Code Style

- Use TypeScript for type safety with proper interfaces/types
- Follow Prettier config: 100 char line length, 2 space indent, single quotes
- Import order: external libs → shared → local modules
- Use named exports/imports over default exports
- Use arktype for schema validation and type inference
- Prefer functional approach: arrow functions, immutability (use omit/pick)
- Error handling: validate inputs with schemas, use try/catch for async operations
- Use JSDoc comments for important functions/interfaces

## Structure

- Monorepo with packages: frontend (Vue), backend (Bun), shared (types/schemas)
- Use workspace dependencies with `workspace:*` syntax
