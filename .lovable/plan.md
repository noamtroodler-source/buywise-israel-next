

## Plan: Add Total Saves and Total Inquiries to Agent Dashboard Snapshot Strip

### What
Add two new all-time metrics — **total saves** and **total inquiries** — to the snapshot strip on the agent dashboard (next to "1 live · 5 total views").

### How

**Single file edit: `src/pages/agent/AgentDashboard.tsx`**

1. Compute `totalSaves` from properties array: `properties.reduce((sum, p) => sum + ((p as any).total_saves || 0), 0)`
2. Get `totalInquiries` from the existing `leadStats.total` (already fetched via `useLeadStats`)
3. Add two entries to the `snapshotItems` array:
   - `{ label: 'total saves', value: totalSaves }`
   - `{ label: 'total inquiries', value: leadStats?.total || 0 }`

No new hooks, queries, or database changes needed — all data is already available on the page.

