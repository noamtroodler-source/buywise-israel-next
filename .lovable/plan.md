

## Logo Implementation Plan

### What we have
- **Uploaded logo**: `user-uploads://og-image.png` — the new BuyWise Israel logo
- **Previously generated previews**: `src/assets/logo-icon-preview.png` (square icon mark) and `src/assets/logo-full-transparent-preview.png` (full transparent logo)
- **Current branding**: Generic blue square with Lucide `Home` icon in Header and Footer

### What needs to change

#### 1. Copy logo files to public directory
- Copy `user-uploads://og-image.png` → `public/og-image.png` (OG/social share image)
- Copy icon mark preview → `public/icon-192.png` and `public/icon-512.png` (PWA icons)
- Copy icon mark preview → `public/apple-touch-icon.png`

#### 2. Update favicon in `index.html`
- Replace current favicon reference to point to the new logo icon

#### 3. Update Header logo (`src/components/layout/Header.tsx`)
- Replace the blue square + Home icon with an `<img>` tag using the icon mark from `src/assets/logo-icon-preview.png`
- Keep the "BuyWise Israel" text beside it

#### 4. Update Footer logo (`src/components/layout/Footer.tsx`)
- Same change — replace Home icon with the logo icon mark image

#### 5. Update email templates (all 15+ edge functions)
- Add a logo image header to the shared `brandFooter` pattern and email HTML across all edge functions
- Host the logo in a publicly accessible location (the OG image URL or upload to storage)
- Add an `<img>` tag at the top of each email body referencing the hosted logo

**Edge functions with email HTML to update:**
- `send-inquiry-confirmation`
- `send-welcome-email`
- `send-notification`
- `send-developer-notification`
- `send-agency-notification`
- `send-digest-email`
- `send-price-drop-alert`
- `send-verification-email`
- `contact-form-notify`
- `enterprise-inquiry-notify`
- `process-retention-emails`
- `process-search-alerts`
- `check-trial-expirations`
- `stripe-webhook`

#### 6. Update `manifest.json`
- Already references `icon-192.png` and `icon-512.png` — these files will be replaced with the new icon mark

### Technical approach
- For emails: Create a shared logo header snippet that all email functions can include at the top of their HTML, showing the BuyWise Israel logo centered above the content
- For the site: Use `<img>` tags with the icon mark asset, sized to match current 36px (h-9 w-9) dimensions
- The OG image stays as-is (full logo with white background works well for social cards)

