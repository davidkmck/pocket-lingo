# Pocket Lingo: Play Store Monetization Roadmap

A zero-backend guide for packaging **Pocket Lingo** as a Progressive Web App (PWA) in a Trusted Web Activity (TWA) and enabling Google Play Billing.

---

## Phase 1: Accounts & Store Assets

- [ ] **Create Google Play Developer Account**
  - Register for an account via the Google Play Console ($25 one-time fee).
- [ ] **Prepare App Graphics & Copy**
  - **Icon:** High-resolution `512x512` PNG file.
  - **Screenshots:** At least 2–4 mobile screenshots demonstrating core features (phrase categories, custom phrase additions, text-to-speech audio).
  - **Store Descriptions:** Short summary (under 80 characters) and a full description highlighting offline functionality and travel utilities.

---

## Phase 2: TWA Packaging & Verification

- [ ] **Generate Android App Bundle (`.aab`)**
  - Run the deployed site URL through [PWABuilder](https://www.pwabuilder.com) or the `bubblewrap` CLI.
  - Set the package name (e.g., `com.davidkmck.pocketlingo`).
  - Generate and securely back up your keystore file (`.keystore` / `.jks`) and passwords.
- [ ] **Deploy Digital Asset Links**
  - Copy the generated `assetlinks.json` containing your SHA-256 fingerprint into `/.well-known/assetlinks.json`.
  - Push the file to GitHub Pages and verify it resolves publicly at `https://davidkmck.github.io/pocket-lingo/.well-known/assetlinks.json`.

---

## Phase 3: In-App Billing Integration

- [ ] **Configure In-App Product in Play Console**
  - Navigate to **Monetize > In-app products** in the Google Play Console.
  - Create a single non-consumable SKU (e.g., `premium_upgrade`), set the localized pricing, and activate it.
- [ ] **Enable Billing Logic**
  - Confirm `billing.js` correctly calls `service.acknowledge(purchaseToken, 'onetime')` to prevent automatic refunds after 3 days.
  - Uncomment the module script block in `index.html` to connect `initBilling()` and `makePurchase()`.
  - Ensure `billing.js` is included in the `sw.js` precache list for full offline support.

---

## Phase 4: Testing & Production Submission

- [ ] **Closed Testing (Alpha Track)**
  - Upload the `.aab` file to an internal/closed test track in the Play Console.
  - Test the Google Play purchase flow on a physical Android device using a test user account.
- [ ] **Publish Privacy Policy & Ratings**
  - Host a basic `PRIVACY.md` or HTML privacy policy page on GitHub Pages.
  - Complete the required Content Rating Questionnaire in the Play Console.
- [ ] **Submit for Production Review**
  - Roll out the tested build to the Production track for Google's review.
