# AGENTS.md

## Project

Monorepo of JavaScript/TypeScript utility libraries (`@gutenye/lib.js`). Each workspace package lives under `src/<name>/` with its own `package.json` for publishable packages.

## Stack

- Runtime: Bun
- Language: TypeScript (strict mode, ESNext, bundler resolution)
- Linter/Formatter: Biome (single quotes, no semicolons, space indent)
- Test: `bun test`
- Task runner: `./ake` (script.js v2)

## Code Style

- Single quotes, no semicolons, space indentation (enforced by Biome)
- Imports at the top of the file — no inline imports
- Exhaustive switch handling for TypeScript unions and enums
- Use `node:` prefix for Node built-in imports (`node:fs`, `node:path`)
- Path aliases: `#/*` → `src/*`, `#root/*` → `./*`

## Testing

- Tests live in `src/<package>/__tests__/<name>.test.ts`
- Run all: `bun test`
- Run watch: `bun test --watch`
- Run specific: `bun test src/fs`

## Linting

- Run: `bun run lint` (biome check --fix)
- CI: `bun run lint:ci`

## Project Structure

```
src/
  child_process/    # Child process utilities
  cloudflare/       # Cloudflare Workers helpers
  crypto/           # Crypto utilities (randomNumber, randomPassword, etc.)
  fetch/            # Fetch utilities
  fs/               # File system utilities
  GithubAPI/        # GitHub API client
  js/               # Core JS utilities (error, invariant)
  otp/              # OTP utilities
  raycast/          # Raycast extension helpers
  streams/          # Web streams utilities
  zod/              # Zod parse helpers
```
