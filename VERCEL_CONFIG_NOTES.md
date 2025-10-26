# Vercel Configuration Notes

## Cron Jobs - DISABLED

**Status**: Cron jobs are NOT configured in `vercel.json`

**Reason**:

- Vercel cron jobs require Pro plan ($20/month)
- Using FREE client-side automation instead

**Alternative Solution**:

- Client-side automation runs in admin panel header
- Component: `AutomationStatusIndicator` (in `app/admin/layout.tsx`)
- Runs automatically when admin opens any page
- Configurable interval (10-300 seconds, default: 60s)
- No server costs!

## To Enable Server-Side Cron (Future)

If you upgrade to Vercel Pro plan, add this to `vercel.json`:

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

**Schedule**: `* * * * *` = every minute

**Endpoint**: `/api/cron/automation` (already implemented)

## Current Configuration

`vercel.json` is intentionally empty (`{}`):

- No cron jobs configured
- Client-side automation handles everything
- Free tier compatible
- No schema validation errors

## Important Notes

1. **Don't use underscore-prefixed properties** (`_comment`, `_crons`) - they cause schema validation errors in Vercel
2. **Client-side automation is production-ready** - works perfectly for this use case
3. **No action needed** - current setup is optimal for free tier
