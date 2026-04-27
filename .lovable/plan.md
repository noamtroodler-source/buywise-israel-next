## Plan: Internal “1-Hour Listing Approval” System

### Goal

Create a private agency/admin workflow where Erez can quickly review and approve every imported listing, without making this visible to buyers. The site keeps a quality tone publicly, while the agency gets a lightweight but responsible approval process internally.

The core shift:

```text
Not: “Complete 59 perfect listings before launch.”
Yes: “Confirm each listing is accurate, available, and safe to publish.”
```

## 1. Add internal listing approval states

Each imported agency listing should have an internal review status separate from public visibility.

Recommended states:

```text
needs_review       Imported, not yet agency-confirmed
approved_live      Agency confirmed; can be public
needs_edit         Agency saw an issue; not ready yet
archived/stale     Agency says it is no longer relevant
```

Important distinction:

```text
Agency approval status = internal workflow
Public published status = buyer-facing visibility
```

This means a listing can be imported and visible inside the agency dashboard, but not visible to buyers until approved.

## 2. Create a fast review queue for agencies

Add a private agency-facing review mode, likely from `/agency/listings`, focused only on imported listings that need confirmation.

The experience should feel like an inbox, not a full listing editor.

For each listing, show only the fields they actually need to verify quickly:

- Main photo/photos
- Title
- Price
- City / neighborhood / Exact adress with street number 
- Rooms / bedrooms
- Size
- Floor if available
- Agent assignment
- Source link
- Key missing or risky fields
- “Last imported from source” timestamp if available

Primary actions:

```text
Approve & publish
Needs quick edit
Not available / archive
Skip for now
```

This keeps the agency responsible for confirming each listing, but avoids forcing them into a long form for every property.

## 3. Add “Approve with notes” instead of forcing perfection

When a listing has missing non-critical information, allow approval if the core facts are good enough.

A listing should be publishable if it has:

- Real agency ownership
- Price
- City/location
- Property type
- Basic room/size info when available
- At least one acceptable image or approved fallback treatment
- Agency confirmation that it is available/current

If fields are missing, show internal warnings like:

```text
Missing neighborhood
Only 2 photos
No floor info
No bathroom count
```

But do not block approval unless the issue is serious.

Blocking issues should be limited to things like:

- No price
- No city/location
- No usable title/address context
- No ownership/agent connection
- No confirmation that it is available
- Duplicate/conflict requiring admin review

## 4. Add batch approval only for very safe listings

To save time, add a “safe batch approve” option, but only for listings that pass a minimum quality threshold.

Example:

```text
12 listings look complete enough to approve together.
Review summary → Approve selected
```

This should not approve everything blindly. It should only include listings with no critical flags.

For Erez, this creates the feeling of momentum:

```text
Approve 12 now
Review 18 quick fixes
Leave 29 for later polish/archive
```

## 5. Add a lightweight “quick edit drawer”

For listings that need small fixes, do not send them into the full property wizard.

Create a compact internal drawer/modal with only the most likely missing fields:

- Price
- Neighborhood
- Size
- Rooms/bedrooms
- Bathrooms
- Floor / total floors
- Agent assignment
- Photos/source link review
- Availability status

After saving, return them immediately to the review queue.

This makes the task feel like:

```text
Fix one thing → approve → next listing
```

Not:

```text
Open giant listing form → get lost → never finish
```

## 6. Keep incomplete but approved listings polished publicly

Nothing buyer-facing should say “incomplete,” “needs review,” or “missing data.”

Public listing pages should continue to feel curated. Missing data should simply be omitted or softened.

Examples:

- If floor is missing, do not show a blank floor row.
- If neighborhood is uncertain, show city-level context instead.
- If photos are limited, avoid calling attention to it.
- If data was imported, avoid exposing internal scrape/review language.

Public tone remains:

```text
Verified agency listing
Buyer-useful details
Clear contact path
No messy internal status
```

## 7. Add an internal quality score, not public-facing

Create an internal listing quality score/checklist for the agency/admin side only.

Example scoring categories:

```text
Critical readiness
- price
- city/location
- agency/agent attached
- availability confirmed

Buyer usefulness
- photos
- neighborhood
- rooms
- size
- floor
- description

Performance polish
- features
- parking/storage
- balcony/elevator/mamad
- better description
```

Use this to power internal labels:

```text
Ready to approve
Needs 1 quick fix
Needs photos
Needs agent confirmation
Likely stale
```

Do not show these quality labels to buyers.

## 8. Add a post-launch backlog so they do not forget

After they approve enough listings to go live, keep the rest in a private backlog.

Agency dashboard widget:

```text
Listing cleanup
18 still need confirmation
9 missing photos
6 missing neighborhood
4 likely stale
```

Use small weekly goals:

```text
Polish 5 listings this week
Confirm stale listings
Add missing neighborhoods
```

The agency should not feel like launch failed because everything is not perfect. They should feel like the site is live, and now they have a manageable cleanup queue.

## 9. Add admin-side oversight for you

Create or improve an admin view that lets you see Erez’s onboarding progress without relying on them to tell you.

Admin should see:

- Total imported listings
- Approved listings
- Needs review
- Needs edit
- Archived/stale
- Listings with critical blockers
- Listings missing photos
- Listings missing agent
- Last review activity

This gives you leverage to follow up manually:

```text
“You’re 70% through. Just 8 quick confirmations left to launch the first batch.”
```

## 10. Improve importer quality before asking them to review

Before Erez spends time reviewing, improve the imported listing completeness as much as possible automatically.

Use the existing importer improvement direction:

- Extract more fields from agency pages
- Better parse English labels
- Pull useful facts from descriptions
- Fill neighborhood/address when possible
- Keep agency source data preferred
- Use other sources only to fill gaps
- Flag conflicts instead of silently overwriting

This reduces how many listings feel “unfinished” when Erez opens the review queue.

## Recommended Erez workflow

```text
Step 1: You/importer prepares listings as much as possible
Step 2: Erez opens private Review Queue
Step 3: They approve/archive every listing quickly
Step 4: Approved listings go live
Step 5: Remaining issues become internal backlog
Step 6: Weekly nudges keep cleanup moving
```

The key is that every listing gets a yes/no/needs-edit decision, but only the important fields are reviewed during the first pass.

## Technical implementation

### Database

Add or reuse internal fields on listings/properties for agency review, such as:

- `agency_review_status`
- `agency_reviewed_at`
- `agency_reviewed_by`
- `agency_review_notes`
- `quality_score`
- `quality_flags` or continue using `listing_quality_flags`
- `last_imported_at` if not already available

Keep this protected by backend security rules so only the owning agency/admin can see and update review state.

### Hooks/data

Update agency listing hooks to fetch review status and quality flags for agency dashboard use.

Relevant existing areas:

- `useAgencyListingsManagement`
- `usePendingItems`
- listing quality flags
- agency listing pages
- agency import review pages

### Agency UI

Add private agency components:

- Review queue view
- Listing review card
- Quick edit drawer
- Batch approval controls
- Post-launch backlog widget

### Admin UI

Add or improve admin onboarding visibility:

- Agency onboarding progress summary
- Listing review status breakdown
- Erez-specific progress tracking

### Public UI

No public-facing “incomplete,” “pending,” or “review” labels.

Only approved/published listings appear publicly. Missing optional fields are hidden gracefully.

## Success criteria

This is working when:

- Erez can review every listing without opening a full editor each time.
- Listings do not go public until agency-confirmed.
- The first useful batch can go live quickly.
- Incomplete listings do not look messy to buyers.
- Erez has a persistent private backlog so nothing gets forgotten.
- You can monitor progress from admin.
- Public site quality remains protected even while internal onboarding is still in progress.