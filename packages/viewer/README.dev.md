# @eggosystem/viewer - Development

This package can be developed independently with its own dev server.

## Quick Start

```bash
cd packages/viewer
pnpm dev
```

The dev server will ask you for a match game ID, then start a Vite development server on `http://localhost:3001`.

## Development Features

- **Interactive CLI**: Prompts for match game ID on startup
- **Live Reload**: Hot module replacement for instant feedback
- **API Integration**: Fetches demo data from the Eggosystem API
- **Polling**: Automatically polls for demo processing status
- **Error Handling**: Clear error messages and status updates

## Environment Variables

- `VITE_VIEWER_API_URL`: API base URL (default: `http://localhost:3000`)
- `VITE_VIEWER_ASSETS_URL`: Assets base URL for images and icons (optional)
- `VIEWER_API_URL`: Alternative way to set API URL

### Environment Files

The package supports `.env.development` files for development configuration:

```bash
# .env.development
VITE_VIEWER_API_URL=https://cs2ddev.kanaliiga.fi
VITE_VIEWER_ASSETS_URL=https://hubdev.kanaliiga.fi
```

This will automatically be loaded by Vite when running in development mode.

## Scripts

- `pnpm dev`: Start interactive dev server with CLI
- `pnpm dev:direct`: Start Vite dev server directly (no CLI)
- `pnpm dev:build`: Watch TypeScript compilation
- `pnpm build`: Build the package
- `pnpm typecheck`: Type check without building
- `pnpm lint`: Run ESLint

## URL Parameters

You can also pass the match game ID via URL parameter:

```
http://localhost:3001?matchGameId=123
```

## API Endpoints

The dev server expects the following API endpoint:

```
GET /api/v1/demos/game/{matchGameId}
```

Returns either:

- Processing status with progress
- Ready status with demo data

## Development Workflow

1. Start the dev server: `pnpm dev`
2. Enter a match game ID when prompted
3. The server will fetch and display demo data
4. Make changes to the viewer components
5. See changes instantly with hot reload

## Troubleshooting

- **API Connection Issues**: Check that `VITE_VIEWER_API_URL` points to a running Eggosystem API server
- **Demo Not Loading**: Verify the match game ID exists and has processed demo data
- **Port Conflicts**: The dev server runs on port 3001 by default
