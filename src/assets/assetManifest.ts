import heroCulturalPavilion from './images/hero_pavilion_sunset_desktop_1794641953472.jpg';
import heroCulturalPavilionMobile from './images/hero_pavilion_sunset_mobile_1794641952647.jpg';
import heroKurukshetraDialogue from './images/hero_kurukshetra_dialogue_1794684327214.jpg';
import heroVishvarupaVision from './images/hero_vishvarupa_vision_1794684329228.jpg';
import heroAncientTempleSanctum from './images/hero_ancient_temple_sanctum_1794684328005.jpg';
import eternalPavilionAtrium from './images/eternal_pavilion_atrium_1794639529424.jpg';
import twilightSanctumBasin from './images/twilight_sanctum_basin_1794639530747.jpg';
import manuscriptCraftDetail from './images/manuscript_craft_detail_1794633937480.jpg';
import eternalGitaVolume from './images/eternal_gita_volume_1794640255693.jpg';
import ivoryMountainMist from './images/ivory_mountain_mist_1794640256022.jpg';
import registrationSanctumBg from './images/registration_sanctum_bg_1794643936841.jpg';
import registrationKurukshetraMobile from './images/registration_kurukshetra_mobile_1794643936981.jpg';
import cultureSaraswatiHeritage from './images/culture_saraswati_heritage_1794684330913.jpg';
import cultureLakshmiHeritage from './images/culture_lakshmi_heritage_1794684330220.jpg';
import cultureDurgaHeritage from './images/culture_durga_heritage_1794684330017.jpg';
import heroYouthGitaForum from './images/hero_youth_gita_forum_1794734994483.jpg';
import heroGlobalParayanaSanctum from './images/hero_global_parayana_sanctum_1794734994800.jpg';
import lordKrishnaPortrait from './images/lord_krishna_devotional_portrait_1794747546478.jpg';
import openBhagavadGitaBook from './images/open_bhagavad_gita_book_1794747546875.jpg';
import kurukshetraSacredBattlefield from './images/kurukshetra_sacred_battlefield_1794747546301.jpg';
import krishnaTeachingArjuna from './images/krishna_teaching_arjuna_1794747547380.jpg';

export interface ArchitecturalAsset {
  id: string;
  src: string;
  altKey: string;
  aspectRatio: '16:9' | '4:3' | '3:4';
  role: 'hero-primary' | 'hero-mobile' | 'hero-fallback' | 'editorial-study' | 'closing-sanctum' | 'atmosphere' | 'cultural-heritage';
  approvalStatus: 'commissioned-concept';
}

/**
 * Central Asset Manifest
 * Official event/partner logos and approved event photography are intentionally
 * kept null until supplied and signed off in CONTENT_APPROVAL.md.
 */
export const ASSET_MANIFEST = {
  officialEventLogo: null as string | null,
  officialOrganizationLogos: [] as Array<{ id: string; name: string; src: string }>,
  visualStudies: {
    heroPavilion: {
      id: 'hero-cultural-pavilion',
      src: heroCulturalPavilion,
      altKey: 'assets.heroPavilionAlt',
      aspectRatio: '16:9',
      role: 'hero-primary',
      approvalStatus: 'commissioned-concept',
    } satisfies ArchitecturalAsset,
    heroPavilionMobile: {
      id: 'hero-cultural-pavilion-mobile',
      src: heroCulturalPavilionMobile,
      altKey: 'assets.heroPavilionAlt',
      aspectRatio: '3:4',
      role: 'hero-mobile',
      approvalStatus: 'commissioned-concept',
    } satisfies ArchitecturalAsset,
    heroKurukshetraDialogue: {
      id: 'hero-kurukshetra-dialogue',
      src: heroKurukshetraDialogue,
      altKey: 'assets.heroKurukshetraAlt',
      aspectRatio: '16:9',
      role: 'hero-primary',
      approvalStatus: 'commissioned-concept',
    } satisfies ArchitecturalAsset,
    heroVishvarupaVision: {
      id: 'hero-vishvarupa-vision',
      src: heroVishvarupaVision,
      altKey: 'assets.heroVishvarupaAlt',
      aspectRatio: '16:9',
      role: 'hero-primary',
      approvalStatus: 'commissioned-concept',
    } satisfies ArchitecturalAsset,
    heroAncientTempleSanctum: {
      id: 'hero-ancient-temple-sanctum',
      src: heroAncientTempleSanctum,
      altKey: 'assets.heroTempleSanctumAlt',
      aspectRatio: '16:9',
      role: 'hero-primary',
      approvalStatus: 'commissioned-concept',
    } satisfies ArchitecturalAsset,
    eternalGitaVolume: {
      id: 'eternal-gita-volume',
      src: eternalGitaVolume,
      altKey: 'assets.eternalGitaVolumeAlt',
      aspectRatio: '16:9',
      role: 'editorial-study',
      approvalStatus: 'commissioned-concept',
    } satisfies ArchitecturalAsset,
    ivoryMountainMist: {
      id: 'ivory-mountain-mist',
      src: ivoryMountainMist,
      altKey: 'assets.ivoryMountainMistAlt',
      aspectRatio: '16:9',
      role: 'atmosphere',
      approvalStatus: 'commissioned-concept',
    } satisfies ArchitecturalAsset,
    sandstoneGallery: {
      id: 'study-pavilion-atrium',
      src: eternalPavilionAtrium,
      altKey: 'assets.sandstoneGalleryAlt',
      aspectRatio: '16:9',
      role: 'editorial-study',
      approvalStatus: 'commissioned-concept',
    } satisfies ArchitecturalAsset,
    manuscriptCraft: {
      id: 'study-manuscript-craft',
      src: manuscriptCraftDetail,
      altKey: 'assets.manuscriptCraftAlt',
      aspectRatio: '4:3',
      role: 'editorial-study',
      approvalStatus: 'commissioned-concept',
    } satisfies ArchitecturalAsset,
    eveningSanctum: {
      id: 'study-twilight-sanctum',
      src: twilightSanctumBasin,
      altKey: 'assets.eveningSanctumAlt',
      aspectRatio: '16:9',
      role: 'closing-sanctum',
      approvalStatus: 'commissioned-concept',
    } satisfies ArchitecturalAsset,
    registrationSanctumBg: {
      id: 'registration-sanctum-bg',
      src: registrationSanctumBg,
      altKey: 'assets.registrationSanctumAlt',
      aspectRatio: '16:9',
      role: 'hero-primary',
      approvalStatus: 'commissioned-concept',
    } satisfies ArchitecturalAsset,
    registrationKurukshetraMobile: {
      id: 'registration-kurukshetra-mobile',
      src: registrationKurukshetraMobile,
      altKey: 'assets.registrationMobileAlt',
      aspectRatio: '3:4',
      role: 'hero-mobile',
      approvalStatus: 'commissioned-concept',
    } satisfies ArchitecturalAsset,
    cultureSaraswatiHeritage: {
      id: 'culture-saraswati-heritage',
      src: cultureSaraswatiHeritage,
      altKey: 'assets.cultureSaraswatiAlt',
      aspectRatio: '4:3',
      role: 'cultural-heritage',
      approvalStatus: 'commissioned-concept',
    } satisfies ArchitecturalAsset,
    cultureLakshmiHeritage: {
      id: 'culture-lakshmi-heritage',
      src: cultureLakshmiHeritage,
      altKey: 'assets.cultureLakshmiAlt',
      aspectRatio: '4:3',
      role: 'cultural-heritage',
      approvalStatus: 'commissioned-concept',
    } satisfies ArchitecturalAsset,
    cultureDurgaHeritage: {
      id: 'culture-durga-heritage',
      src: cultureDurgaHeritage,
      altKey: 'assets.cultureDurgaAlt',
      aspectRatio: '4:3',
      role: 'cultural-heritage',
      approvalStatus: 'commissioned-concept',
    } satisfies ArchitecturalAsset,
    heroYouthGitaForum: {
      id: 'hero-youth-gita-forum',
      src: heroYouthGitaForum,
      altKey: 'assets.heroYouthGitaAlt',
      aspectRatio: '16:9',
      role: 'hero-primary',
      approvalStatus: 'commissioned-concept',
    } satisfies ArchitecturalAsset,
    heroGlobalParayanaSanctum: {
      id: 'hero-global-parayana-sanctum',
      src: heroGlobalParayanaSanctum,
      altKey: 'assets.heroGlobalParayanaAlt',
      aspectRatio: '16:9',
      role: 'hero-primary',
      approvalStatus: 'commissioned-concept',
    } satisfies ArchitecturalAsset,
    lordKrishnaPortrait: {
      id: 'lord-krishna-devotional-portrait',
      src: lordKrishnaPortrait,
      altKey: 'assets.lordKrishnaPortraitAlt',
      aspectRatio: '4:3',
      role: 'cultural-heritage',
      approvalStatus: 'commissioned-concept',
    } satisfies ArchitecturalAsset,
    openBhagavadGitaBook: {
      id: 'open-bhagavad-gita-book',
      src: openBhagavadGitaBook,
      altKey: 'assets.openBhagavadGitaBookAlt',
      aspectRatio: '4:3',
      role: 'editorial-study',
      approvalStatus: 'commissioned-concept',
    } satisfies ArchitecturalAsset,
    kurukshetraSacredBattlefield: {
      id: 'kurukshetra-sacred-battlefield',
      src: kurukshetraSacredBattlefield,
      altKey: 'assets.kurukshetraSacredBattlefieldAlt',
      aspectRatio: '4:3',
      role: 'cultural-heritage',
      approvalStatus: 'commissioned-concept',
    } satisfies ArchitecturalAsset,
    krishnaTeachingArjuna: {
      id: 'krishna-teaching-arjuna',
      src: krishnaTeachingArjuna,
      altKey: 'assets.krishnaTeachingArjunaAlt',
      aspectRatio: '4:3',
      role: 'cultural-heritage',
      approvalStatus: 'commissioned-concept',
    } satisfies ArchitecturalAsset,
  },
} as const;
