# ⚠️ IMPORTANT: Environment Variables Required

## Quick Setup for Vercel Deployment

After cloning this repository and deploying to Vercel, you **MUST** add these environment variables or the site will show **404 errors**.

### Required Variables (Add to Vercel)

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

Add these **8 variables**:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password
```

**Make sure to select ALL environments**: Production, Preview, Development

### After Adding Variables

1. Go to **Deployments** tab
2. Click **Redeploy** on the latest deployment
3. Wait for build to complete
4. Visit your site - homepage should now work! ✅

### Get Firebase Config

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click Settings ⚙️ → Project Settings
4. Scroll to "Your apps" → SDK setup and configuration
5. Copy the config values

### Still Getting 404?

See detailed guide: **`VERCEL_404_FIX.md`**

---

**Why?** This project uses Firebase which requires configuration. Environment variables are not stored in git for security, so you must add them manually to Vercel.
