Yes — the implementation plan is to make both agency onboarding/provisioning and the agency portal pull both resale and rental listings from all three source types, while still excluding projects.

What this will mean after implementation

1. Agency provisioning/admin onboarding
- In `/admin/agency-provisioning`, when you add sources for an agency:
  - Agency website source will discover active resale + active rental listing pages.
  - Madlan office source will pull both buy + rent results.
  - Yad2 agency source will pull both `/forsale` + `/rent` agency tabs.
- Projects/new developments remain excluded and should still go through the Project Wizard.

2. Agency portal import flow
- In the agency portal import page, agencies will also be able to import both sale and rental listings from:
  - their website
  - Yad2
  - Madlan
- I’ll change the default there from sale-only to sale + rentals, with clear copy that projects are skipped.

3. Backend behavior
- The import job will use `import_type: both` by default for these flows.
- Existing backend extraction already supports rental-specific fields like monthly rent, `listing_status: for_rent`, furnished status, lease terms, pets policy, agent fee, guarantees, and checks.
- Yad2 and Madlan already have partial support for both modes; the missing part is wiring provisioning/portal calls so they stop forcing `resale`.

4. Important filtering rule
- It will include:
  - active resale listings
  - active rental listings
- It will exclude:
  - projects/new developments
  - sold listings
  - already-rented listings
  - leased/archive/off-market pages

Implementation steps

1. Update the agency provisioning UI and source sync hooks to pass `import_type: both` by default.
2. Update the agency portal import page default from `resale` to `all/both` and make the UI copy clear.
3. Update manual per-source sync and “discover all active sources” so all sources use the same sale + rental mode.
4. Update automated/nightly sync so saved agency sources also use sale + rental mode by default instead of falling back to resale-only.
5. Add/adjust safeguards so rental pages are not filtered out during `both` mode, but sold/rented/leased/archived pages still are.
6. Verify with build checks, Deno checks, and a test function call using the current agency/source setup.

No database schema change should be needed for the core version because `import_jobs.import_type` and `properties.listing_status` already support this. If we later want each saved source to permanently store a preference like “sale-only” vs “rental-only” vs “both,” that would be a separate enhancement.