# Client-Side Automation System

## 🔄 How It Works

The automation system now runs **in your browser** when the admin dashboard is open. No server-side cron required!

---

## ✅ Changes Made

### 1. **AutomationRunner Component Created**

**File**: `components/AutomationRunner.tsx`

**Features**:

- ✅ **Auto-starts** when admin dashboard loads
- ✅ **Runs every 60 seconds** while page is open
- ✅ **Start/Stop button** to control automation
- ✅ **Live countdown** showing next check time
- ✅ **Real-time results** showing messages sent
- ✅ **Error display** if automation fails
- ✅ **Visual indicator** (green pulse when running)

### 2. **Added to Dashboard**

**File**: `app/admin/dashboard/page.tsx`

The AutomationRunner is now prominently displayed on the dashboard between stats and referrer card.

### 3. **Cron Disabled (Not Deleted)**

**File**: `vercel.json`

```json
{
  "_comment": "Cron disabled - Using client-side polling instead",
  "_crons": [...]  // Kept for future use
}
```

The cron configuration is preserved but disabled. Can be re-enabled by:

1. Removing underscore from `"_crons"` → `"crons"`
2. Upgrading to Vercel Pro plan

---

## 📊 Automation Flow

```
1. Admin opens dashboard
   ↓
2. AutomationRunner starts automatically
   ↓
3. Runs automation immediately
   ↓
4. Sets 60-second timer
   ↓
5. Shows countdown (59s... 58s... 1s)
   ↓
6. Runs automation again
   ↓
7. Repeat steps 4-6 while page is open
```

### When Admin Closes Dashboard:

- ❌ Automation **stops**
- 📥 New messages go to **pending**
- ⏸️ System **pauses** until admin returns
- ✅ Resumes automatically when dashboard opens again

---

## 🎮 Admin Dashboard Controls

### Automation Engine Card

**Green "Running" State**:

- ● **Running** - Panel must stay open
- 🔄 Shows countdown to next check
- ✅ Displays last run time
- 📊 Shows results (Welcome: X, Referrer: Y, Events: Z)

**Gray "Stopped" State**:

- ● **Stopped** - Click Start to begin
- No countdown shown
- Can manually start anytime

### Controls:

- **Stop Button** (Red): Pause automation
- **Start Button** (Green): Resume automation
- Auto-starts when page loads (can be disabled)

---

## 📱 What Gets Checked Every Minute

While admin dashboard is open, system checks:

1. **Welcome Messages** (5 min delay)
   - Scans participants registered > 5 minutes ago
   - Sends welcome message if not already sent
2. **Referrer Alerts** (Instant)
   - Finds new referrals
   - Notifies referrer immediately
3. **Event Reminders** (1 hour before)
   - Checks upcoming events
   - Sends reminders 1 hour before start time

---

## 💡 Usage Instructions

### For Daily Operations:

1. **Login to Admin Panel**

   - Go to `/admin/login`
   - Enter credentials

2. **Keep Dashboard Open**

   - Navigate to `/admin/dashboard`
   - Automation starts automatically
   - See green "● Running" indicator

3. **Monitor Activity**

   - Watch countdown timer (60s → 0s)
   - Check results after each run
   - View sent messages in Notifications page

4. **Optional: Stop/Start**
   - Click "Stop" to pause temporarily
   - Click "Start" to resume
   - Useful when making system changes

### Best Practices:

✅ **Keep dashboard tab open** during business hours  
✅ **Check automation status** indicator (green = running)  
✅ **Monitor results** for errors  
✅ **Review notifications log** periodically  
❌ Don't close dashboard if expecting messages to send  
❌ Don't stop automation unless necessary

---

## 🔧 Technical Details

### Polling Interval

- **Frequency**: Every 60 seconds (1 minute)
- **API Endpoint**: `/api/cron/automation`
- **Method**: POST request
- **Auto-start**: `true` (configurable)

### State Management

```typescript
const [isRunning, setIsRunning] = useState(true);
const [lastRun, setLastRun] = useState<Date | null>(null);
const [nextRun, setNextRun] = useState<Date | null>(null);
const [isProcessing, setIsProcessing] = useState(false);
```

### Lifecycle

- **Mount**: Runs automation immediately
- **Running**: Sets 60-second interval
- **Unmount**: Clears interval (stops automation)
- **Toggle**: Start/stop on demand

---

## 🆚 Client-Side vs Server-Side Comparison

| Feature         | Client-Side (Current) | Server-Side Cron                |
| --------------- | --------------------- | ------------------------------- |
| **Cost**        | ✅ Free               | ❌ Requires Vercel Pro ($20/mo) |
| **Requires**    | Admin dashboard open  | Nothing (automatic)             |
| **Reliability** | Depends on admin      | 100% uptime                     |
| **Control**     | Start/Stop anytime    | Always running                  |
| **Setup**       | ✅ Already done       | Need Pro upgrade                |
| **Best For**    | Small operations      | 24/7 automation                 |

---

## 🔄 Migration Path to Server Cron

When ready to upgrade to Vercel Pro:

### Step 1: Upgrade Plan

- Go to Vercel Dashboard → Settings → Billing
- Upgrade to Pro plan ($20/month)

### Step 2: Enable Cron

Edit `vercel.json`:

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

(Remove underscore from `_crons`)

### Step 3: Deploy

```powershell
vercel --prod
```

### Step 4: Verify

- Vercel Dashboard → Settings → Cron Jobs
- Should show active cron running every minute

### Step 5: Update Dashboard

You can optionally remove AutomationRunner from dashboard or keep it as manual override option.

---

## ⚠️ Important Warnings

### **Dashboard Must Stay Open**

```
⚠️ This admin panel must stay open in your browser
   for automation to work. When you close this page,
   message sending will pause and resume when you return.
```

This warning is displayed prominently in the AutomationRunner card.

### **No Background Processing**

Unlike server-side cron, client-side polling:

- ❌ Does NOT run when browser is closed
- ❌ Does NOT run when dashboard is not active
- ❌ Does NOT run on other admin pages
- ✅ ONLY runs on `/admin/dashboard`

### **Browser Tab Must Be Active**

Some browsers throttle inactive tabs:

- Keep dashboard tab in focus
- Or use browser extension to prevent throttling
- Or use server-side cron for 24/7 operation

---

## 🐛 Troubleshooting

### Automation Not Running

1. **Check Status**: Should show "● Running" in green
2. **Click Start**: If stopped, click green "Start" button
3. **Refresh Page**: Sometimes needed after changes
4. **Check Console**: Browser DevTools → Console for errors

### Messages Not Sending

1. **Check API Keys**: Settings → DripSender API Keys
2. **Enable Automation**: Settings → Automation → Enable toggle
3. **Check Templates**: Settings → Message Templates (need all 3 types)
4. **View Errors**: AutomationRunner shows errors if any occur

### Countdown Not Moving

1. **Page Active**: Make sure browser tab is active
2. **No Errors**: Check AutomationRunner for error messages
3. **Network**: Ensure internet connection is stable

---

## ✅ Deployment Checklist

- [x] AutomationRunner component created
- [x] Added to admin dashboard with auto-start
- [x] Cron disabled in vercel.json (kept for future)
- [x] Runs every 60 seconds when dashboard open
- [x] Start/Stop controls working
- [x] Real-time countdown display
- [x] Results showing after each run
- [x] Warning message about keeping page open
- [ ] Deploy to Vercel (see VERCEL_DEPLOYMENT.md)
- [ ] Test automation on production
- [ ] Monitor for 24 hours to ensure stability

---

## 🎉 Ready to Use!

The automation system is now **fully client-side** and ready to deploy:

1. ✅ No Vercel Pro plan needed
2. ✅ No server-side cron required
3. ✅ Admin controls automation directly
4. ✅ Real-time feedback on dashboard
5. ✅ Can upgrade to cron later if needed

Just deploy to Vercel (free plan) and keep the admin dashboard open during business hours! 🚀
