# Urban Risk Intelligence Platform - Deployment Guide

## Table of Contents
1. [System Requirements](#system-requirements)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Environment Setup](#environment-setup)
4. [Production Build](#production-build)
5. [Deployment Options](#deployment-options)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Troubleshooting](#troubleshooting)

---

## System Requirements

### Minimum Requirements
- **Node.js**: v16.0.0 or higher (v18+ recommended)
- **npm**: v8.0.0 or higher
- **RAM**: 2GB minimum (4GB recommended)
- **Storage**: 500MB for application + dependencies
- **OS**: Windows, Linux, or macOS

### Production Server Recommendations
- **Node.js LTS**: v20.x
- **RAM**: 4GB+
- **CPU**: 2+ cores
- **Storage**: 1GB+ SSD
- **Network**: Stable internet connection for serving clients

---

## Pre-Deployment Checklist

Before deploying, ensure you have:

- [x] Tested all API endpoints successfully
- [x] Verified frontend-backend integration
- [ ] Updated environment variables for production
- [ ] Configured CORS settings for production domain
- [ ] Set up SSL/TLS certificates (for HTTPS)
- [ ] Configured production database (if applicable)
- [ ] Set up logging and monitoring
- [ ] Prepared backup and rollback procedures

---

## Environment Setup

### 1. Clone and Configure

```bash
# Clone or copy the repository
cd c:\Users\Dell\Downloads\au_hack-main\au_hack-main

# Install root dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

### 2. Environment Variables

Create a `.env` file in the root directory based on `.env.example`:

```bash
# Copy the example file
copy .env.example .env
```

Edit `.env` with production values:

```env
PORT=5000
NODE_ENV=production

# Update with your production domain
CORS_ORIGIN=https://yourdomain.com

# API Configuration
API_BASE_URL=https://yourdomain.com/api/v1

# Logging for production
LOG_LEVEL=warn
```

### 3. Frontend Configuration

Update `client/src/utils/api.js` if needed to point to production API:

```javascript
const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://yourdomain.com/api/v1'
  : 'http://localhost:5000/api/v1';
```

---

## Production Build

### Build the Frontend

```bash
# Navigate to project root
cd c:\Users\Dell\Downloads\au_hack-main\au_hack-main

# Build the client
npm run build
```

**Build Output**: The production-ready files will be created in:
```
client/dist/
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── ... (other bundled assets)
└── ... (static files)
```

### Verify Build

```bash
# Preview the production build locally
cd client
npm run preview
```

This starts a local preview server. Open the URL shown (usually `http://localhost:4173`) to verify the build.

---

## Deployment Options

### Option 1: Single Server (Node.js Serves Everything)

**Best for**: Simple deployments, small to medium traffic

#### Step 1: Configure Server to Serve Static Files

Update `server.js` to serve the frontend build:

```javascript
import path from 'path';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from client/dist
app.use(express.static(path.join(__dirname, 'client', 'dist')));

// API routes (keep existing ones)
app.get('/api/v1/health', ...);
// ... other API routes ...

// Fallback to index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
});
```

#### Step 2: Start the Server

```bash
# Using Node directly
node server.js

# Or with PM2 (recommended for production)
npm install -g pm2
pm2 start server.js --name urban-risk-platform
pm2 save
pm2 startup
```

#### Step 3: Configure Reverse Proxy (Nginx)

Create `/etc/nginx/sites-available/urban-risk`:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and restart:
```bash
sudo ln -s /etc/nginx/sites-available/urban-risk /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

### Option 2: Separate Frontend and Backend Servers

**Best for**: Scalability, CDN integration, microservices architecture

#### Backend Deployment

Deploy the backend API to a Node.js server:

```bash
# On backend server
git clone <your-repo>
cd au_hack-main
npm install
node server.js
```

Or use a platform like:
- **Heroku**: `git push heroku main`
- **Railway**: Connect GitHub repo
- **DigitalOcean App Platform**: Deploy from GitHub
- **AWS Elastic Beanstalk**: Upload application bundle

#### Frontend Deployment

Deploy `client/dist` to a static hosting service:

- **Vercel**: `vercel --prod`
- **Netlify**: `netlify deploy --prod --dir=client/dist`
- **AWS S3 + CloudFront**: Upload to S3 bucket, configure CloudFront
- **GitHub Pages**: Push `dist` folder to `gh-pages` branch

**Important**: Update frontend API base URL to point to the deployed backend.

---

### Option 3: Docker Deployment

**Best for**: Consistency across environments, container orchestration

#### Create Dockerfile

Create `Dockerfile` in project root:

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/

# Install dependencies
RUN npm install
RUN cd client && npm install

# Copy application files
COPY . .

# Build frontend
RUN npm run build

# Expose port
EXPOSE 5000

# Start application
CMD ["node", "server.js"]
```

#### Create docker-compose.yml

```yaml
version: '3.8'

services:
  urban-risk:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - PORT=5000
    restart: unless-stopped
```

#### Deploy

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

---

## Post-Deployment Verification

### 1. Health Check

```bash
curl https://yourdomain.com/api/v1/health
# Expected: {"status":"ok","timestamp":"..."}
```

### 2. API Endpoints Test

```bash
# Current state
curl "https://yourdomain.com/api/v1/current-state?city_id=1"

# Risk assessment
curl "https://yourdomain.com/api/v1/risk-assessment?city_id=1"

# Historical data
curl "https://yourdomain.com/api/v1/historical?city_id=1&hours=24"
```

### 3. Frontend Access

1. Open `https://yourdomain.com` in browser
2. Verify homepage loads
3. Navigate to Platform page
4. Check that data is loading from API
5. Test all page navigations

### 4. Performance Check

- **Page Load Time**: Should be < 3 seconds
- **API Response Time**: Should be < 500ms
- **No JavaScript Errors**: Check browser console

---

## Monitoring and Maintenance

### Logging

Add logging middleware to `server.js`:

```javascript
import morgan from 'morgan';

if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}
```

### Process Management (PM2)

```bash
# Monitor processes
pm2 status

# View logs
pm2 logs urban-risk-platform

# Restart gracefully
pm2 reload urban-risk-platform

# Auto-restart on crashes
pm2 startup
pm2 save
```

### Backup Strategy

**Code**: Use Git for version control
```bash
git push origin main
```

**Data** (if you add database):
```bash
# Example for PostgreSQL
pg_dump dbname > backup_$(date +%Y%m%d).sql
```

---

## Security Recommendations

1. **Enable HTTPS**: Use Let's Encrypt for free SSL certificates
2. **Rate Limiting**: Add express-rate-limit middleware
3. **Helmet**: Add security headers
   ```javascript
   import helmet from 'helmet';
   app.use(helmet());
   ```
4. **CORS**: Restrict to specific origins
   ```javascript
   app.use(cors({
     origin: 'https://yourdomain.com'
   }));
   ```
5. **Environment Variables**: Never commit `.env` to Git
6. **Update Dependencies**: Regularly run `npm audit fix`

---

## Scaling Recommendations

### Horizontal Scaling
- Use load balancer (Nginx, AWS ALB)
- Deploy multiple server instances
- Use PM2 cluster mode:
  ```bash
  pm2 start server.js -i max
  ```

### Caching
- Add Redis for API response caching
- Enable browser caching for static assets
- Use CDN for frontend assets

### Database
- Consider adding PostgreSQL/MongoDB for persistent data
- Use connection pooling
- Implement database indexing

---

## Troubleshooting

### Issue: Frontend not loading

**Symptoms**: Blank page or 404 errors

**Solutions**:
1. Verify build was successful: Check `client/dist` folder exists
2. Check server is serving static files correctly
3. Verify API requests aren't being blocked by CORS
4. Check browser console for JavaScript errors

### Issue: API endpoints returning 500 errors

**Symptoms**: Server crashes or internal server errors

**Solutions**:
1. Check server logs: `pm2 logs` or console output
2. Verify all dependencies are installed: `npm install`
3. Check environment variables are set correctly
4. Verify Node.js version: `node --version`

### Issue: Slow performance

**Symptoms**: Long API response times, slow page loads

**Solutions**:
1. Enable gzip compression in Express:
   ```javascript
   import compression from 'compression';
   app.use(compression());
   ```
2. Implement caching for frequently requested data
3. Optimize frontend bundle size
4. Use CDN for static assets
5. Upgrade server resources (CPU/RAM)

### Issue: Memory leaks

**Symptoms**: Server RAM usage continuously increases

**Solutions**:
1. Monitor with PM2: `pm2 monit`
2. Add memory limit: `pm2 start server.js --max-memory-restart 500M`
3. Review code for event listener leaks
4. Update dependencies to latest stable versions

---

## Quick Reference Commands

```bash
# Development
npm run dev              # Start both frontend and backend

# Production Build
npm run build            # Build frontend for production
npm run preview          # Preview production build locally

# Server Only
npm run server           # Start backend only
npm run client           # Start frontend only (dev mode)

# PM2 Management
pm2 start server.js --name urban-risk
pm2 stop urban-risk
pm2 restart urban-risk
pm2 logs urban-risk
pm2 monit

# Docker
docker-compose up -d
docker-compose down
docker-compose logs -f
```

---

## Support and Documentation

- **API Documentation**: See `API_DOCUMENTATION.md`
- **Setup Guide**: See `SETUP_AND_TESTING.md`
- **Architecture**: See `VITE_ARCHITECTURE.md`
- **Frontend Components**: See `INTERACTIVE_EXPERIENCE.md`

---

## Deployment Checklist

Before going live:

- [ ] All tests passing (backend + frontend)
- [ ] Production environment variables configured
- [ ] Frontend built successfully
- [ ] Server configured to serve static files
- [ ] CORS configured for production domain
- [ ] SSL/TLS certificate installed
- [ ] Reverse proxy configured (if using)
- [ ] PM2 or similar process manager configured
- [ ] Logging and monitoring set up
- [ ] Backup procedures established
- [ ] Security headers added (Helmet, CORS, rate limiting)
- [ ] Performance testing completed
- [ ] Documentation updated with deployment details

---

## Production Deployment Timeline

| Phase | Duration | Tasks |
|-------|----------|-------|
| **Preparation** | 2-4 hours | Environment setup, configuration, security review |
| **Build & Test** | 1-2 hours | Production build, local verification |
| **Deployment** | 1-2 hours | Server setup, application deployment |
| **Verification** | 1 hour | Post-deployment testing, monitoring setup |
| **Monitoring** | Ongoing | Performance monitoring, log review |

**Total Estimated Time**: 5-9 hours for initial deployment

---

## Conclusion

The Urban Risk Intelligence Platform is ready for production deployment. Follow this guide to deploy to your chosen infrastructure. Choose the deployment option that best fits your requirements:

- **Option 1** for simplicity
- **Option 2** for scalability
- **Option 3** for containerization

For assistance or questions, refer to the project documentation or contact the development team.

**Status**: ✅ **DEPLOYMENT-READY**
