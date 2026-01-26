
# Remove "Where Should I Buy?" Tool

## Summary

Delete the "Where Should I Buy?" (Neighborhood Match) tool from the platform entirely. This removes it from the tools directory, homepage promotion, and deletes the component files.

---

## What Will Be Removed

| Item | Location |
|------|----------|
| Tool card on /tools page | Shows in tool grid |
| Tool functionality | 15-question quiz |
| Homepage promo reference | ToolsPromo component |
| Component files | 2 files |

---

## Database Impact

**No database changes required.** The `tool_runs` and `tool_step_events` tables contain no data related to this tool (verified via query).

---

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/Tools.tsx` | Remove import, tool entry from array, and component mapping |
| `src/components/home/ToolsPromo.tsx` | Remove 'neighborhood' from tools array |

## Files to Delete

| File | Reason |
|------|--------|
| `src/components/tools/NeighborhoodMatch.tsx` | Primary component (767 lines) |
| `src/components/tools/NeighborhoodQuiz.tsx` | Legacy component (unused, 323 lines) |

---

## Technical Details

### Tools.tsx Changes

1. Remove import line 18
2. Remove tool entry from `tools` array (line 35)
3. Remove mapping from `toolComponents` (line 46)
4. Remove `MapPinned` from icon imports if no longer used

### ToolsPromo.tsx Changes

1. Remove neighborhood entry from tools array (line 10)
2. Remove `Compass` from icon imports if no longer used

### TrustStrip Update

After removal, the "9 Free Tools" stat in TrustStrip should be updated to "8 Free Tools" to reflect accurate count.

---

## Post-Removal Tool Count

The platform will have **8 tools** remaining:
1. Mortgage Calculator
2. Total Cost Calculator
3. Affordability Calculator
4. Investment Return Calculator
5. Rent vs Buy Calculator
6. Renovation Cost Estimator
7. Document Checklist
8. *(One tool removed)*

