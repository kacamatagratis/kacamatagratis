# Vercel Deployment Guide with Cron

## 📋 Pre-Deployment Checklist

### ✅ Build Verification

- [x] Build completed successfully (`npm run build` exit code 0)
- [x] vercel.json configured with cron job (runs every minute)
- [x] Environment variables documented in .env.example

### 🔧 Required Setup Before Deployment

1. **Firebase Project Ready**

   - Firebase project created at [console.firebase.google.com](https://console.firebase.google.com)
   - Firestore Database enabled
   - Firebase configuration values ready

2. **Admin Credentials**
   - Choose secure admin username and password
   - These will be set as Vercel environment variables

---

## 🚀 Deployment Steps

### Step 1: Install Vercel CLI (if not already installed)

```powershell
npm install -g vercel
```

### Step 2: Login to Vercel

```powershell
vercel login
```

Follow the prompts to authenticate with your Vercel account.

### Step 3: Initial Deployment

From your project directory:

```powershell
cd C:\Users\kevin\SynologyDrive\kacamatagratis.com\kacamatagratis.com
vercel
```

You'll be asked:

- **Set up and deploy?** → Yes
- **Which scope?** → Select your account/team
- **Link to existing project?** → No (first time) or Yes (if exists)
- **What's your project's name?** → kacamatagratis (or your preferred name)
- **In which directory is your code located?** → ./ (current directory)
- **Want to modify settings?** → No (use detected Next.js settings)

### Step 4: Set Environment Variables

After initial deployment, set environment variables:

```powershell
# Firebase Configuration
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
# Paste your Firebase API key when prompted
# Choose: Production, Preview, Development (select all 3)

vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
# Paste: your-project.firebaseapp.com

vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID
# Paste your project ID

vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
# Paste: your-project.appspot.com

vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
# Paste your sender ID

vercel env add NEXT_PUBLIC_FIREBASE_APP_ID
# Paste your app ID

# Admin Credentials
vercel env add ADMIN_USERNAME
# Enter your admin username (e.g., admin)

vercel env add ADMIN_PASSWORD
# Enter your secure admin password
```

**Alternative: Add via Vercel Dashboard**

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project → Settings → Environment Variables
3. Add all variables from `.env.example` one by one
4. Select which environments: Production, Preview, Development

### Step 5: Redeploy with Environment Variables

```powershell
vercel --prod
```

---

## ⏰ Cron Job Configuration

### Automatic Setup (Already Configured!)

Your `vercel.json` is already set up:

```json
{
  "crons": [
    {
      "path": "/api/cron/automation",
      "schedule": "* * * * *"
    }
  ]
}
```

**What this does:**

- Runs `/api/cron/automation` endpoint **every minute**
- Automatically processes:
  - Welcome messages (5 min delay)
  - Referrer alerts (instant)
  - Event reminders (1 hour before)

### Verify Cron is Active

1. Go to Vercel Dashboard → Your Project → Settings → Cron Jobs
2. You should see: `/api/cron/automation` running every minute
3. Check logs in Vercel Dashboard → Your Project → Logs

**Note:** Vercel Cron is only available on Pro plans and above. If you're on the Free plan, the cron job won't run automatically. You'll need to:

- Upgrade to Pro ($20/month) for cron support, OR
- Use a free alternative like [cron-job.org](https://cron-job.org) to call `https://yourdomain.com/api/cron/automation` every minute

---

## 🔒 Security Configuration

### Protect API Routes

The cron endpoint is already protected with:

```typescript
// Only allow requests from Vercel Cron or localhost
const isVercelCron = request.headers.get("user-agent")?.includes("vercel");
const isLocalhost = request.url.includes("localhost");

if (!isVercelCron && !isLocalhost) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

### Admin Panel Protection

- Cookie-based session authentication (24-hour expiry)
- Bcrypt password hashing
- Admin-only routes with middleware protection

---

## 📊 Post-Deployment Setup

### 1. Access Your Deployed Site

After deployment completes, Vercel will give you a URL like:

- **Production**: `https://kacamatagratis.vercel.app`
- **Custom Domain**: Set up in Vercel Dashboard → Settings → Domains

### 2. Setup Firebase Collections

Visit your admin panel: `https://yourdomain.com/admin/login`

**Login with credentials you set in environment variables:**

- Username: (your ADMIN_USERNAME)
- Password: (your ADMIN_PASSWORD)

Then setup Firebase:

1. Go to Settings → Message Templates
   - Add templates for: welcome, referrer_alert, event_reminder
2. Go to Settings → DripSender API Keys
   - Add at least one active API key from [dripsender.id](https://dripsender.id)
3. Go to Settings → Automation
   - Configure delays (default: 5 min welcome, instant referrer, 1 hr event)
   - Enable automation toggle

### 3. Test the System

Visit: `https://yourdomain.com/admin/test-automation`

- Click "Run Automation Now"
- Verify messages are being sent
- Check Notifications page for logs

### 4. Monitor Cron Jobs

**Vercel Dashboard:**

- Go to Logs tab to see cron execution
- Filter by `/api/cron/automation`

**Admin Panel:**

- Check automation status indicator (top right)
- View Notifications page for sent messages

---

## 🛠️ Troubleshooting

### Cron Not Running

1. **Check Plan**: Cron jobs require Vercel Pro plan
2. **Check Logs**: Vercel Dashboard → Logs → Filter by "cron"
3. **Verify Configuration**: Settings → Cron Jobs shows your schedule

### Messages Not Sending

1. **Check API Keys**: Settings → DripSender API Keys (must have active keys)
2. **Check Automation**: Settings → Automation → Ensure enabled
3. **Check Logs**: Notifications page shows errors
4. **Test Manually**: Test Automation page to run immediately

### Environment Variables Not Working

1. **Redeploy**: After adding env vars, must redeploy
2. **Check Scope**: Ensure vars are set for Production environment
3. **Verify Values**: Settings → Environment Variables shows all values

### Firebase Connection Issues

1. **Check Credentials**: Verify all NEXT*PUBLIC_FIREBASE*\* variables
2. **Check Rules**: Ensure Firestore security rules allow access
3. **Check Quotas**: Firebase free tier has daily limits

---

## 🔄 Update Deployment

### Deploy Latest Changes

```powershell
# Commit your changes
git add .
git commit -m "Your commit message"
git push origin main

# Vercel auto-deploys from GitHub
# Or manually trigger:
vercel --prod
```

### View Deployments

```powershell
vercel ls
```

### View Logs

```powershell
vercel logs [deployment-url]
```

---

## 📈 Monitoring & Maintenance

### Daily Checks

- ✅ Automation status indicator (green = healthy)
- ✅ Notifications log shows recent activity
- ✅ No errors in Vercel logs

### Weekly Checks

- ✅ API key rotation working
- ✅ Events scheduled correctly
- ✅ Participant registrations flowing

### Monthly Checks

- ✅ Firebase usage within quotas
- ✅ Vercel function executions within limits
- ✅ DripSender credits sufficient

---

## 📝 Important URLs

After deployment, bookmark these:

- **Landing Page**: `https://yourdomain.com`
- **Admin Login**: `https://yourdomain.com/admin/login`
- **Admin Dashboard**: `https://yourdomain.com/admin/dashboard`
- **Test Automation**: `https://yourdomain.com/admin/test-automation`
- **Vercel Dashboard**: `https://vercel.com/dashboard`
- **Firebase Console**: `https://console.firebase.google.com`

---

## ✅ Deployment Complete Checklist

- [ ] Vercel CLI installed and logged in
- [ ] Initial deployment successful (`vercel`)
- [ ] All environment variables added (Firebase + Admin)
- [ ] Production deployment with env vars (`vercel --prod`)
- [ ] Cron job visible in Vercel Dashboard → Cron Jobs
- [ ] Custom domain configured (optional)
- [ ] Admin login working at `/admin/login`
- [ ] Firebase collections created via admin panel
- [ ] Message templates added
- [ ] DripSender API keys added
- [ ] Automation enabled in settings
- [ ] Test automation run successfully
- [ ] Automation status indicator showing green
- [ ] Latest event displaying on landing page
- [ ] Notifications log showing sent messages

---

## 🎉 Success!

Your kacamatagratis.com admin panel with automated WhatsApp notifications is now **live on Vercel** with cron jobs running every minute!

**Next Steps:**

1. Share landing page URL with participants
2. Monitor automation status daily
3. Check notifications log for sent messages
4. Add events and watch reminders send automatically

**Support:**

- Vercel Docs: https://vercel.com/docs
- Firebase Docs: https://firebase.google.com/docs
- Next.js Docs: https://nextjs.org/docs
