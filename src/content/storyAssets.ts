import type { LocalizedText } from '../types/cms';

export interface StorySceneAsset {
  sceneId: string;
  sceneNumber: number;
  primaryImageSrc: string;
  fallbackGradient: string;
  objectPosition: string;
  aspectHint: string;
  motionDirection:
    | 'approach'
    | 'intimate-pan'
    | 'radiant-drift'
    | 'cosmic-orbit'
    | 'serene-sweep'
    | 'pull-back'
    | 'horizon-rise';
  continuityNotes: string;
  alt: LocalizedText;
  approvalStatus: 'curated-story-plate';
}

/**
 * Story Asset Manifest (15 Scenes: 01..07 Gita + 08..15 Mahabharata War Days 1..18 & Epilogue)
 * All files are hosted locally under /public/assets/aistudio/ so zero external image URLs are required.
 */
export const STORY_ASSET_MANIFEST: Readonly<Record<string, StorySceneAsset>> = {
  'scene-01': {
    sceneId: 'scene-01',
    sceneNumber: 1,
    primaryImageSrc: '/assets/aistudio/image_a59e30de.png',
    fallbackGradient:
      'radial-gradient(circle at 50% 42%, #D5AC70 0%, #5B4326 32%, #1B2741 72%, #101426 100%)',
    objectPosition: '50% 42%',
    aspectHint: '16:9',
    motionDirection: 'approach',
    continuityNotes:
      'Kurukshetra dawn vista: golden chariot centered between two facing armies, twin white steeds, Krishna and Arjuna seated at golden sunrise.',
    alt: {
      en: 'Lord Krishna and Arjuna seated in the ornate golden chariot drawn by white horses between the two opposing armies at Kurukshetra dawn.',
      hi: 'कुरुक्षेत्र की प्रभात बेला में दोनों सेनाओं के मध्य श्वेत अश्वों से जुड़े दिव्य स्वर्ण रथ में विराजमान श्रीकृष्ण और अर्जुन।',
      te: 'కురుక్షేత్ర ఉషోదయ వేళ రెండు సైన్యాల మధ్య శ్వేత అశ్వాలతో కూడిన స్వర్ణ రథంలో ఆసీనులైన శ్రీకృష్ణుడు మరియు అర్జునుడు.',
    },
    approvalStatus: 'curated-story-plate',
  },
  'scene-02': {
    sceneId: 'scene-02',
    sceneNumber: 2,
    primaryImageSrc: '/assets/aistudio/image_750bf28f.png',
    fallbackGradient:
      'radial-gradient(circle at 38% 45%, #B87B3A 0%, #3E332B 42%, #141A2C 85%, #101426 100%)',
    objectPosition: '55% 32%',
    aspectHint: '3:2',
    motionDirection: 'intimate-pan',
    continuityNotes:
      'Arjuna seated forward in anguish with his Gandiva bow lowered across his lap while Krishna leans gently beside him in golden morning clouds.',
    alt: {
      en: 'Arjuna bowed in sorrow with his Gandiva bow lowered as Lord Krishna places a steadying hand beside him on the chariot.',
      hi: 'गाण्डीव धनुष नीचे रखकर विषाद में डूबे अर्जुन और रथ पर उन्हें धीरज प्रदान करते भगवान श्रीकृष्ण।',
      te: 'గాండీవ ధనుస్సును క్రిందికి దించి విచారంలో మునిగి ఉన్న అర్జునునికి రథంపై అభయమిస్తున్న శ్రీకృష్ణ పరమాత్మ.',
    },
    approvalStatus: 'curated-story-plate',
  },
  'scene-03': {
    sceneId: 'scene-03',
    sceneNumber: 3,
    primaryImageSrc: '/assets/aistudio/image_90d5bfd2.png',
    fallbackGradient:
      'radial-gradient(circle at 34% 40%, #E9AE78 0%, #6A4E2E 38%, #1C2743 76%, #101426 100%)',
    objectPosition: '50% 25%',
    aspectHint: '16:9',
    motionDirection: 'radiant-drift',
    continuityNotes:
      'Krishna seated serenely inside the golden chariot canopy imparting wisdom with uplifted palm while Arjuna kneels in attentive reverence.',
    alt: {
      en: 'Lord Krishna calmly instructing Arjuna with an uplifted open hand in golden morning light aboard the chariot.',
      hi: 'स्वर्ण रथ पर सुनहरे प्रकाश के मध्य शांत भाव से अर्जुन को आत्मज्ञान का उपदेश देते भगवान श्रीकृष्ण।',
      te: 'స్వర్ణ రథంలో ప్రశాంత వదనంతో చేయి ఎత్తి అర్జునునికి దివ్య జ్ఞానాన్ని బోధిస్తున్న శ్రీకృష్ణుడు.',
    },
    approvalStatus: 'curated-story-plate',
  },
  'scene-04': {
    sceneId: 'scene-04',
    sceneNumber: 4,
    primaryImageSrc: '/assets/aistudio/image_40c258eb.png',
    fallbackGradient:
      'radial-gradient(circle at 50% 44%, #F3CD82 0%, #243B59 46%, #101426 85%, #070B16 100%)',
    objectPosition: '50% 42%',
    aspectHint: '1:1',
    motionDirection: 'cosmic-orbit',
    continuityNotes:
      'Devotional representation of the Vishvarupa cosmic revelation framed with luminous galaxies and Arjuna gazing upward in reverent awe.',
    alt: {
      en: 'Devotional depiction of the Universal Form (Vishvarupa) surrounded by luminous galaxies and celestial hosts as Arjuna gazes in awe.',
      hi: 'असंख्य दिव्य रूपों और ब्रह्मांडीय आकाशगंगाओं से युक्त भगवान श्रीकृष्ण के विराट विश्वरूप का भव्य दर्शन।',
      te: 'దివ్యమైన నక్షత్రమండలాలు మరియు అనంత రూపాలతో ప్రకాశించే శ్రీకృష్ణుని విరాట్ విశ్వరూప సందర్శనం.',
    },
    approvalStatus: 'curated-story-plate',
  },
  'scene-05': {
    sceneId: 'scene-05',
    sceneNumber: 5,
    primaryImageSrc: '/assets/aistudio/image_444cdb8d.png',
    fallbackGradient:
      'radial-gradient(circle at 46% 36%, #F3CD82 0%, #7C5B31 35%, #202B48 75%, #101426 100%)',
    objectPosition: '52% 28%',
    aspectHint: '16:9',
    motionDirection: 'serene-sweep',
    continuityNotes:
      'Krishna radiating golden light on the moving chariot with white steeds and Arjuna listening with folded hands.',
    alt: {
      en: 'Lord Krishna radiating serene wisdom on the golden chariot while Arjuna listens with folded hands beneath sunlit skies.',
      hi: 'प्रभात की सुनहरी आभा में दिव्य ज्ञान का प्रकाश बिखेरते श्रीकृष्ण और हाथ जोड़े श्रवण करते अर्जुन।',
      te: 'దివ్య కాంతిపుంజంతో రథంపై ఆశీర్వదించుచున్న శ్రీకృష్ణుడు మరియు భక్తితో ఆలకిస్తున్న అర్జునుడు.',
    },
    approvalStatus: 'curated-story-plate',
  },
  'scene-06': {
    sceneId: 'scene-06',
    sceneNumber: 6,
    primaryImageSrc: '/assets/aistudio/image_da96a03c.png',
    fallbackGradient:
      'radial-gradient(circle at 52% 40%, #D5AC70 0%, #4E453B 38%, #1C2740 76%, #101426 100%)',
    objectPosition: '50% 24%',
    aspectHint: '1:1',
    motionDirection: 'pull-back',
    continuityNotes:
      'Return to the Kurukshetra chariot: Arjuna holds the tall Gandiva bow upright beside Krishna as storm clouds part into golden light.',
    alt: {
      en: 'Arjuna standing aboard the chariot gripping his Gandiva bow with renewed resolve alongside Lord Krishna on the Kurukshetra field.',
      hi: 'कुरुक्षेत्र की रणभूमि पर संदेह से मुक्त होकर गाण्डीव धनुष थामे अर्जुन और उनके साथ विराजमान श्रीकृष्ण।',
      te: 'కురుక్షేత్రంలో సందేహం తొలగి దృఢ సంకల్పంతో గాండీవ ధనుస్సును ధరించిన అర్జునుడు మరియు శ్రీకృష్ణుడు.',
    },
    approvalStatus: 'curated-story-plate',
  },
  'scene-07': {
    sceneId: 'scene-07',
    sceneNumber: 7,
    primaryImageSrc: '/assets/aistudio/image_33a90594.png',
    fallbackGradient:
      'radial-gradient(circle at 65% 38%, #F3CD82 0%, #836137 36%, #202B48 75%, #101426 100%)',
    objectPosition: '46% 30%',
    aspectHint: '16:9',
    motionDirection: 'horizon-rise',
    continuityNotes:
      'Golden dawn opening over the distant mountain horizon as Krishna and Arjuna sit in serene dialogue on the chariot.',
    alt: {
      en: 'Krishna and Arjuna in serene dialogue overlooking a luminous golden horizon, symbolizing timeless clarity and universal harmony.',
      hi: 'सुनहरे क्षितिज की ओर देखते हुए शांत संवाद में लीन श्रीकृष्ण और अर्जुन — शाश्वत स्पष्टता एवं विश्व सद्भाव का प्रतीक।',
      te: 'బంగారు ఉషోదయ క్షితిజం ఎదుట ప్రశాంత సంభాషణలో ఉన్న శ్రీకృష్ణుడు మరియు అర్జునుడు.',
    },
    approvalStatus: 'curated-story-plate',
  },
  'scene-08': {
    sceneId: 'scene-08',
    sceneNumber: 8,
    primaryImageSrc: '/assets/aistudio/image_c82c9fc2.png',
    fallbackGradient:
      'radial-gradient(circle at 50% 42%, #D97D42 0%, #5B3826 40%, #1C2236 78%, #0B0F1F 100%)',
    objectPosition: '50% 45%',
    aspectHint: '16:9',
    motionDirection: 'approach',
    continuityNotes: 'Kurukshetra Days 1–4 opening clash across cavalry, chariots, and elephant divisions.',
    alt: {
      en: 'Massive Pandava and Kaurava battle formations advancing across the misty plains of Kurukshetra on War Days 1–4.',
      hi: 'महाभारत युद्ध के प्रथम चार दिनों में कुरुक्षेत्र के मैदान पर आमने-सामने बढ़ती पाण्डव और कौरव सेनाएँ।',
      te: 'మహాభారత యుద్ధం 1–4 రోజులలో కురుక్షేత్ర మైదానంలో ఎదురుగా కదులుతున్న పాండవ మరియు కౌరవ సేనలు.',
    },
    approvalStatus: 'curated-story-plate',
  },
  'scene-09': {
    sceneId: 'scene-09',
    sceneNumber: 9,
    primaryImageSrc: '/assets/aistudio/image_da96a03c.png',
    fallbackGradient:
      'radial-gradient(circle at 50% 40%, #D97D42 0%, #6A4428 38%, #192038 78%, #0B0F1F 100%)',
    objectPosition: '50% 28%',
    aspectHint: '16:9',
    motionDirection: 'intimate-pan',
    continuityNotes: 'Days 5–9: Bhishma storm & Day 9 Sri Krishna raising a fallen wooden chariot wheel.',
    alt: {
      en: 'Days 5–9 of Kurukshetra depicting Bhishma’s relentless charge and Krishna raising the broken wooden chariot wheel on Day 9.',
      hi: 'युद्ध के पाँचवें से नौवें दिन का प्रसंग — भीष्म का पराक्रम और नौवें दिन श्रीकृष्ण द्वारा टूटा रथ-चक्र उठाने का दृश्य।',
      te: '5–9వ రోజుల యుద్ధం — భీష్ముని వీరవిహారం మరియు 9వ రోజున శ్రీకృష్ణుడు రథచక్రాన్ని ఎత్తిన ఘట్టం.',
    },
    approvalStatus: 'curated-story-plate',
  },
  'scene-10': {
    sceneId: 'scene-10',
    sceneNumber: 10,
    primaryImageSrc: '/assets/aistudio/image_750bf28f.png',
    fallbackGradient:
      'radial-gradient(circle at 50% 45%, #B8764C 0%, #4A3830 42%, #181D32 80%, #0B0F1F 100%)',
    objectPosition: '50% 35%',
    aspectHint: '16:9',
    motionDirection: 'pull-back',
    continuityNotes: 'Day 10 dusk stillness as Pitamaha Bhishma rests upon the Shara-Shayya Bed of Arrows.',
    alt: {
      en: 'Day 10 dusk on Kurukshetra as Pitamaha Bhishma reclines calmly upon the Bed of Arrows.',
      hi: 'दसवें दिन की संध्या में शरशय्या पर शांत भाव से विराजमान पितामह भीष्म।',
      te: '10వ రోజు సాయంత్రం అంపశయ్యపై ప్రశాంతంగా విశ్రమించిన పితామహ భీష్ముడు.',
    },
    approvalStatus: 'curated-story-plate',
  },
  'scene-11': {
    sceneId: 'scene-11',
    sceneNumber: 11,
    primaryImageSrc: '/assets/aistudio/image_c82c9fc2.png',
    fallbackGradient:
      'radial-gradient(circle at 50% 44%, #C96A3A 0%, #4E2F26 42%, #171D34 80%, #0B0F1F 100%)',
    objectPosition: '50% 50%',
    aspectHint: '16:9',
    motionDirection: 'cosmic-orbit',
    continuityNotes: 'Days 11–13: Acharya Drona commands the rotating seven-ring Chakravyuha breached by Abhimanyu.',
    alt: {
      en: 'The seven-ring Chakravyuha formation wheeling across Kurukshetra on Day 13 as Abhimanyu enters the breach.',
      hi: 'तेरहवें दिन का घूमता चक्रव्यूह और वीर अभिमन्यु का प्रवेश।',
      te: '13వ రోజున తిరుగుతున్న చక్రవ్యూహం మరియు వీరాభిమన్యుడి ప్రవేశం.',
    },
    approvalStatus: 'curated-story-plate',
  },
  'scene-12': {
    sceneId: 'scene-12',
    sceneNumber: 12,
    primaryImageSrc: '/assets/aistudio/image_40c258eb.png',
    fallbackGradient:
      'radial-gradient(circle at 50% 44%, #FF8C28 0%, #3E2218 38%, #0E1326 78%, #060914 100%)',
    objectPosition: '50% 45%',
    aspectHint: '16:9',
    motionDirection: 'radiant-drift',
    continuityNotes: 'Day 14 sunset vow over Jayadratha followed by torch-lit nocturnal conflict led by Ghatotkacha.',
    alt: {
      en: 'Day 14 twilight eclipse and torch-lit nocturnal battle under Ghatotkacha’s fierce sky assault.',
      hi: 'चौदहवें दिन का सूर्यास्त संकल्प और रात्रि में मशालों के प्रकाश में घटोत्कच का महासंग्राम।',
      te: '14వ రోజు సంధ్యాసమయ ప్రతిజ్ఞ మరియు దివిటీల వెలుగులో ఘటోత్కచుడి రాత్రి యుద్ధం.',
    },
    approvalStatus: 'curated-story-plate',
  },
  'scene-13': {
    sceneId: 'scene-13',
    sceneNumber: 13,
    primaryImageSrc: '/assets/aistudio/image_da96a03c.png',
    fallbackGradient:
      'radial-gradient(circle at 50% 42%, #C9552D 0%, #5A2E22 42%, #1B1124 80%, #090C1A 100%)',
    objectPosition: '50% 30%',
    aspectHint: '16:9',
    motionDirection: 'serene-sweep',
    continuityNotes: 'Days 15–17: Fall of Drona and the legendary archery duel of Karna and Arjuna culminating in Day 17.',
    alt: {
      en: 'Days 16–17 chariot confrontation between Angaraja Karna and Arjuna beneath crimson evening skies.',
      hi: 'सोलहवें व सत्रहवें दिन कर्ण और अर्जुन के बीच ऐतिहासिक रथ-द्वंद्व।',
      te: '16–17 రోజులలో కర్ణుడు మరియు అర్జునుడి మధ్య జరిగిన అద్భుత రథ ద్వంద్వ యుద్ధం.',
    },
    approvalStatus: 'curated-story-plate',
  },
  'scene-14': {
    sceneId: 'scene-14',
    sceneNumber: 14,
    primaryImageSrc: '/assets/aistudio/image_c82c9fc2.png',
    fallbackGradient:
      'radial-gradient(circle at 50% 42%, #B8764C 0%, #4A3129 42%, #1A1E33 80%, #0B0F1F 100%)',
    objectPosition: '50% 48%',
    aspectHint: '16:9',
    motionDirection: 'pull-back',
    continuityNotes: 'Day 18 final mace duel (Gada-Yuddha) between Bhima and Duryodhana.',
    alt: {
      en: 'Day 18 decisive mace confrontation (Gada-Yuddha) between Bhima and Duryodhana at dusk.',
      hi: 'अठारहवें दिन भीम और दुर्योधन के मध्य निर्णायक गदायुद्ध।',
      te: '18వ రోజున భీముడు మరియు దుర్యోధనుడి మధ్య జరిగిన నిర్ణాయక గదాయుద్ధం.',
    },
    approvalStatus: 'curated-story-plate',
  },
  'scene-15': {
    sceneId: 'scene-15',
    sceneNumber: 15,
    primaryImageSrc: '/assets/aistudio/image_33a90594.png',
    fallbackGradient:
      'radial-gradient(circle at 60% 38%, #F3CD82 0%, #7C5C36 38%, #1C2743 76%, #0D1224 100%)',
    objectPosition: '50% 32%',
    aspectHint: '16:9',
    motionDirection: 'horizon-rise',
    continuityNotes: 'Post-war aftermath, Ashwatthama episode, and Yudhishthira ascending in sorrow toward dharmic stewardship.',
    alt: {
      en: 'Quiet golden dawn after the eighteen-day war, honoring remembrance, peace, and dharmic stewardship.',
      hi: 'अठारह दिवसीय महायुद्ध के उपरांत शांति, करुणा और धर्म-शासन का प्रभात।',
      te: '18 రోజుల మహాభారత యుద్ధం అనంతరం శాంతి మరియు ధర్మ పాలన ఉదయం.',
    },
    approvalStatus: 'curated-story-plate',
  },
};

export const STORY_ASSET_LIST: ReadonlyArray<StorySceneAsset> = Object.values(STORY_ASSET_MANIFEST);

export function getStorySceneAsset(sceneId: string): StorySceneAsset {
  return STORY_ASSET_MANIFEST[sceneId] ?? STORY_ASSET_MANIFEST['scene-01'];
}
