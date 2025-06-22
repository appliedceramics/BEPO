# Deployment Fix for Fun Calculator

## Common Issues After Deployment

### 1. Environment Variables Missing
```bash
# Required environment variables
DATABASE_URL=postgresql://...
NODE_ENV=production
SESSION_SECRET=your-secret-key
PORT=5000
```

### 2. Database Schema Not Applied
```bash
# Run this after deployment
npm run db:push
```

### 3. Build Configuration
```bash
# Ensure production build works
npm run build
npm run start
```

### 4. API Endpoint Issues
Check these endpoints are working:
- `/api/calculator-settings` - Calculator settings
- `/api/user` - User authentication  
- `/api/insulin-logs` - Logging functionality

### 5. Static File Serving
Ensure the production build serves the React app correctly.

## Quick Fix Commands

```bash
# 1. Set environment variables
export DATABASE_URL="your-database-url"
export NODE_ENV="production"
export SESSION_SECRET="your-secret"

# 2. Apply database schema
npm run db:push

# 3. Rebuild and restart
npm run build
npm run start
```

## Redeployment Steps

If the calculator still doesn't work:

1. **Update the GitHub repository:**
```bash
git add .
git commit -m "Fix deployment configuration for Fun Calculator"
git push origin main
```

2. **Redeploy from your hosting platform** (Vercel, Netlify, Railway, etc.)

3. **Set environment variables** in your hosting platform dashboard

4. **Run database migration** in your hosting platform terminal:
```bash
npm run db:push
```

The calculator is working locally, so this is likely a deployment configuration issue rather than code problems.