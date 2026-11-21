import type { LocalizedText } from '../types/cms';
import type { StoryPartId } from '../three/story/storyTimeline';
import {
  buildVisemeTimelineFromTranscript,
  type DialogueAudioTrack,
  type DialogueSourceType,
  type DialogueSpeakerId,
  type FacialEmotionState,
} from '../three/story/visemeTimeline';
import {
  CHARACTER_REGISTRY,
  MAHABHARATA_18_DAYS,
  MAHABHARATA_WAR_SCENES,
} from './mahabharataWarData';

export interface StoryNarrationCue {
  id: string;
  kind: 'adaptation' | 'scripture' | 'mahabharata-narrative';
  speakerRole?: DialogueSpeakerId;
  emotion?: FacialEmotionState;
  sourceType?: DialogueSourceType;
  sourceRef?: string;
  speaker: LocalizedText;
  text: LocalizedText;
}

export interface StoryScriptureItem {
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

export interface StoryTeachingPillar {
  id: string;
  sanskritTerm: string;
  title: LocalizedText;
  summary: LocalizedText;
  verseRef: string;
  sanskritQuote: string;
  translation: LocalizedText;
}

export interface StorySceneRecord {
  id: string;
  sceneNumber: number;
  paddedCode: string;
  partId?: StoryPartId;
  warDaysLabel?: string;
  provenanceCategory?: 'bhagavad-gita-scripture' | 'mahabharata-narrative' | 'visual-interpretation';
  parvaCitation?: string;
  durationMs: number;
  title: LocalizedText;
  subtitle: LocalizedText;
  scripturalScope: LocalizedText;
  chaptersReferenced: string;
  audioChapterNumber: number;
  editorialClassification: 'narrative-adaptation';
  atmosphereNote: LocalizedText;
  cues: ReadonlyArray<StoryNarrationCue>;
  featuredVerses: ReadonlyArray<StoryScriptureItem>;
  teachingPillars?: ReadonlyArray<StoryTeachingPillar>;
  eternalValues?: ReadonlyArray<{ id: string; title: LocalizedText; note: LocalizedText }>;
}

export const STORY_SOURCE_PROVENANCE = {
  sanskritEdition: {
    en: 'Canonical Bhagavad Gita Vulgate Edition (700 Shlokas across 18 Chapters)',
    hi: 'प्रामाणिक श्रीमद्भगवद्गीता मूल संस्कृत पाठ (१८ अध्याय, ७०० श्लोक)',
    te: 'ప్రామాణిక శ్రీమద్భగవద్గీత మూల సంస్కృత పాఠము (18 అధ్యాయాలు, 700 శ్లోకాలు)',
  },
  narrationPolicy: {
    en: 'Narrative commentary is clearly marked as an original editorial adaptation connecting the dialogue across the 7 story sequences; Sanskrit shlokas are presented verbatim with chapter-and-verse citations.',
    hi: 'कथात्मक विवरण को स्पष्ट रूप से मूल संपादकीय रूपांतरण के रूप में दर्शाया गया है, जबकि संस्कृत श्लोक अध्याय एवं श्लोक संख्या सहित मूल रूप में प्रस्तुत हैं।',
    te: 'కథన వివరణను స్పష్టంగా సంపాదకీయ అనుసరణగా పేర్కొనడం జరిగింది; సంస్కృత శ్లోకాలు అధ్యాయ మరియు శ్లోక సంఖ్యలతో మూలరూపంలో ఇవ్వబడ్డాయి.',
  },
  approvalRecord: {
    en: 'Editorial & Scriptural Continuity Record · Version 2026-11 · Bhagavad Gita Vishwa Mahotsav 2027',
    hi: 'संपादकीय एवं शास्त्र-निष्ठा अभिलेख · संस्करण 2026-11 · भगवद्गीता विश्व महोत्सव 2027',
    te: 'సంపాదకీయ మరియు శాస్త్ర ప్రమాణ పత్రం · సంచిక 2026-11 · భగవద్గీత విశ్వ మహోత్సవం 2027',
  },
} as const;

export const PART_A_GITA_SCENES: ReadonlyArray<StorySceneRecord> = [
  {
    id: 'scene-01',
    sceneNumber: 1,
    paddedCode: '01',
    durationMs: 22000,
    title: {
      en: 'The Battlefield of Kurukshetra',
      hi: 'कुरुक्षेत्र की रणभूमि',
      te: 'కురుక్షేత్ర యుద్ధభూమి',
    },
    subtitle: {
      en: 'Dawn Before the Conch Sounds',
      hi: 'महायुद्ध से पूर्व प्रभात की निस्तब्ध बेला',
      te: 'మహాసంగ్రామానికి ముందు ఉషోదయ క్షణం',
    },
    scripturalScope: {
      en: 'Bhagavad Gita Chapter 1',
      hi: 'श्रीमद्भगवद्गीता अध्याय १',
      te: 'భగవద్గీత అధ్యాయము 1',
    },
    chaptersReferenced: 'Chapter 1',
    audioChapterNumber: 1,
    editorialClassification: 'narrative-adaptation',
    atmosphereNote: {
      en: 'Distant morning mist rises across the vast plain as twin armies stand arrayed and sacred conches echo across the horizon.',
      hi: 'कुरुक्षेत्र के विशाल मैदान में प्रातःकालीन धुंध के बीच दोनों सेनाएँ आमने-सामने खड़ी हैं और आकाश में शंखनाद गूँजने को तत्पर है।',
      te: 'కురుక్షేత్ర మహామైదానంలో ఉదయపు మంచు తెరల మధ్య రెండు సేనలు ఎదురెదురుగా నిలిచి శంఖనాదానికి సిద్ధంగా ఉన్నాయి.',
    },
    cues: [
      {
        id: 's1-c1',
        kind: 'adaptation',
        speaker: { en: 'Narrative Adaptation', hi: 'कथात्मक विवरण', te: 'కథన వివరణ' },
        text: {
          en: 'On the sacred plain of Kurukshetra, two great hosts stand facing one another at daybreak, their standards lifted against the rising sun.',
          hi: 'धर्मभूमि कुरुक्षेत्र के विशाल प्रांगण में सूर्योदय के साथ दो महासेनाएँ अपने-अपने ध्वज लिए आमने-सामने खड़ी हैं।',
          te: 'ధర్మక్షేత్రమైన కురుక్షేత్రంలో ఉదయిస్తున్న సూర్యుని వెలుగులో రెండు మహా సైన్యాలు ఎదురెదురుగా నిలిచాయి.',
        },
      },
      {
        id: 's1-c2',
        kind: 'adaptation',
        speaker: { en: 'Narrative Adaptation', hi: 'कथात्मक विवरण', te: 'కథన వివరణ' },
        text: {
          en: 'Between them rolls a radiant white-steeded chariot—Arjuna the warrior beside Sri Krishna, his charioteer and quiet guide—before the first arrow is ever drawn.',
          hi: 'युद्ध आरंभ होने से पहले ही, उन दोनों सेनाओं के मध्य श्वेत अश्वों वाला दिव्य रथ पहुँचता है—जिसमें योद्धा अर्जुन और उनके सारथी श्रीकृष्ण विराजमान हैं।',
          te: 'మొదటి బాణం సంధించక ముందే, ఆ రెండు సేనల మధ్య శ్వేత అశ్వాల దివ్య రథం నిలుస్తుంది—అందులో వీరుడు అర్జునుడు మరియు సారథి శ్రీకృష్ణుడు ఆసీనులై ఉన్నారు.',
        },
      },
      {
        id: 's1-c3',
        kind: 'scripture',
        speaker: { en: 'Bhagavad Gita 1.1', hi: 'भगवद्गीता १.१', te: 'భగవద్గీత 1.1' },
        text: {
          en: '“On the sacred field of Kurukshetra, gathered together eager for battle, what did my sons and the sons of Pandu do, O Sanjaya?”',
          hi: '“हे संजय! धर्मभूमि कुरुक्षेत्र में युद्ध की इच्छा से एकत्रित हुए मेरे और पाण्डु के पुत्रों ने क्या किया?”',
          te: '“ఓ సంజయా! ధర్మక్షేత్రమైన కురుక్షేత్రములో యుద్ధోత్సాహముతో చేరిన నా కుమారులు మరియు పాండవులు ఏమి చేసిరి?”',
        },
      },
    ],
    featuredVerses: [
      {
        id: 'story-bg-1-1',
        chapter: 1,
        verse: '1',
        reference: 'Bhagavad Gita 1.1',
        sanskritDevanagari:
          'धर्मक्षेत्रे कुरुक्षेत्रे समवेता युयुत्सवः ।\nमामकाः पाण्डवाश्चैव किमकुर्वत सञ्जय ॥',
        transliteration:
          'dharma-kṣetre kuru-kṣetre samavetā yuyutsavaḥ |\nmāmakāḥ pāṇḍavāś caiva kim akurvata sañjaya ||',
        translation: {
          en: 'Dhritarashtra asked: On the sacred field of Kurukshetra, gathered together eager for battle, what did my sons and the sons of Pandu do, O Sanjaya?',
          hi: 'धृतराष्ट्र ने कहा: हे संजय! धर्मभूमि कुरुक्षेत्र में युद्ध की इच्छा से एकत्रित हुए मेरे और पाण्डु के पुत्रों ने क्या किया?',
          te: 'ధృతరాష్ట్రుడు అడిగెను: ఓ సంజయా! ధర్మక్షేత్రమైన కురుక్షేత్రములో యుద్ధోత్సాహముతో చేరిన నా కుమారులు మరియు పాండవులు ఏమి చేసిరి?',
        },
        sourceEdition: STORY_SOURCE_PROVENANCE.sanskritEdition,
        editorialStatus: 'canonical-reference',
      },
    ],
  },
  {
    id: 'scene-02',
    sceneNumber: 2,
    paddedCode: '02',
    durationMs: 24000,
    title: {
      en: 'Arjuna’s Dilemma',
      hi: 'अर्जुन का नैतिक द्वंद्व',
      te: 'అర్జునుని విషాదము',
    },
    subtitle: {
      en: 'When Duty Collides with Deepest Affection',
      hi: 'कर्तव्य और ममत्व के मध्य गहन मानवीय संकट',
      te: 'కర్తవ్యానికి మరియు ఆత్మీయతకు మధ్య మథనం',
    },
    scripturalScope: {
      en: 'Bhagavad Gita Chapter 1, vv. 20–47',
      hi: 'श्रीमद्भगवद्गीता अध्याय १, श्लोक २०–४७',
      te: 'భగవద్గీత అధ్యాయము 1, శ్లోకాలు 20–47',
    },
    chaptersReferenced: 'Chapter 1 (vv. 20–47)',
    audioChapterNumber: 1,
    editorialClassification: 'narrative-adaptation',
    atmosphereNote: {
      en: 'The clamor of the battlefield recedes into silence as Arjuna’s gaze rests upon his teachers, elders, kinsmen, and lifelong companions.',
      hi: 'रणभूमि का कोलाहल मानो शांत हो जाता है जब अर्जुन की दृष्टि अपने गुरुजनों, पितामहों, संबंधियों और मित्रों पर ठहरती है।',
      te: 'ఎదురుగా ఉన్న గురువులు, పెద్దలు, బంధువులు మరియు మిత్రులను చూసి అర్జునుని చుట్టూ యుద్ధ ఘోష మౌనమైపోతుంది.',
    },
    cues: [
      {
        id: 's2-c1',
        kind: 'adaptation',
        speaker: { en: 'Narrative Adaptation', hi: 'कथात्मक विवरण', te: 'కథన వివరణ' },
        text: {
          en: 'As Krishna draws the chariot to the very center between the lines, Arjuna does not see anonymous foes—he beholds Bhishma, Drona, elders, and beloved kin.',
          hi: 'जब श्रीकृष्ण रथ को दोनों सेनाओं के ठीक मध्य खड़ा करते हैं, तब अर्जुन को कोई अपरिचित शत्रु नहीं, बल्कि भीष्म, द्रोण, गुरुजन और अपने ही स्वजन दिखाई देते हैं।',
          te: 'శ్రీకృష్ణుడు రథాన్ని ఇరు సేనల మధ్య నిలిపినప్పుడు, అర్జునునికి అక్కడ శత్రువులు కాదు—భీష్ముడు, ద్రోణుడు, గురువులు మరియు తన ఆత్మీయులే కనిపిస్తారు.',
        },
      },
      {
        id: 's2-c2',
        kind: 'adaptation',
        speaker: { en: 'Narrative Adaptation', hi: 'कथात्मक विवरण', te: 'కథన వివరణ' },
        text: {
          en: 'Overwhelmed by sorrow and moral anguish, his limbs tremble, the celebrated Gandiva bow slips from his grasp, and he sits down in silence.',
          hi: 'करुणा और गहन नैतिक पीड़ा से विह्वल होकर उनके अंग शिथिल पड़ जाते हैं, गाण्डीव धनुष हाथ से छूटने लगता है और वे रथ के पिछले भाग में बैठ जाते हैं।',
          te: 'అమితమైన కరుణ మరియు ధర్మ సందేహంతో అతని శరీరం కంపిస్తుంది, గాండీవ ధనుస్సు చేతి నుండి జారిపోగా అర్జునుడు నిశ్శబ్దంగా కూలబడతాడు.',
        },
      },
      {
        id: 's2-c3',
        kind: 'scripture',
        speaker: { en: 'Bhagavad Gita 1.28–30', hi: 'भगवद्गीता १.२८–३०', te: 'భగవద్గీత 1.28–30' },
        text: {
          en: '“Seeing these my own kinsmen arrayed and eager for battle, O Krishna, my limbs fail me, my mouth grows dry, and my bow slips from my hand.”',
          hi: '“हे कृष्ण! युद्ध की इच्छा से उपस्थित अपने इन स्वजनों को देखकर मेरे अंग शिथिल हो रहे हैं, मुख सूख रहा है और हाथ से गाण्डीव धनुष गिर रहा है।”',
          te: '“ఓ కృష్ణా! యుద్ధోన్ముఖులై నిలిచిన ఈ నా స్వజనులను చూసి నా అవయవాలు పట్టు తప్పుతున్నాయి, నోరు ఎండిపోతోంది, చేతిలోని గాండీవం జారిపోతోంది.”',
        },
      },
    ],
    featuredVerses: [
      {
        id: 'story-bg-1-28',
        chapter: 1,
        verse: '28',
        reference: 'Bhagavad Gita 1.28',
        sanskritDevanagari:
          'दृष्ट्वेमं स्वजनं कृष्ण युयुत्सुं समुपस्थितम् ।\nसीदन्ति मम गात्राणि मुखं च परिशुष्यति ॥',
        transliteration:
          'dṛṣṭvemaṁ svajanaṁ kṛṣṇa yuyutsuṁ samupasthitam |\nsīdanti mama gātrāṇi mukhaṁ ca pariśuṣyati ||',
        translation: {
          en: 'Arjuna said: Seeing these my own kinsmen standing eager for battle, O Krishna, my limbs give way and my mouth grows parched.',
          hi: 'अर्जुन ने कहा: हे कृष्ण! युद्ध के लिए उपस्थित अपने इन स्वजनों को देखकर मेरे अंग शिथिल हो रहे हैं और मुख सूख रहा है।',
          te: 'అర్జునుడు పలికెను: ఓ కృష్ణా! యుద్ధానికి సిద్ధమై నిలిచిన నా ఈ బంధుజనాన్ని చూసి నా అవయవాలు సడలిపోతున్నాయి మరియు నోరు ఎండిపోతోంది.',
        },
        sourceEdition: STORY_SOURCE_PROVENANCE.sanskritEdition,
        editorialStatus: 'canonical-reference',
      },
    ],
  },
  {
    id: 'scene-03',
    sceneNumber: 3,
    paddedCode: '03',
    durationMs: 28000,
    title: {
      en: 'The Divine Teaching Begins',
      hi: 'दिव्य उपदेश का शुभारंभ',
      te: 'దివ్య గీతోపదేశ ప్రారంభం',
    },
    subtitle: {
      en: 'From Sorrow to the Science of the Self and Action',
      hi: 'विषाद से आत्मज्ञान, कर्तव्य और समत्व योग की ओर',
      te: 'విషాదం నుండి ఆత్మతత్వం, కర్తవ్యం మరియు సమత్వ బోధనకు',
    },
    scripturalScope: {
      en: 'Bhagavad Gita Chapters 2–6',
      hi: 'श्रीमद्भगवद्गीता अध्याय २–६',
      te: 'భగవద్గీత అధ్యాయాలు 2–6',
    },
    chaptersReferenced: 'Chapters 2–6',
    audioChapterNumber: 2,
    editorialClassification: 'narrative-adaptation',
    atmosphereNote: {
      en: 'Golden morning light warms the chariot banners as Sri Krishna begins answering Arjuna’s deepest human perplexity with tranquil clarity.',
      hi: 'सुनहरे प्रभात प्रकाश के बीच भगवान श्रीकृष्ण शांत, करुणामय स्वर में अर्जुन के गहन प्रश्नों का उत्तर देना आरंभ करते हैं।',
      te: 'బంగారు ఉదయపు కాంతిలో శ్రీకృష్ణ పరమాత్మ ప్రశాంత చిత్తంతో అర్జునుని మానసిక వేదనకు దివ్య జ్ఞానంతో సమాధానం చెప్పడం ప్రారంభిస్తాడు.',
    },
    cues: [
      {
        id: 's3-c1',
        kind: 'adaptation',
        speaker: { en: 'Narrative Adaptation', hi: 'कथात्मक विवरण', te: 'కథన వివరణ' },
        text: {
          en: 'When Arjuna asks as a humble disciple for clarity, Sri Krishna smiles gently—illuminating first what is imperishable within every being, and what rises and passes like seasons.',
          hi: 'जब अर्जुन विनम्र शिष्य बनकर मार्गदर्शन की याचना करते हैं, तब श्रीकृष्ण मंद मुस्कान के साथ प्रत्येक प्राणी में विद्यमान अविनाशी आत्मा और नश्वर परिस्थितियों का भेद स्पष्ट करते हैं।',
          te: 'అర్జునుడు వినమ్ర శిష్యునిగా మార్గదర్శకత్వం కోరినప్పుడు, శ్రీకృష్ణుడు చిరునవ్వుతో ప్రతి జీవిలో ఉన్న నాశనరహితమైన ఆత్మతత్వాన్ని ముందుగా వివరిస్తాడు.',
        },
      },
      {
        id: 's3-c2',
        kind: 'scripture',
        speaker: { en: 'Bhagavad Gita 2.47', hi: 'भगवद्गीता २.४७', te: 'భగవద్గీత 2.47' },
        text: {
          en: '“Your rightful sphere is action alone, never anxiety over its fruits; let not the reward be your sole motive, nor yield ever to inaction.”',
          hi: '“तुम्हारा अधिकार केवल कर्तव्य-कर्म करने में है, उसके फलों में कभी नहीं; न कर्मफल के हेतु बनो और न ही अकर्मण्यता में आसक्त हो।”',
          te: '“కర్మలు ఆచరించడంలో మాత్రమే నీకు అధికారం ఉన్నది, ఫలితాలపై ఎన్నడూ కాదు; కర్మఫల ఆపేక్షతో కాకుండా కర్తవ్యాన్ని నిర్వర్తించుము.”',
        },
      },
      {
        id: 's3-c3',
        kind: 'adaptation',
        speaker: { en: 'Narrative Adaptation', hi: 'कथात्मक विवरण', te: 'కథన వివరణ' },
        text: {
          en: 'Across Chapters Two through Six, Krishna weaves five enduring pillars: knowing the eternal Self, honoring duty, acting without selfish fear, cultivating wisdom, and resting in equanimity.',
          hi: 'दूसरे से छठे अध्याय तक श्रीकृष्ण पाँच आधारभूत स्तंभ स्थापित करते हैं: आत्मा का स्वरूप, स्वधर्म, निष्काम कर्म, विवेक-ज्ञान और सुख-दुःख में समत्व भाव।',
          te: 'రెండవ అధ్యాయం నుండి ఆరవ అధ్యాయం వరకు శ్రీకృష్ణుడు ఆత్మతత్వం, కర్తవ్యం, నిష్కామ కర్మ, వివేక జ్ఞానం మరియు సమత్వ బుద్ధి అనే ఐదు స్తంభాలను బోధిస్తాడు.',
        },
      },
    ],
    featuredVerses: [
      {
        id: 'story-bg-2-20',
        chapter: 2,
        verse: '20',
        reference: 'Bhagavad Gita 2.20',
        sanskritDevanagari:
          'न जायते म्रियते वा कदाचिन्नायं भूत्वा भविता वा न भूयः ।\nअजो नित्यः शाश्वतोऽयं पुराणो न हन्यते हन्यमाने शरीरे ॥',
        transliteration:
          'na jāyate mriyate vā kadācin nāyaṁ bhūtvā bhavitā vā na bhūyaḥ |\najo nityaḥ śāśvato ’yaṁ purāṇo na hanyate hanyamāne śarīre ||',
        translation: {
          en: 'The Self is never born nor does it ever die; unborn, eternal, everlasting, and primeval, it is not slain when the body is slain.',
          hi: 'यह आत्मा न कभी जन्म लेती है और न कभी मरती है; यह अजन्मा, नित्य, शाश्वत और पुरातन है—शरीर के नष्ट होने पर भी इसका नाश नहीं होता।',
          te: 'ఆత్మకు ఎన్నడూ జనన మరణాలు లేవు; అది పుట్టుక లేనిది, నిత్యమైనది, శాశ్వతమైనది మరియు శరీరం నశించినా నశించనిది.',
        },
        sourceEdition: STORY_SOURCE_PROVENANCE.sanskritEdition,
        editorialStatus: 'canonical-reference',
      },
      {
        id: 'story-bg-2-48',
        chapter: 2,
        verse: '48',
        reference: 'Bhagavad Gita 2.48',
        sanskritDevanagari:
          'योगस्थः कुरु कर्माणि सङ्गं त्यक्त्वा धनञ्जय ।\nसिद्ध्यसिद्ध्योः समो भूत्वा समत्वं योग उच्यते ॥',
        transliteration:
          'yoga-sthaḥ kuru karmāṇi saṅgaṁ tyaktvā dhanañjaya |\nsiddhy-asiddhyoḥ samo bhūtvā samatvaṁ yoga ucyate ||',
        translation: {
          en: 'Steadfast in yoga, perform your duties relinquishing attachment, O Dhananjaya, remaining balanced in success and failure—this evenness of mind is called yoga.',
          hi: 'हे धनंजय! आसक्ति का त्याग कर, सिद्धि और असिद्धि में समान रहते हुए योग में स्थित होकर कर्म करो—मन की यह समता ही योग कहलाती है।',
          te: 'ఓ ధనంజయా! ఆసక్తిని విడిచి, జయాపజయాలలో సమభావంతో యోగనిష్ఠుడవై కర్మలను ఆచరించుము—ఈ సమత్వమే యోగమని చెప్పబడుతుంది.',
        },
        sourceEdition: STORY_SOURCE_PROVENANCE.sanskritEdition,
        editorialStatus: 'canonical-reference',
      },
    ],
    teachingPillars: [
      {
        id: 'pillar-self',
        sanskritTerm: 'आत्मतत्त्व (Atman)',
        title: { en: 'Nature of the Self', hi: 'आत्मा का स्वरूप', te: 'ఆత్మ తత్వము' },
        summary: {
          en: 'Beyond changing circumstances lies an unshakeable inner awareness—unborn, enduring, and untouched by temporal sorrow.',
          hi: 'परिवर्तनशील परिस्थितियों से परे प्रत्येक प्राणी में अजन्मा, नित्य और अविनाशी आत्मचेतना विद्यमान है।',
          te: 'మారే పరిస్థితులకు అతీతంగా ప్రతి వ్యక్తిలో శాశ్వతమైన, నాశనరహితమైన ఆత్మచైతన్యం ఉంటుంది.',
        },
        verseRef: 'Bhagavad Gita 2.20',
        sanskritQuote: 'अजो नित्यः शाश्वतोऽयं पुराणो न हन्यते हन्यमाने शरीरे ॥',
        translation: {
          en: 'Unborn, eternal, changeless, and ancient, the Self is never destroyed when the body perishes.',
          hi: 'यह अजन्मा, नित्य, शाश्वत और पुरातन आत्मा शरीर के नाश होने पर भी नष्ट नहीं होती।',
          te: 'పుట్టుక లేనిది, నిత్యమైనది, శాశ్వతమైనది అయిన ఆత్మ శరీరం నశించినా నశించదు.',
        },
      },
      {
        id: 'pillar-duty',
        sanskritTerm: 'स्वधर्म (Svadharma)',
        title: { en: 'Duty & Moral Responsibility', hi: 'कर्तव्य एवं स्वधर्म', te: 'కర్తవ్యం & స్వధర్మం' },
        summary: {
          en: 'True peace does not come from escaping one’s ethical responsibility, but from meeting one’s calling with integrity.',
          hi: 'वास्तविक शांति अपने नैतिक दायित्व से पलायन में नहीं, बल्कि सत्यनिष्ठा के साथ कर्तव्य निभाने में निहित है।',
          te: 'నిజమైన శాంతి బాధ్యతల నుండి పారిపోవడంలో కాదు, ధర్మబద్ధంగా కర్తవ్యాన్ని నిర్వర్తించడంలో ఉంది.',
        },
        verseRef: 'Bhagavad Gita 3.19',
        sanskritQuote: 'तस्मादसक्तः सततं कार्यं कर्म समाचर ।',
        translation: {
          en: 'Therefore, unattached, constantly perform the rightful duty that ought to be done.',
          hi: 'अतः आसक्ति से रहित होकर निरंतर अपना कर्तव्य-कर्म भली-भांति करो।',
          te: 'కావున ఆసక్తి రహితుడవై నీ కర్తవ్య కర్మను నిరంతరం ఆచరించుము.',
        },
      },
      {
        id: 'pillar-action',
        sanskritTerm: 'निष्काम कर्म (Karma Yoga)',
        title: { en: 'Right Action', hi: 'निष्काम कर्मयोग', te: 'నిష్కామ కర్మ' },
        summary: {
          en: 'Give full excellence and sincerity to every act without clinging anxiously to personal outcomes.',
          hi: 'व्यक्तिगत फल की व्याकुल चिंता छोड़कर प्रत्येक कर्म में अपनी पूर्ण निष्ठा और कौशल समर्पित करना।',
          te: 'ఫలితంపై వ్యామోహం లేకుండా ప్రతి కర్మను పూర్తి నైపుణ్యంతో, నిష్ఠతో నిర్వర్తించడం.',
        },
        verseRef: 'Bhagavad Gita 2.47',
        sanskritQuote: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन ।',
        translation: {
          en: 'Your rightful sphere is action alone, never anxiety over its fruits.',
          hi: 'तुम्हारा अधिकार केवल कर्म करने में है, उसके फलों की चिंता में कभी नहीं।',
          te: 'కర్మలు చేయడంలో మాత్రమే నీకు అధికారం ఉంది, వాటి ఫలితాలపై కాదు.',
        },
      },
      {
        id: 'pillar-wisdom',
        sanskritTerm: 'प्रज्ञा (Wisdom)',
        title: { en: 'Discriminating Wisdom', hi: 'विवेक एवं ज्ञान', te: 'వివేక జ్ఞానం' },
        summary: {
          en: 'Insight clarifies illusion, harmonizes action with reflection, and frees the heart from narrow fear.',
          hi: 'सत्य विवेक भ्रम को मिटाता है, कर्म को चिंतन से जोड़ता है और हृदय को भय से मुक्त करता है।',
          te: 'సద్వివేకం అజ్ఞానాన్ని తొలగించి, కర్మను జ్ఞానంతో అనుసంధానించి భయాలను దూరం చేస్తుంది.',
        },
        verseRef: 'Bhagavad Gita 4.38',
        sanskritQuote: 'न हि ज्ञानेन सदृशं पवित्रमिह विद्यते ।',
        translation: {
          en: 'In this world, there is indeed nothing as purifying as true wisdom.',
          hi: 'इस संसार में ज्ञान के समान पवित्र करने वाला दूसरा कोई साधन नहीं है।',
          te: 'ఈ లోకంలో జ్ఞానానికి సమానమైన పవిత్రమైనది మరేదీ లేదు.',
        },
      },
      {
        id: 'pillar-equanimity',
        sanskritTerm: 'समत्वम् (Equanimity)',
        title: { en: 'Equanimity of Mind', hi: 'समत्व बुद्धि', te: 'సమత్వ బుద్ధి' },
        summary: {
          en: 'Standing balanced amidst praise and blame, triumph and loss, turns ordinary life into living yoga.',
          hi: 'सुख-दुःख और सफलता-विफलता में संतुलित बने रहना ही जीवन को योग बना देता है।',
          te: 'జయాపజయాలలో మరియు సుఖదుఃఖాలలో మనస్సును సమతుల్యంగా ఉంచుకోవడమే నిజమైన యోగం.',
        },
        verseRef: 'Bhagavad Gita 2.48',
        sanskritQuote: 'सिद्ध्यसिद्ध्योः समो भूत्वा समत्वं योग उच्यते ॥',
        translation: {
          en: 'Remaining even-minded in success and failure—this balance is called yoga.',
          hi: 'सिद्धि और असिद्धि में सम रहना ही योग कहलाता है।',
          te: 'సఫలత మరియు విఫలతలలో సమభావంతో ఉండడమే యోగం.',
        },
      },
    ],
  },
  {
    id: 'scene-04',
    sceneNumber: 4,
    paddedCode: '04',
    durationMs: 26000,
    title: {
      en: 'The Universal Vision',
      hi: 'विराट विश्वरूप दर्शन',
      te: 'విరాట్ విశ్వరూప సందర్శనం',
    },
    subtitle: {
      en: 'All Worlds Held Within One Luminous Whole',
      hi: 'एक ही परम चेतना में समाहित अनंत ब्रह्मांड',
      te: 'ఒకే పరమాత్మ తత్వంలో నిబిడీకృతమైన అనంత విశ్వం',
    },
    scripturalScope: {
      en: 'Bhagavad Gita Chapter 11',
      hi: 'श्रीमद्भगवद्गीता अध्याय ११',
      te: 'భగవద్గీత అధ్యాయము 11',
    },
    chaptersReferenced: 'Chapter 11',
    audioChapterNumber: 11,
    editorialClassification: 'narrative-adaptation',
    atmosphereNote: {
      en: 'Space and time expand beyond the battlefield into an awe-filled cosmic expanse of suns, constellations, and interconnected creation.',
      hi: 'रणभूमि की सीमाएँ अनंत ब्रह्मांड में विलीन हो जाती हैं—सहस्रों सूर्यों के तेज, नक्षत्रों और सृष्टि के विराट रूप का भव्य दर्शन प्रकट होता है।',
      te: 'యుద్ధభూమి సరిహద్దులు అనంత విశ్వంగా విస్తరిస్తాయి—వేలాది సూర్యుల తేజస్సుతో, నక్షత్రమండలాలతో కూడిన దివ్య విశ్వరూపం దర్శనమిస్తుంది.',
    },
    cues: [
      {
        id: 's4-c1',
        kind: 'adaptation',
        speaker: { en: 'Narrative Adaptation', hi: 'कथात्मक विवरण', te: 'కథన వివరణ' },
        text: {
          en: 'Granting Arjuna divine sight, Sri Krishna unveils the Vishvarupa—not as a fragmented fantasy, but as the living interconnected totality of cosmos, time, and existence.',
          hi: 'अर्जुन को दिव्य चक्षु प्रदान कर श्रीकृष्ण विश्वरूप का दर्शन कराते हैं—जहाँ समस्त लोक, काल और सृष्टि एक ही परम सूत्र में पिरोए दिखाई देते हैं।',
          te: 'అర్జునునికి దివ్యదృష్టిని ప్రసాదించి, శ్రీకృష్ణుడు సమస్త లోకాలు, కాలం మరియు సృష్టి ఒకే పరమాత్మలో ఉన్న విరాట్ విశ్వరూపాన్ని దర్శింపజేస్తాడు.',
        },
      },
      {
        id: 's4-c2',
        kind: 'scripture',
        speaker: { en: 'Bhagavad Gita 11.12', hi: 'भगवद्गीता ११.१२', te: 'భగవద్గీత 11.12' },
        text: {
          en: '“If the radiance of a thousand suns were to rise at once in the heavens, that might resemble the splendor of that Great Being.”',
          hi: '“यदि आकाश में एक साथ सहस्र सूर्यों का प्रकाश उदय हो जाए, तो वह भी उस महात्मन् के दिव्य तेज के सदृश कदाचित् ही हो सके।”',
          te: '“ఆకాశంలో ఒకేసారి వెయ్యి సూర్యుల తేజస్సు ఉదయించినా, ఆ మహాత్ముని దివ్య కాంతికి అది సాటిరావచ్చును.”',
        },
      },
      {
        id: 's4-c3',
        kind: 'adaptation',
        speaker: { en: 'Narrative Adaptation', hi: 'कथात्मक विवरण', te: 'కథన వివరణ' },
        text: {
          en: 'Overcome with wonder and humility, Arjuna bows before the cosmic truth and asks to behold once more the gentle, compassionate face of his trusted friend.',
          hi: 'विस्मय और विनम्र श्रद्धा से अभिभूत होकर अर्जुन इस विराट सत्य को प्रणाम करते हैं और पुनः अपने करुणामय सखा रूप के दर्शन की प्रार्थना करते हैं।',
          te: 'ఆశ్చర్యం మరియు వినయంతో నమస్కరిస్తూ, అర్జునుడు తిరిగి తన ప్రియ మిత్రుడైన ప్రసన్న రూపాన్ని చూపించమని ప్రార్థిస్తాడు.',
        },
      },
    ],
    featuredVerses: [
      {
        id: 'story-bg-11-12',
        chapter: 11,
        verse: '12',
        reference: 'Bhagavad Gita 11.12',
        sanskritDevanagari:
          'दिवि सूर्यसहस्रस्य भवेद्युगपदुत्थिता ।\nयदि भाः सदृशी सा स्याद्भासस्तस्य महात्मनः ॥',
        transliteration:
          'divi sūrya-sahasrasya bhaved yugapad utthitā |\nyadi bhāḥ sadṛśī sā syād bhāsas tasya mahātmanaḥ ||',
        translation: {
          en: 'If the splendor of a thousand suns were to blaze forth simultaneously in the sky, that radiance might bear likeness to the effulgence of that Great Soul.',
          hi: 'यदि आकाश में हजारों सूर्यों की प्रभा एक साथ उदय हो जाए, तो वह शायद उस महात्मन् के तेज के समान हो सकती है।',
          te: 'ఒకేసారి ఆకాశంలో వెయ్యి సూర్యుల ప్రకాశం ఉదయించినట్లయితే, ఆ కాంతి ఆ మహాత్ముని తేజస్సుకు పోలిక కాగలదు.',
        },
        sourceEdition: STORY_SOURCE_PROVENANCE.sanskritEdition,
        editorialStatus: 'canonical-reference',
      },
    ],
  },
  {
    id: 'scene-05',
    sceneNumber: 5,
    paddedCode: '05',
    durationMs: 28000,
    title: {
      en: 'The Wisdom of the Gita',
      hi: 'गीता का समग्र ज्ञान',
      te: 'భగవద్గీత సర్వతోముఖ జ్ఞానం',
    },
    subtitle: {
      en: 'Paths of Action, Knowledge, Devotion & Contemplation',
      hi: 'कर्म, ज्ञान, भक्ति और ध्यानयोग के समन्वित मार्ग',
      te: 'కర్మ, జ్ఞాన, భక్తి మరియు ధ్యాన యోగ మార్గాల సమన్వయం',
    },
    scripturalScope: {
      en: 'Bhagavad Gita Chapters 7–18',
      hi: 'श्रीमद्भगवद्गीता अध्याय ७–१८',
      te: 'భగవద్గీత అధ్యాయాలు 7–18',
    },
    chaptersReferenced: 'Chapters 7–18',
    audioChapterNumber: 12,
    editorialClassification: 'narrative-adaptation',
    atmosphereNote: {
      en: 'Radiant afternoon sunlight frames the chariot as Krishna illuminates how action, wisdom, devotion, and inner discipline converge into one whole life.',
      hi: 'सूर्य के प्रखर प्रकाश में श्रीकृष्ण स्पष्ट करते हैं कि कर्म, ज्ञान, भक्ति और ध्यान अलग मार्ग नहीं बल्कि एक ही पूर्ण जीवन-दर्शन के आयाम हैं।',
      te: 'సూర్యకాంతిలో శ్రీకృష్ణుడు కర్మ, జ్ఞానం, భక్తి మరియు ధ్యానం వేర్వేరు మార్గాలు కావని, అవి పరిపూర్ణ జీవన విధానానికి నాలుగు కోణాలని బోధిస్తాడు.',
    },
    cues: [
      {
        id: 's5-c1',
        kind: 'adaptation',
        speaker: { en: 'Narrative Adaptation', hi: 'कथात्मक विवरण', te: 'కథన వివరణ' },
        text: {
          en: 'Through the concluding chapters, the Gita honors the diversity of human temperament—guiding hands through Karma Yoga, intellect through Jnana Yoga, heart through Bhakti Yoga, and stillness through Dhyana Yoga.',
          hi: 'सातवें से अठारहवें अध्याय तक गीता मानव स्वभाव की विविधता का सम्मान करती है—हाथों को कर्मयोग, बुद्धि को ज्ञानयोग, हृदय को भक्तियोग और मन को ध्यानयोग से दिशा देती है।',
          te: 'ఏడవ అధ్యాయం నుండి పద్దెనిమిదవ అధ్యాయం వరకు భగవద్గీత కర్మయోగం, జ్ఞానయోగం, భక్తియోగం మరియు ధ్యానయోగాల ద్వారా సమగ్ర మార్గాన్ని చూపుతుంది.',
        },
      },
      {
        id: 's5-c2',
        kind: 'scripture',
        speaker: { en: 'Bhagavad Gita 12.13', hi: 'भगवद्गीता १२.१३', te: 'భగవద్గీత 12.13' },
        text: {
          en: '“Free from malice toward all beings, friendly and compassionate, devoid of possessiveness and ego, balanced in sorrow and joy, and ever forgiving.”',
          hi: '“जो समस्त प्राणियों के प्रति द्वेष से रहित, मित्रवत, करुणावान, ममता व अहंकार से मुक्त, सुख-दुःख में सम और क्षमाशील है।”',
          te: '“సకల ప్రాణుల యందు ద్వేషం లేనివాడు, మైత్రి మరియు కరుణ కలవాడు, మమకార అహంకారాలు లేనివాడు, సుఖదుఃఖాలలో సమభావం గల క్షమాశీలి నాకు ప్రియుడు.”',
        },
      },
      {
        id: 's5-c3',
        kind: 'adaptation',
        speaker: { en: 'Narrative Adaptation', hi: 'कथात्मक विवरण', te: 'కథన వివరణ' },
        text: {
          en: 'Every action carries the quality of the intention behind it; dharma is lived whenever self-knowledge purifies everyday choice.',
          hi: 'प्रत्येक कर्म का मूल्य उसके पीछे छिपी भावना और संकल्प से तय होता है; जब आत्मबोध दैनिक निर्णयों को निखारता है, तब धर्म सजीव हो उठता है।',
          te: 'ప్రతి కర్మ దాని వెనుక ఉన్న సంకల్పాన్ని బట్టి రూపుదిద్దుకుంటుంది; ఆత్మజ్ఞానం రోజువారీ నిర్ణయాలను మార్చినప్పుడు ధర్మం ప్రకాశిస్తుంది.',
        },
      },
    ],
    featuredVerses: [
      {
        id: 'story-bg-12-13',
        chapter: 12,
        verse: '13',
        reference: 'Bhagavad Gita 12.13',
        sanskritDevanagari:
          'अद्वेष्टा सर्वभूतानां मैत्रः करुण एव च ।\nनिर्ममो निरहङ्कारः समदुःखसुखः क्षमी ॥',
        transliteration:
          'adveṣṭā sarva-bhūtānāṁ maitraḥ karuṇa eva ca |\nnirmamo nirahaṅkāraḥ sama-duḥkha-sukhaḥ kṣamī ||',
        translation: {
          en: 'One who harbors ill-will toward no being, who is friendly and compassionate, free from possessiveness and pride, balanced in pain and pleasure, and forgiving.',
          hi: 'जो किसी भी प्राणी से द्वेष नहीं करता, सबका मित्र एवं करुणामय है, अहंकार व ममता से रहित, सुख-दुःख में सम और क्षमाशील है।',
          te: 'ఎవరి పట్ల ద్వేషం లేనివాడు, అందరికీ మిత్రుడు, కరుణామయుడు, అహంకార మమకారాలు లేనివాడు, సుఖదుఃఖాలలో సమచిత్తం కల క్షమాశీలి.',
        },
        sourceEdition: STORY_SOURCE_PROVENANCE.sanskritEdition,
        editorialStatus: 'canonical-reference',
      },
    ],
    teachingPillars: [
      {
        id: 'yoga-karma',
        sanskritTerm: 'कर्मयोग (Karma Yoga)',
        title: { en: 'Disciplined Action', hi: 'निस्वार्थ कर्मयोग', te: 'కర్మయోగము' },
        summary: {
          en: 'Acting wholeheartedly for collective welfare while purifying intention from personal greed.',
          hi: 'स्वार्थ से मुक्त होकर लोककल्याण के भाव से पूरी निष्ठा के साथ कर्म करना।',
          te: 'లోకకళ్యాణం కోసం ఫలాపేక్ష లేకుండా నిష్ఠతో కర్మలను ఆచరించడం.',
        },
        verseRef: 'Bhagavad Gita 3.19',
        sanskritQuote: 'असक्तो ह्याचरन्कर्म परमाप्नोति पूरुषः ॥',
        translation: {
          en: 'By performing duty without selfish attachment, one attains the highest freedom.',
          hi: 'अनासक्त भाव से कर्तव्य-कर्म करने वाला मनुष्य परम पद को प्राप्त होता है।',
          te: 'నిస్సంగత్వంతో కర్మ చేసే మనిషి పరమపదాన్ని పొందుతాడు.',
        },
      },
      {
        id: 'yoga-jnana',
        sanskritTerm: 'ज्ञानयोग (Jnana Yoga)',
        title: { en: 'Knowledge & Wisdom', hi: 'ज्ञानयोग', te: 'జ్ఞానయోగము' },
        summary: {
          en: 'Discerning the witness consciousness within from transient bodily and mental impressions.',
          hi: 'परिवर्तनशील जगत और साक्षी चेतना के सूक्ष्म भेद को प्रत्यक्ष रूप से समझना।',
          te: 'క్షేత్రానికి మరియు దాన్ని గమనించే సాక్షి చైతన్యానికి గల భేదాన్ని గ్రహించడం.',
        },
        verseRef: 'Bhagavad Gita 13.3',
        sanskritQuote: 'क्षेत्रक्षेत्रज्ञयोर्ज्ञानं यत्तज्ज्ञानं मतं मम ॥',
        translation: {
          en: 'Understanding both the Field of experience and its Knower is true wisdom.',
          hi: 'क्षेत्र और क्षेत्रज्ञ का यथार्थ बोध ही वास्तविक ज्ञान है।',
          te: 'క్షేత్రము మరియు క్షేత్రజ్ఞుని గురించిన జ్ఞానమే నిజమైన జ్ఞానము.',
        },
      },
      {
        id: 'yoga-bhakti',
        sanskritTerm: 'भक्तियोग (Bhakti Yoga)',
        title: { en: 'Devotion & Compassion', hi: 'भक्तियोग', te: 'భక్తియోగము' },
        summary: {
          en: 'Offering love, humility, and fearless trust toward the Divine present in all beings.',
          hi: 'समस्त प्राणियों के प्रति मैत्री, करुणा और अनन्य प्रेममय समर्पण।',
          te: 'సకల ప్రాణుల యందు కరుణతో, అనన్య భక్తితో పరమాత్మను సేవించడం.',
        },
        verseRef: 'Bhagavad Gita 9.22',
        sanskritQuote: 'अनन्याश्चिन्तयन्तो मां ये जनाः पर्युपासते ।',
        translation: {
          en: 'Those who contemplate and worship with single-hearted devotion are sustained in harmony.',
          hi: 'जो अनन्य भाव से चिंतन और उपासना करते हैं, उनका योगक्षेम स्वयं वहन होता है।',
          te: 'అనన్య భక్తితో ధ్యానించేవారి యోగక్షేమాలను పరమాత్మ స్వయంగా వహిస్తాడు.',
        },
      },
      {
        id: 'yoga-dhyana',
        sanskritTerm: 'ध्यानयोग (Dhyana Yoga)',
        title: { en: 'Meditation & Discipline', hi: 'ध्यान एवं आत्मसंयम', te: 'ధ్యానయోగము' },
        summary: {
          en: 'Quieting the restless mind like an unflickering lamp in a windless place, uplifting oneself by oneself.',
          hi: 'वात-रहित स्थान के अचल दीपक की भांति मन को स्थिर कर स्वयं अपना उद्धार करना।',
          te: 'గాలి లేని చోట నిశ్చలంగా వెలిగే దీపంలా మనస్సును నిలిపి తనను తానే ఉద్ధరించుకోవడం.',
        },
        verseRef: 'Bhagavad Gita 6.5',
        sanskritQuote: 'उद्धरेदात्मनात्मानं नात्मानमवसादयेत् ।',
        translation: {
          en: 'Let one uplift oneself by one’s own disciplined mind and never degrade oneself.',
          hi: 'मनुष्य स्वयं अपने द्वारा अपना उद्धार करे और अपने को पतन में न डाले।',
          te: 'మనిషి తనను తానే ఉద్ధరించుకోవాలి కానీ అధోగతి పాలు చేసుకోకూడదు.',
        },
      },
    ],
  },
  {
    id: 'scene-06',
    sceneNumber: 6,
    paddedCode: '06',
    durationMs: 24000,
    title: {
      en: 'Arjuna Finds Clarity',
      hi: 'अर्जुन को स्पष्टता की प्राप्ति',
      te: 'అర్జునుని సందేహ నివృత్తి',
    },
    subtitle: {
      en: 'Delusion Dispelled; Resolve Restored',
      hi: 'मोह का नाश, स्मृति की पुनः प्राप्ति और कर्तव्य का संकल्प',
      te: 'మోహం తొలగి, స్థిరచిత్తంతో కర్తవ్య స్వీకారం',
    },
    scripturalScope: {
      en: 'Bhagavad Gita Chapter 18, vv. 72–73',
      hi: 'श्रीमद्भगवद्गीता अध्याय १८, श्लोक ७२–७३',
      te: 'భగవద్గీత అధ్యాయము 18, శ్లోకాలు 72–73',
    },
    chaptersReferenced: 'Chapter 18 (vv. 72–73)',
    audioChapterNumber: 18,
    editorialClassification: 'narrative-adaptation',
    atmosphereNote: {
      en: 'Sunlight returns across Kurukshetra as Arjuna lifts his Gandiva bow—calm, free from inner darkness, and awakened to his duty.',
      hi: 'कुरुक्षेत्र पर पुनः निर्मल सूर्यप्रकाश फैलता है और संशय से मुक्त अर्जुन शांत संकल्प के साथ अपना गाण्डीव धनुष उठाते हैं।',
      te: 'కురుక్షేత్రంపై తిరిగి ప్రకాశవంతమైన సూర్యకిరణాలు ప్రసరించగా, సంపూర్ణ స్పష్టతతో అర్జునుడు గాండీవ ధనుస్సును చేతబూనుతాడు.',
    },
    cues: [
      {
        id: 's6-c1',
        kind: 'adaptation',
        speaker: { en: 'Narrative Adaptation', hi: 'कथात्मक विवरण', te: 'కథన వివరణ' },
        text: {
          en: 'Having laid open the entire philosophy without imposing compulsion, Krishna asks quietly in Chapter 18 verse 72: “Has this been heard with an attentive mind, and has the delusion born of ignorance been dispelled?”',
          hi: 'अठारहवें अध्याय के ७२वें श्लोक में किसी दबाव के बिना संपूर्ण उपदेश देने के बाद श्रीकृष्ण सहज प्रश्न पूछते हैं: “क्या तुमने इसे एकाग्र चित्त से सुना और क्या तुम्हारा अज्ञानजनित मोह नष्ट हुआ?”',
          te: '18వ అధ్యాయం 72వ శ్లోకంలో ఎటువంటి బలవంతం లేకుండా సమస్త తత్వాన్ని బోధించి, శ్రీకృష్ణుడు ప్రశాంతంగా అడుగుతాడు: “నీ అజ్ఞాన మోహం నశించిందా?”',
        },
      },
      {
        id: 's6-c2',
        kind: 'scripture',
        speaker: { en: 'Bhagavad Gita 18.73', hi: 'भगवद्गीता १८.७३', te: 'భగవద్గీత 18.73' },
        text: {
          en: '“Destroyed is my delusion; through Your grace, O Achyuta, I have regained clarity of remembrance. I now stand firm, freed from doubt—I will act according to Your word.”',
          hi: '“हे अच्युत! आपकी कृपा से मेरा मोह नष्ट हो गया और मुझे स्मृति (आत्मबोध) प्राप्त हो गई है। अब मैं संदेहरहित होकर स्थिर हूँ और आपके वचन का पालन करूँगा।”',
          te: '“ఓ అచ్యుతా! నీ అనుగ్రహంతో నా మోహం నశించింది, నిజమైన స్మృతి (జ్ఞానం) లభించింది. సందేహాలు తొలగి స్థిరంగా నిలిచాను—నీ ఆదేశానుసారం నడుచుకుంటాను.”',
        },
      },
      {
        id: 's6-c3',
        kind: 'adaptation',
        speaker: { en: 'Narrative Adaptation', hi: 'कथात्मक विवरण', te: 'కథన వివరణ' },
        text: {
          en: 'With poised hand and peaceful eyes, Arjuna lifts his Gandiva bow—transformed not by anger, but by awakened understanding.',
          hi: 'क्रोध से नहीं, बल्कि जागृत विवेक और शांत निश्चय के साथ अर्जुन अपना गाण्डीव धनुष पुनः धारण करते हैं।',
          te: 'క్రోధంతో కాదు, జాగృతమైన వివేకంతో మరియు నిశ్చలమైన దృఢ సంకల్పంతో అర్జునుడు గాండీవ ధనుస్సును ఎక్కుపెడతాడు.',
        },
      },
    ],
    featuredVerses: [
      {
        id: 'story-bg-18-73',
        chapter: 18,
        verse: '73',
        reference: 'Bhagavad Gita 18.73',
        sanskritDevanagari:
          'नष्टो मोहः स्मृतिर्लब्धा त्वत्प्रसादान्मयाच्युत ।\nस्थितोऽस्मि गतसन्देहः करिष्ये वचनं तव ॥',
        transliteration:
          'naṣṭo mohaḥ smṛtir labdhā tvat-prasādān mayācyuta |\nsthito ’smi gata-sandehaḥ kariṣye vacanaṁ tava ||',
        translation: {
          en: 'Arjuna said: My delusion is destroyed, and through Your grace I have regained remembrance, O Achyuta (Unfailing One). I stand firm, free from all doubt, and I shall fulfill Your counsel.',
          hi: 'अर्जुन बोले: हे अच्युत! आपकी कृपा से मेरा मोह नष्ट हो गया है और मुझे स्मृति (सत्य बोध) प्राप्त हो गई है। अब मैं संदेहरहित होकर स्थित हूँ और आपकी आज्ञा का पालन करूँगा।',
          te: 'అర్జునుడు పలికెను: ఓ అచ్యుతా! నీ దయవల్ల నా మోహం నశించింది, నాకు నిజమైన జ్ఞానస్మృతి లభించింది. సందేహరహితుడనై స్థిరంగా నిలిచాను—నీ వాక్కు ప్రకారం కర్తవ్యాన్ని నిర్వర్తిస్తాను.',
        },
        sourceEdition: STORY_SOURCE_PROVENANCE.sanskritEdition,
        editorialStatus: 'canonical-reference',
      },
    ],
  },
  {
    id: 'scene-07',
    sceneNumber: 7,
    paddedCode: '07',
    durationMs: 25000,
    title: {
      en: 'The Eternal Message',
      hi: 'शाश्वत संदेश',
      te: 'సనాతన సందేశం',
    },
    subtitle: {
      en: 'The Wisdom That Connects the World',
      hi: 'संपूर्ण विश्व को जोड़ने वाला शाश्वत ज्ञान',
      te: 'ప్రపంచాన్ని అనుసంధానించే సనాతన జ్ఞానం',
    },
    scripturalScope: {
      en: 'Reflection & Living Legacy · Mahotsav 2027',
      hi: 'चिंतन एवं जीवंत विरासत · महोत्सव २०२७',
      te: 'ఆత్మావలోకనం మరియు సజీవ వారసత్వం · మహోత్సవం 2027',
    },
    chaptersReferenced: 'Chapter 18 · Universal Reflection',
    audioChapterNumber: 18,
    editorialClassification: 'narrative-adaptation',
    atmosphereNote: {
      en: 'The chariot dialogue opens onto the wide golden horizon of humanity today—inviting reflection, clarity, and global fellowship.',
      hi: 'कुरुक्षेत्र का वह पावन संवाद आज के संपूर्ण मानव समाज के सुनहरे क्षितिज की ओर विस्तार पाता है—जो स्पष्टता, उद्देश्य और विश्व बंधुत्व का आह्वान करता है।',
      te: 'కురుక్షేత్రంలోని ఆ పవిత్ర సంవాదం నేటి ప్రపంచ మానవాళికి స్పష్టత, లక్ష్యసిద్ధి మరియు విశ్వసౌభ్రాతృత్వపు వెలుగును పంచుతూ విస్తరిస్తోంది.',
    },
    cues: [
      {
        id: 's7-c1',
        kind: 'adaptation',
        speaker: { en: 'Narrative Adaptation', hi: 'कथात्मक विवरण', te: 'కథన వివరణ' },
        text: {
          en: 'The battlefield was the setting of a single day, yet the dialogue speaks directly to our own crossroads—whenever uncertainty clouds purpose, or responsibility calls for courage.',
          hi: 'रणभूमि एक युग की घटना थी, किंतु वह संवाद आज भी हमारे जीवन के हर मोड़ से बात करता है—जब भी संदेह उद्देश्य को धुंधला करता है या कर्तव्य साहस की मांग करता है।',
          te: 'కురుక్షేత్ర యుద్ధం ఆ నాటి సందర్భమైనా, ఆ గీతోపదేశం నేటి మన జీవితంలోని ప్రతీ సంక్లిష్ట పరిస్థితికి స్పష్టమైన దిశానిర్దేశం చేస్తుంది.',
        },
      },
      {
        id: 's7-c2',
        kind: 'scripture',
        speaker: { en: 'Bhagavad Gita 18.78', hi: 'भगवद्गीता १८.७८', te: 'భగవద్గీత 18.78' },
        text: {
          en: '“Wherever Krishna, Lord of Yoga, and Arjuna, the dedicated seeker, stand together—there abide prosperity, enduring triumph, welfare, and steadfast justice.”',
          hi: '“जहाँ योगेश्वर श्रीकृष्ण और निष्ठावान साधक पार्थ अर्जुन एक साथ हैं, वहीं श्री, विजय, विभूति और अचल न्याय निवास करते हैं।”',
          te: '“ఎక్కడ యోగేశ్వరుడైన శ్రీకృష్ణుడు మరియు కర్తవ్యనిష్ఠుడైన అర్జునుడు కలిసి ఉంటారో, అక్కడే శుభం, విజయం, ఐశ్వర్యం మరియు ధర్మనీతి స్థిరంగా ఉంటాయి.”',
        },
      },
      {
        id: 's7-c3',
        kind: 'adaptation',
        speaker: { en: 'Mahotsav Invitation', hi: 'महोत्सव आमंत्रण', te: 'మహోత్సవ ఆహ్వానం' },
        text: {
          en: 'In this living spirit, Bhagavad Gita Vishwa Mahotsav 2027 unites 18 nations, 18 chapters, and 18 languages—carrying forward The Wisdom That Connects the World.',
          hi: 'इसी जीवंत भावना के साथ भगवद्गीता विश्व महोत्सव २०२७ १८ देशों, १८ अध्यायों और १८ भाषाओं को एक सूत्र में जोड़कर “संपूर्ण विश्व को जोड़ने वाले शाश्वत ज्ञान” को आगे बढ़ाता है।',
          te: 'ఈ సజీవ స్ఫూర్తితో భగవద్గీత విశ్వ మహోత్సవం 2027 18 దేశాలను, 18 అధ్యాయాలను మరియు 18 భాషలను ఏకం చేస్తూ ప్రపంచాన్ని అనుసంధానించే జ్ఞానాన్ని ముందుకు తీసుకువెళుతోంది.',
        },
      },
    ],
    featuredVerses: [
      {
        id: 'story-bg-18-78',
        chapter: 18,
        verse: '78',
        reference: 'Bhagavad Gita 18.78',
        sanskritDevanagari:
          'यत्र योगेश्वरः कृष्णो यत्र पार्थो धनुर्धरः ।\nतत्र श्रीर्विजयो भूतिर्ध्रुवा नीतिर्मतिर्मम ॥',
        transliteration:
          'yatra yogeśvaraḥ kṛṣṇo yatra pārtho dhanur-dharaḥ |\ntatra śrīr vijayo bhūtir dhruvā nītir matir mama ||',
        translation: {
          en: 'Wherever is Krishna, the Lord of Yoga, and wherever is Arjuna, the bearer of the bow, there abide splendor, victory, flourishing well-being, and unswerving righteousness—such is my conviction.',
          hi: 'जहाँ योगेश्वर श्रीकृष्ण हैं और जहाँ गाण्डीव धनुषधारी पार्थ अर्जुन हैं, वहीं श्री, विजय, विभूति और अचल नीति विराजमान रहती है—यही मेरा दृढ़ मत है।',
          te: 'ఎక్కడ యోగేశ్వరుడైన శ్రీకృష్ణుడు, ఎక్కడ ధనుర్ధారియైన అర్జునుడు ఉంటారో, అక్కడే సంపద, విజయము, అభివృద్ధి మరియు స్థిరమైన ధర్మనీతి ఉంటాయని నా దృఢ నిశ్చయం.',
        },
        sourceEdition: STORY_SOURCE_PROVENANCE.sanskritEdition,
        editorialStatus: 'canonical-reference',
      },
    ],
    eternalValues: [
      {
        id: 'val-clarity',
        title: { en: 'Clarity', hi: 'स्पष्टता', te: 'స్పష్టత' },
        note: {
          en: 'Seeing beyond confusion and fear to discern right action.',
          hi: 'भ्रम और भय से ऊपर उठकर उचित निर्णय का बोध।',
          te: 'భయసందేహాలను దాటి సరైన మార్గాన్ని గుర్తించడం.',
        },
      },
      {
        id: 'val-purpose',
        title: { en: 'Purpose', hi: 'उद्देश्य', te: 'లక్ష్యం' },
        note: {
          en: 'Aligning daily work with deeper meaning and service.',
          hi: 'दैनिक कर्म को उच्चतर जीवन उद्देश्य व सेवा से जोड़ना।',
          te: 'రోజువారీ కర్మలను ఉన్నత సేవా లక్ష్యంతో అనుసంధానించడం.',
        },
      },
      {
        id: 'val-duty',
        title: { en: 'Duty', hi: 'कर्तव्य', te: 'కర్తవ్యం' },
        note: {
          en: 'Honoring responsibilities with integrity and steadiness.',
          hi: 'सत्यनिष्ठा और धैर्य के साथ अपने दायित्वों का निर्वहन।',
          te: 'నిజాయితీ మరియు స్థిరత్వంతో బాధ్యతలను నెరవేర్చడం.',
        },
      },
      {
        id: 'val-wisdom',
        title: { en: 'Wisdom', hi: 'विवेक', te: 'వివేకం' },
        note: {
          en: 'Understanding the imperishable spirit shared across humanity.',
          hi: 'सम्पूर्ण मानवता में निहित अविनाशी एकता का बोध।',
          te: 'సమస్త మానవాళిలోని ఏకత్వ తత్వాన్ని గ్రహించడం.',
        },
      },
      {
        id: 'val-devotion',
        title: { en: 'Devotion', hi: 'भक्ति', te: 'భక్తి' },
        note: {
          en: 'Gratitude, compassion, and reverence toward all creation.',
          hi: 'समस्त सृष्टि के प्रति कृतज्ञता, करुणा और श्रद्धा।',
          te: 'సమస్త సృష్టి పట్ల కృతజ్ఞత, కరుణ మరియు భక్తి.',
        },
      },
      {
        id: 'val-discipline',
        title: { en: 'Inner Discipline', hi: 'आत्मसंयम', te: 'ఆత్మసంయమనం' },
        note: {
          en: 'Mastering impulse through mindfulness and steady balance.',
          hi: 'सचेत संयम और समत्व द्वारा मन पर संतुलित अधिकार।',
          te: 'ధ్యానం మరియు సమభావంతో మనోనిగ్రహం సాధించడం.',
        },
      },
      {
        id: 'val-universal',
        title: { en: 'Universal Human Values', hi: 'सार्वभौमिक मूल्य', te: 'విశ్వమానవ విలువలు' },
        note: {
          en: 'Non-enmity, harmony, and ethical fellowship across nations.',
          hi: 'सभी राष्ट्रों में निर्वैरता, सद्भाव और नैतिक बंधुत्व।',
          te: 'దేశాలన్నింటి మధ్య శాంతి, సామరస్యం మరియు నైతిక బంధం.',
        },
      },
    ],
  },
];

export const STORY_SCENES: ReadonlyArray<StorySceneRecord> = [
  ...PART_A_GITA_SCENES.map((s) => ({
    ...s,
    partId: 'part-a' as const,
    provenanceCategory: 'bhagavad-gita-scripture' as const,
  })),
  ...MAHABHARATA_WAR_SCENES,
];

function inferPartACueSpeakerRole(sceneId: string, cueIndex: number): DialogueSpeakerId {
  switch (sceneId) {
    case 'scene-01':
      return 'narrator';
    case 'scene-02':
      return cueIndex === 2 ? 'arjuna' : 'narrator';
    case 'scene-03':
      return cueIndex >= 1 ? 'krishna' : 'narrator';
    case 'scene-04':
      return cueIndex === 1 ? 'krishna' : cueIndex === 2 ? 'arjuna' : 'narrator';
    case 'scene-05':
      return cueIndex === 1 ? 'krishna' : 'narrator';
    case 'scene-06':
      return cueIndex === 1 ? 'arjuna' : 'krishna';
    case 'scene-07':
      return cueIndex === 1 ? 'krishna' : 'narrator';
    default:
      return 'narrator';
  }
}

function inferCueEmotion(sceneId: string, speaker: DialogueSpeakerId): FacialEmotionState {
  if (sceneId === 'scene-02') return speaker === 'arjuna' ? 'sorrow' : 'compassionate';
  if (sceneId === 'scene-03' || sceneId === 'scene-05') return 'compassionate';
  if (sceneId === 'scene-04') return 'awe';
  if (sceneId === 'scene-06') return 'resolve';
  if (sceneId === 'scene-10' || sceneId === 'scene-15') return 'serene';
  if (speaker === 'karna' || speaker === 'duryodhana' || sceneId === 'scene-08' || sceneId === 'scene-13' || sceneId === 'scene-14') {
    return 'battle_focus';
  }
  return 'resolve';
}

export function getCueDialogueTrack(
  scene: StorySceneRecord,
  cueIndex: number,
  locale: 'en' | 'hi' | 'te',
): DialogueAudioTrack {
  const safeCueIdx = Math.max(0, Math.min(scene.cues.length - 1, cueIndex));
  const cue = scene.cues[safeCueIdx] ?? scene.cues[0];
  const speaker = cue?.speakerRole ?? inferPartACueSpeakerRole(scene.id, safeCueIdx);
  const emotion = cue?.emotion ?? inferCueEmotion(scene.id, speaker);
  const sourceType: DialogueSourceType =
    cue?.sourceType ??
    (cue?.kind === 'scripture'
      ? 'bhagavad-gita-scripture'
      : cue?.kind === 'mahabharata-narrative'
        ? 'mahabharata-narrative'
        : 'editorial-adaptation');

  return buildVisemeTimelineFromTranscript({
    id: `${scene.id}-${cue?.id ?? safeCueIdx}-${locale}`,
    sceneId: scene.id,
    speaker,
    language: locale,
    transcript: cue?.text[locale] ?? '',
    sourceRef: cue?.sourceRef ?? scene.chaptersReferenced,
    sourceType,
    emotion,
    animationTrack: scene.partId === 'part-b' ? 'mahabharata-war' : 'gita-dialogue',
    durationSec: Math.max(4, Math.round(scene.durationMs / Math.max(1, scene.cues.length) / 1000)),
  });
}

export function getStorySceneByIndex(index: number): StorySceneRecord {
  const safe = Math.max(0, Math.min(STORY_SCENES.length - 1, Math.round(index)));
  return STORY_SCENES[safe] ?? STORY_SCENES[0];
}

export { CHARACTER_REGISTRY, MAHABHARATA_18_DAYS };
