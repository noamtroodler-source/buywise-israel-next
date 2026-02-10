

# Insert Mock Trusted Professionals Data

Populate the `trusted_professionals` table with 12 realistic mock firms (4 per category) to fill out the directory page.

---

## Data Overview

### Lawyers (4 firms)
1. **Cohen, Levy & Partners** -- Full-service real estate law firm specializing in residential purchases for English-speaking buyers. Languages: English, Hebrew. Cities: Jerusalem, Tel Aviv, Haifa.
2. **Adv. Sarah Goldstein** -- Independent attorney focused on property due diligence and contract negotiation for North American olim. Languages: English, Hebrew, French. Cities: Tel Aviv, Herzliya, Netanya.
3. **Shapira Legal Group** -- Handles title registration, land authority procedures, and cross-border property transactions. Languages: English, Hebrew, Russian. Cities: Tel Aviv, Bat Yam, Ashdod.
4. **Ben-David & Associates** -- Boutique firm advising international investors on Israeli property law, zoning, and commercial acquisitions. Languages: English, Hebrew, Spanish. Cities: Jerusalem, Modi'in, Beit Shemesh.

### Mortgage Brokers (4 firms)
1. **Israel Mortgage Advisors** -- Independent brokerage comparing rates across all major Israeli banks for foreign residents and new immigrants. Languages: English, Hebrew. Cities: Nationwide.
2. **FirstHome Finance** -- Specializes in first-time buyer mortgages, guiding clients through Bank of Israel regulations and documentation. Languages: English, Hebrew, French. Cities: Tel Aviv, Jerusalem, Haifa.
3. **Global Lending IL** -- Helps non-resident buyers secure Israeli mortgages, including foreign income documentation and currency planning. Languages: English, Hebrew, Russian. Cities: Nationwide.
4. **Aliyah Mortgage Solutions** -- Focused exclusively on olim mortgage rights, toshav chozer benefits, and government grants. Languages: English, Hebrew, Spanish. Cities: Nationwide.

### Accountants & Tax Advisors (4 firms)
1. **Katz & Co. Accounting** -- Advises international buyers on purchase tax brackets, capital gains obligations, and cross-border tax treaties. Languages: English, Hebrew. Cities: Tel Aviv, Jerusalem.
2. **Stern Tax Advisory** -- Specializes in US-Israel dual tax filing, FBAR/FATCA compliance, and property investment structuring. Languages: English, Hebrew. Cities: Tel Aviv, Herzliya.
3. **Levi Financial Partners** -- Full-service accounting for property investors covering VAT, rental income reporting, and entity structuring. Languages: English, Hebrew, French. Cities: Jerusalem, Haifa, Netanya.
4. **Dvora Mizrachi, CPA** -- Independent tax advisor helping UK and EU nationals navigate Israeli property taxation and treaty benefits. Languages: English, Hebrew, German. Cities: Tel Aviv, Ra'anana.

---

## Technical Details

A single SQL INSERT statement will be executed via the data insertion tool (not a migration, since this is data, not schema). Each row includes:
- Unique slug (e.g., `cohen-levy-partners`)
- Category enum value
- Short description (1-2 sentences, factual tone)
- Long description (2-3 paragraphs for the detail page)
- Specializations array
- Cities covered array
- Contact info (mock emails, phones, websites)
- `works_with_internationals: true` for all
- `is_published: true`
- `display_order` for consistent ordering

