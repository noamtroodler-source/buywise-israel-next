

# Enrich Erez Listings: Addresses + Agent Avatars

## 1. Upload Agent Avatar Photos

Upload the two provided photos to the `property-images` storage bucket (it's public) and update the agent records:

- **Guy Erez** (`8dd585fe-...`) — first photo (white shirt)
- **Anna Levenson** (`82e4ebb9-...`) — second photo (beige blazer)

Technical: Copy images to project assets, then use an edge function to upload to storage and update `agents.avatar_url`.

## 2. Assign Realistic Addresses to 38 Listings

Create a temporary edge function `enrich-erez-addresses` that assigns real Tel Aviv street addresses based on neighborhood + property characteristics, using streets from `sold_transactions` data:

| Neighborhood | Streets to use |
|---|---|
| Bavli | Sanhedrin, Dvora HaNevi'a |
| Old North | Nordau, Yehoshua Bin Nun, Jabotinsky |
| Lev HaIr / Lev HaIr North | Frischmann, Shenkin, Dizengoff |
| Kerem HaTeimanim | Nahman, Yehuda HaYamit |
| Neve Tzedek | Pines, Shabazi |
| Florentin | Florentin, Vital |
| Jaffa | Yefet, Olei Tziyon |
| Central Tel Aviv | Rothschild, Allenby, HaYarkon |
| Old North - North | Ben Yehuda, Arlozorov |
| HaRishonim | HaRishonim |

Logic: Each listing gets a street name appropriate to its neighborhood + a realistic house number (even numbers, range 2-120). The function deterministically assigns based on property ID hash to avoid duplicates.

## 3. Fix the 5 Listings That Already Have Partial Addresses

- "Herbert Samuel Reef" → "Herbert Samuel 42" (proper format)
- "Ibn Gabirol" → "Ibn Gabirol 38"
- "Old North - North" → "Nordau 64" (was using neighborhood as address)
- "Frischmann Corner" → "Frischmann 22"
- "Pines" → "Pines 8"

## Execution Order

1. Copy avatar images into project, create edge function to upload to storage + update agent avatar_url
2. Create `enrich-erez-addresses` edge function with neighborhood→street mapping
3. Deploy, invoke, verify, delete both functions

