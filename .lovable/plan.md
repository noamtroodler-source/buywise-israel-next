

# Create German Colony Private House Listing

## Overview
Insert one luxury property listing into the database, assigned to Michael Steinmetz (agent ID: `c477a7be-fa3a-4536-9071-6982c33d398b`), with all 9 uploaded property photos stored in the `property-images` bucket. The listing will appear as "Just Listed" and display all platform features (Market Intelligence, cost breakdowns, etc.).

## Step 1: Upload 9 Property Photos to Storage

Copy all 9 uploaded screenshots to the project, then upload to the `property-images` storage bucket under a path like `properties/german-colony-house/`. These will be used as the `images` array on the property record.

Photos to upload:
1. Exterior (Jerusalem stone facade with glass)
2. Kitchen angle 1
3. Kitchen angle 2
4. Living room angle 1
5. Living room angle 2
6. Dining room with garden view
7. Staircase and open floor
8. Grand hallway / open plan
9. Garden-facing room with sliding doors

## Step 2: Insert Property Record

Insert into `properties` table with these values:

| Field | Value |
|---|---|
| agent_id | `c477a7be-fa3a-4536-9071-6982c33d398b` (Michael Steinmetz) |
| title | Private House in the German Colony |
| description | Full listing description from JRE site (the "Once-in-a-Lifetime Opportunity..." text) |
| property_type | `house` |
| listing_status | `for_sale` |
| price | 10,350,000 (USD) |
| currency | USD |
| address | Dubnov Street, German Colony |
| city | Jerusalem |
| neighborhood | German Colony |
| latitude | 31.7615 |
| longitude | 35.2210 |
| bedrooms | 8 |
| additional_rooms | 2 |
| bathrooms | 7 (6.5 rounded up to fit integer column) |
| size_sqm | 400 |
| year_built | 2025 (brand new) |
| total_floors | 3 |
| parking | 2 |
| ac_type | central |
| has_elevator | true |
| has_storage | true |
| has_balcony | false |
| features | Elevator, Laundry Room, Private Garden, Smart House System, Storage Room, Underfloor Heating, Jerusalem Stone, High Ceilings, Floor-to-Ceiling Windows |
| images | (array of 9 uploaded storage URLs) |
| is_published | true |
| is_featured | true |
| verification_status | approved |
| condition | new |
| created_at | now() (will show as "Just Listed") |
| featured_highlight | Once-in-a-lifetime luxury home in the German Colony |

## Step 3: Verify the Listing

- Navigate to the listings page to confirm the property appears with the "Just Listed" badge
- Open the property detail page to verify all features render: photo gallery, description, Quick Facts, cost breakdown, Market Intelligence, and agent contact (Michael Steinmetz linked to Jerusalem Real Estate)

## Technical Notes
- No schema changes or code changes needed -- purely data insertion
- The `bathrooms` column is integer, so 6.5 will be stored as 7 (closest representation)
- Price is in USD ($10,350,000) matching the original listing
- Location pinned near Dubnov St based on the map screenshot showing Marrache Fine Art landmark
- Setting `created_at` to current time ensures the "Just Listed" freshness badge appears (properties 3 days old or less)

