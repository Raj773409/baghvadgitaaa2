import type { LocalizedText } from '../types/cms';
import type { CharacterAssetId } from '../three/story/assetManifest';
import type { StoryPartId } from '../three/story/storyTimeline';
import type {
  DialogueSourceType,
  DialogueSpeakerId,
  FacialEmotionState,
} from '../three/story/visemeTimeline';

export interface MahabharataCharacterRecord {
  id: string;
  name: LocalizedText;
  faction: 'pandava' | 'kaurava' | 'witness-noncombatant';
  role: LocalizedText;
  rigAssetId: CharacterAssetId | 'narrative-chronicle';
  weaponOrSymbol: LocalizedText;
  keyWarDays: string;
}

export interface MahabharataWarDayRecord {
  day: number;
  parva: string;
  kauravaCommander: LocalizedText;
  title: LocalizedText;
  summary: LocalizedText;
  linkedSceneIndex: number; // 7..14
}

export interface ExtendedStoryNarrationCue {
  id: string;
  kind: 'adaptation' | 'scripture' | 'mahabharata-narrative';
  speakerRole: DialogueSpeakerId;
  emotion: FacialEmotionState;
  sourceType: DialogueSourceType;
  sourceRef: string;
  speaker: LocalizedText;
  text: LocalizedText;
}

export interface ExtendedStoryScriptureItem {
  id: string;
  chapter: number;
  verse: string;
  reference: string;
  sanskritDevanagari: string;
  transliteration: string;
  translation: LocalizedText;
  sourceEdition: LocalizedText;
  editorialStatus: 'canonical-reference';
}

export interface ExtendedStorySceneRecord {
  id: string;
  sceneNumber: number;
  paddedCode: string;
  partId: StoryPartId;
  warDaysLabel?: string;
  provenanceCategory: 'bhagavad-gita-scripture' | 'mahabharata-narrative' | 'visual-interpretation';
  parvaCitation?: string;
  durationMs: number;
  title: LocalizedText;
  subtitle: LocalizedText;
  scripturalScope: LocalizedText;
  chaptersReferenced: string;
  audioChapterNumber: number;
  editorialClassification: 'narrative-adaptation';
  atmosphereNote: LocalizedText;
  cues: ReadonlyArray<ExtendedStoryNarrationCue>;
  featuredVerses: ReadonlyArray<ExtendedStoryScriptureItem>;
  teachingPillars?: ReadonlyArray<{
    id: string;
    sanskritTerm: string;
    title: LocalizedText;
    summary: LocalizedText;
    verseRef: string;
    sanskritQuote: string;
    translation: LocalizedText;
  }>;
  eternalValues?: ReadonlyArray<{ id: string; title: LocalizedText; note: LocalizedText }>;
}

/**
 * Named Hero & Chronicled Figure Registry spanning Bhagavad Gita & Mahabharata War
 */
export const CHARACTER_REGISTRY: ReadonlyArray<MahabharataCharacterRecord> = [
  {
    id: 'sri-krishna',
    name: { en: 'Sri Krishna', hi: 'श्रीकृष्ण', te: 'శ్రీకృష్ణుడు' },
    faction: 'pandava',
    role: { en: 'Parthasarathi (Charioteer & Guide)', hi: 'पार्थसारथी एवं योगेश्वर', te: 'పార్థసారథి మరియు మార్గదర్శి' },
    rigAssetId: 'krishna',
    weaponOrSymbol: { en: 'Reins, Panchajanya Conch, Chariot Wheel (Day 9), Vishvarupa Chakra', hi: 'रथ की बागडोर, पांचजन्य शंख, नौवें दिन का रथ-चक्र', te: 'రథం పగ్గాలు, పాంచజన్యం, 9వ రోజు రథచక్రం' },
    keyWarDays: 'All 18 Days',
  },
  {
    id: 'arjuna',
    name: { en: 'Arjuna', hi: 'अर्जुन', te: 'అర్జునుడు' },
    faction: 'pandava',
    role: { en: 'Chief Pandava Archer (Savyasachi)', hi: 'मुख्य पाण्डव धनुर्धर', te: 'ప్రధాన పాండవ ధనుర్ధారి' },
    rigAssetId: 'arjuna',
    weaponOrSymbol: { en: 'Gandiva Celestial Bow', hi: 'गाण्डीव धनुष', te: 'గాండీవ ధనుస్సు' },
    keyWarDays: 'Days 1–18',
  },
  {
    id: 'yudhishthira',
    name: { en: 'Yudhishthira', hi: 'युधिष्ठिर', te: 'యుధిష్ఠిరుడు' },
    faction: 'pandava',
    role: { en: 'Eldest Pandava & Dharmic King', hi: 'ज्येष्ठ पाण्डव व धर्मराज', te: 'జ్యేష్ఠ పాండవుడు & ధర్మరాజు' },
    rigAssetId: 'warrior_archetype',
    weaponOrSymbol: { en: 'Spear & Royal Golden Banner', hi: 'शक्ति एवं धर्मध्वज', te: 'శక్తి ఆయుధం & ధర్మధ్వజం' },
    keyWarDays: 'Days 1–18, Post-War',
  },
  {
    id: 'bhima',
    name: { en: 'Bhima (Bhimasena)', hi: 'भीमसेन', te: 'భీమసేనుడు' },
    faction: 'pandava',
    role: { en: 'Mighty Vanguard & Gada Duelist', hi: 'महाबली गदाधारी योद्धा', te: 'మహాబలశాలి గదాధారి' },
    rigAssetId: 'mace_duelists',
    weaponOrSymbol: { en: 'Heavy Gada (Mace)', hi: 'भीम गदा', te: 'మహా గద' },
    keyWarDays: 'Days 1–18 (Day 18 Gada Duel)',
  },
  {
    id: 'nakula-sahadeva',
    name: { en: 'Nakula & Sahadeva', hi: 'नकुल एवं सहदेव', te: 'నకుల సహదేవులు' },
    faction: 'pandava',
    role: { en: 'Cavalry & Twin Pandava Strategists', hi: 'पाण्डव अश्वारोही एवं रणनीतिकार', te: 'అశ్వసేన మరియు తంత్రవేత్తలు' },
    rigAssetId: 'warrior_archetype',
    weaponOrSymbol: { en: 'Sword, Shield & Battle Axe', hi: 'खड्ग, ढाल एवं परशु', te: 'ఖడ్గం, డాలు మరియు పరశువు' },
    keyWarDays: 'Days 1–18 (Day 18 Shakuni Fall)',
  },
  {
    id: 'abhimanyu',
    name: { en: 'Abhimanyu', hi: 'अभिमन्यु', te: 'అభిమన్యుడు' },
    faction: 'pandava',
    role: { en: 'Young Lion of the Chakravyuha', hi: 'चक्रव्यूह भेदक वीर अभिमन्यु', te: 'చక్రవ్యూహ వీరుడు' },
    rigAssetId: 'warrior_archetype',
    weaponOrSymbol: { en: 'Bow, Shield & Broken Chariot Wheel Defense', hi: 'धनुष एवं रथ-चक्र प्रतिरक्षा', te: 'ధనుస్సు & రథచక్రం' },
    keyWarDays: 'Day 13 Chakravyuha',
  },
  {
    id: 'dhrishtadyumna',
    name: { en: 'Dhrishtadyumna & Satyaki', hi: 'धृष्टद्युम्न एवं सात्यकि', te: 'ధృష్టద్యుమ్నుడు & సాత్యకి' },
    faction: 'pandava',
    role: { en: 'Pandava Marshal & Vrishni Ally', hi: 'पाण्डव सेनापति एवं वृष्णि महारथी', te: 'పాండవ సేనాపతి & సాత్యకి' },
    rigAssetId: 'warrior_archetype',
    weaponOrSymbol: { en: 'Sword & Chariot Quiver', hi: 'खड्ग एवं रथ', te: 'ఖడ్గం & రథం' },
    keyWarDays: 'Days 1–18',
  },
  {
    id: 'ghatotkacha',
    name: { en: 'Ghatotkacha', hi: 'घटोत्कच', te: 'ఘటోత్కచుడు' },
    faction: 'pandava',
    role: { en: 'Son of Bhima & Night-Warfare Hero', hi: 'रात्रि-युद्ध महावीर घटोत्कच', te: 'రాత్రి యుద్ధ వీరుడు ఘటోత్కచుడు' },
    rigAssetId: 'mace_duelists',
    weaponOrSymbol: { en: 'Gada & Torch-lit Night Charge', hi: 'मशाल रात्रि संग्राम व गदा', te: 'దివిటీల రాత్రి యుద్ధం' },
    keyWarDays: 'Day 14 Night',
  },
  {
    id: 'draupadi',
    name: { en: 'Draupadi (Panchali)', hi: 'द्रौपदी', te: 'ద్రౌపది' },
    faction: 'witness-noncombatant',
    role: { en: 'Queen in Remembrance (Non-Battlefield Witness)', hi: 'धैर्य व न्याय की साक्षी', te: 'ధర్మ న్యాయ సాక్షి (యుద్ధేతర)' },
    rigAssetId: 'narrative-chronicle',
    weaponOrSymbol: { en: 'Chronicle of Justice & Post-War Mourning', hi: 'न्याय व करुणा का स्मरण', te: 'ధర్మం & కరుణ స్మరణ' },
    keyWarDays: 'Pre-War & Post-War Epilogue',
  },
  {
    id: 'bhishma',
    name: { en: 'Pitamaha Bhishma', hi: 'पितामह भीष्म', te: 'పితామహ భీష్ముడు' },
    faction: 'kaurava',
    role: { en: 'Grandsire & Kaurava Commander (Days 1–10)', hi: 'कौरव सेनापति (दिन १–१०)', te: 'కౌరవ సేనాధిపతి (1–10 రోజులు)' },
    rigAssetId: 'bhishma_drona_hero',
    weaponOrSymbol: { en: 'Silver Bow & Day 10 Shara-Shayya (Bed of Arrows)', hi: 'श्वेत ध्वज व शरशय्या', te: 'శ్వేత ధ్వజం & అంపశయ్య' },
    keyWarDays: 'Days 1–10',
  },
  {
    id: 'dronacharya',
    name: { en: 'Acharya Drona', hi: 'आचार्य द्रोण', te: 'ద్రోణాచార్యులు' },
    faction: 'kaurava',
    role: { en: 'Royal Preceptor & Commander (Days 11–15)', hi: 'गुरु एवं कौरव सेनापति (दिन ११–१५)', te: 'గురువు & సేనాధిపతి (11–15 రోజులు)' },
    rigAssetId: 'bhishma_drona_hero',
    weaponOrSymbol: { en: 'Chakravyuha Vyuha-Formations', hi: 'चक्रव्यूह व्यूह-रचना', te: 'చక్రవ్యూహ రచన' },
    keyWarDays: 'Days 1–15',
  },
  {
    id: 'karna',
    name: { en: 'Karna (Angaraja)', hi: 'अंगराज कर्ण', te: 'అంగరాజు కర్ణుడు' },
    faction: 'kaurava',
    role: { en: 'Surya-Putra & Commander (Days 16–17)', hi: 'कौरव सेनापति (दिन १६–१७)', te: 'కౌరవ సేనాధిపతి (16–17 రోజులు)' },
    rigAssetId: 'karna_hero',
    weaponOrSymbol: { en: 'Vijaya Bow & Solar Chariot', hi: 'विजय धनुष व सूर्य-रथ', te: 'విజయ ధనుస్సు & రథం' },
    keyWarDays: 'Days 11–17',
  },
  {
    id: 'duryodhana',
    name: { en: 'Duryodhana', hi: 'दुर्योधन', te: 'దుర్యోధనుడు' },
    faction: 'kaurava',
    role: { en: 'Kaurava Sovereign & Master of the Gada', hi: 'हस्तिनापुर युवराज व गदाधारी', te: 'కౌరవ అగ్రజుడు & గదాయోధుడు' },
    rigAssetId: 'mace_duelists',
    weaponOrSymbol: { en: 'Iron-Bronze Gada (Mace)', hi: 'लौह गदा', te: 'లోహ గద' },
    keyWarDays: 'Days 1–18',
  },
  {
    id: 'kaurava-generals',
    name: { en: 'Dushasana, Jayadratha, Ashwatthama, Kripa, Shakuni & Shalya', hi: 'दुःशासन, जयद्रथ, अश्वत्थामा, कृप, शकुनि व शल्य', te: 'దుశ్శాసన, జయద్రథ, అశ్వత్థామ, కృప, శకుని & శల్యుడు' },
    faction: 'kaurava',
    role: { en: 'Kaurava Wing Commanders & Strategists', hi: 'कौरव पक्ष के प्रमुख महारथी', te: 'కౌరవ పక్ష సేనానులు' },
    rigAssetId: 'warrior_archetype',
    weaponOrSymbol: { en: 'Armored Chariots, War Elephants & Standards', hi: 'रथ, गजसेना एवं ध्वज', te: 'రథాలు, గజదళం & ధ్వజాలు' },
    keyWarDays: 'Days 1–18 & Night Epilogue',
  },
];

/**
 * Day-by-Day 18-Day Kurukshetra War Chronicle mapped seamlessly to Story Scenes 08..15
 */
export const MAHABHARATA_18_DAYS: ReadonlyArray<MahabharataWarDayRecord> = [
  { day: 1, parva: 'Bhishma Parva', kauravaCommander: { en: 'Bhishma', hi: 'भीष्म', te: 'భీష్ముడు' }, title: { en: 'Opening Crash & Fall of Uttara', hi: 'प्रथम दिवस: महायुद्ध आरंभ', te: 'మొదటి రోజు: యుద్ధారంభం' }, summary: { en: 'After the Bhagavad Gita and blowing of sacred conches, Bhishma leads the Kauravas while Shweta and Uttara fall heroically.', hi: 'शंखनाद के पश्चात भीष्म के नेतृत्व में भीषण संग्राम प्रारंभ होता है।', te: 'శంఖారావం తర్వాత భీష్ముని నాయకత్వంలో భీకర పోరు ఆరంభమవుతుంది.' }, linkedSceneIndex: 7 },
  { day: 2, parva: 'Bhishma Parva', kauravaCommander: { en: 'Bhishma', hi: 'भीष्म', te: 'భీష్ముడు' }, title: { en: 'Arjuna Checks the Advance', hi: 'द्वितीय दिवस: अर्जुन का प्रतिकार', te: 'రెండవ రోజు: అర్జునుని ప్రతిఘటన' }, summary: { en: 'Pandavas adopt Krauncha (Heron) array; Arjuna stalls Bhishma while Dhrishtadyumna confronts Drona.', hi: 'पाण्डवों ने क्रौंच व्यूह रचा और अर्जुन ने भीष्म के वेग को संतुलित किया।', te: 'పాండవులు క్రౌంచ వ్యూహం పన్ని కౌరవ దళాన్ని ఎదుర్కొన్నారు.' }, linkedSceneIndex: 7 },
  { day: 3, parva: 'Bhishma Parva', kauravaCommander: { en: 'Bhishma', hi: 'भीष्म', te: 'భీష్ముడు' }, title: { en: 'Garuda vs Half-Moon Formations', hi: 'तृतीय दिवस: गरुड़ व अर्धचन्द्र व्यूह', te: 'మూడవ రోజు: గరుడ వ్యూహం' }, summary: { en: 'Garuda array clashes against the Ardhachandra formation; Bhishma’s volleys provoke Krishna’s first surge of indignation.', hi: 'गरुड़ व्यूह में प्रविष्ट होकर दोनों पक्षों में घमासान बाण-वर्षा हुई।', te: 'గరుడ, అర్ధచంద్ర వ్యూహాల మధ్య తీవ్ర బాణ యుద్ధం జరిగింది.' }, linkedSceneIndex: 7 },
  { day: 4, parva: 'Bhishma Parva', kauravaCommander: { en: 'Bhishma', hi: 'भीष्म', te: 'భీష్ముడు' }, title: { en: 'Bhima’s Elephant Corps Assault', hi: 'चतुर्थ दिवस: गजसेना पर भीम का प्रहार', te: 'నాలుగవ రోజు: గజదళంపై భీముని దాడి' }, summary: { en: 'Bhimasena scatters the Kaurava elephant division with heavy mace strikes across open plains.', hi: 'भीमसेन ने अपनी गदा से कौरव गजसेना के व्यूह को छिन्न-भिन्न कर दिया।', te: 'భీముడు తన గదతో కౌరవ గజసైన్యాన్ని చెల్లాచెదురు చేశాడు.' }, linkedSceneIndex: 7 },
  { day: 5, parva: 'Bhishma Parva', kauravaCommander: { en: 'Bhishma', hi: 'भीष्म', te: 'భీష్ముడు' }, title: { en: 'Makara vs Syena Arrays', hi: 'पञ्चम दिवस: मकर व श्येन व्यूह', te: 'ఐదవ రోజు: మకర వ్యూహం' }, summary: { en: 'Satyaki and Bhima press Drona’s wing relentlessly while both armies hold through dusk.', hi: 'सात्यकि और भीम ने कौरव पंक्ति पर तीव्र दबाव बनाए रखा।', te: 'సాత్యకి మరియు భీముడు కౌరవ సైన్యంపై ఒత్తిడి పెంచారు.' }, linkedSceneIndex: 8 },
  { day: 6, parva: 'Bhishma Parva', kauravaCommander: { en: 'Bhishma', hi: 'भीष्म', te: 'భీష్ముడు' }, title: { en: 'Fierce Chariot Skirmishes', hi: 'षष्ठ दिवस: भीम व द्रोण संघर्ष', te: 'ఆరవ రోజు: ద్రోణ-భీమ పోరు' }, summary: { en: 'Bhima plunges deep into Kaurava ranks before Drona’s defensive arc forces regrouping.', hi: 'भीम कौरव सेना के भीतर प्रविष्ट हुए और द्रोणाचार्य से द्वंद्व हुआ।', te: 'భీముడు కౌరవ వ్యూహంలోకి చొచ్చుకుపోయి ద్రోణుడితో తలపడ్డాడు.' }, linkedSceneIndex: 8 },
  { day: 7, parva: 'Bhishma Parva', kauravaCommander: { en: 'Bhishma', hi: 'भीष्म', te: 'భీష్ముడు' }, title: { en: 'Mandala Array & Stalemate', hi: 'सप्तम दिवस: मण्डल व्यूह', te: 'ఏడవ రోజు: మండల వ్యూహం' }, summary: { en: 'Circular Mandala phalanx resists Arjuna’s arrows; Bhagadatta and Ghatotkacha trade aerial volleys.', hi: 'चक्राकार मण्डल व्यूह में महारथियों के मध्य संतुलित संग्राम चला।', te: 'మండల వ్యూహంలో ఇరుపక్షాల మహారథులు సమంగా పోరాడారు.' }, linkedSceneIndex: 8 },
  { day: 8, parva: 'Bhishma Parva', kauravaCommander: { en: 'Bhishma', hi: 'भीष्म', te: 'భీష్ముడు' }, title: { en: 'Iravan Falls Heroically', hi: 'अष्टम दिवस: वीर इरावन का बलिदान', te: 'ఎనిమిదవ రోజు: ఇరావంతుని వీరమరణం' }, summary: { en: 'Ghatotkacha surges forward after Iravan’s sacrifice as the conflict intensifies.', hi: 'इरावन के बलिदान के पश्चात् घटोत्कच ने प्रचंड पराक्रम दिखाया।', te: 'ఇరావంతుని బలిదానం తర్వాత ఘటోత్కచుడు విజృంభించాడు.' }, linkedSceneIndex: 8 },
  { day: 9, parva: 'Bhishma Parva, Ch. 59', kauravaCommander: { en: 'Bhishma', hi: 'भीष्म', te: 'భీష్ముడు' }, title: { en: 'Krishna Lifts the Broken Chariot Wheel', hi: 'नवम दिवस: श्रीकृष्ण द्वारा रथ-चक्र उठाना', te: 'తొమ్మిదవ రోజు: శ్రీకృష్ణుడు రథచక్రం ఎత్తడం' }, summary: { en: 'When Bhishma’s arrows batter Arjuna’s chariot, Sri Krishna leaps down gripping a fallen wooden chariot wheel—before Arjuna humbly holds Him back to honor His vow of non-combat.', hi: 'भीष्म के प्रखर बाणों के बीच श्रीकृष्ण टूटा हुआ रथ-चक्र उठाकर आगे बढ़े, तब अर्जुन ने चरण पकड़कर उन्हें अस्त्र-त्याग की प्रतिज्ञा स्मरण कराई।', te: 'భీష్ముని బాణవృష్టి మధ్య శ్రీకృష్ణుడు విరిగిన రథచక్రాన్ని పైకెత్తగా, అర్జునుడు పాదాలపై పడి ఆయన్ని నిలువరించాడు.' }, linkedSceneIndex: 8 },
  { day: 10, parva: 'Bhishma Parva, Ch. 119', kauravaCommander: { en: 'Bhishma', hi: 'भीष्म', te: 'భీష్ముడు' }, title: { en: 'Fall of Pitamaha Bhishma — Bed of Arrows', hi: 'दशम दिवस: पितामह भीष्म की शरशय्या', te: 'పదవ రోజు: భీష్ముని అంపశయ్య' }, summary: { en: 'With Shikhandi standing ahead of Arjuna’s bow, Bhishma lowers his weapon and falls suspended upon a Bed of Arrows (Shara-Shayya), honored in hushed ceasefire.', hi: 'शिखण्डी के सामने आने पर भीष्म ने धनुष रख दिया और अर्जुन के बाणों की शरशय्या पर शांतिपूर्वक शयन किया।', te: 'శిఖండిని ముందుంచి అర్జునుడు వేసిన బాణాలతో పితామహుడు అంపశయ్యపై ఒరిగాడు.' }, linkedSceneIndex: 9 },
  { day: 11, parva: 'Drona Parva', kauravaCommander: { en: 'Dronacharya', hi: 'आचार्य द्रोण', te: 'ద్రోణాచార్యులు' }, title: { en: 'Drona Takes Command & Enters Karna', hi: 'एकादश दिवस: द्रोण सेनापतित्व व कर्ण प्रवेश', te: 'పదకొండవ రోజు: ద్రోణ సేనాపత్యం' }, summary: { en: 'Acharya Drona takes command and Angaraja Karna enters Kurukshetra, while Arjuna defends Yudhishthira from capture.', hi: 'गुरु द्रोण कौरव सेनापति बने और अंगराज कर्ण ने युद्ध में प्रवेश किया।', te: 'ద్రోణాచార్యుడు సేనాధిపతిగా బాధ్యతలు స్వీకరించగా కర్ణుడు రణరంగంలో ప్రవేశించాడు.' }, linkedSceneIndex: 10 },
  { day: 12, parva: 'Drona Parva', kauravaCommander: { en: 'Dronacharya', hi: 'आचार्य द्रोण', te: 'ద్రోణాచార్యులు' }, title: { en: 'Samsaptakas & Bhagadatta’s Elephant', hi: 'द्वादश दिवस: भगदत्त व सुप्रतीक गज', te: 'పన్నెండవ రోజు: సుప్రతీక గజ పోరు' }, summary: { en: 'The Samsaptakas draw Arjuna away toward the southern wing while Bhagadatta charges upon the war elephant Supratika.', hi: 'संसप्तकों ने अर्जुन को दक्षिण दिशा में उलझाया और भगदत्त गजराज सुप्रतीक पर चढ़कर आए।', te: 'సంసప్తకులు అర్జునుడిని దక్షిణానికి లాగగా, భగదత్తుడు సుప్రతీక గజంపై విజృంభించాడు.' }, linkedSceneIndex: 10 },
  { day: 13, parva: 'Drona Parva (Abhimanyu-vadha)', kauravaCommander: { en: 'Dronacharya', hi: 'आचार्य द्रोण', te: 'ద్రోణాచార్యులు' }, title: { en: 'Chakravyuha & Heroism of Abhimanyu', hi: 'त्रयोदश दिवस: चक्रव्यूह एवं अभिमन्यु', te: 'పదమూడవ రోజు: చక్రవ్యూహం & అభిమన్యుడు' }, summary: { en: 'Acharya Drona arranges the rotating seven-ring Chakravyuha. Young Abhimanyu pierces six rings alone before Jayadratha seals the exit, fighting with a chariot wheel to his final breath.', hi: 'द्रोणाचार्य के घूमते चक्रव्यूह को भेदकर युवा अभिमन्यु अकेले भीतर प्रविष्ट हुए और अंततः रथ-चक्र से युद्ध करते हुए वीरगति पाई।', te: 'ద్రోణుడు పన్నిన తిరిగే చక్రవ్యూహాన్ని ఛేదించి అభిమన్యుడు వీరోచితంగా పోరాడి అసువులు బాసాడు.' }, linkedSceneIndex: 10 },
  { day: 14, parva: 'Drona Parva (Jayadratha & Ghatotkacha)', kauravaCommander: { en: 'Dronacharya', hi: 'आचार्य द्रोण', te: 'ద్రోణాచార్యులు' }, title: { en: 'Jayadratha at Dusk & Night Battle by Torchlight', hi: 'चतुर्दश दिवस: जयद्रथ वध व रात्रि संग्राम', te: 'పద్నాలుగవ రోజు: జయద్రథ వధ & రాత్రి యుద్ధం' }, summary: { en: 'Arjuna fulfills his sunset vow against Jayadratha; combat continues into pitch darkness by blazing torches until Ghatotkacha falls to Karna’s Vasavi Shakti.', hi: 'सूर्यास्त से पूर्व अर्जुन की प्रतिज्ञा पूर्ण हुई; रात्रि में मशालों के बीच घटोत्कच ने कौरव सेना को थाम लिया।', te: 'సూర్యాస్తమయానికి ముందే జయద్రథ వధ పూర్తికాగా, రాత్రి దివిటీల వెలుగులో ఘటోత్कచుడు భీకర యుద్ధం చేశాడు.' }, linkedSceneIndex: 11 },
  { day: 15, parva: 'Drona Parva', kauravaCommander: { en: 'Dronacharya', hi: 'आचार्य द्रोण', te: 'ద్రోణాచార్యులు' }, title: { en: 'Fall of Acharya Drona', hi: 'पन्द्रहवाँ दिवस: आचार्य द्रोण का अवसान', te: 'పదిహేనవ రోజు: ద్రోణాచార్యుల మరణం' }, summary: { en: 'Upon hearing the ambiguous report of “Ashwatthama,” Preceptor Drona lays aside his weapons in yogic meditation before Dhrishtadyumna’s sword.', hi: '“अश्वत्थामा” समाचार सुनकर गुरु द्रोण ने योग-समाधि में शस्त्र त्याग दिए।', te: 'అశ్వత్థామ వార్త విని ద్రోణాచార్యుడు ఆయుధ సన్యాసం చేసి యోగసమాధిలో ప్రాణాలు విడిచాడు.' }, linkedSceneIndex: 12 },
  { day: 16, parva: 'Karna Parva', kauravaCommander: { en: 'Karna', hi: 'कर्ण', te: 'కర్ణుడు' }, title: { en: 'Karna Leads — Nakula, Sahadeva & Bhima Surge', hi: 'सोलहवाँ दिवस: कर्ण का सेनापतित्व', te: 'పదహారవ రోజు: కర్ణ సేనాపత్యం' }, summary: { en: 'Anointed general, Karna unleashes Makara and Bhasmakara volleys while sparing the four brothers per his vow to Kunti.', hi: 'कर्ण सेनापति बने और अपनी प्रतिज्ञा का निर्वाह करते हुए पाण्डव भाइयों से भीषण संग्राम किया।', te: 'కర్ణుడు సేనాధిపతిగా ఉధృతంగా పోరాడుతూనే కుంతికి ఇచ్చిన మాటను నిలబెట్టుకున్నాడు.' }, linkedSceneIndex: 12 },
  { day: 17, parva: 'Karna Parva, Ch. 90', kauravaCommander: { en: 'Karna', hi: 'कर्ण', te: 'కర్ణుడు' }, title: { en: 'Chariot Duel of Karna & Arjuna — Sunken Wheel', hi: 'सत्रहवाँ दिवस: कर्ण-अर्जुन युद्ध व धँसा चक्र', te: 'పదిహేడవ రోజు: కర్ణ-అర్జున ద్వంద్వం' }, summary: { en: 'A blinding archery duel across Kurukshetra ends as Karna’s left chariot wheel sinks into the earth under Parashurama’s curse and Arjuna looses the Anjalika arrow.', hi: 'भीषण कर्ण-अर्जुन द्वंद्व में कर्ण के रथ का बायाँ पहिया भूमि में धँस गया और अर्जुन के अंजलिकास्त्र से कर्ण का पतन हुआ।', te: 'కర్ణ-అర్జున భీకర ద్వంద్వ యుద్ధంలో కర్ణుని రథచక్రం భూమిలో కూరుకుపోగా అంజలికాస్త్రంతో కర్ణుడు నేలకొరిగాడు.' }, linkedSceneIndex: 12 },
  { day: 18, parva: 'Shalya & Sauptika Parvas', kauravaCommander: { en: 'Shalya', hi: 'शल्य', te: 'శల్యుడు' }, title: { en: 'Fall of Shalya & Bhima–Duryodhana Mace Duel', hi: 'अठारहवाँ दिवस: शल्य व गदायुद्ध समापन', te: 'పద్దెనిమిదవ రోజు: శల్యుని మరణం & గదాయుద్ధం' }, summary: { en: 'Yudhishthira defeats Madra King Shalya at noon; Sahadeva slays Shakuni; by evening Bhima and Duryodhana clash in the final Gada-Yuddha mace duel.', hi: 'दोपहर में शल्य और शकुनि परास्त हुए तथा सायंकाल भीम-दुर्योधन के निर्णायक गदायुद्ध से महासंग्राम समाप्त हुआ।', te: 'శల్యుడు మరియు శకుని పతనమైన అనంతరం భీముడు-దుర్యోధనుల మధ్య చివరి గదాయుద్ధంతో యుద్ధం ముగిసింది.' }, linkedSceneIndex: 13 },
];

/**
 * Scenes 08..15: Part B — The Mahabharata War Across All 18 Days + Epilogue
 * Note: Strictly distinguishes Mahabharata narrative & editorial synthesis from
 * canonical Bhagavad Gita verses (no unverified Sanskrit shlokas fabricated).
 */
export const MAHABHARATA_WAR_SCENES: ReadonlyArray<ExtendedStorySceneRecord> = [
  {
    id: 'scene-08',
    sceneNumber: 8,
    paddedCode: '08',
    partId: 'part-b',
    warDaysLabel: 'War Days 1–4',
    provenanceCategory: 'mahabharata-narrative',
    parvaCitation: 'Mahabharata — Bhishma Parva (War Days 1–4)',
    durationMs: 22000,
    title: {
      en: 'The Great War Opens — Days 1 to 4',
      hi: 'महायुद्ध का आरंभ — दिन १ से ४',
      te: 'మహాసంగ్రామ ఆరంభం — 1 నుండి 4వ రోజు',
    },
    subtitle: {
      en: 'Conches, Krauncha & Garuda Formations, Elephant Charges',
      hi: 'शंखनाद, क्रौंच एवं गरुड़ व्यूह तथा गजसेना का वेग',
      te: 'శంఖారావాలు, క్రౌంచ మరియు గరుడ వ్యూహాల ఘర్షణ',
    },
    scripturalScope: {
      en: 'Mahabharata Narrative · Bhishma Parva (Days 1–4)',
      hi: 'महाभारत कथा · भीष्म पर्व (दिन १–४)',
      te: 'మహాభారత కథనం · భీష్మ పర్వం (1–4 రోజులు)',
    },
    chaptersReferenced: 'Days 1–4 · Bhishma Parva',
    audioChapterNumber: 1,
    editorialClassification: 'narrative-adaptation',
    atmosphereNote: {
      en: 'War horns and kettle drums thunder across Kurukshetra as Arjuna’s Gandiva arrows streak past advancing cavalry and armored elephants.',
      hi: 'रणभेरी और शंखनाद के बीच अश्वारोही दलों व गजसेना के सामने गाण्डीव से तीव्र बाण-वर्षा आरंभ होती है।',
      te: 'యుద్ధభేరుల మధ్య అశ్వదళాలు మరియు గజబలాల నడుమ గాండీవం నుండి బాణవృష్టి ప్రారంభమవుతుంది.',
    },
    cues: [
      {
        id: 's8-c1',
        kind: 'mahabharata-narrative',
        speakerRole: 'narrator',
        emotion: 'battle_focus',
        sourceType: 'mahabharata-narrative',
        sourceRef: 'Mahabharata — Bhishma Parva (Days 1–4)',
        speaker: { en: 'Mahabharata Narrative · Days 1–4', hi: 'महाभारत कथा · दिन १–४', te: 'మహాభారత కథనం · 1–4 రోజులు' },
        text: {
          en: 'Across the first four days, the Krauncha and Garuda formations collide across thunderous dust clouds while Bhishma leads the Kauravas and Bhima shatters the enemy elephant division.',
          hi: 'प्रथम चार दिनों में क्रौंच और गरुड़ व्यूह आमने-सामने टकराए—भीष्म ने कौरव पक्ष का नेतृत्व किया और भीम ने शत्रु गजसेना को विदीर्ण कर दिया।',
          te: 'మొదటి నాలుగు రోజులలో క్రౌంచ, గరుడ వ్యూహాలు ఢీకొన్నాయి—భీష్ముడు కౌరవ దళాన్ని నడిపించగా, భీముడు గజసైన్యాన్ని ఛేదించాడు.',
        },
      },
      {
        id: 's8-c2',
        kind: 'adaptation',
        speakerRole: 'arjuna',
        emotion: 'resolve',
        sourceType: 'editorial-adaptation',
        sourceRef: 'Editorial Adaptation · Days 1–4',
        speaker: { en: 'Arjuna (Dramatic Voice)', hi: 'अर्जुन (नाट्य संवाद)', te: 'అర్జునుడు (కథన స్వరం)' },
        text: {
          en: 'Steady the reins, Madhusudana! I draw Gandiva to break the forward wings and hold our brothers’ line firm.',
          hi: 'हे मधुसूदन, अश्वों को स्थिर रखिए! मैं अग्रिम पंक्ति को भेदने के लिए गाण्डीव पर बाण संधान कर रहा हूँ।',
          te: 'ఓ మధుసూదనా, అశ్వాలను స్థిరంగా నిలుపు! శత్రు వ్యూహాన్ని ఛేదించడానికి నేను గాండీవంతో బాణాలను సంధిస్తున్నాను.',
        },
      },
      {
        id: 's8-c3',
        kind: 'mahabharata-narrative',
        speakerRole: 'narrator',
        emotion: 'battle_focus',
        sourceType: 'mahabharata-narrative',
        sourceRef: 'Mahabharata — Bhishma Parva Day 4',
        speaker: { en: 'Mahabharata Narrative', hi: 'महाभारत कथा', te: 'మహాభారత కథనం' },
        text: {
          en: 'Yet as each twilight bugle calls an uneasy truce, both sides realize how staggering the cost of pride will prove across the days ahead.',
          hi: 'किन्तु प्रत्येक संध्या युद्ध-विराम के साथ दोनों पक्ष इस महासंग्राम की विकराल कीमत का अनुभव करते हैं।',
          te: 'ప్రతి సాయంత్రం యుద్ధ విరమణ వేళ, ఈ మహాసంగ్రామపు తీవ్రతను ఇరుపక్షాలూ గ్రహిస్తాయి.',
        },
      },
    ],
    featuredVerses: [],
  },
  {
    id: 'scene-09',
    sceneNumber: 9,
    paddedCode: '09',
    partId: 'part-b',
    warDaysLabel: 'War Days 5–9',
    provenanceCategory: 'mahabharata-narrative',
    parvaCitation: 'Mahabharata — Bhishma Parva, Ch. 59 (Day 9 Chariot Wheel)',
    durationMs: 24000,
    title: {
      en: 'Bhishma’s Tempest & The Chariot Wheel — Days 5 to 9',
      hi: 'भीष्म का पराक्रम व रथ-चक्र प्रसंग — दिन ५ से ९',
      te: 'భీష్ముని విజృంభణ & రథచక్ర ఘట్టం — 5–9వ రోజులు',
    },
    subtitle: {
      en: 'Krishna Raises a Fallen Wooden Chariot Wheel',
      hi: 'श्रीकृष्ण द्वारा टूटा हुआ रथ-चक्र उठाने का अविस्मरणीय क्षण',
      te: 'శ్రీకృష్ణుడు విరిగిన రథచక్రాన్ని ఎత్తిన అపూర్వ ఘట్టం',
    },
    scripturalScope: {
      en: 'Mahabharata Narrative · Bhishma Parva (Days 5–9)',
      hi: 'महाभारत कथा · भीष्म पर्व (दिन ५–९)',
      te: 'మహాభారత కథనం · భీష్మ పర్వం (5–9 రోజులు)',
    },
    chaptersReferenced: 'Days 5–9 · Day 9 Chariot Wheel',
    audioChapterNumber: 11,
    editorialClassification: 'narrative-adaptation',
    atmosphereNote: {
      en: 'On Day 9, amidst Bhishma’s storm of arrows, Sri Krishna leaps from the chariot lifting a splintered wooden wheel until Arjuna checks Him at ten paces.',
      hi: 'नवम दिन भीष्म की प्रखर बाण-वर्षा देख श्रीकृष्ण रथ से उतरकर टूटा हुआ काष्ठ-चक्र उठा लेते हैं।',
      te: '9వ రోజున భీష్ముని బాణవృష్టి మధ్య శ్రీకృష్ణుడు రథం నుండి దూకి విరిగిన కొయ్య రథచక్రాన్ని పైకెత్తుతాడు.',
    },
    cues: [
      {
        id: 's9-c1',
        kind: 'mahabharata-narrative',
        speakerRole: 'narrator',
        emotion: 'battle_focus',
        sourceType: 'mahabharata-narrative',
        sourceRef: 'Mahabharata — Bhishma Parva Ch. 59',
        speaker: { en: 'Mahabharata Narrative · Days 5–9', hi: 'महाभारत कथा · दिन ५–९', te: 'మహాభారత కథనం · 5–9 రోజులు' },
        text: {
          en: 'From Day Five to Day Nine, Bhishma’s arrows strike like monsoon lightning—wounding Pandava banners and forcing even Krishna’s golden chariot back.',
          hi: 'पाँचवें से नौवें दिन तक पितामह भीष्म के बाणों ने पाण्डव व्यूह को झकझोर दिया और रथ तक को घेर लिया।',
          te: 'ఐదు నుండి తొమ్మిదవ రోజు వరకు భీష్ముని బాణాలు పిడుగుల్లా కురిసి పాండవ దళాన్ని ఉక్కిరిబిక్కిరి చేశాయి.',
        },
      },
      {
        id: 's9-c2',
        kind: 'adaptation',
        speakerRole: 'arjuna',
        emotion: 'awe',
        sourceType: 'editorial-adaptation',
        sourceRef: 'Bhishma Parva Ch. 59 (Adaptation)',
        speaker: { en: 'Arjuna', hi: 'अर्जुन', te: 'అర్జునుడు' },
        text: {
          en: 'Turn back, O Keshava! Let no warrior ever say You broke Your sacred vow not to lift a weapon—it is my bow alone that shall answer!',
          hi: 'रुकिए केशव! आपकी अस्त्र न उठाने की प्रतिज्ञा अखण्ड रहनी चाहिए—मैं ही इस बाण-वर्षा का उत्तर दूँगा!',
          te: 'ఆగండి కేశవా! ఆయుధం పట్టననే మీ ప్రతిజ్ఞకు భంగం కలగకూడదు—నేనే ఈ పోరును ఎదుర్కొంటాను!',
        },
      },
      {
        id: 's9-c3',
        kind: 'adaptation',
        speakerRole: 'krishna',
        emotion: 'resolve',
        sourceType: 'editorial-adaptation',
        sourceRef: 'Bhishma Parva Ch. 59 (Adaptation)',
        speaker: { en: 'Sri Krishna', hi: 'श्रीकृष्ण', te: 'శ్రీకృష్ణుడు' },
        text: {
          en: 'Then fight without hesitation, Partha—for only an undivided heart can pierce this storm of duty.',
          hi: 'तो बिना संकोच युद्ध करो पार्थ—संकल्प और धर्म के बीच अब कोई संशय शेष न रहे।',
          te: 'అలాగే సంకోచం వీడి పోరాడు పార్థా—ధర్మసంకల్పానికి ఇప్పుడు తిరుగుండకూడదు.',
        },
      },
    ],
    featuredVerses: [],
  },
  {
    id: 'scene-10',
    sceneNumber: 10,
    paddedCode: '10',
    partId: 'part-b',
    warDaysLabel: 'War Day 10',
    provenanceCategory: 'mahabharata-narrative',
    parvaCitation: 'Mahabharata — Bhishma Parva, Ch. 119 (Shara-Shayya)',
    durationMs: 22000,
    title: {
      en: 'Fall of Pitamaha Bhishma — Day 10',
      hi: 'पितामह भीष्म का पतन — दसवाँ दिन',
      te: 'పితామహ భీష్ముని అంపశయ్య — 10వ రోజు',
    },
    subtitle: {
      en: 'Suspended Upon the Shara-Shayya (Bed of Arrows)',
      hi: 'अर्जुन के बाणों की शरशय्या पर शांति एवं सम्मान का क्षण',
      te: 'అర్జునుని బాణాలతో అంపశయ్యపై ఒరిగిన కురువృద్ధుడు',
    },
    scripturalScope: {
      en: 'Mahabharata Narrative · Bhishma Parva (Day 10)',
      hi: 'महाभारत कथा · भीष्म पर्व (दशम दिवस)',
      te: 'మహాభారత కథనం · భీష్మ పర్వం (10వ రోజు)',
    },
    chaptersReferenced: 'Day 10 · Shara-Shayya',
    audioChapterNumber: 2,
    editorialClassification: 'narrative-adaptation',
    atmosphereNote: {
      en: 'Dusk softens the battle dust as fighting halts around the fallen grandsire resting suspended above the earth on Arjuna’s arrows.',
      hi: 'गोधूलि बेला में दोनों सेनाएँ शस्त्र रखकर शरशय्या पर लेटे पितामह भीष्म को प्रणाम करती हैं।',
      te: 'సాయంసంధ్యలో రెండు సైన్యాలు ఆయుధాలు దించి అంపశయ్యపై పవళించిన భీష్మునికి నమస్కరిస్తాయి.',
    },
    cues: [
      {
        id: 's10-c1',
        kind: 'mahabharata-narrative',
        speakerRole: 'narrator',
        emotion: 'sorrow',
        sourceType: 'mahabharata-narrative',
        sourceRef: 'Mahabharata — Bhishma Parva Ch. 119',
        speaker: { en: 'Mahabharata Narrative · Day 10', hi: 'महाभारत कथा · दशम दिवस', te: 'మహాభారత కథనం · 10వ రోజు' },
        text: {
          en: 'On the tenth day, recognizing Shikhandi at the prow of the chariot, Bhishma lowers his white bow cleanly—unwilling to strike—as Arjuna’s shafts weave beneath him into a bed of arrows.',
          hi: 'दसवें दिन शिखण्डी को सामने देख भीष्म ने स्वेच्छा से धनुष रख दिया और अर्जुन के बाणों से निर्मित शरशय्या पर आसीन हुए।',
          te: 'పదవ రోజున శిఖండిని ఎదుట చూసి భీష్ముడు తన ధనుస్సును దించగా, అర్జునుని బాణాలు ఆయన్ను అంపశయ్యపై నిలిపాయి.',
        },
      },
      {
        id: 's10-c2',
        kind: 'adaptation',
        speakerRole: 'bhishma',
        emotion: 'serene',
        sourceType: 'editorial-adaptation',
        sourceRef: 'Bhishma Parva (Adaptation)',
        speaker: { en: 'Pitamaha Bhishma', hi: 'पितामह भीष्म', te: 'పితామహ భీష్ముడు' },
        text: {
          en: 'This pillow of arrows befits a warrior, Vijaya. May both houses honor peace while I await the northward course of the sun.',
          hi: 'यह बाणों का उपधान ही वीर को शोभा देता है अर्जुन; उत्तरायण की प्रतीक्षा में मेरा प्रणाम स्वीकार हो।',
          te: 'వీరునికి ఈ బాణాల తలగడయే తగినది అర్జునా; ఉత్తరాయణ పుణ్యకాలం కోసం వేచి ఉంటాను.',
        },
      },
      {
        id: 's10-c3',
        kind: 'mahabharata-narrative',
        speakerRole: 'narrator',
        emotion: 'compassionate',
        sourceType: 'mahabharata-narrative',
        sourceRef: 'Mahabharata — Bhishma Parva',
        speaker: { en: 'Mahabharata Narrative', hi: 'महाभारत कथा', te: 'మహాభారత కథనం' },
        text: {
          en: 'All princes gather in quiet reverence around the elder patriarch, before duty summons Drona to command the eleventh dawn.',
          hi: 'कौरव व पाण्डव दोनों पक्ष मौन श्रद्धा से भीष्म को नमन करते हैं और अगले प्रभात द्रोणाचार्य सेनापति बनते हैं।',
          te: 'ఇరు పక్షాల రాకుమారులు మౌన గౌరవంతో నమస్కరించి మరుసటి ఉదయానికి సిద్ధమవుతారు.',
        },
      },
    ],
    featuredVerses: [],
  },
  {
    id: 'scene-11',
    sceneNumber: 11,
    paddedCode: '11',
    partId: 'part-b',
    warDaysLabel: 'War Days 11–13',
    provenanceCategory: 'mahabharata-narrative',
    parvaCitation: 'Mahabharata — Drona Parva (Chakravyuha & Abhimanyu)',
    durationMs: 24000,
    title: {
      en: 'Drona & The Chakravyuha — Days 11 to 13',
      hi: 'द्रोणाचार्य व चक्रव्यूह — दिन ११ से १३',
      te: 'ద్రోణుడు & చక్రవ్యూహం — 11 నుండి 13వ రోజు',
    },
    subtitle: {
      en: 'Rotating Seven-Ring Phalanx & Abhimanyu’s Immortal Courage',
      hi: 'घूमता चक्रव्यूह और वीर अभिमन्यु का अद्वितीय शौर्य',
      te: 'తిరిగే చక్రవ్యూహం మరియు వీరాభిమన్యుడి అమర పోరాటం',
    },
    scripturalScope: {
      en: 'Mahabharata Narrative · Drona Parva (Days 11–13)',
      hi: 'महाभारत कथा · द्रोण पर्व (दिन ११–१३)',
      te: 'మహాభారత కథనం · ద్రోణ పర్వం (11–13 రోజులు)',
    },
    chaptersReferenced: 'Days 11–13 · Chakravyuha',
    audioChapterNumber: 2,
    editorialClassification: 'narrative-adaptation',
    atmosphereNote: {
      en: 'Seen from an elevated tactical vantage, concentric rings of armored shields spiral slowly on the plain as Day 13 unfolds.',
      hi: 'ऊपरी रणनीतिक दृष्टि से कुरुक्षेत्र के मैदान में घूमती हुई चक्रव्यूह की सात परतें दिखाई देती हैं।',
      te: 'పైనుండి చూస్తున్నట్లుగా కురుక్షేత్ర మైదానంలో ఏడు వలయాల చక్రవ్యూహం గిర్రున తిరుగుతుంది.',
    },
    cues: [
      {
        id: 's11-c1',
        kind: 'mahabharata-narrative',
        speakerRole: 'narrator',
        emotion: 'battle_focus',
        sourceType: 'mahabharata-narrative',
        sourceRef: 'Mahabharata — Drona Parva (Days 11–12)',
        speaker: { en: 'Mahabharata Narrative · Days 11–12', hi: 'महाभारत कथा · दिन ११–१२', te: 'మహాభారత కథనం · 11–12 రోజులు' },
        text: {
          en: 'Over Days Eleven and Twelve, Preceptor Drona shields the Kaurava line while the Samsaptakas draw Arjuna far toward the southern flank.',
          hi: 'ग्यारहवें व बारहवें दिन द्रोणाचार्य ने कमान संभाली और संसप्तक अर्जुन को दूर दक्षिण मोर्चे पर ले गए।',
          te: '11–12 రోజులలో ద్రోణుడు సైన్యాన్ని నడిపించగా సంసప్తకులు అర్జునుడిని దక్షిణ తీరానికి మళ్లించారు.',
        },
      },
      {
        id: 's11-c2',
        kind: 'mahabharata-narrative',
        speakerRole: 'narrator',
        emotion: 'awe',
        sourceType: 'mahabharata-narrative',
        sourceRef: 'Mahabharata — Drona Parva Day 13',
        speaker: { en: 'Mahabharata Narrative · Day 13', hi: 'महाभारत कथा · तेरहवाँ दिन', te: 'మహాభారత కథనం · 13వ రోజు' },
        text: {
          en: 'On Day Thirteen, Drona spins the labyrinthine Chakravyuha. Young Abhimanyu breaches six concentric rings alone before Jayadratha seals the gate behind him.',
          hi: 'तेरहवें दिन द्रोण ने घूमता चक्रव्यूह रचा। युवा अभिमन्यु ने छह द्वार अकेले भेदे, किन्तु जयद्रथ ने प्रवेश मार्ग बंद कर दिया।',
          te: '13వ రోజున చక్రవ్యూహాన్ని అభిమన్యుడు ఒక్కడే ఆరు వలయాలు ఛేదించి లోపలికి వెళ్లగా జయద్రథుడు ద్వారం మూసివేశాడు.',
        },
      },
      {
        id: 's11-c3',
        kind: 'mahabharata-narrative',
        speakerRole: 'narrator',
        emotion: 'sorrow',
        sourceType: 'mahabharata-narrative',
        sourceRef: 'Mahabharata — Drona Parva Day 13',
        speaker: { en: 'Mahabharata Narrative', hi: 'महाभारत कथा', te: 'మహాభారత కథనం' },
        text: {
          en: 'Disarmed yet unbroken, holding only a broken chariot wheel against six maharathis, Abhimanyu enters legend for every age to come.',
          hi: 'निःशस्त्र होकर भी केवल रथ के टूटे पहिये से छह महारथियों का सामना करते हुए अभिमन्यु अमर हो गए।',
          te: 'విరిగిన రథచక్రమే ఆయుధంగా ఆరుగురు మహారథులతో తలపడి అభిమన్యుడు చరిత్రలో అమరుడయ్యాడు.',
        },
      },
    ],
    featuredVerses: [],
  },
  {
    id: 'scene-12',
    sceneNumber: 12,
    paddedCode: '12',
    partId: 'part-b',
    warDaysLabel: 'War Day 14 (Day & Night)',
    provenanceCategory: 'mahabharata-narrative',
    parvaCitation: 'Mahabharata — Drona Parva (Jayadratha & Ghatotkacha)',
    durationMs: 24000,
    title: {
      en: 'Jayadratha & The Torch-Lit Night — Day 14',
      hi: 'जयद्रथ प्रतिज्ञा एवं रात्रि संग्राम — चौदहवाँ दिन',
      te: 'జయద్రథ వధ & దివిటీల రాత్రి యుద్ధం — 14వ రోజు',
    },
    subtitle: {
      en: 'Sunset Vow Fulfilled, Followed by Ghatotkacha’s Night Battle',
      hi: 'सूर्यास्त संकल्प पूर्ण व मशालों के बीच घटोत्कच का पराक्रम',
      te: 'సూర్యాస్తమయ ప్రతిజ్ఞ & ఘటోత్కచుని రాత్రి పోరాటం',
    },
    scripturalScope: {
      en: 'Mahabharata Narrative · Drona Parva (Day 14)',
      hi: 'महाभारत कथा · द्रोण पर्व (चौदहवाँ दिवस)',
      te: 'మహాభారత కథనం · ద్రోణ పర్వం (14వ రోజు)',
    },
    chaptersReferenced: 'Day 14 · Day & Night',
    audioChapterNumber: 11,
    editorialClassification: 'narrative-adaptation',
    atmosphereNote: {
      en: 'Crimson dusk darkens abruptly into midnight Kurukshetra illuminated solely by flickering iron war torches and fiery arrow trails.',
      hi: 'सूर्यास्त की लालिमा घोर रात्रि में बदल जाती है और केवल धधकती मशालों के प्रकाश में युद्ध चलता है।',
      te: 'సూర్యాస్తమయం చీకటి రాత్రిగా మారగా, కేవలం దివిటీల వెలుగులో రాత్రి యుద్ధం కొనసాగుతుంది.',
    },
    cues: [
      {
        id: 's12-c1',
        kind: 'adaptation',
        speakerRole: 'krishna',
        emotion: 'resolve',
        sourceType: 'editorial-adaptation',
        sourceRef: 'Drona Parva Day 14 (Adaptation)',
        speaker: { en: 'Sri Krishna', hi: 'श्रीकृष्ण', te: 'శ్రీకృష్ణుడు' },
        text: {
          en: 'Look toward the western horizon, Arjuna—darkness covers the sun for a breath, and Jayadratha lifts his gaze. Loose your arrow now!',
          hi: 'पश्चिम क्षितिज की ओर देखो अर्जुन—क्षण भर के तिमिर में जयद्रथ ऊपर देख रहा है; अब अपना बाण छोड़ो!',
          te: 'పశ్చిమ దిక్కుకు చూడు అర్జునా—సూర్యుడిని చీకటి కమ్ముకుంది, జయద్రథుడు తల ఎత్తి చూస్తున్నాడు. ఇప్పుడే బాణం వేయు!',
        },
      },
      {
        id: 's12-c2',
        kind: 'adaptation',
        speakerRole: 'arjuna',
        emotion: 'battle_focus',
        sourceType: 'editorial-adaptation',
        sourceRef: 'Drona Parva Day 14 (Adaptation)',
        speaker: { en: 'Arjuna', hi: 'अर्जुन', te: 'అర్జునుడు' },
        text: {
          en: 'This shaft answers for my son Abhimanyu—before the day closes, my vow stands kept!',
          hi: 'अभिमन्यु के बलिदान के प्रति यह बाण मेरा संकल्प पूर्ण करेगा!',
          te: 'నా కుమారుడు అభిమన్యుని కోసం నా ఈ ప్రతిజ్ఞ సూర్యాస్తమయానికి ముందే నెరవేరుతుంది!',
        },
      },
      {
        id: 's12-c3',
        kind: 'mahabharata-narrative',
        speakerRole: 'narrator',
        emotion: 'awe',
        sourceType: 'mahabharata-narrative',
        sourceRef: 'Mahabharata — Drona Parva Day 14 Night',
        speaker: { en: 'Mahabharata Narrative · Night Battle', hi: 'महाभारत कथा · रात्रि युद्ध', te: 'మహాభారత కథనం · రాత్రి యుద్ధం' },
        text: {
          en: 'Refusing to pause at dusk, both armies light thousands of torches into the fourteenth night until Ghatotkacha overwhelms the Kaurava lines and draws Karna’s single Vasavi Shakti.',
          hi: 'सूर्यास्त के बाद भी हजारों मशालों के उजाले में युद्ध चलता रहा, जहाँ घटोत्कच ने कौरवों पर दबाव बढ़ाकर कर्ण की अमोघ वासवी शक्ति को झेल लिया।',
          te: 'సూర్యాస్తమయం తర్వాత కూడా వేలాది దివిటీల మధ్య యుద్ధం జరగగా, ఘటోత్कచుడు కర్ణుని వాసవీ శక్తిని తనపైకి మళ్లించాడు.',
        },
      },
    ],
    featuredVerses: [],
  },
  {
    id: 'scene-13',
    sceneNumber: 13,
    paddedCode: '13',
    partId: 'part-b',
    warDaysLabel: 'War Days 15–17',
    provenanceCategory: 'mahabharata-narrative',
    parvaCitation: 'Mahabharata — Drona & Karna Parvas (Days 15–17)',
    durationMs: 25000,
    title: {
      en: 'Drona’s Fall & Karna vs Arjuna — Days 15 to 17',
      hi: 'द्रोण अवसान व कर्ण-अर्जुन द्वंद्व — दिन १५ से १७',
      te: 'ద్రోణ పతనం & కర్ణ-అర్జున ద్వంద్వం — 15–17వ రోజులు',
    },
    subtitle: {
      en: 'Vijaya vs Gandiva, and the Sunken Chariot Wheel of Day 17',
      hi: 'विजय और गाण्डीव धनुष का महाद्वंद्व तथा धँसा रथ-चक्र',
      te: 'విజయ-గాండీవ ధనుస్సుల పోరు & కూరుకుపోయిన రథచక్రం',
    },
    scripturalScope: {
      en: 'Mahabharata Narrative · Drona & Karna Parvas (Days 15–17)',
      hi: 'महाभारत कथा · द्रोण व कर्ण पर्व (दिन १५–१७)',
      te: 'మహాభారత కథనం · ద్రోణ & కర్ణ పర్వాలు (15–17 రోజులు)',
    },
    chaptersReferenced: 'Days 15–17 · Karna–Arjuna Duel',
    audioChapterNumber: 18,
    editorialClassification: 'narrative-adaptation',
    atmosphereNote: {
      en: 'Deep amber-crimson twilight bathes two rival golden chariots locked in blazing archery exchange as Karna’s left wheel tilts into the Kurukshetra soil.',
      hi: 'रक्तिम संध्या में कुरुक्षेत्र की रणभूमि पर दोनों महायोद्धाओं के स्वर्ण रथ आमने-सामने महाद्वंद्व में संलग्न होते हैं।',
      te: 'ఎరుపురంగు సంధ్యాకాంతిలో కర్ణ-అర్జునుల రథాలు ఎదురెదురుగా నిలిచి భీకర అస్త్ర యుద్ధం సాగిస్తాయి.',
    },
    cues: [
      {
        id: 's13-c1',
        kind: 'adaptation',
        speakerRole: 'arjuna',
        emotion: 'battle_focus',
        sourceType: 'editorial-adaptation',
        sourceRef: 'Karna Parva (Adaptation)',
        speaker: { en: 'Arjuna · Days 15–16', hi: 'अर्जुन · दिन १५–१६', te: 'అర్జునుడు · 15–16 రోజులు' },
        text: {
          en: 'With Drona passed beyond earthly strife, Angaraja Karna himself rides forward. Today Kurukshetra sees our lifelong rivalry settled before both hosts.',
          hi: 'गुरु द्रोण के पश्चात् आज स्वयं अंगराज कर्ण सामने आए हैं—समग्र सेना आज इस द्वंद्व की साक्षी है।',
          te: 'ద్రోణాచార్యుల అనంతరం నేడు అంగరాజు కర్ణుడు స్వయంగా ఎదురు నిలిచాడు—ఈ ద్వంద్వానికి రణరంగం సాక్షిగా ఉంది.',
        },
      },
      {
        id: 's13-c2',
        kind: 'adaptation',
        speakerRole: 'karna',
        emotion: 'resolve',
        sourceType: 'editorial-adaptation',
        sourceRef: 'Karna Parva Ch. 90 (Adaptation)',
        speaker: { en: 'Angaraja Karna · Day 17', hi: 'अंगराज कर्ण · सप्तदश दिन', te: 'కర్ణుడు · 17వ రోజు' },
        text: {
          en: 'Earth swallows my left wheel at this very hour—pause one heartbeat, Dhananjaya, by the code of dharma while I raise my axle free!',
          hi: 'इस क्षण पृथ्वी ने मेरे रथ का बायाँ चक्र निगल लिया है—धर्म की मर्यादा से एक क्षण रुक जाओ धनंजय, जब तक मैं चक्र बाहर निकालूँ!',
          te: 'ఈ క్షణమే భూమి నా రథచక్రాన్ని మింగింది—ధర్మనీతి ప్రకారం నేను చక్రాన్ని పైకెత్తేంతవరకు ఒక్క క్షణం ఆగు ధనంజయా!',
        },
      },
      {
        id: 's13-c3',
        kind: 'adaptation',
        speakerRole: 'krishna',
        emotion: 'resolve',
        sourceType: 'editorial-adaptation',
        sourceRef: 'Karna Parva Ch. 90 (Adaptation)',
        speaker: { en: 'Sri Krishna', hi: 'श्रीकृष्ण', te: 'శ్రీకృష్ణుడు' },
        text: {
          en: 'Remember where six warriors stood around lone Abhimanyu on Day Thirteen, Karna. Strike without hesitation now, Arjuna—Anjalika finds its mark!',
          hi: 'तेरहवें दिन अकेले अभिमन्यु पर छह महारथियों के प्रहार का स्मरण करो कर्ण। अब संकोच न करो अर्जुन—अंजलिका बाण चलाओ!',
          te: 'పదమూడవ రోజున ఒంటరి అభిమన్యుడిపై ఆరుగురు చేసిన పోరును గుర్తుచేసుకో కర్ణా! ఇక ఆలస్యం చేయకు అర్జునా!',
        },
      },
    ],
    featuredVerses: [],
  },
  {
    id: 'scene-14',
    sceneNumber: 14,
    paddedCode: '14',
    partId: 'part-b',
    warDaysLabel: 'War Day 18',
    provenanceCategory: 'mahabharata-narrative',
    parvaCitation: 'Mahabharata — Shalya Parva (Day 18 Gada-Yuddha)',
    durationMs: 22000,
    title: {
      en: 'Shalya’s Fall & The Mace Duel — Day 18',
      hi: 'शल्य वध व अंतिम गदायुद्ध — अठारहवाँ दिन',
      te: 'శల్యుని మరణం & అంతిమ గదాయుద్ధం — 18వ రోజు',
    },
    subtitle: {
      en: 'Bhima vs Duryodhana in the Final Gada Confrontation',
      hi: 'भीम और दुर्योधन के मध्य निर्णायक गदायुद्ध',
      te: 'భీముడు మరియు దుర్యోధనుల మధ్య నిర్ణాయక గదాయుద్ధం',
    },
    scripturalScope: {
      en: 'Mahabharata Narrative · Shalya Parva (Day 18)',
      hi: 'महाभारत कथा · शल्य पर्व (अठारहवाँ दिवस)',
      te: 'మహాభారత కథనం · శల్య పర్వం (18వ రోజు)',
    },
    chaptersReferenced: 'Day 18 · Gada-Yuddha',
    audioChapterNumber: 18,
    editorialClassification: 'narrative-adaptation',
    atmosphereNote: {
      en: 'Exhausted armies form a solemn dusk ring as Bhima and Duryodhana circle with raised heavy bronze maces.',
      hi: 'थकी हुई सेनाएँ सायंकाल में शांत घेरा बनाती हैं, जहाँ भीम और दुर्योधन भारी गदाओं के साथ अंतिम द्वंद्व करते हैं।',
      te: 'అలసిపోయిన సైన్యాలు చుట్టూ నిలువగా, భీముడు మరియు దుర్యోధనుడు భారీ గదలతో తుది ద్వంద్వంలో తలపడతారు.',
    },
    cues: [
      {
        id: 's14-c1',
        kind: 'adaptation',
        speakerRole: 'duryodhana',
        emotion: 'battle_focus',
        sourceType: 'editorial-adaptation',
        sourceRef: 'Shalya Parva (Adaptation)',
        speaker: { en: 'Duryodhana · Day 18', hi: 'दुर्योधन · अठारहवाँ दिन', te: 'దుర్యోధనుడు · 18వ రోజు' },
        text: {
          en: 'Shalya and Shakuni have fallen, yet I ask no quarter! Raise your heavy mace, Vrikodara—let eighteen days end man to man!',
          hi: 'शल्य और शकुनि धराशायी हो चुके, फिर भी मैं झुकूँगा नहीं! भीम, अपनी गदा उठाओ—आज अठारह दिनों का निर्णय गदायुद्ध से होगा!',
          te: 'శల్యుడు, శకుని నేలకొరిగినా నేను వెనక్కి తగ్గను! భీమా, నీ గదను ఎత్తు—18 రోజుల యుద్ధానికి ఇదే తుది నిర్ణయం!',
        },
      },
      {
        id: 's14-c2',
        kind: 'mahabharata-narrative',
        speakerRole: 'narrator',
        emotion: 'battle_focus',
        sourceType: 'mahabharata-narrative',
        sourceRef: 'Mahabharata — Shalya Parva (Gada-Yuddha)',
        speaker: { en: 'Mahabharata Narrative', hi: 'महाभारत कथा', te: 'మహాభారత కథనం' },
        text: {
          en: 'Earlier at noon Yudhishthira vanquished Shalya and Sahadeva slew Shakuni. Now bronze maces spark in evening mist as Bhima and Duryodhana weave through thunderous strikes.',
          hi: 'मध्याह्न में युधिष्ठिर ने शल्य को तथा सहदेव ने शकुनि को परास्त किया। अब संध्या की धुंध में भीम और दुर्योधन की गदाएँ आपस में टकराती हैं।',
          te: 'మధ్యాహ్నం యుధిష్ఠిరుడు శల్యుడిని, సహదేవుడు శకునిని వధించగా, సాయంత్రం భీమ-దుర్యోధనుల గదలు ఢీకొంటాయి.',
        },
      },
      {
        id: 's14-c3',
        kind: 'mahabharata-narrative',
        speakerRole: 'narrator',
        emotion: 'sorrow',
        sourceType: 'mahabharata-narrative',
        sourceRef: 'Mahabharata — Shalya Parva',
        speaker: { en: 'Mahabharata Narrative', hi: 'महाभारत कथा', te: 'మహాభారత కథనం' },
        text: {
          en: 'With a decisive mace blow shattering Duryodhana’s thigh, the eighteen-day war falls silent over Kurukshetra.',
          hi: 'भीम के निर्णायक गदा प्रहार से दुर्योधन धराशायी होते हैं और अठारह दिनों का महायुद्ध शांत हो जाता है।',
          te: 'భీముని నిర్ణాయక గదా ఘాతంతో దుర్యోధనుడు నేలకొరగగా, పద్దెనిమిది రోజుల మహాభారత యుద్ధం ముగుస్తుంది.',
        },
      },
    ],
    featuredVerses: [],
  },
  {
    id: 'scene-15',
    sceneNumber: 15,
    paddedCode: '15',
    partId: 'part-b',
    warDaysLabel: 'Post-War Epilogue',
    provenanceCategory: 'mahabharata-narrative',
    parvaCitation: 'Mahabharata — Sauptika, Stri & Shanti Parvas',
    durationMs: 24000,
    title: {
      en: 'Aftermath & The Reign of Dharma',
      hi: 'महायुद्ध के पश्चात एवं धर्म-शासन',
      te: 'యుద్ధానంతర శాంతి & ధర్మరాజ్య స్థాపన',
    },
    subtitle: {
      en: 'Ashwatthama’s Night Raid, Sorrow, and Yudhishthira’s Stewardship',
      hi: 'अश्वत्थामा का रात्रि प्रसंग, करुणा और युधिष्ठिर का धर्म-राज्याभिषेक',
      te: 'అశ్వత్థామ రాత్రి ఉదంతం, శోకం మరియు యుధిష్ఠిరుని ధర్మపాలన',
    },
    scripturalScope: {
      en: 'Mahabharata Narrative · Sauptika, Stri & Shanti Parvas',
      hi: 'महाभारत कथा · सौप्तिक, स्त्री व शान्ति पर्व',
      te: 'మహాభారత కథనం · సౌప్తిక, స్త్రీ & శాంతి పర్వాలు',
    },
    chaptersReferenced: 'Sauptika · Stri · Shanti Parvas',
    audioChapterNumber: 18,
    editorialClassification: 'narrative-adaptation',
    atmosphereNote: {
      en: 'Still golden light rises softly over a hushed Kurukshetra, honoring sorrow, forgiveness, and the enduring light of the Gita’s message.',
      hi: 'मौन कुरुक्षेत्र पर शांत सुनहरा प्रभात उदय होता है—करुणा, क्षमा और गीता के शाश्वत ज्ञान को समर्पित।',
      te: 'నిశ్శబ్ద కురుక్షేత్రంపై ప్రశాంత బంగారు ఉదయం వికసిస్తుంది—కరుణ, క్షమ మరియు గీతా సారానికి ప్రతీకగా.',
    },
    cues: [
      {
        id: 's15-c1',
        kind: 'mahabharata-narrative',
        speakerRole: 'narrator',
        emotion: 'sorrow',
        sourceType: 'mahabharata-narrative',
        sourceRef: 'Mahabharata — Sauptika & Stri Parvas',
        speaker: { en: 'Mahabharata Epilogue', hi: 'महाभारत उपसंहार', te: 'మహాభారత ఉపసంహారం' },
        text: {
          en: 'Following Ashwatthama’s tragic nocturnal raid upon the sleeping camp, Draupadi, Gandhari, and Kunti weep together—showing that victory in war leaves every heart bruised by grief.',
          hi: 'अश्वत्थामा के रात्रि आक्रमण के उपरांत द्रौपदी, गांधारी और कुंती का शोक यह सत्य दर्शाता है कि युद्ध की विजय भी करुणा से अछूती नहीं रहती।',
          te: 'అశ్వత్థామ రాత్రి దాడి అనంతరం ద్రౌపది, గాంధారి మరియు కుంతిల శోకం—యుద్ధ విజయం కూడా ఎంతో విషాదాన్ని మిగులుస్తుందని చూపుతుంది.',
        },
      },
      {
        id: 's15-c2',
        kind: 'adaptation',
        speakerRole: 'krishna',
        emotion: 'compassionate',
        sourceType: 'editorial-adaptation',
        sourceRef: 'Shanti Parva Synthesis (Adaptation)',
        speaker: { en: 'Sri Krishna', hi: 'श्रीकृष्ण', te: 'శ్రీకృష్ణుడు' },
        text: {
          en: 'Grieve cleanly without malice, for those who endure must now rebuild the world with compassion, restraint, and living dharma.',
          hi: 'द्वेष से मुक्त होकर करुणा, संयम और लोक-कल्याण के धर्म से नए युग का निर्माण करो।',
          te: 'ద్వేషరహితమైన కరుణ, సంయమనం మరియు ధర్మంతో నవసమాజాన్ని నిర్మించండి.',
        },
      },
      {
        id: 's15-c3',
        kind: 'mahabharata-narrative',
        speakerRole: 'narrator',
        emotion: 'serene',
        sourceType: 'mahabharata-narrative',
        sourceRef: 'Mahabharata — Shanti Parva · Bhishma Counsel',
        speaker: { en: 'Mahabharata Epilogue · Dharmic Reign', hi: 'महाभारत उपसंहार · धर्म-शासन', te: 'మహాభారత ఉపసంహారం · ధర్మపాలన' },
        text: {
          en: 'Receiving final statecraft counsel from Pitamaha Bhishma upon the Bed of Arrows, Yudhishthira begins thirty-six years of dharmic governance—preserving the wisdom of the Gita for all generations.',
          hi: 'शरशय्या पर पितामह भीष्म से राजधर्म का अंतिम ज्ञान प्राप्त कर युधिष्ठिर ने न्यायपूर्ण शासन आरंभ किया और गीता का संदेश युगों तक जीवित रहा।',
          te: 'అంపశయ్యపై ఉన్న భీష్ముని నుండి రాజధర్మం తెలుసుకుని, యుధిష్ఠిరుడు ధర్మపాలన సాగించాడు—గీతా సందేశం యుగయుగాలకు నిలిచింది.',
        },
      },
    ],
    featuredVerses: [],
  },
];
