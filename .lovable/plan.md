

## Plan: Show Only Agent in Project Sticky Card (Remove Developer Tab)

**What changes:** In `ProjectStickyCard.tsx`, remove the tabbed "Sales Agent / Developer" UI. When a representing agent exists, show only the agent contact section directly (no tabs). When no agent exists, keep showing the developer contact section as fallback.

**File:** `src/components/project/ProjectStickyCard.tsx`

1. **Replace lines 222-238** — Remove the `Tabs`/`TabsList`/`TabsTrigger`/`TabsContent` wrapper. Instead:
   - If `representingAgent` exists → render `<AgentContactSection />` directly (no tabs)
   - Else → render `<DeveloperContactSection />` as fallback
2. **Clean up unused imports** — Remove `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` imports if no longer used elsewhere in the file.

This matches the screenshot reference — just the agent avatar, name, WhatsApp/Email buttons, and the "Read the guide" section below.

