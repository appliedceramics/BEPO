#!/bin/bash

echo "Mobile Insulin Calculator - GitHub Setup"
echo "========================================"

# Clean up any git locks
rm -f .git/index.lock .git/config.lock .git/HEAD.lock 2>/dev/null

# Initialize git if needed
if [ ! -d .git ]; then
    git init
    echo "Git repository initialized"
fi

# Add all files
git add .

# Commit changes
git commit -m "Initial commit: Mobile-first insulin calculator

- Touch-optimized calculator interface with native app feel
- Progressive Web App capabilities for mobile installation
- Real-time insulin dose calculations (First Meal, Other Meals, Bedtime, 24-Hour)
- Settings management for insulin ratios and sensitivity factors
- Secure authentication with PostgreSQL backend
- React TypeScript frontend with Tailwind CSS
- Responsive design optimized for mobile devices"

echo "Files committed successfully"
echo ""
echo "Next steps to push to GitHub:"
echo "1. Create a repository on GitHub named 'mobile-insulin-calculator'"
echo "2. Run these commands:"
echo ""
echo "git remote add origin https://github.com/YOUR_USERNAME/mobile-insulin-calculator.git"
echo "git branch -M main"
echo "git push -u origin main"
echo ""
echo "Replace YOUR_USERNAME with your actual GitHub username"