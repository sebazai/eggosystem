# BullMQ Email Queue Monitoring with Grafana

This document describes how to monitor the BullMQ email queue system using bull-monitor and Grafana Cloud.

## Overview

The email queue system uses BullMQ to rate-limit welcome emails sent when sortter placements are finalized. To avoid triggering spam filters, emails are sent with a 500ms delay between each (configurable via `EMAIL_SEND_DELAY_MS`).

## Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Backend   │─────▶│ Redis Queue  │◀─────│ Email Worker│
│     API     │      │   (BullMQ)   │      │             │
└─────────────┘      └──────────────┘      └─────────────┘
                            │
                            │ Monitor
                            ▼
                     ┌──────────────┐
                     │ bull-monitor │
                     │   (Docker)   │
                     └──────────────┘
                            │
                            │ /metrics
                            ▼
                     ┌──────────────┐
                     │ Grafana Alloy│
                     │  (Scraper)   │
                     └──────────────┘
                            │
                            │ Forward
                            ▼
                     ┌──────────────┐
                     │ Grafana Cloud│
                     └──────────────┘
```

## Components

### 1. BullMQ Queue (`welcome-emails`)

- **Location**: `apps/backend/src/services/email-queue.services.ts`
- **Rate Limit**: 1 email per 500ms (default)
- **Retry Strategy**: 3 attempts with exponential backoff (1s, 2s, 4s)
- **Job Cleanup**: Completed jobs removed after 7 days, failed jobs after 30 days

### 2. Email Worker

- **Location**: `apps/backend/src/services/email-worker.services.ts`
- **Concurrency**: 1 (sequential processing)
- **Lifecycle**: Starts with backend server, stops on graceful shutdown

### 3. bull-monitor Service

- **Image**: `ejhayes/nodejs-bull-monitor:latest`
- **Port**: 3010
- **UI**: bull-board
- **Metrics Endpoint**: `http://localhost:3010/metrics` (dev) or `http://eggo-bull-monitor:3010/metrics` (prod)

## Accessing bull-monitor UI

### Development Environment

1. Ensure services are running:

   ```bash
   docker-compose up -d eggo-redis eggo-bull-monitor
   ```

2. Access the UI at: **http://localhost:3010**

3. You'll see the bull-board interface showing:
   - Queue status (waiting, active, completed, failed, delayed)
   - Individual job details
   - Retry/pause/resume controls

### Production/Staging/Dev Environments

bull-monitor is accessible in multiple ways:

1. **Via Web (Recommended)**:
   - Development: **https://hubdev.kanaliiga.fi/bull-monitor**
   - Staging: **https://hubstage.kanaliiga.fi/bull-monitor**
   - Production: **https://hub.kanaliiga.fi/bull-monitor**
   - Requires basic authentication (credentials in `BULL_MONITOR_AUTH` environment variable)

2. **Via SSH tunnel**:

   ```bash
   ssh -L 3010:localhost:3010 user@server
   ```

   Then access: **http://localhost:3010**

3. **Via internal network** (if you have VPN access):
   - Dev: `http://eggo-dev-bull-monitor:3010`
   - Stage: `http://eggo-stage-bull-monitor:3010`
   - Prod: `http://eggo-prod-bull-monitor:3010`

## Grafana Cloud Integration

### Configure Alloy to Scrape Metrics

Add the following to your Grafana Alloy configuration file:

```hcl
prometheus.scrape "bull_monitor" {
  targets = [{
    __address__ = "eggo-bull-monitor:3010",
  }]
  forward_to = [prometheus.remote_write.grafana_cloud.receiver]
  scrape_interval = "60s"
  metrics_path = "/metrics"
}
```

For different environments, adjust the target address:

- **Dev**: `eggo-dev-bull-monitor:3010`
- **Stage**: `eggo-stage-bull-monitor:3010`
- **Prod**: `eggo-prod-bull-monitor:3010`

### Available Prometheus Metrics

bull-monitor exposes the following metrics for each queue:

#### Gauge Metrics (Totals)

- `jobs_completed_total` - Total number of completed jobs
- `jobs_failed_total` - Total number of failed jobs
- `jobs_delayed_total` - Total number of delayed jobs
- `jobs_active_total` - Total number of active jobs
- `jobs_waiting_total` - Total number of waiting jobs

#### Counter Metrics (Events)

- `jobs_active` - Jobs that started processing
- `jobs_waiting` - Jobs added to queue
- `jobs_stalled` - Jobs that stalled
- `jobs_failed` - Jobs that failed
- `jobs_completed` - Jobs that completed
- `jobs_delayed` - Jobs that were delayed

#### Summary Metrics (Performance)

- `job_duration` - Processing time for completed/failed jobs (seconds)
- `job_wait_duration` - Time spent waiting for job to start (seconds)
- `job_attempts` - Number of attempts made before job completed/failed

#### Metric Labels

All metrics include the following labels:

- `queue_prefix` - Queue prefix (usually empty)
- `queue_name` - Queue name (`welcome-emails`)
- `job_name` - Job name (`send-welcome-email`)
- `status` - Job status (`completed` or `failed`)
- `error_type` - Error class name (for failed jobs)

### Import Grafana Dashboards

bull-monitor provides pre-built Grafana dashboards:

#### 1. Queue Overview Dashboard

**Grafana Dashboard ID**: [14538](https://grafana.com/grafana/dashboards/14538)

Shows high-level overview of all monitored BullMQ queues:

- Total jobs by status
- Job throughput over time
- Error rates
- Queue health indicators

**To import**:

1. Go to Grafana Cloud → Dashboards → Import
2. Enter dashboard ID: `14538`
3. Select your Prometheus data source
4. Click "Import"

#### 2. Queue-Specific Dashboard

**Grafana Dashboard ID**: [14537](https://grafana.com/grafana/dashboards/14537)

Shows detailed metrics for a specific queue:

- Job processing duration (p50, p95, p99)
- Job wait time distribution
- Retry attempts histogram
- Failed job details
- Active/waiting/completed trends

**To import**:

1. Go to Grafana Cloud → Dashboards → Import
2. Enter dashboard ID: `14537`
3. Select your Prometheus data source
4. Select queue name: `welcome-emails`
5. Click "Import"

## Monitoring Email Queue Health

### Key Metrics to Watch

1. **Jobs Waiting** (`jobs_waiting_total`)
   - Normal: 0-50 jobs
   - Warning: 50-200 jobs (queue building up)
   - Critical: >200 jobs (potential issue with worker)

2. **Jobs Failed** (`jobs_failed_total`)
   - Normal: <5% of total jobs
   - Warning: 5-10% failure rate
   - Critical: >10% failure rate (SMTP issues?)

3. **Job Duration** (`job_duration`)
   - Normal: p95 < 5 seconds
   - Warning: p95 5-10 seconds
   - Critical: p95 >10 seconds (SMTP slow?)

4. **Job Wait Duration** (`job_wait_duration`)
   - Expected: ~500ms between jobs (rate limit)
   - Warning: >2 seconds (queue congestion)

### Common Issues and Solutions

#### Issue: Jobs Stuck in Waiting State

**Symptoms**: `jobs_waiting_total` keeps increasing, no jobs completing

**Possible Causes**:

- Email worker not running
- Redis connection issues
- Worker crashed

**Solutions**:

1. Check worker logs: `docker logs <backend-container>`
2. Restart backend service to restart worker
3. Check Redis connectivity

#### Issue: High Failure Rate

**Symptoms**: `jobs_failed_total` increasing rapidly

**Possible Causes**:

- SMTP server issues
- Invalid email addresses
- Rate limiting by email provider

**Solutions**:

1. Check failed job details in bull-monitor UI
2. Review Redis key: `email-stats:season:{seasonId}` for error details
3. Verify SMTP credentials and server status
4. Check if emails are being marked as spam

#### Issue: Slow Processing

**Symptoms**: `job_duration` p95 >10 seconds

**Possible Causes**:

- SMTP server slow to respond
- Network latency
- Email size too large

**Solutions**:

1. Check SMTP server performance
2. Review network connectivity
3. Consider adjusting `EMAIL_SEND_DELAY_MS` if needed

## Email Statistics in Redis

The system tracks email statistics per season in Redis:

**Key Format**: `email-stats:season:{seasonId}`

**Fields**:

- `successful` - Number of successfully sent emails
- `failed` - Number of failed emails

**Expiry**: 90 days

**Access via Redis CLI**:

```bash
# Get stats for season 1
redis-cli HGETALL email-stats:season:1

# Example output:
# 1) "successful"
# 2) "750"
# 3) "failed"
# 4) "5"
```

## Environment Variables

### Backend Configuration

- `EMAIL_SEND_DELAY_MS` - Delay between emails in milliseconds (default: 750)
- `REDIS_HOST` - Redis host for BullMQ (default: eggo-redis)
- `REDIS_PORT` - Redis port (default: 6379)

### bull-monitor Configuration

- `REDIS_HOST` - Redis host to monitor (default: eggo-redis)
- `REDIS_PORT` - Redis port (default: 6379)
- `PORT` - bull-monitor HTTP port (default: 3010)
- `UI` - UI framework to use (default: bull-board)
- `BULL_MONITOR_AUTH` - Basic auth credentials for web access (htpasswd format: `username:$apr1$...`)
  - Generate with: `htpasswd -nb username password`
  - Example: `admin:$apr1$n0kAnnPt$40/2lJX3jzZ3oD1Y6HFpL/` (password: kanaliiga)

## Troubleshooting

### bull-monitor Not Showing Queues

1. **Check Redis connection**:

   ```bash
   docker exec eggo-bull-monitor redis-cli -h eggo-redis ping
   ```

2. **Verify queue exists in Redis**:

   ```bash
   redis-cli KEYS "bull:welcome-emails:*"
   ```

3. **Check bull-monitor logs**:
   ```bash
   docker logs eggo-bull-monitor
   ```

### Metrics Not Appearing in Grafana

1. **Verify Alloy is scraping**:
   - Check Alloy logs for scrape errors
   - Verify target is up: `http://eggo-bull-monitor:3010/metrics`

2. **Check metric names in Grafana Explore**:

   ```promql
   {job="bull_monitor"}
   ```

3. **Verify data source connection** in Grafana settings

### Worker Not Processing Jobs

1. **Check if worker is running**:

   ```bash
   docker logs <backend-container> | grep "Email worker"
   ```

2. **Verify Redis connectivity from backend**:

   ```bash
   docker exec <backend-container> redis-cli -h eggo-redis ping
   ```

3. **Check for errors in backend logs**:
   ```bash
   docker logs <backend-container> | grep -i "email\|worker\|error"
   ```

## Additional Resources

- [BullMQ Documentation](https://docs.bullmq.io/)
- [bull-monitor GitHub](https://github.com/ejhayes/bull-monitor)
- [Grafana Alloy Documentation](https://grafana.com/docs/alloy/)
- [Prometheus Metrics Best Practices](https://prometheus.io/docs/practices/naming/)
