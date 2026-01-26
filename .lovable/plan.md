

# Update TrustStrip Stats Section

## Summary

Replace the current inventory-focused stats with utility and trust-focused metrics that complement (not duplicate) the hero section.

---

## New Stats Configuration

| Icon | Value | Label |
|------|-------|-------|
| Calculator | 9 | Free Tools |
| MapPin | 35+ | Cities |
| Shield | 100% | Independent |
| Globe | 100% | In English |

---

## Implementation

**File:** `src/components/home/TrustStrip.tsx`

### Changes Required

1. **Update imports** - Replace `Home, Key, Building2` with `Calculator, MapPin, Globe` (keep `Shield`)

2. **Replace displayStats array** - Remove dynamic database queries since these are now static values

3. **Simplify component** - Remove the `usePlatformStats` hook since we no longer need database counts

```tsx
import { motion } from 'framer-motion';
import { Calculator, MapPin, Shield, Globe } from 'lucide-react';

const displayStats = [
  { icon: Calculator, value: '9', label: 'Free Tools' },
  { icon: MapPin, value: '35+', label: 'Cities' },
  { icon: Shield, value: '100%', label: 'Independent' },
  { icon: Globe, value: '100%', label: 'In English' },
];
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/home/TrustStrip.tsx` | Update icons, values, labels; remove database hook |

