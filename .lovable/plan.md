

# Mock Blog Posts for Professionals Demo

## Overview

Delete all existing blog posts (53 total) and create new mock blog posts authored by the existing agents, developers, and agencies in the database. This will showcase how different professionals can contribute content to the blog.

## Current State

| Entity | Count Available | Status |
|--------|-----------------|--------|
| Agents | 10+ active | Ready to use |
| Developers | 8 active | Ready to use |
| Agencies | 10+ active | Ready to use |
| Existing Blog Posts | 53 | Will be deleted |
| Blog Categories | 10 | Will be used |

## Implementation Plan

### Step 1: Delete Existing Blog Posts

Remove all current blog posts to start fresh:

```sql
DELETE FROM blog_posts;
```

Also delete any saved articles references:

```sql
DELETE FROM saved_articles;
```

### Step 2: Create Mock Blog Posts

Create 15-20 professional blog posts distributed across:

| Author Type | Posts | Example Authors |
|-------------|-------|-----------------|
| Agent | 6 posts | Ayelet Weiss, Moshe Gross, Yael Peretz |
| Developer | 6 posts | Azrieli Development, Shikun & Binui, Gindi Holdings |
| Agency | 6 posts | Anglo Israel Properties, Jerusalem Heritage Realty, Central Israel RE |

### Step 3: Blog Post Content Themes

Each professional type will have relevant content:

**Agent Posts:**
- "My Top 5 Tips for First-Time Buyers in Tel Aviv"
- "What I Wish Clients Knew Before Their Property Search"
- "Navigating Bidding Wars: An Agent's Perspective"
- "The Most Common Questions I Get from Olim Buyers"
- "How to Spot a Good Investment Property"
- "Why Location Research Matters More Than You Think"

**Developer Posts:**
- "Behind the Scenes: How We Design Modern Israeli Living"
- "Sustainability in Israeli Construction: Our Approach"
- "What Makes a Premium Development Stand Out"
- "The Future of Urban Living in Israel"
- "Our Process: From Blueprint to Move-In Ready"
- "Why We Focus on Family-Friendly Communities"

**Agency Posts:**
- "Market Report: Q4 Trends Across Israel"
- "How Our Team Evaluates Properties for Clients"
- "The Anglo Buyer's Complete Guide to Israeli Real Estate"
- "Investment Strategies for 2024 and Beyond"
- "Understanding Israeli Property Law: Key Points"
- "Why Working with an Agency Matters"

### Step 4: Blog Post Fields

Each post will include:

- **title**: Professional, market-relevant title
- **slug**: URL-friendly version
- **excerpt**: 1-2 sentence summary
- **content**: 3-4 paragraphs of placeholder content
- **cover_image**: High-quality Unsplash images
- **category_id**: Mapped to existing categories
- **author_type**: 'agent', 'developer', or 'agency'
- **author_profile_id**: UUID of the actual professional
- **is_published**: true
- **verification_status**: 'approved' (for display)
- **published_at**: Distributed over past 2 months
- **city**: Relevant Israeli city
- **audiences**: Array like ['investors', 'olim', 'first-time-buyers']
- **reading_time_minutes**: 3-8 minutes
- **views_count**: Random 50-500

## Data Distribution

```text
┌─────────────────────────────────────────────────────────────┐
│                    18 Mock Blog Posts                        │
├─────────────────────────────────────────────────────────────┤
│  AGENTS (6)          DEVELOPERS (6)       AGENCIES (6)       │
│  ├─ Ayelet Weiss     ├─ Azrieli Group    ├─ Anglo Israel     │
│  ├─ Moshe Gross      ├─ Shikun & Binui   ├─ Jerusalem Herit. │
│  ├─ Yael Peretz      ├─ Gindi Holdings   ├─ Central Israel   │
│  ├─ Keren Shapiro    ├─ Africa Israel    ├─ Negev Living     │
│  ├─ Orly Rosen       ├─ Azorim Group     ├─ Mediterranean    │
│  └─ Dan Friedman     └─ Tidhar Group     └─ Gush Dan Realty  │
└─────────────────────────────────────────────────────────────┘
```

## Categories Used

- Market Insights
- Investment Tips
- Buying Guide
- Neighborhood Guides
- Living in Israel
- Legal & Finance

## Expected Result

After implementation:
- Blog page shows 18 diverse articles
- Each article displays author name, photo, and type
- Clicking author name goes to their professional profile
- Mix of topics relevant to each professional's expertise
- Realistic publication dates and view counts

## Files Modified

No code changes required - this is data-only via SQL inserts.

