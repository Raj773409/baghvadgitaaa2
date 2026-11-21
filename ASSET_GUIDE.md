# Asset Production & Integration Guide

All central asset slots are managed in `src/assets/assetManifest.ts`.

## 1. Current Commissioned Visual Studies (Active in Preview)

Generated museum-grade architectural studies currently bundled for preview and fallback surfaces:

- `arch_sandstone_gallery_1794633937042.jpg` — 16:9 colonnade daylight study (`HeroSceneFallback`, `EternalMessage`, `MediaSection`).
- `manuscript_craft_detail_1794633937480.jpg` — 4:3 carved sandstone relief, parchment, and antique bronze study (`EternalMessage`, `MediaSection`).
- `arch_evening_sanctum_1794633938163.jpg` — 16:9 dusk courtyard study (`ParticipationSection`, `MediaSection`).

## 2. Procedural 3D Assets (Active in Preview)

- `src/three/architecturalColonnade.ts` — Multi-part sandstone colonnade, `LatheGeometry` plinths, beveled `ExtrudeGeometry` capitals, reflective water channel, and sunlit dust motes.
- `src/three/earthGlobe.ts` — Procedural cartographic Earth sphere (`CanvasTexture`), bronze graticule, Fresnel rim shader, armillary rings, and 18 country beacons.

## 3. Official Assets Pending Organizer Delivery

| Asset Slot | Target Path / Manifest Key | Preferred Format | Priority |
|---|---|---|---|
| Official Event Logo | `ASSET_MANIFEST.officialEventLogo` | SVG / Transparent PNG | Critical |
| Organization Logos | `ASSET_MANIFEST.officialOrganizationLogos` | SVG / Transparent PNG | Critical |
| Commissioned 3D Environment | `ASSET_MANIFEST.hero3DModelGlb` | Draco-compressed GLB/GLTF | High |
| Official Event Photography | `src/assets/images/official/` | WebP / AVIF | High |
| Leadership Portraits | `APPROVED_LEADERSHIP_RECORDS` | Approved WebP (3:4) | Later |
| Partner Logos | `APPROVED_PARTNER_RECORDS` | Monochrome / Full SVG | Later |
| Official Videos | Streaming URLs / MP4 | HLS / MP4 (no autoplay) | Later |

## 4. Replacing the Hero 3D Environment

`src/components/hero/HeroEnvironment.tsx` is isolated from `HeroContent.tsx` and `ArchitecturalHero.tsx`. To introduce an approved Blender `.glb` model:
1. Load the `.glb` via Three.js `GLTFLoader` + `DRACOLoader` inside `HeroEnvironment.tsx`.
2. Preserve `RoomEnvironment` PMREM lighting, `ACESFilmicToneMapping`, and the `isSoftwareGl` guard.
3. Keep `HeroSceneFallback.tsx` active for mobile viewports (`< 768px`) and `prefers-reduced-motion: reduce`.
