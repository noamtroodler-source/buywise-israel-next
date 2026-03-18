

## Plan: Remove Developer Logo/Icon from Card

Remove the logo image and Building icon fallback entirely from `ProjectDeveloperCard.tsx`. The developer name and metadata will start at the left edge without any logo space.

### Changes

**`src/components/project/ProjectDeveloperCard.tsx`**
- Remove the `logoError` state
- Remove the entire logo `<Link>` block (the image and Building icon fallback)
- Keep the right-side content (`flex-1 min-w-0` div) but remove the parent flex layout that creates the gap for the logo

