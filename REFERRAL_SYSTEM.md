# Referral System Documentation

## Overview

The referral system allows participants to share referral links and earn credit when new participants register using their link.

## How It Works

### 1. Referral Link Format

Each participant gets a unique referral link:

```
https://kacamatagratis.com?ref=6287831100001
```

The `ref` parameter contains the referrer's phone number (without the + sign).

### 2. User Experience Flow

#### For Visitors (New Participants)

1. **Click Referral Link** - Visit `https://kacamatagratis.com?ref=6287831100001`
2. **See Normal Landing Page** - The landing page displays normally
3. **Fill Registration Form** - Complete the registration form with their details
4. **System Saves Referral** - The system automatically:
   - Links the new participant to the referrer
   - Assigns a referral sequence number (1st, 2nd, 3rd referral, etc.)
   - Creates pending notifications for both welcome and referrer alert

#### For Referrers (Existing Participants)

1. **Receive Notification** - Get WhatsApp message when someone registers using their link
2. **Track Progress** - See referral count and details in the referrals page
3. **Build Network** - Each successful referral increases their count

### 3. Technical Implementation

#### Registration Flow (`/api/register`)

When a new participant registers with a referral code:

```typescript
{
  sapaan: "Bapak/Ibu",
  name: "John Doe",
  city: "Jakarta",
  profession: "Engineer",
  phone: "+6287831100002",
  referrer_phone: "+6287831100001", // From ?ref= parameter
  referrer_sequence: 1, // 1st person referred by this referrer
  referral_code: "6287831100002", // Their own code for sharing
  status: "belum_join",
  registered_at: "2025-10-27T10:30:00.000Z"
}
```

#### Pending Notifications Created

**1. Welcome Notification (to new participant)**

```typescript
{
  participant_id: "new_participant_id",
  target_phone: "+6287831100002",
  type: "welcome",
  status: "pending",
  created_at: "2025-10-27T10:30:00.000Z",
  metadata: { /* participant data */ }
}
```

**2. Referrer Alert Notification (to referrer)**

```typescript
{
  participant_id: "new_participant_id",
  target_phone: "+6287831100001", // Referrer's phone
  type: "referrer_alert",
  status: "pending",
  created_at: "2025-10-27T10:30:00.000Z",
  metadata: {
    new_participant_name: "John Doe",
    new_participant_city: "Jakarta",
    referrer_sequence: 1
  }
}
```

#### Automation Processing (`/api/cron/automation`)

The automation runs every minute and:

1. **Checks for Pending Notifications**

   - Queries `notifications_log` where `status = "pending"`
   - Filters by notification type (`welcome` or `referrer_alert`)

2. **Validates Delay Time**

   - Welcome messages: Wait X minutes after registration (default: 2 minutes)
   - Referrer alerts: Wait Y minutes after registration (default: 5 minutes)

3. **Sends WhatsApp Message**

   - Welcome message includes participant's referral code for sharing
   - Referrer alert includes new participant's name and total referral count

4. **Updates Notification Status**
   - Deletes the pending notification
   - Creates new notification with `status: "success"` or `status: "failed"`
   - Failed notifications are automatically retried

### 4. Message Templates

#### Welcome Message Template

Available variables:

- `{sapaan}` - Greeting (Bapak/Ibu)
- `{name}` - Participant's full name
- `{city}` - Participant's city
- `{referral_code}` - Unique referral code for sharing

Example:

```
Halo {sapaan} {name}! Terima kasih sudah mendaftar dari {city}.

Kode referral Anda: {referral_code}

Bagikan link ini untuk mengajak teman:
https://kacamatagratis.com?ref={referral_code}
```

#### Referrer Alert Template

Available variables:

- `{sapaan}` - Greeting (Bapak/Ibu)
- `{name}` - Referrer's full name
- `{referral_count}` - Total referrals
- `{new_participant_name}` - New participant's name
- `{referrer_sequence}` - Referral order number

Example:

```
Selamat {sapaan} {name}! 🎉

Anda berhasil mengajak {new_participant_name} untuk bergabung!

Ini adalah orang ke-{referrer_sequence} yang Anda ajak.
Total ajakan berhasil: {referral_count} orang.

Terus bagikan link referral Anda!
```

### 5. Tracking and Analytics

#### Admin Dashboard

- View total referrals system-wide
- See top referrers (leaderboard)
- Track referral growth over time

#### Referrals Page (`/admin/referrals`)

Shows detailed statistics:

- **Top Referrers** - Sorted by total referrals
- **Referral Details** - See who each referrer brought in
- **Referral Tree** - View referral sequences

#### Participant Details

Each participant document includes:

- `referral_code` - Their unique code
- `referrer_phone` - Who referred them (null if organic)
- `referrer_sequence` - What number referral they were (1st, 2nd, 3rd, etc.)

### 6. Key Features

✅ **Automatic Link Detection** - URL parameter automatically extracted
✅ **Seamless UX** - Normal landing page, no special referral page needed
✅ **Delayed Notifications** - Configurable delays prevent spam
✅ **Automatic Retry** - Failed notifications retry automatically
✅ **Sequence Tracking** - Know who was 1st, 2nd, 3rd, etc. referral
✅ **Real-time Stats** - Live referral count updates
✅ **Admin Visibility** - Full tracking and analytics

### 7. Configuration

Settings can be adjusted in `/admin/settings`:

- **Welcome Delay** - How long to wait before sending welcome message (default: 2 minutes)
- **Referrer Alert Delay** - How long to wait before notifying referrer (default: 5 minutes)
- **Message Templates** - Customize notification content
- **Automation Enable/Disable** - Turn automation on/off

### 8. Example User Journey

**Day 1:**

1. Ahmad registers on the website
2. Ahmad receives welcome message with his referral code: `6281234567890`
3. Ahmad shares: `https://kacamatagratis.com?ref=6281234567890`

**Day 2:**

1. Budi clicks Ahmad's referral link
2. Budi fills registration form
3. System saves Budi with `referrer_phone: +6281234567890` and `referrer_sequence: 1`
4. After 2 minutes: Budi gets welcome message
5. After 5 minutes: Ahmad gets notification "Anda berhasil mengajak Budi!" (referral count: 1)

**Day 3:**

1. Citra clicks Ahmad's referral link
2. Citra registers
3. System saves Citra with `referrer_phone: +6281234567890` and `referrer_sequence: 2`
4. Ahmad gets notification "Anda berhasil mengajak Citra!" (referral count: 2)

**Result:**

- Ahmad has 2 successful referrals (Budi and Citra)
- Ahmad can see both in `/admin/referrals` page
- Ahmad knows Budi was his 1st referral, Citra was his 2nd

## Files Modified

1. **`/app/api/register/route.ts`**

   - Fixed referral URL format (`?ref=` instead of `/ref=`)
   - Added pending referrer alert notification creation

2. **`/app/api/cron/automation/route.ts`**

   - Refactored `processPendingReferrerAlerts()` to use pending notifications
   - Added support for new variables (new_participant_name, referrer_sequence)

3. **`/app/admin/settings/page.tsx`**

   - Updated referrer_alert template documentation
   - Added new variable descriptions

4. **`/components/RegistrationForm.tsx`**
   - Already extracts `ref` parameter from URL
   - Already sends `referrerPhone` to API

## Testing

To test the referral system:

1. Register a participant (Person A)
2. Note their phone number (e.g., `6281234567890`)
3. Open new incognito window
4. Visit: `http://localhost:3000?ref=6281234567890`
5. Register as Person B
6. Check notifications_log in Firebase:
   - Should see pending welcome for Person B
   - Should see pending referrer_alert for Person A
7. Wait for automation to run (or trigger manually)
8. Check WhatsApp messages sent
9. Check `/admin/referrals` to see Person A has 1 referral

## Database Schema

### Participants Collection

```typescript
{
  id: "auto_generated_id",
  sapaan: "Bapak",
  name: "Ahmad",
  city: "Jakarta",
  profession: "Engineer",
  phone: "+6281234567890",
  referral_code: "6281234567890",
  referrer_phone: null | "+6281111111111",
  referrer_sequence: 0 | 1 | 2 | 3...,
  registered_at: "ISO_DATE_STRING",
  status: "belum_join" | "sudah_join" | "tidak_join",
  unsubscribed: false
}
```

### Notifications Log Collection

```typescript
{
  participant_id: "participant_doc_id",
  target_phone: "+6281234567890",
  type: "welcome" | "referrer_alert" | "event_reminder",
  status: "pending" | "success" | "failed",
  message_content: "Actual message sent" | null,
  api_key_used: "dripsender_key_id" | null,
  error: "Error message" | null,
  created_at: "ISO_DATE_STRING",
  metadata: {
    // For referrer_alert:
    new_participant_name: "John Doe",
    new_participant_city: "Jakarta",
    referrer_sequence: 1,
    // For welcome and others:
    // ... participant data
  }
}
```
