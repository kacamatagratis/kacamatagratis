# Fix 404 Error on Vercel After Moving Repository

## Problem

When you move this repository from your GitHub to a client's GitHub and deploy to Vercel, the homepage shows **404 Not Found** even though it works locally.

## Root Cause

**Missing Environment Variables on Vercel**

The app requires Firebase configuration environment variables to work. When you clone/fork the repository to a new GitHub account and deploy to Vercel, these variables aren't automatically copied.

## Solution: Add Environment Variables to Vercel

### Step 1: Get Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Click **Settings** ⚙️ → **Project Settings**
4. Scroll down to **Your apps** section
5. Click **Config** under SDK setup and configuration
6. Copy the `firebaseConfig` values

You'll see something like:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456",
};
```

### Step 2: Add Environment Variables to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your deployed project
3. Go to **Settings** → **Environment Variables**
4. Add the following variables:

| Variable Name                              | Value                                  | Environment                      |
| ------------------------------------------ | -------------------------------------- | -------------------------------- |
| `NEXT_PUBLIC_FIREBASE_API_KEY`             | `AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX` | Production, Preview, Development |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`         | `your-project.firebaseapp.com`         | Production, Preview, Development |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID`          | `your-project-id`                      | Production, Preview, Development |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`      | `your-project.appspot.com`             | Production, Preview, Development |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `123456789012`                         | Production, Preview, Development |
| `NEXT_PUBLIC_FIREBASE_APP_ID`              | `1:123456789012:web:abcdef123456`      | Production, Preview, Development |
| `ADMIN_USERNAME`                           | `admin` (or your chosen username)      | Production, Preview, Development |
| `ADMIN_PASSWORD`                           | `your-secure-password`                 | Production, Preview, Development |

**Important**: Make sure to select all three environments (Production, Preview, Development) for each variable!

### Step 3: Redeploy

After adding environment variables:

1. Go to **Deployments** tab
2. Click **...** (three dots) on the latest deployment
3. Click **Redeploy**
4. Check **Use existing build cache** (optional)
5. Click **Redeploy**

OR

Just push a new commit to trigger automatic redeployment:

```powershell
git commit --allow-empty -m "Trigger redeploy"
git push origin main
```

### Step 4: Verify

1. Wait for deployment to complete
2. Visit your Vercel URL: `https://your-project.vercel.app`
3. Homepage should now load without 404 error! ✅

## Why This Happens

### The Issue

```typescript
// lib/firebase.ts
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY, // ❌ undefined on Vercel
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, // ❌ undefined
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, // ❌ undefined
  // ...
};

const app = initializeApp(firebaseConfig); // ❌ FAILS - causes 404
```

When environment variables are missing:

1. Firebase initialization fails
2. Components that depend on Firebase throw errors
3. Next.js returns 404 instead of showing error page
4. Homepage appears "not found"

### The Fix

Adding environment variables in Vercel makes them available during build:

```typescript
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY, // ✅ "AIzaSy..."
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, // ✅ "project.firebaseapp.com"
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, // ✅ "project-id"
  // ...
};

const app = initializeApp(firebaseConfig); // ✅ SUCCESS
```

## Quick Checklist for New Deployments

When deploying to a new Vercel project from forked/cloned repository:

- [ ] Fork/clone repository to client's GitHub account
- [ ] Connect repository to Vercel
- [ ] Add **8 environment variables** in Vercel Settings
  - [ ] `NEXT_PUBLIC_FIREBASE_API_KEY`
  - [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
  - [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
  - [ ] `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
  - [ ] `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
  - [ ] `NEXT_PUBLIC_FIREBASE_APP_ID`
  - [ ] `ADMIN_USERNAME`
  - [ ] `ADMIN_PASSWORD`
- [ ] Select all environments (Production, Preview, Development)
- [ ] Trigger redeploy
- [ ] Verify homepage loads (no 404)
- [ ] Test admin login at `/admin/login`

## Additional Setup After Deployment

### 1. Create Firebase Collections

Go to Firebase Console → Firestore Database → Start collection

Create these collections:

1. `participants` - Store registrations
2. `events` - Store events
3. `notifications_log` - Message history
4. `message_templates` - WhatsApp templates
5. `dripsender_keys` - API keys
6. `automation_settings` - Automation config

Add initial document to `automation_settings`:

**Document ID**: `config`

```json
{
  "automation_enabled": true,
  "welcome_delay_minutes": 5,
  "referrer_delay_minutes": 0,
  "event_reminder_hours": 1,
  "automation_engine_interval_seconds": 60
}
```

### 2. Add DripSender API Key

1. Visit your deployed site: `/admin/login`
2. Login with your admin credentials
3. Go to **Settings** → **DripSender API Keys** tab
4. Add at least one API key from [DripSender](https://dripsender.id)
5. Mark it as active

### 3. Configure Message Templates

1. Still in Settings → **Message Templates** tab
2. Configure messages for:
   - Welcome Message
   - Referrer Alert
   - Event Reminder
3. Use placeholders: `{name}`, `{code}`, `{event_name}`, `{event_date}`, `{zoom_link}`

### 4. Test Automation

1. Go to `/admin/test-automation`
2. Click **Run Automation Now**
3. Check if automation works without errors
4. Monitor **Notifications** page for logs

## Common Errors and Solutions

### Error 1: "404 Not Found" on Homepage

**Cause**: Missing environment variables  
**Fix**: Add all 8 environment variables to Vercel, then redeploy

### Error 2: "Firebase: Error (auth/invalid-api-key)"

**Cause**: Wrong API key  
**Fix**: Double-check `NEXT_PUBLIC_FIREBASE_API_KEY` value from Firebase Console

### Error 3: "Firebase: Error (auth/project-not-found)"

**Cause**: Wrong project ID  
**Fix**: Verify `NEXT_PUBLIC_FIREBASE_PROJECT_ID` matches your Firebase project

### Error 4: Admin Login Fails

**Cause**: Wrong admin credentials  
**Fix**: Check `ADMIN_USERNAME` and `ADMIN_PASSWORD` in Vercel environment variables

### Error 5: Build Succeeds but Still 404

**Cause**: Environment variables added but not redeployed  
**Fix**: Go to Deployments → Redeploy latest deployment

### Error 6: Works Locally but 404 on Vercel

**Cause**: `.env.local` exists locally but not on Vercel  
**Fix**: Add environment variables to Vercel (they don't read from `.env.local`)

## Prevention for Future Deployments

### Include in Repository Handoff Documentation

When handing over this repository to a client:

1. **Provide Firebase Credentials**

   - Share Firebase Console access OR
   - Provide all config values in secure way

2. **Provide Admin Credentials**

   - Share desired `ADMIN_USERNAME`
   - Share desired `ADMIN_PASSWORD`

3. **Provide Setup Checklist**

   - Point them to this file: `VERCEL_404_FIX.md`
   - Ensure they know to add environment variables

4. **Provide DripSender API Key**
   - Share at least one active API key
   - Or guide them to create their own at dripsender.id

### Automate with Vercel CLI (Optional)

You can add environment variables via Vercel CLI:

```powershell
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link

# Add environment variables
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY production
# Enter value when prompted

# Repeat for all 8 variables...
```

## Summary

**The 404 error on Vercel after moving repositories is caused by missing environment variables.**

**Quick fix:**

1. ✅ Add 8 environment variables to Vercel Settings
2. ✅ Redeploy
3. ✅ Homepage works!

**This happens because:**

- `.env.local` is gitignored (not in repository)
- Vercel doesn't have access to your local environment variables
- Firebase initialization fails without proper config
- Next.js returns 404 for failed pages

**Prevention:**
Always add environment variables to Vercel BEFORE first deployment, or immediately after if you forget.

Now your homepage will work perfectly on Vercel! 🎉
