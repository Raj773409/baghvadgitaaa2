# Project Eternal — Bhagavad Gita Vishwa Mahotsav 2027

**Creative Direction:** The Living Architecture  
**Initial Interface Languages:** English (`en`), Hindi (`hi`), Telugu (`te`)  
**Official Reference:** https://bhagavadgitavishwamahotsav.com/

## Overview

This application establishes the architectural design system, 3D visual environments, multilingual foundation, and responsive homepage for **Bhagavad Gita Vishwa Mahotsav 2027**.

### Implemented Homepage Architecture

1. **Announcement Strip & Architectural Header** (`Header.tsx`, `MobileNavigation.tsx`) — Sticky warm-ivory transition on scroll, single-row 3-zone desktop header, dedicated mobile drawer with 48px touch targets, and immediate `EN / हिं / తె` language switcher.
2. **The Living Architecture 3D Hero** (`ArchitecturalHero.tsx`, `HeroEnvironment.tsx`) — Procedural Three.js sandstone colonnade with stepped `LatheGeometry` plinths, beveled `ExtrudeGeometry` capitals, `RoomEnvironment` IBL, warm directional daylight, horizon fog, dust motes, and automatic mobile/reduced-motion/software-WebGL graceful fallback (`HeroSceneFallback.tsx`).
3. **Official Event Identity** (`EventIntroduction.tsx`) — Presents the 18-part global theme (`18 Countries · 18 Chapters · 18 Languages · One Gita`) and the static `50,000+` published participant statement.
4. **The Eternal Message** (`EternalMessage.tsx`) — Asymmetric museum-editorial layout with GSAP ScrollTrigger depth reveals and figure captions.
5. **Eighteen Chapters Explorer** (`ChapterExplorer.tsx`) — Original eighteen-fold radial architectural dial (`01`–`18`) with Framer Motion transitions and reserved slots for verified Sanskrit verses, translations, commentaries, and recitation audio.
6. **Global Journey 3D Armillary Earth** (`GlobalJourney.tsx`, `GlobalJourneyGlobe.tsx`) — Interactive Three.js globe plotting the 18 officially published participating countries with click-to-focus beacons and an accessible 18-country directory.
7. **Event Timeline** (`EventTimeline.tsx`) — Displays only the two published milestones (`20 December 2026 — Curtain Raiser` and `27 February 2027 — Main Mahotsav`).
8. **Content-Driven Institutional Slots** (`LeadershipSection.tsx`, `PartnershipSection.tsx`, `MediaSection.tsx`) — Structured to display verified dignitaries, partners, and media strictly after written organizer approval, without fabricated people, brands, or press items.
9. **Participation & Institutional Footer** (`ParticipationSection.tsx`, `Footer.tsx`) — Connects registration CTAs directly to `https://bhagavadgitavishwamahotsav.com/participate/register` and provides accessible policy disclosure modals.

## Verification Commands

```bash
npm install
npx --yes tsx --test src/utils/geodesy.test.ts src/utils/chapters.test.ts src/utils/i18nHelpers.test.ts
npm run lint
npm run build
```

## Pending Client Assets & Approvals

See `ASSET_GUIDE.md` and `CONTENT_APPROVAL.md` for the complete checklist of official logos, Blender GLB/GLTF architectural models, verified scripture texts, native-speaker translation sign-offs, and leadership records required prior to public launch.
