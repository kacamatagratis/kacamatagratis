# Fix Homepage 404 Issue After Git Clone

## Problem

When cloning this project from git to a new location, the homepage shows "Not Found" (404 error) even though the files exist.

## Root Cause

Next.js caches build files and routes in the `.next` directory. When you move the project or clone from git, these cached files may be incompatible or corrupted.

## Solution

### Step 1: Clean Build Cache

```powershell
# Remove .next build cache
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue

# Remove node_modules (optional but recommended)
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
```

### Step 2: Install Dependencies

```powershell
npm install
```

### Step 3: Build & Run

```powershell
# For development
npm run dev

# For production
npm run build
npm start
```

## Quick Fix (One Command)

```powershell
Remove-Item -Recurse -Force .next; npm run dev
```

## Common Issues After Git Clone

### 1. Homepage Shows 404

**Fix**: Clear `.next` folder

```powershell
Remove-Item -Recurse -Force .next; npm run dev
```

### 2. Module Not Found Errors

**Fix**: Reinstall dependencies

```powershell
Remove-Item -Recurse -Force node_modules; npm install
```

### 3. Environment Variables Missing

**Fix**: Copy `.env.example` to `.env.local` and fill in values

```powershell
Copy-Item .env.example .env.local
# Then edit .env.local with your Firebase config
```

### 4. Build Fails

**Fix**: Full clean install

```powershell
Remove-Item -Recurse -Force .next, node_modules, .turbo -ErrorAction SilentlyContinue
npm install
npm run build
```

## After Fresh Clone - Complete Setup

```powershell
# 1. Navigate to project directory
cd kacamatagratis.com

# 2. Install dependencies
npm install

# 3. Setup environment variables
Copy-Item .env.example .env.local
# Edit .env.local with your Firebase config

# 4. Clean any previous builds
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue

# 5. Run development server
npm run dev
```

## Production Deployment After Clone

```powershell
# 1. Install dependencies
npm install

# 2. Clean build cache
Remove-Item -Recurse -Force .next

# 3. Build for production
npm run build

# 4. Test production build
npm start
```

## Why This Happens

1. **Next.js Caching**: Next.js caches compiled routes in `.next/` folder
2. **Path Changes**: When moving projects, absolute paths may change
3. **Build Artifacts**: Previous build artifacts may conflict with new environment
4. **Node Modules**: Dependencies may have different compiled binaries per system

## Best Practices

### Always Include in .gitignore

```
.next/
node_modules/
.turbo/
.env.local
```

### After Every Git Clone

1. ✅ Install dependencies: `npm install`
2. ✅ Setup environment: Copy `.env.example` to `.env.local`
3. ✅ Clean cache: `Remove-Item -Recurse -Force .next`
4. ✅ Build/Run: `npm run dev` or `npm run build`

### Never Commit These Folders

- ❌ `.next/` - Build cache
- ❌ `node_modules/` - Dependencies
- ❌ `.turbo/` - Turbopack cache
- ❌ `.env.local` - Local environment variables

## Automated Setup Script

Create `setup.ps1` in your project root:

```powershell
# setup.ps1 - Run after git clone
Write-Host "Setting up Kacamata Gratis project..." -ForegroundColor Green

# Clean build cache
Write-Host "Cleaning build cache..." -ForegroundColor Yellow
Remove-Item -Recurse -Force .next, .turbo -ErrorAction SilentlyContinue

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install

# Setup environment
if (-not (Test-Path .env.local)) {
    Write-Host "Creating .env.local from .env.example..." -ForegroundColor Yellow
    Copy-Item .env.example .env.local
    Write-Host "⚠️  Please edit .env.local with your Firebase config!" -ForegroundColor Red
}

Write-Host "✅ Setup complete! Run 'npm run dev' to start." -ForegroundColor Green
```

Then run:

```powershell
.\setup.ps1
```

## Vercel Deployment (No Issues)

Vercel automatically:

- ✅ Cleans build cache
- ✅ Installs fresh dependencies
- ✅ Builds from scratch
- ✅ No 404 issues

So this issue only affects local development after git clone.

## Summary

**The homepage 404 issue after git clone is caused by stale Next.js build cache.**

**Quick fix:**

```powershell
Remove-Item -Recurse -Force .next; npm run dev
```

**Complete fix:**

```powershell
Remove-Item -Recurse -Force .next, node_modules
npm install
npm run dev
```

That's it! Your homepage will work perfectly after cleaning the cache.
