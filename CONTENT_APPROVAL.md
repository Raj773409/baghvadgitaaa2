# Content Verification & Client Approval Register

This build strictly enforces zero fabrication across scripture, leadership, sponsors, participation numbers, and event schedules.

## 1. Content Verification Notes

- **50,000+ Participant Statement**: Rendered statically in `EventIntroduction.tsx` (never as an animated counter). **Action required:** Organizers must confirm in writing whether `50,000+` represents a projected attendance target or confirmed registration figure.
- **Hindi (`hi.json`) & Telugu (`te.json`) Interface Translations**: Draft translations cover UI labels, navigation, and structural notices only. **Action required:** Native-speaker editorial review and written approval before production launch.
- **Eighteen Chapters (`src/utils/chapters.ts`)**: Chapters `01`–`18` render numbered architectural identifiers and reserved slots only. **Action required:** Supply independently verified Sanskrit Devanagari verses, approved translations, scholarly commentaries, and approved audio recordings.
- **Participating Countries (`src/content/countryContent.ts`)**: Strictly lists the 18 countries published on `bhagavadgitavishwamahotsav.com` with zero invented participant counts, representative names, or language mappings.
- **Published Milestones (`src/content/eventContent.ts`)**: Displays only `20 December 2026 — Curtain Raiser` and `27 February 2027 — Main Mahotsav`. Venue names, timings, and additional sub-programs remain unpublished until signed off.

## 2. Client Sign-Off Checklist

- [ ] Official event logo, crest, and organizational branding marks
- [ ] Architectural visual direction & color tokens (`tokens.css`)
- [ ] Official tagline and introductory prose
- [ ] Clarification of `50,000+` participant statement meaning
- [ ] Country-level stories, host cities, and photography
- [ ] Native-speaker sign-off on Hindi (`hi`) and Telugu (`te`) UI copy
- [ ] Independently verified Sanskrit verses, translations, and commentaries
- [ ] Organizing leadership, advisory council, and dignitary roster & portraits
- [ ] Chief Minister / public protocol details (if applicable)
- [ ] Institutional partners and approved sponsor logos
- [ ] Official event venues, times, and detailed program schedule
- [ ] Media gallery usage rights, press kit PDFs, and video assets
- [ ] Legal review of Privacy Policy, Terms & Conditions, and Refund Policy
- [ ] Registration portal integration or migration sign-off
