
# Add Chevron Indicator to Agent/Developer Profile Links

## Goal
Make it visually clear that agent and developer names are clickable links to their profiles by adding a small `ChevronRight` icon after the name — a subtle but effective navigation cue.

## Files to Update

### 1. `src/components/property/StickyContactCard.tsx` (Buy/Rent listings sidebar)
**Line 109-114** - Agent name link
```tsx
// Before
<Link 
  to={`/agents/${agent.id}`} 
  className="font-semibold text-foreground truncate block hover:text-primary hover:underline transition-colors"
>
  {agent.name}
</Link>

// After
<Link 
  to={`/agents/${agent.id}`} 
  className="font-semibold text-foreground truncate hover:text-primary hover:underline transition-colors inline-flex items-center gap-1"
>
  {agent.name}
  <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
</Link>
```

### 2. `src/components/property/AgentContactSection.tsx` (In-page agent section)
**Line 92-97** - Agent name link
```tsx
// After
<Link 
  to={`/agents/${agent.id}`} 
  className="font-semibold text-foreground hover:text-primary hover:underline transition-colors inline-flex items-center gap-1"
>
  {agent.name}
  <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
</Link>
```

### 3. `src/components/project/ProjectStickyCard.tsx` (Projects sidebar)
**Lines 100-101** - Agent name in AgentContactSection (currently no link - needs to be made clickable)
```tsx
// Before (not a link)
<span className="font-semibold truncate">{representingAgent?.name}</span>

// After (with link + chevron)
{representingAgent?.id ? (
  <Link 
    to={`/agents/${representingAgent.id}`}
    className="font-semibold truncate hover:text-primary hover:underline transition-colors inline-flex items-center gap-1"
  >
    {representingAgent?.name}
    <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
  </Link>
) : (
  <span className="font-semibold truncate">{representingAgent?.name}</span>
)}
```

**Lines 156-161** - Developer name link (already has link, add chevron)
```tsx
// After
<Link 
  to={`/developers/${developer.slug}`}
  className="font-semibold truncate hover:text-primary transition-colors inline-flex items-center gap-1"
>
  {developer.name}
  <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
</Link>
```

### 4. `src/components/project/ProjectDeveloperCard.tsx` (Full developer card)
**Lines 42-44** - Developer name link (already has chevron pattern on buttons, but not on name)
```tsx
// After
<Link to={`/developers/${developer.slug}`}>
  <h3 className="font-semibold hover:text-primary hover:underline transition-colors inline-flex items-center gap-1">
    {developer.name}
    <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
  </h3>
</Link>
```

## Visual Result
```text
┌────────────────────────────────┐
│  Agent                         │
│  John Smith ›                  │  ← chevron signals "click to view profile"
│  ABC Realty                    │
└────────────────────────────────┘
```

## Styling Details
- Icon: `ChevronRight` at `h-3 w-3` (12px)
- Color: `text-muted-foreground` (subtle gray, not primary blue)
- Layout: `inline-flex items-center gap-1` to keep name + chevron on same line
- `flex-shrink-0` prevents chevron from being squished on truncated names

## Import Updates
- Add `ChevronRight` to lucide-react imports in `StickyContactCard.tsx` and `AgentContactSection.tsx`
- Already imported in `ProjectStickyCard.tsx` and `ProjectDeveloperCard.tsx`
