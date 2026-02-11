

# Create Jerusalem Real Estate Demo: Agency + Agent Profile

## Overview
Insert demo data for **Jerusalem Real Estate (JRE)** agency and **Michael Steinmetz** agent profile directly into the database, so the agency owner can preview how his brand looks on BuyWise Israel. No code changes needed -- just database inserts and photo uploads.

## What We Know (from scraping + LinkedIn)

**Agency - Jerusalem Real Estate:**
- Website: https://jerusalem-real-estate.co
- Tagline: "Exclusive properties for discerning buyers in the most cherished location"
- Office: Derech Beit Lechem 66a, Baka, Jerusalem
- Phone: +972 58-518-1212
- Email: office@jerusalem-real-estate.co
- Founded: ~2019 (based on Michael's LinkedIn)
- Focus: Luxury Jerusalem properties for international buyers
- Neighborhoods: Old Katamon, Baka, German Colony, Rehavia, Talbiya, Katamon, and more
- Logo URL available from their site

**Agent - Michael Steinmetz:**
- Role: Owner of Jerusalem Real Estate (Jan 2019 - Present)
- Previously: Real Estate Broker at Century 21 Jerusalem (Jan 2016 - Jan 2019)
- Before that: Sales Manager at Cdtech Group (Nov 2012 - May 2015)
- Total real estate experience: ~10 years
- Location: West Jerusalem
- Email: michael@jerusalem-real-estate.co
- WhatsApp: +972 54-809-6369
- Languages: English, Hebrew
- Specializations: Luxury Properties, International Buyers, New Developments
- LinkedIn photo provided (uploaded screenshot)

---

## Step 1: Upload Images to Storage

Upload the following to the `property-images` bucket (reusing existing public bucket):
- JRE logo from their website
- Michael's LinkedIn headshot (from the uploaded screenshot)

## Step 2: Insert Agency Record

Insert into `agencies` table:
- **name**: Jerusalem Real Estate
- **slug**: `jerusalem-real-estate`
- **logo_url**: (uploaded logo URL)
- **description**: Crafted from their About page -- focused on helping international buyers find luxury properties in Jerusalem with expert local guidance
- **founded_year**: 2019
- **website**: https://jerusalem-real-estate.co
- **email**: office@jerusalem-real-estate.co
- **phone**: +972 58-518-1212
- **is_verified**: true (for demo purposes)
- **status**: approved
- **verification_status**: approved
- **cities_covered**: ["Jerusalem"]
- **specializations**: ["Luxury Properties", "International Buyers", "New Developments"]
- **office_address**: Derech Beit Lechem 66a, Baka, Jerusalem
- **social_links**: { "linkedin": "...", "instagram": "...", "facebook": "..." } (if found on site)

## Step 3: Insert Agent Record

Insert into `agents` table:
- **name**: Michael Steinmetz
- **email**: michael@jerusalem-real-estate.co
- **phone**: +972 54-809-6369
- **avatar_url**: (uploaded headshot URL)
- **bio**: Written from LinkedIn + website info -- Owner of Jerusalem Real Estate since 2019, previously a broker at Century 21 Jerusalem. Specializes in helping international buyers navigate Jerusalem's luxury real estate market with personalized guidance and deep local knowledge.
- **agency_id**: (linked to the inserted agency)
- **agency_name**: Jerusalem Real Estate
- **years_experience**: 10
- **languages**: ["English", "Hebrew"]
- **specializations**: ["Luxury Properties", "International Buyers", "Penthouses", "New Developments"]
- **neighborhoods_covered**: ["Old Katamon", "Baka", "German Colony", "Rehavia", "Talbiya", "Katamon", "Yemin Moshe", "Mamilla"]
- **is_verified**: true
- **status**: approved
- **linkedin_url**: Michael's LinkedIn URL
- **joined_via**: direct

## Step 4: Verify Pages Work

After inserting, confirm:
- `/agencies/jerusalem-real-estate` loads the agency profile page with logo, description, team member (Michael)
- `/agents/{agent-id}` loads Michael's agent profile with bio, photo, agency link

## What's Next (after this plan)

You'll share 3 listing screenshots/URLs from their site, and I'll create those as properties assigned to Michael -- so the full demo shows listings with Market Intelligence, cost breakdowns, and all BuyWise features.

---

## Technical Notes

- No schema migrations needed -- both tables already exist with all required columns
- Agency status set to "approved" so it renders publicly without admin review
- Agent status set to "approved" for the same reason
- `user_id` on agent left as NULL since this is a demo profile (no real login account)
- Images uploaded to `property-images` bucket (already public)

