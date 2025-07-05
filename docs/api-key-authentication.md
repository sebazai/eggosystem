# API Key Authentication

This document describes how to set up and use API key authentication for protected endpoints in Kanaliiga Eggosystem.

## Protected Endpoints

Currently, the following endpoints are protected with API key authentication:

- `POST /api/v1/elo/stabilize` - ELO stabilization endpoint used by CSRankker integration

## Configuration

### Setting Up API Keys

API keys are configured through the `PARSER_API_KEY` environment variable. This defines a single API key to be used for authentication.

1. Add the API key to your environment variables in the appropriate environment file:

```bash
# .env.local, .env.production, etc.
PARSER_API_KEY=your_secret_key
```

2. For Docker/Docker Compose environments, add the environment variable in the docker-compose file:

```yaml
services:
  backend:
    environment:
      - PARSER_API_KEY=your_secret_key
```

3. For production environments, set this in your deployment configuration.

### Generating Secure API Keys

Use a secure random generator to create API keys. For development, you can use:

```bash
# Generate a secure random 32-character API key
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

## Using API Key Authentication

### Making API Requests

To access protected endpoints, include the API key in the `X-API-KEY` header with your HTTP requests:

```bash
curl -X POST https://api.example.com/api/v1/elo/stabilize \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: your_secret_key" \
  -d '{"playerId": "76561198123456789", "currentValue": 150}'
```

### Example with fetch:

```javascript
const response = await fetch("https://api.example.com/api/v1/elo/stabilize", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-KEY": "your_secret_key"
  },
  body: JSON.stringify({
    playerId: "76561198123456789",
    currentValue: 150
  })
});
```

## Error Handling

If authentication fails, the API will respond with:

- **401 Unauthorized**: When no API key is provided or the key is invalid
  ```json
  {
    "error": {
      "message": "API key required" // or "Invalid API key"
    }
  }
  ```

## Security Considerations

- Never hardcode API keys directly in your source code
- Rotate keys periodically for security best practices
- Monitor for unusual access patterns that might indicate a compromised key

## Implementation Details

The API key authentication is implemented as middleware in `src/middlewares/api-key-auth.middleware.ts`.
