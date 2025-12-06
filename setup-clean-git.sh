#!/bin/bash
# Clean Git History Setup Script for Series Events
# This script ensures NO commit history from cloned repos

set -e  # Exit on error

cd /Users/krishivseth/Series

echo "🧹 Cleaning all existing Git repositories..."
echo "==========================================="

# Method 1: Remove ALL .git directories recursively
echo "Step 1: Removing all .git directories..."
find . -name ".git" -type d -prune -exec rm -rf {} + 2>/dev/null || true
find . -name ".git" -type d 2>/dev/null | while read dir; do
    echo "  Removing: $dir"
    rm -rf "$dir" 2>/dev/null || true
done
echo "✅ All .git directories removed"

# Method 2: Verify no git remotes exist in subdirectories
echo ""
echo "Step 2: Checking for any remaining git artifacts..."
if [ -d "frontend/.git" ] || [ -d "backend/.git" ] || [ -d "ai-social-finder/.git" ]; then
    echo "⚠️  Warning: Some .git directories still exist, removing..."
    rm -rf frontend/.git backend/.git ai-social-finder/.git 2>/dev/null || true
fi
echo "✅ Git artifacts cleaned"

# Method 3: Create comprehensive .gitignore
echo ""
echo "Step 3: Creating comprehensive .gitignore..."
cat > .gitignore << 'EOF'
# ============================================
# Dependencies
# ============================================
**/node_modules/
**/bun.lockb
**/package-lock.json
**/yarn.lock
**/pnpm-lock.yaml

# ============================================
# Build outputs
# ============================================
**/dist/
**/build/
**/.next/
**/out/
**/*.tsbuildinfo

# ============================================
# Environment variables
# ============================================
**/.env
**/.env.local
**/.env.*.local
.env.example

# ============================================
# Logs
# ============================================
**/*.log
**/npm-debug.log*
**/yarn-debug.log*
**/yarn-error.log*
**/chemistry.log
logs/
*.log

# ============================================
# IDE and Editor files
# ============================================
.vscode/
.idea/
*.swp
*.swo
*.sublime-*
*.code-workspace
.DS_Store
Thumbs.db

# ============================================
# Testing and Coverage
# ============================================
**/coverage/
**/.nyc_output/
**/.jest/
**/__tests__/__snapshots__/

# ============================================
# Temporary files
# ============================================
**/.cache/
**/.temp/
**/.tmp/
*.tmp
*.temp

# ============================================
# OS files
# ============================================
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Desktop.ini

# ============================================
# Optional: Uncomment if you want to exclude these
# ============================================
# **/test-api.sh
# **/verify-computation.sh
# **/test-integration.sh
EOF
echo "✅ .gitignore created"

# Method 4: Initialize fresh Git repository at root
echo ""
echo "Step 4: Initializing fresh Git repository..."
if [ -d ".git" ]; then
    echo "  Removing existing .git directory..."
    rm -rf .git
fi

git init
echo "✅ Fresh Git repository initialized"

# Method 5: Verify no git config from previous repos
echo ""
echo "Step 5: Cleaning Git configuration..."
git config --local --remove-section remote.origin 2>/dev/null || true
git config --local --remove-section branch.main 2>/dev/null || true
git config --local --remove-section branch.master 2>/dev/null || true
echo "✅ Git config cleaned"

# Method 6: Add all files and verify
echo ""
echo "Step 6: Staging files for initial commit..."
git add .
echo "✅ Files staged"

# Show what will be committed (first 20 files)
echo ""
echo "Files to be committed (sample):"
git status --short | head -20

# Method 7: Create initial commit
echo ""
echo "Step 7: Creating initial commit..."
git commit -m "Initial commit: Series Events Platform

Complete event planning platform with AI-powered chemistry prediction.

Features:
- Backend API with sophisticated chemistry prediction engine
- Frontend React application with real-time chemistry visualization
- Full integration between backend and frontend
- Privacy-first message metadata analysis (no content stored)
- Guest list optimization algorithms
- Social graph analysis and network metrics
- Event management system
- Real-time chemistry scoring

Tech Stack:
- Backend: Node.js, TypeScript, Express
- Frontend: React, TypeScript, Vite, Tailwind CSS
- Chemistry Engine: Custom algorithms for group dynamics prediction"

echo "✅ Initial commit created"

# Method 8: Verify clean history
echo ""
echo "Step 8: Verifying clean Git history..."
COMMIT_COUNT=$(git rev-list --count HEAD 2>/dev/null || echo "0")
REMOTE_COUNT=$(git remote -v | wc -l)

echo "  Commits in history: $COMMIT_COUNT"
echo "  Remotes configured: $REMOTE_COUNT"

if [ "$COMMIT_COUNT" == "1" ]; then
    echo "✅ History is clean - only 1 commit (the initial commit)"
else
    echo "⚠️  Warning: Multiple commits found. Showing commit log:"
    git log --oneline
fi

# Method 9: Show next steps
echo ""
echo "==========================================="
echo "✅ Setup Complete!"
echo "==========================================="
echo ""
echo "Your repository is now ready with clean history."
echo ""
echo "Next steps:"
echo ""
echo "1. Create a new repository on GitHub:"
echo "   - Go to https://github.com/new"
echo "   - Name it (e.g., 'series-events' or 'hackseries-events')"
echo "   - DO NOT initialize with README, .gitignore, or license"
echo "   - Click 'Create repository'"
echo ""
echo "2. Connect and push:"
echo "   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "3. Verify on GitHub that there's only 1 commit in history"
echo ""
echo "==========================================="

