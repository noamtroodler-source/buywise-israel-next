

# Implement Multi-Category Selection (Max 3) for Blog Wizard

## Overview

Change the blog category selection from a single dropdown to a checkbox-based multi-select allowing 1-3 categories. This matches the existing Target Audience pattern already in the wizard.

---

## Database Change

Add a new column to store multiple category IDs:

```sql
ALTER TABLE blog_posts 
ADD COLUMN category_ids uuid[] DEFAULT '{}';
```

The existing `category_id` column is kept for backward compatibility with existing posts.

---

## Files to Modify

### 1. `src/components/blog/wizard/BlogWizardContext.tsx`

**Changes:**
- Line 7: Change `categoryId: string` → `categoryIds: string[]`
- Line 38: Update default from `categoryId: ''` → `categoryIds: []`
- Line 94: Update validation from `data.categoryId.length > 0` → `(data.categoryIds?.length || 0) > 0`

---

### 2. `src/components/blog/wizard/StepBasics.tsx`

**Replace the Select dropdown (lines 59-76) with a checkbox grid:**

```tsx
<div className="space-y-3">
  <Label>Categories * <span className="text-muted-foreground font-normal">(select up to 3)</span></Label>
  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
    {categories.map((cat) => {
      const isSelected = data.categoryIds?.includes(cat.id);
      const isDisabled = !isSelected && (data.categoryIds?.length || 0) >= 3;
      return (
        <div key={cat.id} className="flex items-center space-x-2">
          <Checkbox
            id={`category-${cat.id}`}
            checked={isSelected}
            onCheckedChange={() => handleCategoryToggle(cat.id)}
            disabled={isDisabled}
          />
          <label
            htmlFor={`category-${cat.id}`}
            className={cn("text-sm cursor-pointer", isDisabled && "text-muted-foreground")}
          >
            {cat.name}
          </label>
        </div>
      );
    })}
  </div>
  <p className="text-xs text-muted-foreground">
    {data.categoryIds?.length || 0} of 3 selected
  </p>
</div>
```

**Add handler function:**
```tsx
const handleCategoryToggle = (categoryId: string) => {
  const current = data.categoryIds || [];
  if (current.includes(categoryId)) {
    updateData({ categoryIds: current.filter(c => c !== categoryId) });
  } else if (current.length < 3) {
    updateData({ categoryIds: [...current, categoryId] });
  }
};
```

**Add import for `cn` utility**

---

### 3. `src/hooks/useProfessionalBlog.tsx`

**Update interfaces:**
- `CreateBlogPostData`: Add `category_ids?: string[]`
- `UpdateBlogPostData`: Add `category_ids?: string[]`

**Update `useCreateBlogPost` mutation (line 132):**
- Add: `category_ids: data.category_ids || [],`

**Update `useUpdateBlogPost` mutation:**
- Handle `category_ids` in the updates object

---

## Visual Result

The category selection will look like:

```text
Categories * (select up to 3)
┌─────────────────────────────────────────────────────────────┐
│ [✓] Market Analysis    [✓] Buyer's Guide    [ ] News       │
│ [ ] Legal Tips         [ ] Investment       [disabled]...  │
└─────────────────────────────────────────────────────────────┘
2 of 3 selected
```

When 3 categories are selected, remaining unchecked options become disabled (grayed out).

---

## Implementation Order

1. **Database**: Run migration to add `category_ids` column
2. **Context**: Update `BlogWizardContext.tsx` data structure and validation
3. **UI**: Update `StepBasics.tsx` with checkbox grid
4. **Hooks**: Update `useProfessionalBlog.tsx` to handle array

---

## Backward Compatibility

- Existing posts keep their `category_id` value
- When editing old posts, the wizard will work with `categoryIds`
- Both `category_id` (legacy) and `category_ids` (new) columns will exist
- Display components can fall back: show `category_ids` if present, else `category_id`

