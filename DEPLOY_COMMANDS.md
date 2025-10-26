# Quick Deployment Commands

## 🚀 Deploy to Vercel - Step by Step

### 1️⃣ Install Vercel CLI (First Time Only)

```powershell
npm install -g vercel
```

### 2️⃣ Login to Vercel

```powershell
vercel login
```

### 3️⃣ Initial Deployment

```powershell
vercel
```

- Answer prompts (see VERCEL_DEPLOYMENT.md for details)
- This creates a preview deployment

### 4️⃣ Add Environment Variables

**Option A - Using CLI:**

```powershell
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID
vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
vercel env add NEXT_PUBLIC_FIREBASE_APP_ID
vercel env add ADMIN_USERNAME
vercel env add ADMIN_PASSWORD
```

**Option B - Using Dashboard:**

1. Go to https://vercel.com/dashboard
2. Select project → Settings → Environment Variables
3. Add all variables from `.env.example`

### 5️⃣ Production Deployment

```powershell
vercel --prod
```

## ✅ That's it! Your app is live with cron jobs running every minute.

---

## 📋 Environment Variables Needed

Copy from Firebase Console → Project Settings → General → Your apps:

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

Set your admin credentials:

```
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password
```

---

## 🔄 Update Deployed App

```powershell
# Push to GitHub (if connected)
git add .
git commit -m "Update"
git push

# Or manual deploy
vercel --prod
```

---

## 📊 Useful Commands

```powershell
# List all deployments
vercel ls

# View logs
vercel logs

# Remove deployment
vercel rm [deployment-url]

# Open project in browser
vercel --open
```

---

## ⚠️ Important Notes

1. **No Cron Required** (Free Plan Compatible!)
   - Automation runs client-side in admin dashboard
   - Keep `/admin/dashboard` open for automation to work
   - Future upgrade: Enable server cron with Pro plan
2. **Must redeploy after adding env vars**

   - Run `vercel --prod` after adding environment variables

3. **Keep Dashboard Open**
   - Automation only runs while admin dashboard is open
   - Messages go to pending when dashboard is closed
   - See CLIENT_SIDE_AUTOMATION.md for details

---

See **VERCEL_DEPLOYMENT.md** for complete deployment guide with troubleshooting!
