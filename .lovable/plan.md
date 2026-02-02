
# Plan: Add Social Links to Agent Profiles

## Overview
Agents currently don't have social link fields in the database or their public profiles. This plan adds LinkedIn, Instagram, and Facebook links for agents, matching the pattern used for developers and agencies.

## Changes Required

### 1. Database Migration
Add three new columns to the `agents` table:
- `linkedin_url` (text, nullable)
- `instagram_url` (text, nullable)  
- `facebook_url` (text, nullable)

This follows the same pattern as the `developers` table (individual URL columns rather than JSONB like agencies).

### 2. Update Agent Interface
**File:** `src/hooks/useAgent.tsx`

Add to the Agent interface:
```typescript
linkedin_url: string | null;
instagram_url: string | null;
facebook_url: string | null;
```

### 3. Update Agent Detail Page
**File:** `src/pages/AgentDetail.tsx`

Add social link icon buttons after the Share button in the contact section:
- Import Linkedin, Instagram, Facebook icons from lucide-react
- Import Separator component
- Add ghost icon buttons for each social link that exists

**Visual placement:** After the "Share Profile" button with a vertical separator

```
[WhatsApp] [Email] [Share Profile] | [LinkedIn] [Instagram] [Facebook]
```

## Summary
| Entity | Database Status | Display Status |
|--------|-----------------|----------------|
| Developers | ✅ Has columns | ✅ Already displays |
| Agencies | ✅ Has social_links JSONB | ✅ Just added display |
| Agents | ❌ Needs columns | ❌ Needs display |

## Files to Modify
1. **Database** - Add 3 columns to agents table
2. `src/hooks/useAgent.tsx` - Add to interface
3. `src/pages/AgentDetail.tsx` - Add social link icons

## Note
Developers already have social links fully working - no changes needed there.
