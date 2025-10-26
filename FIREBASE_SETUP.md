# Firebase Database Initialization Script

This document explains how to set up your Firebase Firestore database for the Kacamata Gratis Admin Panel.

## Initial Setup

### 1. Create Admin Credentials

Go to your Firebase Console → Firestore Database → Start Collection

**Collection: `adminsetting`**
**Document ID: `credential`**

Fields:

```
username: "admin"
password: "your-secure-password"
```

### 2. Create Collections Structure

Create these empty collections (documents will be added automatically by the app):

#### Collection: `participants`

Fields (auto-populated by registration form):

- sapaan (string)
- name (string)
- city (string)
- profession (string)
- phone (string)
- referral_code (string)
- referrer_phone (string | null)
- referrer_sequence (number)
- registered_at (string - ISO date)
- status (string: "belum_join" | "sudah_join")
- unsubscribed (boolean)

#### Collection: `events`

Fields (managed by admin):

- title (string)
- start_time (timestamp)
- zoom_link (string)
- meta (map/object)

#### Collection: `notifications_log`

Fields (auto-populated):

- participant_id (string)
- target_phone (string)
- type (string)
- provider (string)
- status (string)
- created_at (timestamp)

#### Collection: `broadcast_numbers`

Fields (managed by admin):

- phone (string)
- provider (string)
- priority (number)
- is_active (boolean)

## Security Rules

Add these Firestore Security Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Admin credentials - read only from backend
    match /adminsetting/{document=**} {
      allow read, write: if false; // Only accessible from backend
    }

    // Participants - read/write from app
    match /participants/{participantId} {
      allow create: if true; // Allow registration
      allow read: if request.auth != null; // Only authenticated users
      allow update, delete: if request.auth != null;
    }

    // Events - read public, write authenticated
    match /events/{eventId} {
      allow read: if true;
      allow create, update, delete: if request.auth != null;
    }

    // Notifications log - authenticated only
    match /notifications_log/{logId} {
      allow read, write: if request.auth != null;
    }

    // Broadcast numbers - authenticated only
    match /broadcast_numbers/{numberId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Testing

1. Go to http://localhost:3000
2. Try registering with the form
3. Check Firestore to see if participant was created
4. Login to admin panel at http://localhost:3000/admin/login
5. View the dashboard to see the registered participant

## WhatsApp Admin Number

Update the `.env.local` file with your actual WhatsApp number:

```
NEXT_PUBLIC_ADMIN_WHATSAPP_NUMBER=628123456789
```

Replace with your number in international format (without + symbol).
