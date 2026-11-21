import { ASSET_MANIFEST } from '../assets/assetManifest';

export type CulturalCategory =
  | 'all'
  | 'mahabharata'
  | 'devis'
  | 'temples'
  | 'manuscripts';

export interface CulturalArtworkItem {
  id: string;
  category: Exclude<CulturalCategory, 'all'>;
  title: string;
  description: string;
  language: string;
  copyright: string;
  source: string;
  altText: string;
  publicationStatus: 'Published · Visual Study' | 'Published · Curated Heritage';
  imageSrc: string;
  aspectRatio: '16:9' | '4:3';
  focalPoint?: string;
}

export const CULTURAL_HERITAGE_LIBRARY: ReadonlyArray<CulturalArtworkItem> = [
  {
    id: 'art-krishna-arjuna',
    category: 'mahabharata',
    title: 'Lord Krishna & Arjuna — The Chariot of Kurukshetra',
    description:
      'Depicts the timeless moment on Dharma-Kshetra Kurukshetra where Bhagavan Sri Krishna imparts eternal duty, equanimity, and selfless action to Arjuna.',
    language: 'Sanskrit · Multilingual Commentary',
    copyright: '© Project Eternal · Commissioned Classical Study',
    source: 'Kurukshetra Heritage Visual Archive',
    altText:
      'Classical museum oil painting of Lord Krishna imparting the wisdom of the Bhagavad Gita to Arjuna beside their chariot at dawn',
    publicationStatus: 'Published · Curated Heritage',
    imageSrc: ASSET_MANIFEST.visualStudies.heroKurukshetraDialogue.src,
    aspectRatio: '16:9',
  },
  {
    id: 'art-vishvarupa',
    category: 'mahabharata',
    title: 'Vishvarupa Darshana — Cosmic Harmony (Adhyaya XI)',
    description:
      'Reflects Chapter 11 of the Bhagavad Gita, illuminating cosmic unity where stars, time, and all living forms abide within one indivisible Reality.',
    language: 'Sanskrit · Cosmic Philosophy',
    copyright: '© Project Eternal · Commissioned Classical Study',
    source: 'Bhagavad Gita Chapter 11 Iconography Series',
    altText:
      'Sacred classical painting depicting the cosmic Vishvarupa form surrounded by golden astronomical rings',
    publicationStatus: 'Published · Curated Heritage',
    imageSrc: ASSET_MANIFEST.visualStudies.heroVishvarupaVision.src,
    aspectRatio: '16:9',
  },
  {
    id: 'art-saraswati',
    category: 'devis',
    title: 'Devi Saraswati — Wisdom, Sacred Speech & Arts',
    description:
      'Veneration of Devi Saraswati, presiding deity of Vedic learning, musical harmony, palm-leaf manuscripts, and lucid understanding.',
    language: 'Sanskrit · Telugu · Hindi · English',
    copyright: '© Project Eternal · Curated Devotional Series',
    source: 'Indian Classical Iconography Collection',
    altText:
      'Museum painting of Devi Saraswati seated upon an ivory lotus holding a veena and sacred manuscript',
    publicationStatus: 'Published · Curated Heritage',
    imageSrc: ASSET_MANIFEST.visualStudies.cultureSaraswatiHeritage.src,
    aspectRatio: '4:3',
  },
  {
    id: 'art-lakshmi',
    category: 'devis',
    title: 'Devi Lakshmi — Auspicious Grace & Prosperity',
    description:
      'Sacred lotus iconography honoring Devi Lakshmi as the radiance of dharma-aligned abundance, gratitude, and illumination of the home.',
    language: 'Sanskrit · Telugu · Hindi · English',
    copyright: '© Project Eternal · Curated Devotional Series',
    source: 'Indian Classical Iconography Collection',
    altText:
      'Classical painting of Devi Lakshmi seated on a blooming pink lotus above serene temple reflection waters lit by brass diyas',
    publicationStatus: 'Published · Curated Heritage',
    imageSrc: ASSET_MANIFEST.visualStudies.cultureLakshmiHeritage.src,
    aspectRatio: '4:3',
  },
  {
    id: 'art-durga',
    category: 'devis',
    title: 'Maa Durga — Sovereign Courage & Protection of Dharma',
    description:
      'Timeless temple art honoring Shakti Maa Durga in serene resolve beneath carved sandstone arches, embodying fearlessness and protection.',
    language: 'Sanskrit · Telugu · Hindi · English',
    copyright: '© Project Eternal · Curated Devotional Series',
    source: 'Indian Classical Iconography Collection',
    altText:
      'Classical painting of Maa Durga beneath a carved Indian sandstone temple arch with her peaceful lion companion',
    publicationStatus: 'Published · Curated Heritage',
    imageSrc: ASSET_MANIFEST.visualStudies.cultureDurgaHeritage.src,
    aspectRatio: '4:3',
  },
  {
    id: 'art-ancient-temple',
    category: 'temples',
    title: 'Ancient Carved Sandstone Mandapa',
    description:
      'Architectural study highlighting monolithic lotus-capital pillars, hanging bronze lamps, and living Indian temple craftsmanship.',
    language: 'Universal Architectural Visual',
    copyright: '© Project Eternal · Architectural Archive',
    source: 'Indian Sacred Architecture Study',
    altText:
      'Ancient Indian stone temple interior with carved fluted pillars and morning sunbeams through incense haze',
    publicationStatus: 'Published · Visual Study',
    imageSrc: ASSET_MANIFEST.visualStudies.heroAncientTempleSanctum.src,
    aspectRatio: '16:9',
  },
  {
    id: 'art-palm-leaf',
    category: 'manuscripts',
    title: 'Tied Palm-Leaf Manuscript Tradition (Tala-Patra)',
    description:
      'Honors centuries of scribal preservation across India that safeguarded the 700 shlokas of the Bhagavad Gita across generations.',
    language: 'Sanskrit Devanagari & Telugu Script Heritage',
    copyright: '© Project Eternal · Manuscript Archive',
    source: 'Indian Textual Preservation Archive',
    altText:
      'Close-up photograph of ancient tied palm-leaf manuscripts inlaid with delicate gold calligraphy',
    publicationStatus: 'Published · Visual Study',
    imageSrc: ASSET_MANIFEST.visualStudies.manuscriptCraft.src,
    aspectRatio: '4:3',
  },
];
