

# Add "Free" Messaging to Professional Type Cards

## Summary
Add subtle but clear "Free" messaging to the Choose Your Path section, communicating the founding period benefit without long-term promises.

## Changes

### File: `src/components/advertise/ProfessionalTypeChooser.tsx`

**1. Add trust line below section subtitle (after line 72)**
```text
"Free during our founding period"
```
Styled smaller and in muted text, keeping it clean and understated.

**2. Add "Free" badge to each card header**
Position a small "Free" badge next to each card's icon using:
- Secondary variant for a subtle, non-intrusive look
- Positioned alongside the icon area

### Visual Result
```text
┌─────────────────────────────────┐
│  Choose Your Path               │
│  Whether you're an individual...│
│  Free during our founding period│  ← New trust line
└─────────────────────────────────┘

┌─────────────────┐
│ [Icon]   Free   │  ← Badge beside icon
│ Individual Agent│
│ ...features...  │
│ [Register]      │
└─────────────────┘
```

### Why This Approach
- **Sets expectations**: "Founding period" implies this is a special early-access benefit
- **No permanent promises**: Naturally communicates pricing may change later
- **Double reinforcement**: Trust line + badges ensure message is clear
- **Follows brand standards**: Uses existing components and styling patterns

