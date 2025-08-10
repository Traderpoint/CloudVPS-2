# 🐳 CloudVPS - Docker Deployment

This document describes how to build and deploy CloudVPS as a Docker container with full functionality including Google OAuth and all features.

## 📋 Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- Google Cloud Console account (for OAuth)
- HostBill API credentials
- Running Middleware instance (port 3005)

## 🚀 Quick Start

### 1. **Environment Setup**

Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` with your actual values:
```env
# Google OAuth (REQUIRED)
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here

# NextAuth Secret (REQUIRED)
NEXTAUTH_SECRET=your-random-secret-key-here

# HostBill API (REQUIRED)
HOSTBILL_API_ID=your-hostbill-api-id-here
HOSTBILL_API_KEY=your-hostbill-api-key-here

# Production Domain (IMPORTANT)
NEXTAUTH_URL=https://your-domain.com
```

### 2. **Google OAuth Configuration**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure:
   - **Application type**: Web application
   - **Authorized JavaScript origins**: `http://localhost:3000` (or your domain)
   - **Authorized redirect URIs**: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Client Secret to `.env`

### 3. **Build & Run**

```bash
# Make build script executable
chmod +x build-docker.sh

# Build the image
./build-docker.sh

# Start with docker-compose (includes middleware)
docker-compose up -d

# Or run CloudVPS only
docker run -p 3000:3000 --env-file .env cloudvps:latest
```

### 4. **Verify Deployment**

```bash
# Test functionality
node test-cloudvps-docker.js

# Check logs
docker-compose logs -f cloudvps
```

## 🌐 Access Points

Once running, CloudVPS will be available at:

- **Home Page**: http://localhost:3000
- **VPS Selection**: http://localhost:3000/vps
- **Billing Form**: http://localhost:3000/billing
- **Google OAuth**: http://localhost:3000/api/auth/signin
- **Test Cart**: http://localhost:3000/test-cart

## 📁 Container Structure

```
/app/
├── .next/                 # Next.js build output
├── pages/                 # Next.js pages and API routes
│   ├── api/auth/         # NextAuth.js authentication
│   ├── api/orders/       # Order processing
│   ├── api/payments/     # Payment handling
│   ├── api/middleware/   # Middleware communication
│   └── api/hostbill/     # Direct HostBill API calls
├── components/           # React components
├── contexts/             # React contexts (CartContext)
├── utils/                # Utility functions
├── styles/               # CSS styles
└── public/               # Static assets
```

## 🔧 Configuration

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | `123456789-abc.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | `GOCSPX-abcdefghijklmnop` |
| `NEXTAUTH_SECRET` | NextAuth.js secret key | `random-secret-key-here` |
| `NEXTAUTH_URL` | Production domain | `https://your-domain.com` |
| `HOSTBILL_API_ID` | HostBill API ID | `adcdebb0e3b6f583052d` |
| `HOSTBILL_API_KEY` | HostBill API Key | `b8f7a3e9c2d1f4e6a8b9c3d2e1f5a7b4` |
| `MIDDLEWARE_URL` | Middleware endpoint | `http://localhost:3005` |

### Optional Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `production` |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps API | Not set |
| `DEFAULT_AFFILIATE_ID` | Default affiliate | `2` |

## 🔗 Dependencies

### External Services

1. **Google OAuth** - User authentication
2. **HostBill API** - Billing and order management
3. **Middleware** - Order processing (port 3005)

### Service Communication

```
CloudVPS (3000) → Middleware (3005) → HostBill API
CloudVPS (3000) → Google OAuth
CloudVPS (3000) → HostBill API (direct for some operations)
```

## 🏥 Health Checks

The container includes health checks:

```bash
# Check container health
docker-compose ps

# Manual health check
curl http://localhost:3000/api/auth/session
```

## 📊 Monitoring

### View Logs

```bash
# All services
docker-compose logs -f

# CloudVPS only
docker-compose logs -f cloudvps

# Real-time logs
docker logs -f cloudvps-container-name
```

### Container Stats

```bash
# Resource usage
docker stats

# Container info
docker inspect cloudvps:latest
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
# Backup environment and data
tar -czf cloudvps-backup-$(date +%Y%m%d).tar.gz .env docker-compose.yml
```

## 🐛 Troubleshooting

### Common Issues

1. **Google OAuth not working**
   ```bash
   # Check OAuth configuration
   curl http://localhost:3000/api/auth/providers
   
   # Verify redirect URIs in Google Console
   # Must match exactly: http://localhost:3000/api/auth/callback/google
   ```

2. **Middleware connection failed**
   ```bash
   # Check middleware is running
   curl http://localhost:3005/api/health
   
   # Check network connectivity
   docker-compose exec cloudvps curl http://middleware:3005/api/health
   ```

3. **HostBill API errors**
   ```bash
   # Test HostBill connectivity
   curl http://localhost:3000/api/hostbill/products
   
   # Check API credentials in .env
   ```

4. **Container won't start**
   ```bash
   # Check logs for errors
   docker-compose logs cloudvps
   
   # Check environment variables
   docker-compose exec cloudvps env | grep GOOGLE
   ```

### Debug Mode

```bash
# Run with debug logging
docker-compose down
docker-compose run -e NODE_ENV=development cloudvps
```

## 🚀 Production Deployment

### Docker Swarm

```yaml
# docker-stack.yml
version: '3.8'
services:
  cloudvps:
    image: cloudvps:latest
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXTAUTH_URL=https://your-domain.com
    deploy:
      replicas: 2
      restart_policy:
        condition: on-failure
    secrets:
      - google_oauth_secret
      - hostbill_api_secret
```

```bash
docker stack deploy -c docker-stack.yml cloudvps
```

### Kubernetes

```yaml
# k8s-deployment.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cloudvps
spec:
  replicas: 2
  selector:
    matchLabels:
      app: cloudvps
  template:
    metadata:
      labels:
        app: cloudvps
    spec:
      containers:
      - name: cloudvps
        image: cloudvps:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: NEXTAUTH_URL
          value: "https://your-domain.com"
```

## 📝 Notes

- The container runs as non-root user `nextjs` (UID 1001)
- Google OAuth requires exact domain matching
- Middleware must be accessible from the container
- HostBill API calls are made over HTTPS
- All sensitive data should be provided via environment variables
- Container automatically restarts on failure
- Health checks run every 30 seconds
