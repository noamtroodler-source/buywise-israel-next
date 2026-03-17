

# Translate Hebrew Descriptions During Import + Wizard AI-Generated Notices

## What Changes

### 1. Add description translation to AI extraction prompt

In `buildExtractionPrompt` (~line 1502), add a `description` instruction telling the AI to translate Hebrew descriptions into professional English for international buyers:

```
- description: Translate the property description into fluent, professional English for international buyers.
  Keep all factual details (rooms, features, location highlights, renovation info).
  Rephrase marketing fluff into clear, compelling English. 
  If the description is already in good English, keep it as-is.
  Do NOT include the agent's name, phone number, or Hebrew text in the description.
  Aim for 150-400 characters.
```

### 2. Add fallback description generation in `processOneItem`

At the insert point (~line 2282), if the AI returns no description or returns Hebrew text, generate a basic English description from the extracted fields (type, bedrooms, size, neighborhood, city, features, condition).

```ts
function generateListingDescription(listing: any): string | null {
  // If already good English (>50 chars, mostly Latin), keep it
  if (listing.description && listing.description.length > 50 && /^[a-zA-Z\s\d,.!?\-()]+$/.test(listing.description.substring(0,50))) {
    return listing.description;
  }
  // Build from fields
  const parts: string[] = [];
  const type = formatPropertyType(listing.property_type || "apartment");
  if (listing.bedrooms) parts.push(`${listing.bedrooms}-bedroom ${type.toLowerCase()}`);
  else parts.push(type);
  if (listing.size_sqm) parts.push(`${listing.size_sqm} sqm`);
  // ... location, condition, features
  return parts.length > 0 ? capitalizeFirst(parts.join(", ") + ".") : null;
}
```

### 3. Show AI-generated notices in the property wizard

In `StepBasics` (title field) and `StepDescription` (description field), check if the property was imported (`import_source` is set on the property). If so, show an info banner:

**Title field (StepBasics):**
> "This title was AI-generated based on the original listing. Please review and adjust as needed."

**Description field (StepDescription):**
> "This description was translated and adapted from the original Hebrew listing for international buyers. Please review it carefully for accuracy."

These notices only show for imported properties in edit mode. Need to:
- Add `import_source` to `PropertyWizardData` interface
- Pass it when loading property data in `AgencyEditPropertyWizard.tsx`
- Conditionally render info alerts in `StepBasics` and `StepDescription`

## Files Changed

| File | Change |
|------|--------|
| `supabase/functions/import-agency-listings/index.ts` | Add description instruction to prompt; add `generateListingDescription` fallback; apply at insert |
| `src/components/agent/wizard/PropertyWizardContext.tsx` | Add `import_source?: string` to `PropertyWizardData` |
| `src/pages/agency/AgencyEditPropertyWizard.tsx` | Pass `import_source` when loading property data |
| `src/components/agent/wizard/steps/StepBasics.tsx` | Show AI-generated title notice for imported listings |
| `src/components/agent/wizard/steps/StepDescription.tsx` | Show translated description notice for imported listings |

