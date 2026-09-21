# Safe Communities & GBV Response

**Help, hope, and safety for South Africa.**

A responsive PWA that helps people quickly reach emergency help and verified GBV/child-protection support in South Africa, share their live location with trusted contacts, and provides a kid-friendly experience for young people (ages ~6–17).

---

## ⚠️ Critical Notices

### Emergency Numbers Must Be Re-verified Before Launch
All phone numbers in the `emergency_contacts` table were seeded with `last_verified_at = now()` at the time of migration. **Before any real-world deployment, every number must be manually verified by calling it and confirming:**

- The number is still active
- The service description is accurate
- The hours of operation are current
- The languages listed are still supported
- USSD codes and SMS keywords still work

### Support Service Coordinates Are Approximate
The seed data for `support_services` (police stations, Thuthuzela Care Centres, shelters, clinics) contains **approximate coordinates** for major cities. These must be replaced with precise, verified locations before launch.

### This App Does NOT Replace Human Services
This app **never** decides whether an allegation is genuine, diagnoses, or makes safeguarding decisions. It always routes to real people — SAPS, Childline, GBV Command Centre, Thuthuzela Care Centres, and other verified services.

### POPIA and Children's Data
This app collects data from children (under-18s) in Young Person Mode. Under POPIA (Protection of Personal Information Act), special protections apply to children's personal information. **The project owners must obtain legal review from a qualified POPIA practitioner before any real-world deployment.** Key considerations:

- **Data minimisation**: Young Person Mode stores trusted contacts ONLY on the device (encrypted local storage/IndexedDB). No account, name, or email is required.
- **No unnecessary collection**: The app does not collect analytics that identify children.
- **Mandatory reporting**: Under the Children's Act (Act 38 of 2005), certain professionals have mandatory reporting obligations for child abuse. The app facilitates contact with reporting services but does not make reporting decisions. **Project owners must review mandatory-reporting considerations with a qualified professional.**

---

## Phase 1 — What Was Built

### 1. Project Scaffold
- React + TypeScript + Vite + Tailwind CSS
- React Router for navigation
- i18next for internationalisation (English fully translated; isiZulu, isiXhosa, Afrikaans, Sesotho stubbed)
- PWA manifest, service worker, and offline caching for the emergency directory
- Supabase client configured with environment variables

### 2. Database (Supabase / PostgreSQL)
Two tables created with Row Level Security:

| Table | Purpose | RLS |
|---|---|---|
| `emergency_contacts` | Helpline / emergency phone numbers | SELECT open to anon + authenticated (public directory); writes restricted to authenticated |
| `support_services` | Physical service locations (police, shelters, clinics, Thuthuzela) with lat/lng | SELECT open to anon + authenticated; writes restricted to authenticated |

**Seed data**: 10 emergency contacts (112, 10111, 10177, GBV Command Centre, Stop Gender Violence, Childline, Lifeline, SADAG, Crime Stop, Human Trafficking) and 8 sample support services.

### 3. Landing Page
- Two large cards: **Adult Mode** (calm teal/navy palette) and **Young Person Mode** (friendly cream/blue palette)
- Language selector: English, isiZulu, isiXhosa, Afrikaans, Sesotho
- Persistent **Quick Exit** button (visible on every screen) — also triggered by pressing **Escape twice**
- Lightweight and low-data: minimal assets, system fonts with progressive font loading

### 4. Emergency Directory
- Tap-to-call using `tel:` links
- Search by name, description, or number
- Filter by category (general, police, medical, GBV, child, mental, trafficking)
- Shows free-call badge, hours, languages, USSD/SMS codes, verification date
- **Offline-capable**: contacts are cached in localStorage; if the network fails, cached contacts load with an "offline" notice
- Error state with retry button

### 5. Adult Mode Shell
- Professional, high-contrast teal/navy design
- Always-visible SOS button (links to emergency directory)
- Menu grid: Emergency, Find Services, Share Location, Resources, Trusted Circle, Account
- Quick access to emergency directory
- Language selector

### 6. Young Person Mode Shell
- Kid-friendly design: big buttons (88px+ touch targets), rounded shapes, cream background
- Owl mascot greeting (configurable name, default "Sizwe")
- Four giant buttons: I Need Help (coral), I Don't Feel Safe (lavender), My Safe People (blue), Learn & Play (yellow)
- "How am I feeling today?" emoji check-in
- Always-visible "Talk to a real person" link to Childline 116
- No red screens, no alarming sounds, no shaming language

### 7. Design System
- Tailwind CSS with custom color tokens for both Youth and Adult palettes
- Typography: Nunito (headings), Atkinson Hyperlegible (body)
- WCAG 2.2 AA: keyboard navigation, focus states, screen-reader labels, `prefers-reduced-motion` respected
- Colour is never the only signal (icons + text labels accompany all colour-coded elements)

### 8. PWA
- Web app manifest with discreet app name
- Service worker for offline caching of the emergency directory
- Theme color and standalone display mode

---

## How to Run

```bash
npm install
npm run dev      # development server
npm run build     # production build
npm run typecheck # type checking
```

The Supabase database is pre-provisioned. Environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) are pre-populated.

---

## Architecture (Phase 1)

```
┌─────────────────────────────────────────────┐
│                   Browser / PWA              │
│                                              │
│  ┌─────────┐  ┌──────────┐  ┌──────────────┐ │
│  │ Landing │  │  Adult   │  │  Young Person│ │
│  │  Page   │  │   Mode   │  │    Mode      │ │
│  └────┬────┘  └────┬─────┘  └──────┬───────┘ │
│       │            │               │         │
│  ┌────▼────────────▼────────────────▼──────┐ │
│  │     Emergency Directory (offline)       │ │
│  └────────────────┬────────────────────────┘ │
│                   │                          │
│  ┌────────────────▼────────────────────────┐ │
│  │      Supabase Client (anon key)         │ │
│  └────────────────┬────────────────────────┘ │
└───────────────────┼──────────────────────────┘
                    │
┌───────────────────▼──────────────────────────┐
│              Supabase / PostgreSQL            │
│                                               │
│  ┌─────────────────┐  ┌────────────────────┐  │
│  │ emergency_      │  │  support_services  │ │
│  │ contacts (RLS)  │  │  (RLS)             │ │
│  └─────────────────┘  └────────────────────┘  │
└───────────────────────────────────────────────┘
```

---

## Security Decisions (Phase 1)

1. **Row Level Security**: Both tables have RLS enabled. SELECT is open to `anon, authenticated` (public directory data — no sign-in required for Phase 1). INSERT/UPDATE/DELETE restricted to `authenticated` (future admin role).
2. **Quick Exit**: Clears the screen by redirecting to a neutral site (Google weather search). Also triggered by pressing Escape twice. This protects users who may be in an abusive situation where someone might check their screen.
3. **Discreet Mode**: The PWA manifest uses a neutral app name ("SafeComm") and generic icon. Future phases will add a user-toggled discreet mode.
4. **No PII in Phase 1**: The app does not collect any personal information. No accounts, no names, no emails. Young Person Mode stores trusted contacts only on the device.
5. **Offline Caching**: Emergency contacts are cached in localStorage so they work without a network connection. The cache is updated when a connection is available.
6. **HTTPS Only**: The app is designed to run over HTTPS (enforced by the hosting platform). The service worker only works over HTTPS.

---

## Threat Model (Summary)

### Abuser-with-Device-Access Risk
This is a primary threat for GBV/child-safety apps. An abuser may have physical access to the survivor's/child's phone.

**Mitigations in Phase 1:**
- Quick Exit button (visible on every screen, also Escape x2)
- Discreet PWA manifest name and icon
- No browsing-history hints (the app uses a single-page architecture; URLs are generic like `/adult` or `/youth`)
- No push notifications that reveal content (Phase 1 has no notifications)

**Future phases will add:**
- Discreet mode toggle (neutral app name/icon change)
- No content in notifications
- Session timeout and PIN lock
- Browsing-history cleanup guidance

### Data Exposure Risk
- All data in Phase 1 is public directory data (emergency numbers, service locations). No user PII is stored server-side.
- Young Person Mode trusted contacts are stored ONLY on the device.
- Location data (Phase 2) will use hashed tokens, auto-expiring sessions, and coordinate deletion.

---

## Limitations

1. **Browser location tracking**: Browsers cannot reliably track location when the screen is off or the tab is in the background. Phase 2 will implement a Screen Wake Lock API where supported and show a clear warning. A future native app (React Native / Flutter) would be needed for true background location tracking.
2. **Feature phones**: The current web app requires a smartphone with a modern browser. A future USSD/SMS-only flow for feature phones is planned (Phase 6 roadmap).
3. **Language coverage**: Only English is fully translated. isiZulu, isiXhosa, Afrikaans, and Sesotho are stubbed and need translation by native speakers.
4. **Support service data**: Only 8 sample services are seeded. A comprehensive directory with verified locations must be built before launch.
5. **No accounts yet**: Phase 1 has no authentication. Accounts, roles (ADULT_USER, RESPONDER, ADMIN), and JWT auth are planned for Phase 4.

---

## Future Roadmap

| Phase | Scope |
|---|---|
| **Phase 2** | Live location sharing end-to-end (sender, public tracking page, SMS fallback + provider adapter, wake lock, SOS share) |
| **Phase 3** | Young Person Mode full build (I Need Help flow, I Don't Feel Safe, Safe People on-device, Learn & Play with lessons and badges, read-aloud, fake-call helper) |
| **Phase 4** | Adult Mode full build (services map with Leaflet, GBV incident reporting with encrypted fields, educational resources, Trusted Circle, accounts + JWT auth, PIN lock, discreet mode, data export/delete) |
| **Phase 5** | Responder/admin dashboard, security hardening, accessibility audit, tests (unit + integration + Playwright e2e) |
| **Phase 6** | Native app for background location, USSD/SMS-only flow for feature phones, full API docs, architecture diagram, screenshots |

---

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + React Router + i18next
- **Backend**: Supabase (PostgreSQL + RLS + Auth + Edge Functions)
- **PWA**: Service worker, web manifest, offline caching
- **Fonts**: Nunito (headings), Atkinson Hyperlegible (body) — loaded via Google Fonts with progressive enhancement
- **Icons**: Lucide React

---

## License

This project is designed for public benefit in South Africa. Licensing to be determined by project Nonkululeko Cikiso.
