# Third Eye MCP - Production Deployment Guide

**Version:** 1.0
**Last Updated:** January 2025

---

## Pre-Deployment Checklist

### ✅ Security

- [ ] All secrets stored in secure vault (AWS Secrets Manager, HashiCorp Vault)
- [ ] API keys rotated from development defaults
- [ ] Admin bootstrap password set (not auto-generated)
- [ ] CSRF secret configured (`CSRF_SECRET` env var)
- [ ] Database credentials use strong passwords (16+ chars, mixed)
- [ ] Redis password enabled
- [ ] TLS/SSL certificates obtained and configured
- [ ] Firewall rules configured (only necessary ports exposed)
- [ ] Security headers enabled (CSP, HSTS, X-Frame-Options)
- [ ] Rate limiting configured per environment

### ✅ Infrastructure

- [ ] PostgreSQL database provisioned (recommend 4+ vCPU, 16GB+ RAM)
- [ ] Redis cluster configured with persistence (AOF + RDB)
- [ ] Load balancer configured with health checks
- [ ] CDN configured for static assets
- [ ] Monitoring stack deployed (Prometheus, Grafana)
- [ ] Log aggregation configured (ELK, Datadog, CloudWatch)
- [ ] Backup solution implemented (automated daily snapshots)
- [ ] Disaster recovery plan documented

### ✅ Application

- [ ] Environment variables configured per environment
- [ ] Database migrations tested and verified
- [ ] LLM provider API key validated
- [ ] Connection pools sized appropriately
- [ ] WebSocket timeouts configured
- [ ] CORS origins whitelisted
- [ ] Session TTLs configured (default: 7 days)
- [ ] Admin session expiry set (default: 1 hour)
- [ ] Tenant quotas defined
- [ ] Error reporting configured (Sentry, Rollbar)

---

## Environment Variables

### Required

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/thirdeye
DATABASE_POOL_SIZE=20
DATABASE_MAX_OVERFLOW=10

# Redis
REDIS_URL=redis://:password@host:6379/0
REDIS_MAX_CONNECTIONS=50

# LLM Provider
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxx
LLM_MODEL=llama3-70b-8192
LLM_TIMEOUT=30

# Security
CSRF_SECRET=your-secure-random-string-min-32-chars
ADMIN_BOOTSTRAP_PASSWORD=strong-admin-password
SECRET_KEY=your-app-secret-key

# Application
ENV=production
LOG_LEVEL=INFO
PORT=8000
WORKERS=4

# Frontend
PORTAL_BASE_URL=https://portal.yourdomain.com
CONTROL_PLANE_URL=https://admin.yourdomain.com
```

### Optional

```bash
# Session Management
SESSION_TTL_SECONDS=604800  # 7 days
ADMIN_SESSION_TTL_SECONDS=3600  # 1 hour
CLEANUP_INTERVAL_SECONDS=86400  # 24 hours

# Rate Limiting
DEFAULT_RATE_LIMIT_PER_MINUTE=60
BURST_LIMIT=120

# Monitoring
SENTRY_DSN=https://xxx@sentry.io/xxx
PROMETHEUS_PORT=9090
METRICS_ENABLED=true

# Features
ENABLE_WEBSOCKET=true
ENABLE_PROGRESS_STREAMING=true
ENABLE_EXPORT=true

# Performance
REQUEST_TIMEOUT=60
LLM_CACHE_TTL=30
```

---

## Deployment Options

### Option 1: Docker Compose (Small-Medium Scale)

**Best for:** Single server, <1000 req/min

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  api:
    image: thirdeye/api:${VERSION}
    restart: always
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: ${DATABASE_URL}
      REDIS_URL: ${REDIS_URL}
      GROQ_API_KEY: ${GROQ_API_KEY}
      ENV: production
      LOG_LEVEL: INFO
    depends_on:
      - postgres
      - redis
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
        reservations:
          cpus: '1'
          memory: 2G

  postgres:
    image: postgres:15-alpine
    restart: always
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    environment:
      POSTGRES_DB: thirdeye
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    restart: always
    command: redis-server --requirepass ${REDIS_PASSWORD} --appendonly yes
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"

  control-plane:
    image: thirdeye/control-plane:${VERSION}
    restart: always
    ports:
      - "3000:3000"
    environment:
      API_BASE_URL: http://api:8000

  portal:
    image: thirdeye/portal:${VERSION}
    restart: always
    ports:
      - "5173:5173"
    environment:
      API_BASE_URL: http://api:8000

  nginx:
    image: nginx:alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - api
      - control-plane
      - portal

volumes:
  postgres_data:
  redis_data:
```

**Deployment:**

```bash
# Build images
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Check health
docker-compose -f docker-compose.prod.yml ps
curl http://localhost:8000/health/ready

# View logs
docker-compose -f docker-compose.prod.yml logs -f api
```

---

### Option 2: Kubernetes (Large Scale)

**Best for:** Multi-server, >1000 req/min, high availability

#### Namespace

```yaml
# namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: third-eye-prod
```

#### Secrets

```yaml
# secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: third-eye-secrets
  namespace: third-eye-prod
type: Opaque
stringData:
  database-url: postgresql://user:pass@postgres:5432/thirdeye
  redis-url: redis://:pass@redis:6379/0
  groq-api-key: gsk_xxxxxxxxxx
  csrf-secret: your-csrf-secret
  admin-password: your-admin-password
```

#### ConfigMap

```yaml
# configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: third-eye-config
  namespace: third-eye-prod
data:
  ENV: "production"
  LOG_LEVEL: "INFO"
  SESSION_TTL_SECONDS: "604800"
  ADMIN_SESSION_TTL_SECONDS: "3600"
```

#### Deployment

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: third-eye-api
  namespace: third-eye-prod
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: third-eye-api
  template:
    metadata:
      labels:
        app: third-eye-api
        version: "1.0"
    spec:
      containers:
      - name: api
        image: thirdeye/api:1.0.0
        ports:
        - containerPort: 8000
          name: http
        - containerPort: 9090
          name: metrics
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: third-eye-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: third-eye-secrets
              key: redis-url
        - name: GROQ_API_KEY
          valueFrom:
            secretKeyRef:
              name: third-eye-secrets
              key: groq-api-key
        envFrom:
        - configMapRef:
            name: third-eye-config
        resources:
          requests:
            cpu: 500m
            memory: 1Gi
          limits:
            cpu: 2000m
            memory: 4Gi
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 8000
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 5
          failureThreshold: 3
```

#### Service

```yaml
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: third-eye-api
  namespace: third-eye-prod
spec:
  type: ClusterIP
  selector:
    app: third-eye-api
  ports:
  - name: http
    port: 80
    targetPort: 8000
  - name: metrics
    port: 9090
    targetPort: 9090
```

#### Ingress

```yaml
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: third-eye-ingress
  namespace: third-eye-prod
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/websocket-services: third-eye-api
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - api.yourdomain.com
    - admin.yourdomain.com
    - portal.yourdomain.com
    secretName: third-eye-tls
  rules:
  - host: api.yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: third-eye-api
            port:
              number: 80
```

#### HorizontalPodAutoscaler

```yaml
# hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: third-eye-api-hpa
  namespace: third-eye-prod
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: third-eye-api
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

**Deployment:**

```bash
# Apply manifests
kubectl apply -f namespace.yaml
kubectl apply -f secrets.yaml
kubectl apply -f configmap.yaml
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
kubectl apply -f ingress.yaml
kubectl apply -f hpa.yaml

# Verify deployment
kubectl get pods -n third-eye-prod
kubectl get svc -n third-eye-prod
kubectl describe ingress -n third-eye-prod

# Check logs
kubectl logs -n third-eye-prod -l app=third-eye-api -f

# Test health
kubectl port-forward -n third-eye-prod svc/third-eye-api 8000:80
curl http://localhost:8000/health/ready
```

---

## Database Setup

### Initial Migration

```bash
# Run migrations
docker exec -it third-eye-api python -m alembic upgrade head

# Or in Kubernetes
kubectl exec -n third-eye-prod deployment/third-eye-api -- \
  python -m alembic upgrade head
```

### Backup Strategy

```bash
# Automated daily backup (cron job)
0 2 * * * pg_dump -h localhost -U postgres thirdeye | \
  gzip > /backups/thirdeye_$(date +\%Y\%m\%d).sql.gz

# Retain 30 days
find /backups -name "thirdeye_*.sql.gz" -mtime +30 -delete
```

### Restore Procedure

```bash
# Stop application
docker-compose down api

# Restore database
gunzip < backup.sql.gz | psql -h localhost -U postgres thirdeye

# Restart application
docker-compose up -d api
```

---

## Monitoring Setup

### Prometheus Configuration

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'third-eye-api'
    static_configs:
      - targets: ['third-eye-api:9090']
    metrics_path: '/metrics'
```

### Grafana Dashboards

**Import Dashboard:** `docs/grafana-dashboard.json`

**Key Panels:**
- Request rate (by endpoint)
- Response time (P50, P95, P99)
- Error rate
- Active sessions
- LLM call latency
- Database connection pool
- Redis memory usage

### Alert Rules

```yaml
# alerts.yml
groups:
  - name: third-eye
    interval: 30s
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"

      - alert: LLMDown
        expr: llm_health == 0
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "LLM provider unavailable"

      - alert: HighResponseTime
        expr: histogram_quantile(0.95, http_request_duration_seconds_bucket) > 5
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "P95 latency > 5s"
```

---

## Performance Tuning

### Database Optimization

```sql
-- Create indexes
CREATE INDEX idx_sessions_created_at ON sessions(created_at);
CREATE INDEX idx_sessions_tenant_id ON sessions(tenant_id);
CREATE INDEX idx_audit_events_created_at ON audit_events(created_at);
CREATE INDEX idx_audit_events_actor ON audit_events(actor);
CREATE INDEX idx_api_keys_tenant ON api_keys(tenant);

-- Analyze tables
ANALYZE sessions;
ANALYZE audit_events;
ANALYZE api_keys;

-- Vacuum
VACUUM ANALYZE;
```

### Connection Pool Tuning

```python
# Adjust in config
DATABASE_POOL_SIZE = 20  # Per worker
DATABASE_MAX_OVERFLOW = 10
DATABASE_POOL_TIMEOUT = 30
```

### Redis Configuration

```conf
# redis.conf
maxmemory 2gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
appendonly yes
appendfsync everysec
```

---

## Security Hardening

### SSL/TLS Configuration

```nginx
# nginx.conf
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        proxy_pass http://api:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /ws/ {
        proxy_pass http://api:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 600s;
    }
}
```

### Firewall Rules

```bash
# Allow only necessary ports
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
```

---

## Troubleshooting Production Issues

### Quick Diagnostics

```bash
# Check service status
systemctl status third-eye-api

# View recent logs
journalctl -u third-eye-api -n 100 --no-pager

# Test connectivity
curl -I https://api.yourdomain.com/health
curl https://api.yourdomain.com/health/ready | jq

# Check database
psql -h localhost -U postgres -c "SELECT COUNT(*) FROM sessions;"

# Check Redis
redis-cli -a password ping
redis-cli -a password info stats
```

### Common Production Issues

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for detailed solutions.

---

## Rollback Procedure

### Docker Compose

```bash
# Rollback to previous version
export VERSION=1.0.0
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

### Kubernetes

```bash
# View rollout history
kubectl rollout history deployment/third-eye-api -n third-eye-prod

# Rollback to previous revision
kubectl rollout undo deployment/third-eye-api -n third-eye-prod

# Rollback to specific revision
kubectl rollout undo deployment/third-eye-api -n third-eye-prod --to-revision=2

# Monitor rollback
kubectl rollout status deployment/third-eye-api -n third-eye-prod
```

---

## Post-Deployment Verification

### Smoke Tests

```bash
# Health check
curl https://api.yourdomain.com/health/ready

# Admin login
curl -X POST https://api.yourdomain.com/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"***"}' | jq

# Create session
curl -X POST https://api.yourdomain.com/session \
  -H "X-API-Key: your-key" \
  -H "Content-Type: application/json" \
  -d '{"profile":"default"}' | jq

# Run validation
curl -X POST https://api.yourdomain.com/validate \
  -H "X-API-Key: your-key" \
  -H "Content-Type: application/json" \
  -d '{"payload":{"intent":"test"},"context":{"session_id":"test"}}' | jq
```

### Performance Benchmark

```bash
# Load test with Apache Bench
ab -n 1000 -c 10 -H "X-API-Key: your-key" \
  https://api.yourdomain.com/health

# Or with k6
k6 run load-test.js
```

---

## Maintenance Windows

### Zero-Downtime Deployment

```bash
# Kubernetes rolling update (automatic)
kubectl set image deployment/third-eye-api \
  api=thirdeye/api:1.1.0 \
  -n third-eye-prod

# Docker Compose (manual blue-green)
docker-compose -f docker-compose.blue.yml up -d
# Test blue environment
# Switch load balancer
docker-compose -f docker-compose.green.yml down
```

### Database Migrations

```bash
# Run migration with zero downtime
kubectl exec -n third-eye-prod deployment/third-eye-api -- \
  python -m alembic upgrade head

# Verify migration
kubectl exec -n third-eye-prod deployment/third-eye-api -- \
  python -m alembic current
```

---

## Support & Escalation

**Critical Issues:**
- Email: support@thirdeye.com
- Slack: #third-eye-alerts
- PagerDuty: Automated alerts

**Non-Critical:**
- GitHub Issues
- Documentation Portal

---

**End of Production Deployment Guide**
