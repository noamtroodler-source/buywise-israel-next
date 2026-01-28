

# Redesign "More" Dropdown to Match Mega-Menu Style

## Current Issue
The "More" dropdown uses a basic list design while Buy/Rent/Projects use a polished mega-menu style with:
- Rounded corners (`rounded-xl` vs `rounded-md`)
- Larger shadow (`shadow-xl` vs `shadow-lg`)
- Column headers with uppercase styling
- More generous padding
- Better hover transitions

## Design Approach
Since "More" only has 3 items (Blog, About, Contact), we'll create a single-column version that still feels like a mega-menu with:
- Section header ("Resources" or "Company")
- Same rounded corners and shadow
- Same link styling with hover transitions
- Consistent padding and spacing

---

## Changes to `src/components/layout/MoreNav.tsx`

### Before (current basic list):
```tsx
<div className="w-40 rounded-md border bg-popover text-popover-foreground shadow-lg overflow-hidden">
  <Link className="block px-3 py-2 text-sm hover:bg-accent...">Blog</Link>
  ...
</div>
```

### After (mega-menu consistent):
```tsx
<div className="rounded-xl border bg-popover text-popover-foreground shadow-xl overflow-hidden w-[200px]">
  <div className="p-4">
    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
      Company
    </h4>
    <ul className="space-y-1">
      <li>
        <Link className="group flex flex-col rounded-md px-2 py-1.5 hover:bg-accent transition-colors">
          <span className="text-sm font-medium text-foreground group-hover:text-accent-foreground">
            Blog
          </span>
          <span className="text-xs text-muted-foreground group-hover:text-accent-foreground/70">
            News & insights
          </span>
        </Link>
      </li>
      ...
    </ul>
  </div>
</div>
```

---

## Specific Style Alignment

| Property | MegaMenu | MoreNav (Current) | MoreNav (Fixed) |
|----------|----------|-------------------|-----------------|
| Border radius | `rounded-xl` | `rounded-md` | `rounded-xl` |
| Shadow | `shadow-xl` | `shadow-lg` | `shadow-xl` |
| Container padding | `p-4` per column | None | `p-4` |
| Section header | Yes (uppercase) | No | Yes ("Company") |
| Link container | `<ul>` with `space-y-1` | Direct links | `<ul>` with `space-y-1` |
| Link padding | `px-2 py-1.5` | `px-3 py-2` | `px-2 py-1.5` |
| Link style | Rounded with transition | Basic | Rounded with transition |
| Descriptions | Supported | None | Add brief descriptions |

---

## Items with Descriptions

| Link | Description |
|------|-------------|
| Blog | News & insights |
| About | Our story |
| Contact | Get in touch |

---

## Result
- Consistent mega-menu appearance across all navigation dropdowns
- Same visual language: rounded corners, shadows, typography, spacing
- Professional, cohesive navigation experience
- Single-column layout appropriate for fewer items

