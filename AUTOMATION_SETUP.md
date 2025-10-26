# Automated Notification System Setup

This system automatically sends WhatsApp messages based on configurable delays and event schedules.

## Features

### 1. Welcome Message Automation

- Automatically sends welcome messages to new participants after a configurable delay
- Default: 5 minutes after registration
- Includes referral code for sharing

### 2. Referrer Alert Automation

- Notifies referrers when someone uses their referral code
- Default: 5 minutes after the referred person registers
- Shows total referral count

### 3. Event Reminder Automation

- Automatically sends event reminders to all participants
- Default: 1 hour before event starts
- Includes Zoom link and event details

## How It Works

### Database Collections Required

1. **automation_settings**

   - Document ID: `config`
   - Fields:
     - `welcome_delay_minutes` (number): Minutes to wait before sending welcome message
     - `referrer_alert_delay_minutes` (number): Minutes to wait before sending referrer alert
     - `event_reminder_hours_before` (number): Hours before event to send reminder
     - `automation_enabled` (boolean): Enable/disable entire automation system

2. **participants** (existing)

   - Must have `registered_at` field (ISO string)

3. **notifications_log** (existing)

   - Used to track which messages have been sent
   - Prevents duplicate messages

4. **events** (existing)

   - Must have `start_time` field (ISO string)

5. **message_templates** (existing)

   - Templates for welcome, referrer_alert, event_reminder

6. **dripsender_keys** (existing)
   - At least one active API key required

## Automation Endpoint

The automation runs via: `GET /api/cron/automation`

### Response Format

```json
{
  "success": true,
  "results": {
    "welcome_messages_sent": 5,
    "referrer_alerts_sent": 2,
    "event_reminders_sent": 10,
    "errors": []
  }
}
```

## Setup Options

### Option 1: Vercel Cron Jobs (Recommended for Production)

1. Create `vercel.json` in project root:

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

2. Deploy to Vercel
3. Cron job will run automatically every minute

### Option 2: External Cron Service (Alternative)

Use services like:

- **cron-job.org** (Free)
- **EasyCron**
- **Uptime Robot** (with webhook monitoring)

Setup:

1. Register for a cron service
2. Add your URL: `https://your-domain.com/api/cron/automation`
3. Set schedule to every 1 minute: `* * * * *`
4. Add authentication header if needed

### Option 3: Manual Testing

For testing, use the admin panel:

1. Go to `/admin/test-automation` (add link to sidebar if needed)
2. Click "Run Automation Now"
3. View results immediately

### Option 4: Server-Side Cron (Self-Hosted)

If hosting on your own server, add to crontab:

```bash
* * * * * curl -X GET https://your-domain.com/api/cron/automation
```

## Configuration

### Admin Settings Page

Go to `/admin/settings` → "Automation" tab:

1. **Enable/Disable Automation**: Toggle automation on/off
2. **Welcome Message Delay**: Set minutes to wait (1-1440)
3. **Referrer Alert Delay**: Set minutes to wait (1-1440)
4. **Event Reminder Timing**: Set hours before event (1-72)

## How the System Prevents Duplicates

### Welcome Messages

- Checks `notifications_log` for existing welcome message to participant
- Only sends if no previous welcome message found

### Referrer Alerts

- Checks `notifications_log` for alert about this specific referral
- Uses `participant_id` of the referred person to track

### Event Reminders

- Checks `notifications_log` for existing reminder for this event
- Uses `event_id` field to track which events have been notified

## Message Flow

### New Registration

```
1. User submits registration form
   ↓
2. Participant created in Firebase
   ↓
3. [WAIT: welcome_delay_minutes]
   ↓
4. Automation checks: Has welcome been sent?
   ↓
5. If NO → Send welcome message with referral code
   ↓
6. Log to notifications_log
```

### Referral Registration

```
1. User submits form with referral code
   ↓
2. Participant created with referrer_phone
   ↓
3. [WAIT: referrer_alert_delay_minutes]
   ↓
4. Automation checks: Has referrer been alerted?
   ↓
5. If NO → Find referrer, count referrals
   ↓
6. Send alert to referrer with count
   ↓
7. Log to notifications_log
```

### Event Reminder

```
1. Admin creates event with start_time
   ↓
2. Automation runs every minute
   ↓
3. Check: Is event within reminder window?
   ↓
4. Check: Has reminder been sent?
   ↓
5. If NO → Get all participants
   ↓
6. Send reminder to each with 1-second delay
   ↓
7. Log each to notifications_log with event_id
```

## Monitoring

### Check Automation Status

- View `/admin/notifications` to see all sent messages
- Filter by type: welcome, referrer_alert, event_reminder
- Check API key usage and success rate

### Troubleshooting

**No messages being sent:**

1. Check automation is enabled in settings
2. Verify at least one API key is active
3. Check cron job is actually calling the endpoint
4. Review notifications_log for errors

**Duplicate messages:**

- Should not happen - system checks notifications_log
- If occurring, check database indexes on participant_id, type, event_id

**Messages not delayed properly:**

- Verify automation_settings values are correct
- Check server time is correct (uses new Date())

## Security Considerations

### Option 1: API Route is Public

Current implementation: Anyone can call `/api/cron/automation`

**Recommendation for Production:**
Add authentication to the automation endpoint:

```typescript
// In route.ts
export async function GET(request: NextRequest) {
  // Check authorization header
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ... rest of automation code
}
```

Then add to `.env.local`:

```
CRON_SECRET=your-secret-key-here
```

Update cron service to include header:

```
Authorization: Bearer your-secret-key-here
```

## Testing Checklist

- [ ] Create test participant
- [ ] Wait for delay period
- [ ] Run automation manually via test page
- [ ] Verify welcome message received
- [ ] Create second participant with referral code
- [ ] Wait for delay period
- [ ] Verify referrer received alert
- [ ] Create event 1 hour in future
- [ ] Run automation at reminder time
- [ ] Verify all participants received reminder

## Firebase Collections Setup

Execute in Firebase Console or via script:

```javascript
// automation_settings collection
{
  "config": {
    "welcome_delay_minutes": 5,
    "referrer_alert_delay_minutes": 5,
    "event_reminder_hours_before": 1,
    "automation_enabled": true
  }
}
```

## Performance Notes

- System processes all pending messages each run
- 1-second delay between each message (DripSender rate limit)
- With 100 pending messages, run takes ~100 seconds
- Consider reducing check frequency if dealing with very large volumes
- Monitor DripSender API quotas and limits
