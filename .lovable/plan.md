

## Plan: Add Neighborhoods to All Mock Projects

### Problem
All projects in the database have `neighborhood` set to `null`. The listing cards already display neighborhood when present (`{project.neighborhood ? ... : ''}`) — the data is simply missing.

### Solution

**Single database migration** to update all mock projects with appropriate neighborhood values based on their city. Each city's projects will get realistic neighborhood assignments:

- Jerusalem: Baka, Rehavia, German Colony
- Tel Aviv: Florentin, Neve Tzedek, Rothschild
- Herzliya: Herzliya Pituach, Marina, City Center
- Haifa: Carmel Center, Ahuza, Bat Galim
- Netanya: Ir Yamim, City Center, South Beach
- Ra'anana: North Ra'anana, City Center
- Modiin: Buchman, Moriah, Aviv
- Beit Shemesh: Ramat Beit Shemesh Aleph, Sheinfeld
- Beer Sheva: Old City, Neve Noy
- etc.

This is a data-only fix — no component changes needed since all card components (Projects.tsx, ProjectCarousel, MapProjectCard, etc.) already render neighborhood when available.

### Implementation
1. Run a SQL migration with UPDATE statements mapping each project by name/city to a neighborhood value
2. No code changes required — existing conditional rendering handles it

