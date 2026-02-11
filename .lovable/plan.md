

## Move Recently Viewed to Left Column

Move `<RecentlyViewedRow />` from the right "Activity" column to the bottom of the left "Profile Setup" column on desktop, so it fills the empty space and both columns end at a similar height.

### Desktop Layout (after change)

```text
LEFT COLUMN (Profile Setup)        RIGHT COLUMN (Activity)
-------------------------------    ---------------------------
Buyer Profile                      Research Journey
Mortgage                           Search Alerts
Locations                          Saved Properties
Account                            Saved Calculations
Recently Viewed                    
Support Footer                     
```

### Technical Details

**File:** `src/pages/Profile.tsx`

- **Desktop**: Remove `<RecentlyViewedRow />` from the right column and place it in the left column after `<AccountSection />`, before `<SupportFooter />`.
- **Mobile**: No change needed -- it stays in its current position in the single-column layout.

No other files changed. No database changes.

