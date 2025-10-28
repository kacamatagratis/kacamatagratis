# Toast & Modal System

## Usage

Replace all `alert()` and `confirm()` calls with the toast system.

### Setup

```tsx
import { useToast } from "@/hooks/useToast";

export default function YourPage() {
  const { showToast, showConfirm, ToastContainer } = useToast();

  // ... your code

  return (
    <div>
      {/* Your page content */}

      {/* Add this at the end of your JSX */}
      <ToastContainer />
    </div>
  );
}
```

### Replace alert() calls

**Before:**

```tsx
alert("Hero section updated successfully!");
alert("Failed to update: " + data.error);
```

**After:**

```tsx
showToast("Hero section updated successfully!", "success");
showToast("Failed to update: " + data.error, "error");
```

### Replace confirm() calls

**Before:**

```tsx
if (!confirm("Are you sure you want to delete this item?")) return;
// delete code here
```

**After:**

```tsx
showConfirm(
  "Delete Item",
  "Are you sure you want to delete this item? This action cannot be undone.",
  () => {
    // delete code here
  }
);
```

### Toast Types

- `"success"` - Green, with checkmark icon
- `"error"` - Red, with X icon
- `"warning"` - Yellow, with alert icon
- `"info"` - Blue, with info icon

### Confirm Options

```tsx
showConfirm(
  "Delete User",
  "Are you sure?",
  () => {
    /* on confirm */
  },
  {
    confirmText: "Delete",
    cancelText: "Cancel",
    confirmButtonClass: "bg-red-600 hover:bg-red-700",
  }
);
```

## Migration Checklist

- [ ] participants/page.tsx
- [ ] events/page.tsx
- [ ] notifications/page.tsx
- [ ] settings/page.tsx
- [ ] landing-page/page.tsx
- [ ] broadcast/page.tsx
- [ ] setup/page.tsx
