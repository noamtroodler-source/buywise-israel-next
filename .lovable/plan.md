
# Comprehensive Mock Data Generation Plan

## Overview
Create professional-quality demo data for investor presentation including agencies, agents, developers, and listings across all 25 Israeli cities.

## Phase 1: Professional Entities

### Agencies (10 total)
Create realistic Israeli real estate agencies with:
- Professional Hebrew-style names (e.g., "Binyan HaZahav Properties", "Negev Living Realty")
- Complete profiles: description, phone, email, website, founded_year
- cities_covered arrays matching Israeli geography
- Specializations (luxury, investment, anglo services, etc.)
- Logo URLs from professional headshot/logo services
- Status: approved, is_verified: true

### Agents (50 total, ~5 per agency)
Create agents with realistic Israeli names and complete profiles:
- Mixed gender, varied years_experience (2-25 years)
- Languages: Hebrew, English, Russian, French, Spanish mix
- Specializations: First-time buyers, Investment properties, Luxury, Rentals, Anglo clients
- Professional bio text
- License numbers (realistic Israeli format)
- Avatar URLs from professional headshot sources
- Assigned to agencies with proper agency_id relationships
- Status: active, is_verified: true

### Developers (8 total)
Create realistic property developers:
- Professional company names (e.g., "Azrieli Group", "Shikun & Binui" style names)
- Complete descriptions, founded_year, total_projects
- Office addresses in major cities
- Company_type: "public", "private", "boutique"
- Specialties: residential, mixed-use, luxury, affordable
- Status: approved, is_verified: true

## Phase 2: Properties - For Sale (200 total, ~8 per city)

For each of the 25 cities, create 8 for-sale listings with:

### Data Variety per City
- 2 apartments (3-4 rooms)
- 2 garden apartments or penthouses
- 1 duplex or mini-penthouse  
- 2 larger family homes (4-5 rooms)
- 1 luxury property

### Realistic Pricing
Use city-specific price ranges from the cities table:
- Tel Aviv: ₪3.5M-12M
- Jerusalem: ₪2.5M-8M
- Herzliya: ₪3M-15M
- Beer Sheva: ₪1M-2.5M
(scaled per city's median_apartment_price)

### Complete Field Population
- Descriptive titles with property highlights
- Full descriptions (200-400 words) mentioning neighborhood, features, lifestyle
- Property_type: mixed distribution
- Bedrooms: 2-6 range
- Bathrooms: 1-4 range
- Size_sqm: realistic for type (60-250 sqm)
- Floor/total_floors: realistic combinations
- Features arrays: balcony, storage, parking, elevator, etc.
- Condition: new, renovated, good distribution
- Entry_date: mix of immediate and future dates
- ac_type, parking, vaad_bayit: realistic values
- Coordinates: approximate lat/lng for each city
- 5-7 professional Unsplash images per listing

### Image Strategy (Critical for Demo Quality)
Use curated Unsplash real estate collections:
- Living room interiors
- Kitchen shots
- Bedroom photography
- Bathroom images
- Exterior/building shots
- Balcony/view photos
- Neighborhood context

URLs will use Unsplash's reliable CDN with size parameters for optimal loading.

## Phase 3: Rentals (200 total, ~8 per city)

Similar structure to for-sale, but with:
- Rental-appropriate pricing (₪3,000-25,000/month range by city)
- listing_status: 'for_rent'
- Lease reality fields populated:
  - lease_term: '12_months', '24_months', 'flexible'
  - furnished_status: 'fully', 'semi', 'unfurnished' mix
  - pets_policy: 'allowed', 'case_by_case', 'not_allowed'
  - agent_fee_required, bank_guarantee_required, checks_required
- Entry dates more immediate

## Phase 4: Projects (100 total, ~4 per city)

Create new development projects:

### Project Details
- Realistic project names (e.g., "Park Towers Ra'anana", "Sea View Netanya")
- Status distribution: planning, pre_sale, foundation, structure, finishing
- Completion dates: 2025-2028 range
- Price ranges: from/to based on city
- Total units: 30-200 range
- Available units: subset of total
- Construction progress: aligned with status
- Amenities: gym, pool, lobby, parking, etc.
- Professional description of the development

### Project Units (3-6 unit types per project)
- 3-room apartments
- 4-room apartments  
- 5-room apartments
- Penthouses
- Garden apartments
With floor ranges, size ranges, price ranges per type

### Images
- Architectural renderings (Unsplash has good modern building photos)
- Lobby/amenity shots
- Floor plan style images

## Phase 5: Implementation Approach

### Create Edge Function: `seed-demo-data`
Build a comprehensive edge function that:
1. Generates all agencies with proper UUIDs
2. Creates agents linked to agencies
3. Creates developers
4. Creates properties with agent assignments
5. Creates rentals with agent assignments
6. Creates projects with developer assignments
7. Creates project units

### Data Generation Features
- Deterministic but varied data using city-specific parameters
- Proper UUID generation for all entities
- Realistic Israeli phone numbers (05x-xxx-xxxx format)
- Professional email formats
- Coordinate approximations per city
- Hebrew-aware naming patterns

### Image Arrays
Curated Unsplash URLs organized by:
- Property interiors (30+ varied shots)
- Property exteriors (20+ varied shots)
- Modern buildings (20+ for projects)
- Luxury amenities (15+ shots)

Each listing gets 5-7 randomly selected from appropriate categories.

## Technical Details

### Execution Order (respects foreign keys)
1. Insert agencies
2. Insert agents (references agencies)
3. Insert developers
4. Insert properties (references agents)
5. Insert projects (references developers)
6. Insert project_units (references projects)

### SQL Approach
Use batched INSERT statements with:
- gen_random_uuid() for IDs
- Array construction for images, features, languages
- City-appropriate pricing from reference data
- Proper enum values for status fields

### Status Settings
All entities will be set to:
- is_published: true
- is_verified: true  
- status: 'active' or 'approved'
- verification_status: 'approved'

This ensures everything appears on public pages immediately.

## Expected Results

| Entity | Count |
|--------|-------|
| Agencies | 10 |
| Agents | 50 |
| Developers | 8 |
| For-Sale Properties | 200 |
| Rental Properties | 200 |
| Projects | 100 |
| Project Units | ~400 |
| **Total Listings** | **500** |

## Demo Quality Assurance

After implementation, verify:
- Homepage shows featured listings
- All city pages have listings
- Agent/Agency/Developer pages populate correctly
- Search and filters work with real data
- Property detail pages display all fields
- Images load quickly (Unsplash CDN)

## Alternative: AI Images (Optional Enhancement)

If you want some AI-generated images for certain premium listings:
- Generate 50-100 hero images for featured properties
- Use for project renderings specifically
- Run as separate batch after main seeding

This keeps the core demo stable while allowing AI enhancement where it adds value.

## Timeline Estimate

With the edge function approach:
- Development: Single implementation session
- Execution: ~2-5 minutes to insert all data
- Verification: Review key pages

Ready to proceed with building the seed-demo-data edge function?
