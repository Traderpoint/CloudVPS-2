# 🐳 Systrix Middleware NextJS - Docker Deployment

This document describes how to build and deploy the Systrix Middleware NextJS as a Docker container.

## 📋 Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- HostBill API credentials

## 🚀 Quick Start

### 1. **Environment Setup**

Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` with your actual values:
```env
# HostBill API Configuration
HOSTBILL_API_ID=your_actual_api_id
HOSTBILL_API_KEY=your_actual_api_key

# Comgate Payment Gateway (if using)
COMGATE_MERCHANT_ID=your_merchant_id
COMGATE_SECRET=your_secret_key
```

### 2. **Build & Run with Docker Compose**

```bash
# Build and start the container
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the container
docker-compose down
```

### 3. **Manual Docker Build**

```bash
# Make build script executable
chmod +x build-docker.sh

# Build the image
./build-docker.sh

# Run the container
docker run -p 3005:3005 --env-file .env systrix-middleware-nextjs:latest
```

## 🌐 Access Points

Once running, the middleware will be available at:

- **Dashboard**: http://localhost:3005/dashboard
- **Health Check**: http://localhost:3005/api/health
- **Status**: http://localhost:3005/api/status
- **Orders API**: http://localhost:3005/api/orders/create

## 📁 Container Structure

```
/app/
├── .next/                 # Next.js build output
├── lib/                   # Core middleware libraries
│   ├── hostbill-client.js # HostBill API client
│   ├── order-processor.js # Order processing logic
│   ├── payment-processor.js
│   └── product-mapper.js
├── pages/                 # Next.js pages and API routes
├── components/            # React components
├── utils/                 # Utility functions
├── logs/                  # Application logs (volume mounted)
└── server.js             # Custom server entry point
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3005` |
| `NODE_ENV` | Environment | `production` |
| `HOSTBILL_API_ID` | HostBill API ID | Required |
| `HOSTBILL_API_KEY` | HostBill API Key | Required |
| `ALLOWED_ORIGINS` | CORS origins | `http://localhost:3000,http://localhost:3006` |
| `LOG_LEVEL` | Logging level | `info` |

### Volume Mounts

- `middleware-logs:/app/logs` - Persistent log storage

## 🏥 Health Checks

The container includes health checks:

```bash
# Check container health
docker-compose ps

# Manual health check
curl http://localhost:3005/api/health
```

## 📊 Monitoring

### View Logs

```bash
# All logs
docker-compose logs -f

# Specific service logs
docker-compose logs -f systrix-middleware

# Log files (if volume mounted)
docker exec -it systrix-middleware-nextjs_systrix-middleware_1 tail -f /app/logs/middleware.log
```

### Container Stats

```bash
# Resource usage
docker stats

# Container info
docker inspect systrix-middleware-nextjs_systrix-middleware_1
```

## 🔄 Updates

### Update Container

```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Backup Configuration

```bash
# Backup environment and logs
tar -czf middleware-backup-$(date +%Y%m%d).tar.gz .env logs/
```

## 🐛 Troubleshooting

### Common Issues

1. **Port 3005 already in use**
   ```bash
   # Check what's using the port
   lsof -i :3005
   
   # Change port in docker-compose.yml
   ports:
     - "3006:3005"  # Use different external port
   ```

2. **HostBill API connection failed**
   ```bash
   # Check API credentials
   docker-compose exec systrix-middleware curl -f http://localhost:3005/api/test-connection
   ```

3. **Container won't start**
   ```bash
   # Check logs for errors
   docker-compose logs systrix-middleware
   
   # Check environment variables
   docker-compose exec systrix-middleware env | grep HOSTBILL
   ```

### Debug Mode

```bash
# Run with debug logging
docker-compose down
docker-compose run -e LOG_LEVEL=debug systrix-middleware
```

## 🚀 Production Deployment

### Docker Swarm

```yaml
# docker-stack.yml
version: '3.8'
services:
  systrix-middleware:
    image: systrix-middleware-nextjs:latest
    ports:
      - "3005:3005"
    environment:
      - NODE_ENV=production
    deploy:
      replicas: 2
      restart_policy:
        condition: on-failure
```

```bash
docker stack deploy -c docker-stack.yml systrix-middleware
```

### Kubernetes

```yaml
# k8s-deployment.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: systrix-middleware
spec:
  replicas: 2
  selector:
    matchLabels:
      app: systrix-middleware
  template:
    metadata:
      labels:
        app: systrix-middleware
    spec:
      containers:
      - name: systrix-middleware
        image: systrix-middleware-nextjs:latest
        ports:
        - containerPort: 3005
        env:
        - name: NODE_ENV
          value: "production"
```

## 📝 Notes

- The container runs as non-root user `nextjs` (UID 1001)
- Logs are written to `/app/logs/` directory
- Health checks run every 30 seconds
- Container automatically restarts on failure
- All middleware functionality is self-contained
