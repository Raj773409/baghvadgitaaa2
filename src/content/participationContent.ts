import type { ParticipationPathway } from '../types/cms';

export const PARTICIPATION_PATHWAYS: ReadonlyArray<ParticipationPathway> = [
  {
    id: 'individual',
    registrationType: 'individual',
    title: {
      en: 'Individual Participant',
      hi: 'व्यक्तिगत प्रतिभागी',
      te: 'వ్యక్తిగత ప్రతినిధి',
    },
    audience: {
      en: 'Open Worldwide · Online & Stage Tracks',
      hi: 'विश्वभर के साधक · ऑनलाइन एवं मंच सहभागिता',
      te: 'ప్రపంచవ్యాప్తంగా అందరికీ · ఆన్‌లైన్ మరియు వేదికపై',
    },
    description: {
      en: 'Join from India or any of the eighteen participating nations to recite designated shlokas in your mother tongue and Sanskrit during Vishwa Ahvanam (20 Dec 2026) and qualify for Hyderabad 2027.',
      hi: 'भारत अथवा १८ सहभागी देशों में से किसी से भी २० दिसम्बर २०२६ (विश्व आह्वानम्) में मातृभाषा व संस्कृत में श्लोक पाठ हेतु जुड़ें और हैदराबाद २०२७ के लिए नामांकन करें।',
      te: 'భారతదేశం లేదా 18 దేశాల నుండి 20 డిసెంబర్ 2026 విశ్వ ఆహ్వానమ్‌లో పాల్గొని, 2027 హైదరాబాద్ ప్రధాన వేడుకకు నమోదు చేసుకోండి.',
    },
    eligibility: {
      en: 'Includes training & shloka guide',
      hi: 'प्रशिक्षण व श्लोक मार्गदर्शन सहित',
      te: 'శిక్షణ మరియు శ్లోక మార్గదర్శకత్వం',
    },
  },
  {
    id: 'youth',
    registrationType: 'youth',
    title: {
      en: 'Youth Delegate (Youth Gita · Ages 15–35)',
      hi: 'युवा प्रतिनिधि (युवा गीता · आयु १५–३५)',
      te: 'యువ ప్రతినిధి (యువ గీత · వయస్సు 15–35)',
    },
    audience: {
      en: 'Students, Professionals & Next-Gen Thinkers',
      hi: 'विद्यार्थी, शोधार्थी एवं युवा नेतृत्व',
      te: 'విద్యార్థులు, యువ వృత్తినిపుణులు',
    },
    description: {
      en: 'Participate in the dedicated Youth Gita dialogue exploring mental clarity, purposeful action (Karma Yoga), and ethical leadership shaped by eternal principles.',
      hi: 'मानसिक स्पष्टता, कर्मयोग और नैतिक नेतृत्व पर केंद्रित विशेष युवा गीता सत्रों में सहभागिता करें।',
      te: 'మనోబలం, కర్మయోగం మరియు నైతిక నాయకత్వంపై ప్రత్యేక యువ గీత సదస్సులలో భాగస్వాములు కండి.',
    },
    eligibility: {
      en: 'Dedicated Youth Gita session track',
      hi: 'समर्पित युवा गीता कार्यक्रम श्रेणी',
      te: 'ప్రత్యేక యువ గీత విభాగం',
    },
  },
  {
    id: 'family',
    registrationType: 'family',
    title: {
      en: 'Family & Group Participation',
      hi: 'परिवार एवं समूह सहभागिता',
      te: 'కుటుంబ మరియు బృంద నమోదు',
    },
    audience: {
      en: 'Multi-Generational Households & Community Groups',
      hi: 'परिवारजन, सत्संग मंडल एवं सांस्कृतिक समूह',
      te: 'కుటుంబ సభ్యులు మరియు ఆధ్యాత్మిక బృందాలు',
    },
    description: {
      en: 'Register multi-member households or community chanting groups (2 to 10+ persons) together under a single coordinated delegation record.',
      hi: 'एक साथ २ से १०+ सदस्यों वाले परिवारों अथवा सामुदायिक समूहों का समन्वित पंजीकरण एक ही आवेदन के अंतर्गत करें।',
      te: 'కుటుంబ సభ్యులు లేదా బృందాలు (2 నుండి 10+ మంది) ఒకే నమోదు ద్వారా సమిష్టిగా పాల్గొనే అవకాశం.',
    },
    eligibility: {
      en: 'Coordinated group seating & delegation ID',
      hi: 'समन्वित समूह पंजीकरण सुविधा',
      te: 'సమన్వయ బృంద నమోదు సదుపాయం',
    },
  },
  {
    id: 'institutional',
    registrationType: 'institutional',
    title: {
      en: 'Institutional & Academic Delegation',
      hi: 'शैक्षणिक एवं संस्थागत सहभागिता',
      te: 'విద్యాసంస్థలు మరియు సంస్థల భాగస్వామ్యం',
    },
    audience: {
      en: 'Schools, Universities, Ashrams & Cultural Bodies',
      hi: 'विद्यालय, विश्वविद्यालय, आश्रम एवं सांस्कृतिक संस्थान',
      te: 'పాఠశాలలు, విశ్వవిద్యాలయాలు, సాంస్కృతిక సంస్థలు',
    },
    description: {
      en: 'Enlist your university department, school, or cultural foundation to host local Gita Parayana chapters or send formal student and faculty delegations.',
      hi: 'स्थानीय गीता पारायण केंद्र आयोजित करने अथवा छात्र व प्राध्यापक प्रतिनिधिमंडल भेजने हेतु अपनी संस्था को पंजीकृत करें।',
      te: 'స్థానిక గీతా పారాయణ కేంద్రాలు నిర్వహించడానికి లేదా విద్యార్థి బృందాలను పంపడానికి మీ సంస్థను నమోదు చేయండి.',
    },
    eligibility: {
      en: 'Chapter coordination & institutional kit',
      hi: 'संस्थागत केंद्र समन्वय एवं दिशानिर्देश',
      te: 'సంస్థాగత సమన్వయం మరియు మార్గదర్శకాలు',
    },
  },
  {
    id: 'volunteer',
    registrationType: 'volunteer',
    title: {
      en: 'Volunteer & Seva Corps',
      hi: 'स्वयंसेवक एवं सेवा दल',
      te: 'స్వచ్ఛంద సేవకులు (సేవా దళం)',
    },
    audience: {
      en: 'Karma Yoga in Action · Global & Hyderabad Teams',
      hi: 'कर्मयोग सेवा · अंतर्राष्ट्रीय एवं हैदराबाद दल',
      te: 'కర్మయోగ సేవ · అంతర్జాతీయ మరియు హైదరాబాద్ విభాగం',
    },
    description: {
      en: 'Join 200+ sub-committee coordinators supporting hospitality, language translation, stage stewardship, digital outreach, and delegate coordination.',
      hi: 'आतिथ्य सत्कार, भाषा अनुवाद, मंच समन्वय, डिजिटल प्रसार और अतिथि मार्गदर्शन में २००+ समन्वयकों के सेवा दल से जुड़ें।',
      te: 'ఆతిథ్యం, అనువాదం, వేదిక నిర్వహణ మరియు ప్రతినిధుల సమన్వయంలో 200+ ఉప-కమిటీ సేవకులతో చేరండి.',
    },
    eligibility: {
      en: 'Hospitality, translation & logistics teams',
      hi: 'आतिथ्य, अनुवाद एवं व्यवस्थापन सेवा',
      te: 'ఆతిథ్యం, అనువాదం మరియు నిర్వహణ సేవ',
    },
  },
  {
    id: 'scholar',
    registrationType: 'scholar',
    title: {
      en: 'Scholar, Preceptor & Community Parayana Host',
      hi: 'विद्वान्, आचार्य एवं सामुदायिक पारायण आयोजक',
      te: 'విద్వాంసులు మరియు సామూహిక పారాయణ నిర్వాహకులు',
    },
    audience: {
      en: 'Faculty, Gita Teachers & Regional Host Chapters',
      hi: 'विद्वत् वर्ग, गीता शिक्षक एवं क्षेत्रीय केंद्र आयोजक',
      te: 'గీతా ఆచార్యులు మరియు ప్రాంతీయ కేంద్ర నిర్వాహకులు',
    },
    description: {
      en: 'Lead community recitation circles in your city across all 18 countries or express interest in academic paper presentations and multilingual commentary.',
      hi: 'सभी १८ देशों के अपने नगरों में सामुदायिक गीता पारायण का नेतृत्व करें अथवा विद्वत् व्याख्यान एवं बहुभाषी शोध हेतु नामांकन करें।',
      te: '18 దేశాలలోని మీ నగరాల్లో సామూహిక గీతా పారాయణాలను నిర్వహించండి లేదా విద్వత్ చర్చలలో భాగస్వాములు కండి.',
    },
    eligibility: {
      en: 'Subject to Organizing Committee review',
      hi: 'आयोजन समिति की समीक्षा के अधीन',
      te: 'నిర్వాహక కమిటీ ఆమోదానికి లోబడి ఉంటుంది',
    },
  },
];

export interface MovementPathwayItem {
  id: string;
  registrationType: string;
  categoryGroup: 'participant' | 'youth' | 'institution' | 'global' | 'volunteer' | 'patron';
  title: { en: string; hi: string; te: string };
  subtitle: { en: string; hi: string; te: string };
  description: { en: string; hi: string; te: string };
  ctaLabel: { en: string; hi: string; te: string };
  actionHref: string;
  actionKind: 'register' | 'volunteer' | 'partners';
}

export const MOVEMENT_TEN_PATHWAYS: ReadonlyArray<MovementPathwayItem> = [
  {
    id: 'individual',
    registrationType: 'individual',
    categoryGroup: 'participant',
    title: {
      en: 'Individual Participant',
      hi: 'व्यक्तिगत प्रतिभागी',
      te: 'వ్యక్తిగత ప్రతినిధి',
    },
    subtitle: {
      en: 'Personal Devotion & Shloka Chanting',
      hi: 'व्यक्तिगत साधना एवं श्लोक पारायण',
      te: 'వ్యక్తిగత సాధన మరియు శ్లోక పఠనం',
    },
    description: {
      en: 'Join the synchronized 20 December 2026 Curtain Raiser in your mother tongue and Sanskrit, and prepare for Hyderabad 2027.',
      hi: '२० दिसम्बर २०२६ के विश्व आह्वानम् में अपनी मातृभाषा व संस्कृत में श्लोक पाठ कर हैदराबाद २०२७ से जुड़ें।',
      te: '20 డిసెంబర్ 2026 విశ్వ ఆహ్వానమ్‌లో మాతృభాష మరియు సంస్కృతంలో శ్లోక పారాయణం చేయండి.',
    },
    ctaLabel: { en: 'Register Individually', hi: 'व्यक्तिगत पंजीकरण', te: 'వ్యక్తిగత నమోదు' },
    actionHref: '/participate/register?type=individual',
    actionKind: 'register',
  },
  {
    id: 'family',
    registrationType: 'family',
    categoryGroup: 'participant',
    title: {
      en: 'Family Participation',
      hi: 'परिवार सहभागिता',
      te: 'కుటుంబ భాగస్వామ్యం',
    },
    subtitle: {
      en: 'Intergenerational Household Recitation',
      hi: 'पीढ़ियों को जोड़ता पारिवारिक पारायण',
      te: 'తరాలుగా కలిసి పఠించే కుటుంబ వేడుక',
    },
    description: {
      en: 'Register elders, parents, and children together under one household pass for shared cultural and philosophical inspiration.',
      hi: 'माता-पिता, वरिष्ठ जनों और बच्चों के साथ एक ही पारिवारिक पंजीकरण में सम्मिलित हों।',
      te: 'తల్లిదండ్రులు, పెద్దలు మరియు పిల్లలు కలిసి ఒకే కుటుంబ నమోదుతో పాల్గొనండి.',
    },
    ctaLabel: { en: 'Register as Family', hi: 'परिवार पंजीकरण', te: 'కుటుంబ నమోదు' },
    actionHref: '/participate/register?type=family',
    actionKind: 'register',
  },
  {
    id: 'group',
    registrationType: 'group',
    categoryGroup: 'participant',
    title: {
      en: 'Group & Satsang Delegation',
      hi: 'समूह एवं सत्संग मंडल',
      te: 'బృంద మరియు సత్సంగ నమోదు',
    },
    subtitle: {
      en: 'Community Chanting Circles (5–50+)',
      hi: 'सामुदायिक गीता मंडल (५–५०+)',
      te: 'సామూహిక గీతా బృందాలు (5–50+)',
    },
    description: {
      en: 'Coordinate study circles, Gita mandalis, residential communities, and civic groups into one unified delegation record.',
      hi: 'स्थानीय गीता मंडलियों, आवासीय समितियों और सांस्कृतिक समूहों का एक साथ पंजीकरण करें।',
      te: 'గీతా మండలాలు మరియు సమాజ బృందాలను ఒకే ప్రతినిధి బృందంగా నమోదు చేయండి.',
    },
    ctaLabel: { en: 'Register Group', hi: 'समूह पंजीकरण', te: 'బృంద నమోదు' },
    actionHref: '/participate/register?type=group',
    actionKind: 'register',
  },
  {
    id: 'institutional',
    registrationType: 'institutional',
    categoryGroup: 'institution',
    title: {
      en: 'Institutional Participation',
      hi: 'संस्थागत एवं शैक्षणिक सहभागिता',
      te: 'విద్యా మరియు సాంస్కృతిక సంస్థలు',
    },
    subtitle: {
      en: 'Schools, Universities & Cultural Trusts',
      hi: 'विद्यालय, विश्वविद्यालय एवं न्यास',
      te: 'పాఠశాలలు, విశ్వవిద్యాలయాలు మరియు ట్రస్టులు',
    },
    description: {
      en: 'Enlist student delegations, faculty scholars, and cultural academies for campus Gita Parayana and international symposium panels.',
      hi: 'परिसर में गीता पारायण और अंतर्राष्ट्रीय संगोष्ठियों के लिए अपनी संस्था व छात्रों का नामांकन करें।',
      te: 'కళాశాలలు, విశ్వవిద్యాలయాల నుండి విద్యార్థులు మరియు అధ్యాపక బృందాలను పంపండి.',
    },
    ctaLabel: { en: 'Register Institution', hi: 'संस्था पंजीकरण', te: 'సంస్థ నమోదు' },
    actionHref: '/participate/register?type=institutional',
    actionKind: 'register',
  },
  {
    id: 'youth',
    registrationType: 'youth',
    categoryGroup: 'youth',
    title: {
      en: 'Youth Participation (Ages 15–35)',
      hi: 'युवा गीता सहभागिता (१५–३५ वर्ष)',
      te: 'యువ గీత (వయస్సు 15–35 ఏళ్లు)',
    },
    subtitle: {
      en: 'Youth Gita Dialogue & Future Leadership',
      hi: 'मानसिक स्पष्टता, कर्मयोग एवं नेतृत्व',
      te: 'మనోబలం, కర్మయోగం మరియు నాయకత్వం',
    },
    description: {
      en: 'Dedicated youth forums translating Karma Yoga, emotional resilience, and ethical clarity into modern careers and civic service.',
      hi: 'आधुनिक जीवन, करियर और सेवा में कर्मयोग व मानसिक स्थिरता पर केंद्रित विशेष युवा गीता सत्र।',
      te: 'ఆధునిక జీవితం, కెరీర్ మరియు సేవలో గీతా మార్గదర్శకత్వంపై ప్రత్యేక యువ గీత వేదిక.',
    },
    ctaLabel: { en: 'Join Youth Track', hi: 'युवा पंजीकरण', te: 'యువ విభాగంలో చేరండి' },
    actionHref: '/participate/register?type=youth',
    actionKind: 'register',
  },
  {
    id: 'global',
    registrationType: 'individual',
    categoryGroup: 'global',
    title: {
      en: 'Global Delegate (18 Countries)',
      hi: 'वैश्विक प्रतिनिधि (१८ देश)',
      te: 'అంతర్జాతీయ ప్రతినిధి (18 దేశాలు)',
    },
    subtitle: {
      en: 'Diaspora & International Missions',
      hi: 'अंतर्राष्ट्रीय प्रतिनिधि एवं प्रवासी भारतीय',
      te: 'ప్రవాస మరియు అంతర్జాతీయ ప్రతినిధులు',
    },
    description: {
      en: 'Delegates across 18 countries join online on 20 Dec 2026; selected international delegates receive 4-day Hyderabad hospitality.',
      hi: '१८ देशों के प्रतिनिधि २० दिसम्बर को ऑनलाइन जुड़ें; चयनित अंतर्राष्ट्रीय अतिथियों को ४ दिन का हैदराबाद आतिथ्य मिलेगा।',
      te: '18 దేశాల ప్రతినిధులు డిసెంబర్ 20న ఆన్‌లైన్‌లో చేరండి; ఎంపికైన వారికి హైదరాబాద్‌లో 4 రోజుల ఆతిథ్యం ఉంటుంది.',
    },
    ctaLabel: { en: 'Register Global Pass', hi: 'वैश्विक पंजीकरण', te: 'అంతర్జాతీయ నమోదు' },
    actionHref: '/participate/register?type=individual',
    actionKind: 'register',
  },
  {
    id: 'volunteer',
    registrationType: 'volunteer',
    categoryGroup: 'volunteer',
    title: {
      en: 'Volunteer Seva Corps',
      hi: 'स्वयंसेवक सेवा दल',
      te: 'స్వచ్ఛంద సేవా దళం',
    },
    subtitle: {
      en: 'Hospitality, Translation, Media & Stage',
      hi: 'आतिथ्य, अनुवाद, मीडिया एवं मंच सेवा',
      te: 'ఆతిథ్యం, అనువాదం, మీడియా మరియు వేదిక సేవ',
    },
    description: {
      en: 'Put Karma Yoga into daily service alongside 200+ Secretariat sub-committee coordinators across online and Hyderabad desks.',
      hi: '२००+ उप-समितियों के साथ आतिथ्य, अनुवाद व कार्यक्रम संचालन में कर्मयोग सेवा प्रदान करें।',
      te: '200+ ఉప-కమిటీలతో కలిసి ఆతిథ్యం, అనువాదం మరియు వేదిక నిర్వహణలో సేవ చేయండి.',
    },
    ctaLabel: { en: 'Apply for Seva', hi: 'सेवा आवेदन', te: 'సేవా దరఖాస్తు' },
    actionHref: '#volunteer-seva-inline',
    actionKind: 'volunteer',
  },
  {
    id: 'host-parayana',
    registrationType: 'scholar',
    categoryGroup: 'global',
    title: {
      en: 'Host a Gita Parayana Chapter',
      hi: 'गीता पारायण केंद्र आयोजित करें',
      te: 'గీతా పారాయణ కేంద్రం నిర్వహించండి',
    },
    subtitle: {
      en: 'Regional Temple & City Circles',
      hi: 'क्षेत्रीय मंदिर एवं नगर पारायण मंडल',
      te: 'ప్రాంతీయ ఆలయ మరియు నగర కేంద్రాలు',
    },
    description: {
      en: 'Convene neighborhood or temple recitation circles synchronized with the global Mahotsav calendar across any of the 18 nations.',
      hi: 'अपने नगर, मंदिर अथवा सांस्कृतिक केंद्र में विश्व महोत्सव के साथ समन्वित पारायण आयोजित करें।',
      te: 'మీ నగరం లేదా ఆలయంలో అంతర్జాతీయ మహోత్సవంతో అనుసంధానమైన పారాయణ సభను నిర్వహించండి.',
    },
    ctaLabel: { en: 'Host a Parayana', hi: 'पारायण आयोजक बनें', te: 'పారాయణ నిర్వహణ' },
    actionHref: '/participate/register?type=scholar',
    actionKind: 'register',
  },
  {
    id: 'partner',
    registrationType: 'institutional',
    categoryGroup: 'institution',
    title: {
      en: 'Partner with the Mahotsav',
      hi: 'महोत्सव के साथ साझेदारी करें',
      te: 'మహోత్సవంతో భాగస్వామ్యం',
    },
    subtitle: {
      en: 'Academic, Civic & Media Alliances',
      hi: 'शैक्षणिक, सांस्कृतिक एवं प्रसारण सहयोग',
      te: 'విద్యా, సాంస్కృతిక మరియు మీడియా భాగస్వామ్యం',
    },
    description: {
      en: 'Collaborate with Aishwarya Sarvahith Foundation & Sree Media through academic symposia, cultural showcases, or outreach.',
      hi: 'ऐश्वर्या सर्वहित फाउंडेशन और श्री मीडिया के साथ शैक्षणिक व सांस्कृतिक सहयोग स्थापित करें।',
      te: 'ఐశ్వర్య సర్వహిత ఫౌండేషన్ మరియు శ్రీ మీడియాతో సాంస్కృతిక, విద్యా భాగస్వామ్యం పొందండి.',
    },
    ctaLabel: { en: 'Explore Partnerships', hi: 'साझेदारी देखें', te: 'భాగస్వామ్య వివరాలు' },
    actionHref: '/partners',
    actionKind: 'partners',
  },
  {
    id: 'support',
    registrationType: 'individual',
    categoryGroup: 'patron',
    title: {
      en: 'Support the Movement',
      hi: 'महोत्सव अभियान का समर्थन करें',
      te: 'ఉద్యమానికి మద్దతు ఇవ్వండి',
    },
    subtitle: {
      en: 'Patronage for Free Seva & Translation',
      hi: 'निःशुल्क प्रशिक्षण, अनुवाद व आतिथ्य सहयोग',
      te: 'ఉచిత శిక్షణ, అనువాదం మరియు ఆతిథ్యానికి తోడ్పాటు',
    },
    description: {
      en: 'Contribute voluntarily to multilingual manuscript editions, free participant training, and delegate hospitality in Hyderabad.',
      hi: 'बहुभाषी गीता प्रकाशन, निःशुल्क प्रशिक्षण और प्रतिनिधि आतिथ्य हेतु स्वेच्छा से सहयोग दें।',
      te: 'బహుభాషా ప్రచురణలు, ఉచిత శిక్షణ మరియు ప్రతినిధుల ఆతిథ్యం కోసం స్వచ్ఛందంగా తోడ్పడండి.',
    },
    ctaLabel: { en: 'Contribute & Join', hi: 'सहयोग एवं पंजीकरण', te: 'తోడ్పాటు & నమోదు' },
    actionHref: '/participate/register?type=individual',
    actionKind: 'register',
  },
];

export interface WhyParticipateReason {
  index: string;
  id: string;
  pillarTag: { en: string; hi: string; te: string };
  title: { en: string; hi: string; te: string };
  description: { en: string; hi: string; te: string };
}

export const WHY_PARTICIPATE_REASONS: ReadonlyArray<WhyParticipateReason> = [
  {
    index: '01',
    id: 'ancient-to-modern',
    pillarTag: { en: 'Living Relevance', hi: 'व्यावहारिक दर्शन', te: 'సమకాలీన ప్రాసంగికత' },
    title: {
      en: 'Connect Ancient Wisdom with Modern Life',
      hi: 'प्राचीन ज्ञान का आधुनिक जीवन से संवाद',
      te: 'ప్రాచీన జ్ఞానాన్ని ఆధునిక జీవనంతో అనుసంధానించడం',
    },
    description: {
      en: 'Translate Kurukshetra’s philosophical dialogue into clarity for contemporary ethics, family life, and purposeful work.',
      hi: 'कुरुक्षेत्र के शाश्वत संवाद को आधुनिक कार्यक्षेत्र, परिवार और नैतिक निर्णयों की स्पष्टता से जोड़ें।',
      te: 'కురుక్షేత్ర గీతా బోధనలను నేటి వృత్తి, కుటుంబం మరియు నైతిక స్పష్టతతో అన్వయించుకోవడం.',
    },
  },
  {
    index: '02',
    id: 'mental-clarity',
    pillarTag: { en: 'Equanimity', hi: 'समत्व बुद्धि', te: 'మనోనిబ్బరం' },
    title: {
      en: 'Gain Clarity of Mind & Resilience',
      hi: 'मानसिक स्पष्टता और आत्मबल का विकास',
      te: 'మానసిక స్పష్టత మరియు అంతర్గత బలం పొందడం',
    },
    description: {
      en: 'Engage teachings on sthitaprajna—steadiness amidst uncertainty—grounded in BG 2.47 and Chapter VI meditation insights.',
      hi: 'स्थितप्रज्ञता और ध्यानयोग के माध्यम से अनिश्चितता के बीच शांत, केंद्रित और निर्भय रहना सीखें।',
      te: 'అనిశ్చితి మధ్యలోనూ స్థిరంగా నిలిచే స్థితప్రజ్ఞత మరియు ధ్యానయోగ సూత్రాలను అభ్యసించడం.',
    },
  },
  {
    index: '03',
    id: 'youth-empowerment',
    pillarTag: { en: 'Ages 15–35', hi: 'युवा नेतृत्व', te: 'యువశక్తి' },
    title: {
      en: 'Empower Youth with Purposeful Action',
      hi: 'युवाओं को सार्थक कर्म और नेतृत्व की दिशा',
      te: 'యువతకు లక్ష్యశుద్ధి మరియు కర్మయోగ దిశానిర్దేశం',
    },
    description: {
      en: 'Interactive Youth Gita dialogues equip students and young professionals with ethical anchors beyond burnout and distraction.',
      hi: 'युवा गीता मंच विद्यार्थियों व युवा पेशेवरों को तनाव से ऊपर उठकर उद्देश्यपूर्ण जीवन की प्रेरणा देता है।',
      te: 'విద్యార్థులు మరియు యువతకు ఒత్తిడిని అధిగమించి విలువలతో కూడిన నాయకత్వాన్ని అందిస్తుంది.',
    },
  },
  {
    index: '04',
    id: 'global-unity',
    pillarTag: { en: '18 Nations', hi: '१८ देश', te: '18 దేశాలు' },
    title: {
      en: 'Be Part of an 18-Country Cultural Dialogue',
      hi: '१८ देशों की वैश्विक सांस्कृतिक एकता का अनुभव',
      te: '18 దేశాల విశ్వ సాంస్కృతిక సమ్మేళనంలో భాగస్వామ్యం',
    },
    description: {
      en: 'Unite with families, scholars, and diaspora communities across five continents in a landmark celebration of shared heritage.',
      hi: 'पाँच महाद्वीपों के विद्वानों, परिवारों और सांस्कृतिक समुदायों के साथ एक सूत्र में जुड़ें।',
      te: 'ఐదు ఖండాలలోని కుటుంబాలు, విద్వాంసులు మరియు సాంస్కృతిక సమాజాలతో ఏకం కావడం.',
    },
  },
  {
    index: '05',
    id: 'sacred-recitation',
    pillarTag: { en: 'Parayana', hi: 'पारायण', te: 'పారాయణమ్' },
    title: {
      en: 'Chant Alongside Collective Voices Worldwide',
      hi: 'विश्वव्यापी सामूहिक गीता पारायण में सहभागिता',
      te: 'విశ్వవ్యాప్త సామూహిక శ్లోక పారాయణంలో పఠనం',
    },
    description: {
      en: 'Experience both the online Vishwa Ahvanam 6-shloka recitation (20 Dec 2026) and Hyderabad’s live Grand Parayana.',
      hi: '२० दिसम्बर २०२६ के ऑनलाइन पारायण और २७ फरवरी २०२७ को हैदराबाद के महापारायण का जीवंत अनुभव करें।',
      te: 'డిసెంబర్ 20న ఆన్‌లైన్ పారాయణం మరియు ఫిబ్రవరి 27న హైదరాబాద్ మహాపారాయణంలో పాల్గొనండి.',
    },
  },
  {
    index: '06',
    id: 'multilingual-study',
    pillarTag: { en: '18 Languages', hi: '१८ भाषाएँ', te: '18 భాషలు' },
    title: {
      en: 'Explore 18 Chapters in Sanskrit & Mother Tongues',
      hi: 'संस्कृत और १८ भाषाओं में १८ अध्यायों का अध्ययन',
      te: 'సంస్కృతం మరియు 18 మాతృభాషలలో 18 అధ్యాయాలు',
    },
    description: {
      en: 'Access authentic Sanskrit pronunciation guidance paired with verified translations across Indian and global languages.',
      hi: 'शुद्ध संस्कृत उच्चारण मार्गदर्शन के साथ भारतीय व अंतर्राष्ट्रीय भाषाओं में अर्थ समझें।',
      te: 'స్వచ్ఛమైన సంస్కృత ఉచ్చారణతో పాటు భారతీయ మరియు అంతర్జాతీయ భాషలలో భావార్థం తెలుసుకోండి.',
    },
  },
  {
    index: '07',
    id: 'seva-and-dharma',
    pillarTag: { en: 'Karma Yoga', hi: 'सेवा भाव', te: 'సేవా మార్గం' },
    title: {
      en: 'Turn Philosophy into Living Seva',
      hi: 'दर्शन को लोककल्याण और सेवा में उतारना',
      te: 'తాత్విక జ్ఞానాన్ని నిత్య సేవగా మలచుకోవడం',
    },
    description: {
      en: 'Apply lokasangraha—acting for universal welfare—through hospitality, translation, academic research, or community service.',
      hi: 'आतिथ्य, अनुवाद और सामुदायिक समन्वय द्वारा लोकसंग्रह (सर्वकल्याण) के आदर्श को जीना।',
      te: 'ఆతిథ్యం, అనువాదం మరియు సామాజిక సేవ ద్వారా లోకసంగ్రహ భావాన్ని ఆచరణలో పెట్టడం.',
    },
  },
  {
    index: '08',
    id: 'family-heritage',
    pillarTag: { en: 'Intergenerational', hi: 'पारिवारिक धरोहर', te: 'కుటుంబ వారసత్వం' },
    title: {
      en: 'Preserve Living Heritage for Future Generations',
      hi: 'आने वाली पीढ़ियों के लिए सांस्कृतिक धरोहर',
      te: 'భవిష్యత్ తరాల కోసం సజీవ వారసత్వ సంరక్షణ',
    },
    description: {
      en: 'Create enduring family memories rooted in reverence, music, Sanskrit melody, and value-based mentorship for children.',
      hi: 'बच्चों और युवाओं के लिए संस्कृति, संगीत और सद्गुणों की जीवंत पारिवारिक परंपरा संजोएँ।',
      te: 'పిల్లలకు మరియు యువతకు సంస్కృతి, సంగీతం మరియు సద్గుణాల వారసత్వాన్ని అందించడం.',
    },
  },
  {
    index: '09',
    id: 'vishwa-diwas-legacy',
    pillarTag: { en: 'Permanent Legacy', hi: 'स्थायी संकल्प', te: 'శాశ్వత సంకల్పం' },
    title: {
      en: 'Witness the Launch of Annual Vishwa Diwas',
      hi: 'वार्षिक "भगवद्गीता विश्व दिवस" संकल्प के साक्षी बनें',
      te: 'వార్షిక "భగవద్గీత విశ్వ దివస్" ఆవిష్కరణలో భాగం కావడం',
    },
    description: {
      en: 'Stand at the historic inception of permanent civic, academic, and cultural resolutions following the Hyderabad 2027 Mahotsav.',
      hi: 'हैदराबाद २०२७ से प्रारंभ होने वाले स्थायी शैक्षणिक, सांस्कृतिक एवं अंतर्राष्ट्रीय संकल्पों का अंग बनें।',
      te: 'హైదరాబాద్ 2027 తర్వాత ప్రతి ఏటా జరుపుకునే శాశ్వత సాంస్కృతిక సంకల్పాలకు సాక్షీభూతులు కావడం.',
    },
  },
];
