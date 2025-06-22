# Deployment Guide

## Quick Deploy Commands

### 1. Initialize Git Repository
```bash
# Remove existing git lock if present
rm -f .git/index.lock .git/config.lock

# Initialize fresh repository
git init
git add .
git commit -m "Initial commit: Mobile-first insulin calculator app

- Extracted Calculator Settings and Fun Calculator from BEPO
- Mobile-optimized responsive design with native app feel
- Touch-friendly interface with haptic feedback
- Progressive Web App capabilities
- Authentication system with PostgreSQL backend
- Real-time insulin dose calculations
- Settings management for ratios and sensitivity factors"
```

### 2. Push to GitHub
```bash
# Create repository on GitHub first, then:
git remote add origin https://github.com/YOUR_USERNAME/mobile-insulin-calculator.git
git branch -M main
git push -u origin main
```

### 3. Environment Setup for New Deployment
```bash
# Create .env file
cat > .env << EOF
DATABASE_URL=postgresql://username:password@host:port/database
NODE_ENV=production
SESSION_SECRET=your-super-secret-session-key-here
EOF

# Install dependencies
npm install

# Setup database
npm run db:push

# Build for production
npm run build

# Start production server
npm run start
```

## Complete GitHub Push Script

Save this as `deploy.sh` and run `chmod +x deploy.sh && ./deploy.sh`:

```bash
#!/bin/bash

echo "🚀 Starting deployment to GitHub..."

# Clean up any git locks
rm -f .git/index.lock .git/config.lock 2>/dev/null

# Check if remote origin exists
if git remote get-url origin >/dev/null 2>&1; then
    echo "✅ Git remote already configured"
else
    echo "❌ Please set your GitHub repository URL:"
    echo "git remote add origin https://github.com/YOUR_USERNAME/mobile-insulin-calculator.git"
    exit 1
fi

# Stage all files
git add .

# Check if there are changes to commit
if git diff --cached --quiet; then
    echo "✅ No changes to commit"
else
    # Commit changes
    git commit -m "Update mobile insulin calculator - $(date '+%Y-%m-%d %H:%M:%S')"
    echo "✅ Changes committed"
fi

# Push to GitHub
git push -u origin main

echo "🎉 Successfully pushed to GitHub!"
echo "📱 Your mobile insulin calculator is now on GitHub"
echo "🔗 Repository: $(git remote get-url origin)"
```

## Alternative: Manual GitHub Upload

If git commands fail, you can manually upload:

1. **Download project**: 
   - In Replit: Three dots menu → "Download as zip"
   - Extract on your computer

2. **Create GitHub repository**:
   - Go to github.com → "New repository"
   - Name: `mobile-insulin-calculator`
   - Don't initialize with README

3. **Upload files**:
   - Use GitHub's "uploading an existing file" option
   - Drag and drop all project files

## Environment Variables for Production

Set these in your deployment platform:

```
DATABASE_URL=postgresql://...
NODE_ENV=production
SESSION_SECRET=your-secret-key
```

## Deployment Platforms

### Vercel
```bash
npm i -g vercel
vercel --prod
```

### Netlify
```bash
npm run build
# Upload dist/ folder to Netlify
```

### Railway
```bash
# Connect GitHub repo to Railway
# Set environment variables
# Deploy automatically on push
```

### Heroku
```bash
git push heroku main
```