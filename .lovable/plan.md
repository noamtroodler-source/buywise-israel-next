
# Remove Areas from Main Navigation

## Summary
Remove the standalone "Areas" link from both desktop and mobile menus since it's now accessible within the Buy, Rent, and Projects dropdowns.

---

## Changes

**File:** `src/components/layout/Header.tsx`

### 1. Desktop Navigation (Lines 73-78)

Remove this block entirely:
```tsx
<Link 
  to="/areas" 
  className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors"
>
  Areas
</Link>
```

### 2. Mobile Menu (Lines 398-404)

Remove this block entirely:
```tsx
<Link 
  to="/areas" 
  className="px-4 py-3 text-sm font-medium text-foreground hover:bg-muted rounded-lg active:bg-muted/80"
  onClick={() => setMobileMenuOpen(false)}
>
  Areas
</Link>
```

---

## Result

| Location | Before | After |
|----------|--------|-------|
| Desktop nav | Buy, Rent, Projects, **Areas**, Blog, Advertise, More | Buy, Rent, Projects, Blog, Advertise, More |
| Mobile nav | Buy, Rent, Projects, **Areas**, Blog, Advertise... | Buy, Rent, Projects, Blog, Advertise... |

Areas remains accessible via:
- Buy dropdown → "Understand Markets"
- Rent dropdown → "Market Overview"  
- Projects dropdown → "Understand Markets"
