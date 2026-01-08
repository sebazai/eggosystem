# Backend for CS stats

Database pooling, API for CS stats.

## Environment Variables

### Database

- `DB_HOST` - Database host
- `DB_PORT` - Database port
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password
- `DB_NAME` - Database name

### Email Queue

- `EMAIL_SEND_DELAY_MS` - Delay between sending welcome emails in milliseconds (default: 500ms).

### Grafana Cloud Profiles

To enable profiling with Grafana Cloud via Alloy, the following environment variables are configured:

- `OTEL_EXPORTER_OTLP_PROFILING_ENDPOINT` - Points to your local Alloy instance (e.g., `http://172.17.0.1:4040`)
- `OTEL_EXPORTER_OTLP_PROFILING_AUTH_TOKEN` - Optional when using local Alloy (Alloy handles authentication to Grafana Cloud)
- `ENABLE_PROFILING` - Set to `true` to enable profiling in development mode
- `OTEL_EXPORTER_OTLP_PROFILING_REGION_TAG` - Optional region tag for profiling metadata
- `OTEL_EXPORTER_OTLP_PROFILING_VERSION_TAG` - Optional version tag for profiling metadata

### Alloy-based Setup

This application is configured to send profiling data through [Grafana Alloy](https://grafana.com/docs/alloy/) running at `http://172.17.0.1:4040`. Alloy then forwards the data to Grafana Cloud Profiles.

**Benefits of using Alloy:**

- Centralized telemetry collection
- Built-in authentication handling to Grafana Cloud
- No need to configure auth tokens in each application
- Better observability pipeline management

### Getting Grafana Cloud Credentials

The Grafana Cloud credentials are configured in your Alloy instance, not directly in the application:

1. Configure Alloy with your Grafana Cloud Profiles endpoint and auth token
2. Ensure Alloy is accessible at `http://172.17.0.1:4040`
3. The application will automatically send profiling data to Alloy

### Development Setup

For development, profiling is disabled by default. To enable it, set:

```
ENABLE_PROFILING=true
```

In production, profiling is automatically enabled when the required environment variables are present.

## Scripts

# Backend

This is the backend application for the Kanaliiga Eggosystem project.
