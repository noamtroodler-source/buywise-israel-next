

## Plan: Remove Share & Favorite Buttons from Project Images

The share and favorite buttons currently appear overlaid on project images in two places. Since these options are already available below the images, the overlay buttons are redundant and should be removed.

### Changes

**1. `src/components/project/ProjectHero.tsx`** (project detail page)
- Remove the overlay `div` (lines 131-150) containing the Share and Heart buttons from the hero image
- Clean up unused imports (`Share2`, `Heart`) if no longer referenced
- Remove `onShare`, `onSave`, `isSaved` props if they become unused in this component

**2. `src/pages/Projects.tsx`** (projects listing page)
- Remove the "Action Buttons - Top Right" `div` (lines 287-295) containing `ProjectShareButton` and `ProjectFavoriteButton` from project card images
- Remove unused imports for `ProjectShareButton` and `ProjectFavoriteButton`

