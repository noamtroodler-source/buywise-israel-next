
# Remove Telegram from Share Buttons

## Summary
Remove the Telegram sharing option from all share buttons across the platform, keeping only "Copy Link" and "WhatsApp" options.

## Files to Modify

### 1. `src/components/property/ShareButton.tsx`
- Remove `Send` from the lucide-react import (line 1)
- Delete the `handleTelegram` function (lines 44-50)
- Remove the Telegram dropdown menu item (lines 77-80)

### 2. `src/components/project/ProjectShareButton.tsx`
- Remove `Send` from the lucide-react import (line 2)
- Delete the `handleTelegram` function (lines 52-60)
- Remove the Telegram dropdown menu item (lines 91-94)

### 3. `src/hooks/useShareTracking.ts`
- Remove `'telegram'` from the `ShareMethod` type union (line 25)
- Change from: `'copy_link' | 'whatsapp' | 'telegram' | 'native_share'`
- Change to: `'copy_link' | 'whatsapp' | 'native_share'`

### 4. `src/components/admin/analytics/ShareAnalyticsTab.tsx`
- Remove `Send` from lucide-react imports
- Remove `telegram` entry from `SHARE_METHOD_COLORS` (line 15)
- Remove `telegram` entry from `SHARE_METHOD_LABELS` (line 22)
- Remove `telegram: 0` from the dayMap initialization (line 97)
- Delete the entire "Telegram Shares" card (lines 146-158)
- Remove the Telegram `<Line>` component from the chart (lines 283-290)

## Result
Share dropdowns will show only two options:
- Copy Link
- WhatsApp

The admin analytics dashboard will no longer display Telegram-specific metrics, though historical Telegram share data will remain in the database for reference.

## Note on Database
The database constraint still allows 'telegram' as a valid share_method value, which is fine - it preserves historical data and doesn't cause any issues. No migration needed.
