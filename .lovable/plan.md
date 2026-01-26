

# Delete All Mock Data - Fresh Start

## Summary
Delete all current mock/test data from the database including properties, projects, agents, agencies, and developers so you can start fresh.

## Data to Delete

### Listings & Projects
- **102 properties** (all rentals and sales listings)
- **17 projects** (new development projects)
- **155 project units** (units within projects)

### Professionals
- **5 agents**
- **5 agencies**
- **5 developers**

### Related Data (will be deleted automatically or explicitly)
- **250 property views** (analytics)
- **95 project views** (analytics)
- **1 agency invite**

## Deletion Order (respects foreign key constraints)

The deletion must happen in a specific order to respect database relationships:

1. **First - Analytics & tracking data**
   - `property_views` (references properties)
   - `project_views` (references projects)
   - `share_events` (if any exist)

2. **Second - Project-related**
   - `project_units` (references projects)
   - `project_inquiries` (if any exist)
   - `projects` (references developers)

3. **Third - Property-related**
   - `inquiries` (references properties and agents)
   - `favorites` (references properties)
   - `listing_lifecycle` (references properties)
   - `properties` (references agents)

4. **Fourth - Professional accounts**
   - `agency_invites` (references agencies)
   - `agents` (references agencies)
   - `agencies`
   - `developers`

## Technical Details

SQL commands to execute (in order):

```sql
-- Step 1: Clear analytics and tracking
DELETE FROM property_views;
DELETE FROM project_views;
DELETE FROM share_events;
DELETE FROM listing_lifecycle;
DELETE FROM listing_price_history;
DELETE FROM listing_status_history;

-- Step 2: Clear project data
DELETE FROM project_units;
DELETE FROM project_inquiries;
DELETE FROM projects;

-- Step 3: Clear property data
DELETE FROM inquiries;
DELETE FROM favorites;
DELETE FROM price_drop_notifications;
DELETE FROM properties;

-- Step 4: Clear professional accounts
DELETE FROM agency_invites;
DELETE FROM agents;
DELETE FROM agencies;
DELETE FROM developers;
```

## What Stays
- User accounts and profiles
- Cities and market data
- Platform settings and configuration
- Search alerts (user-created)
- User events/analytics

## Result
After this, your database will be clean and ready for real listings, agents, agencies, and developers to be added.

