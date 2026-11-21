import type { FaqItem, LocalizedText, PolicyDocument } from '../types/cms';

export interface AboutValuePillar {
  id: string;
  index: string;
  title: LocalizedText;
  description: LocalizedText;
}

export const FOUR_YOGA_PATHS: ReadonlyArray<AboutValuePillar> = [
  {
    id: 'karma-yoga',
    index: '01',
    title: {
      en: 'Karma Yoga · Path of Selfless Action',
      hi: 'कर्मयोग · निस्वार्थ कर्म और सेवा का पथ',
      te: 'కర్మయోగము · నిస్వార్థ కర్మ మరియు సేవా మార్గము',
    },
    description: {
      en: 'Grounded in seva (selfless service) by over 200 sub-committee leaders, volunteers, and institutional collaborators working toward shared global welfare.',
      hi: '२०० से अधिक उप-समिति प्रमुखों, स्वयंसेवकों और संस्थागत सहयोगियों की निस्वार्थ सेवा भावना पर आधारित।',
      te: '200 మందికి పైగా ఉప-కమిటీ నాయకులు, స్వచ్ఛంద సేవకులు మరియు సంస్థల నిస్వార్థ సేవాభావంపై ఆధారపడింది.',
    },
  },
  {
    id: 'bhakti-yoga',
    index: '02',
    title: {
      en: 'Bhakti Yoga · Path of Collective Devotion',
      hi: 'भक्तियोग · सामूहिक श्रद्धा और भक्ति का पथ',
      te: 'భక్తియోగము · సామూహిక శ్రద్ధ మరియు భక్తి మార్గము',
    },
    description: {
      en: 'Expressed in synchronized multi-lingual recitation—hearing the same timeless verse resonate from 50,000+ voices across mother tongues and Sanskrit.',
      hi: 'विश्वभर में मातृभाषाओं और संस्कृत में एक साथ गूंजते पचास सहस्र से अधिक स्वरों की भक्तिपूर्ण अभिव्यक्ति।',
      te: 'ప్రపంచవ్యాప్తంగా మాతృభాషలలో మరియు సంస్కృతంలో యాభై వేలకు పైగా గొంతులు ఏకమై పఠించే భక్తియుత వ్యక్తీకరణ.',
    },
  },
  {
    id: 'jnana-yoga',
    index: '03',
    title: {
      en: 'Jnana Yoga · Path of Inquiry & Scholarship',
      hi: 'ज्ञानयोग · तात्विक विवेक और शोध का पथ',
      te: 'జ్ఞానయోగము · తాత్విక విచారణ మరియు విజ్ఞాన మార్గము',
    },
    description: {
      en: 'Dedicated academic dialogues, philosophical colloquia, and Youth Gita forums connecting classical Vedanta with ethical clarity in contemporary life.',
      hi: 'शास्त्रीय ज्ञान को समकालीन नैतिक निर्णयों और युवा जिज्ञासा से जोड़ने वाली विद्वत् संगोष्ठियाँ और विमर्श।',
      te: 'ప్రాచీన గీతా జ్ఞానాన్ని ఆధునిక నైతిక విలువలు మరియు యువత ఆలోచనలతో అనుసంధానించే విద్వత్ చర్చలు.',
    },
  },
  {
    id: 'dhyana-yoga',
    index: '04',
    title: {
      en: 'Dhyana Yoga · Path of Inner Equilibrium',
      hi: 'ध्यानयोग · आंतरिक शांति और आत्मसंयम का पथ',
      te: 'ధ్యానయోగము · అంతర్గత ప్రశాంతత మరియు ఆత్మసంయమ మార్గము',
    },
    description: {
      en: 'Cultivating stillness, clarity of consciousness, and balanced living across cultures—celebrating the Gita as a living discipline of peace.',
      hi: 'विभिन्न संस्कृतियों में मानसिक संतुलन, स्पष्ट चेतना और शांतिपूर्ण जीवन के सजीव अभ्यास का उत्सव।',
      te: 'సకల సంస్కృతులలో మానసిక సమతుల్యతను, ప్రశాంతతను మరియు శాంతియుత జీవనాన్ని ప్రోత్సహించే సజీవ సాధన.',
    },
  },
];

export const SIGNIFICANCE_OF_18_ITEMS: ReadonlyArray<{
  value: string;
  title: LocalizedText;
  detail: LocalizedText;
}> = [
  {
    value: '18',
    title: {
      en: 'Sacred Chapters (Adhyayas)',
      hi: 'अठारह पवित्र अध्याय',
      te: 'పవిత్ర అష్టాదశ అధ్యాయాలు',
    },
    detail: {
      en: 'Eighteen chapters of the Bhagavad Gita forming a complete synthesis of action, devotion, and liberating wisdom.',
      hi: 'कर्म, भक्ति और ज्ञान का पूर्ण समन्वय प्रस्तुत करने वाले श्रीमद्भगवद्गीता के १८ अध्याय।',
      te: 'కర్మ, భక్తి, జ్ఞాన యోగాల సంపూర్ణ సమన్వయాన్ని అందించే భగవద్గీత 18 అధ్యాయాలు.',
    },
  },
  {
    value: '18',
    title: {
      en: 'Participating Nations',
      hi: 'अठारह सहभागी देश',
      te: 'పాల్గొనే 18 దేశాలు',
    },
    detail: {
      en: 'Global chapters spanning India, the Americas, Europe, Eurasia, Africa, the Middle East, Asia, and Oceania.',
      hi: 'भारत सहित एशिया, यूरोप, अमेरिका, अफ्रीका, मध्य पूर्व और ओशिनिया के १८ सहभागी राष्ट्र।',
      te: 'భారతదేశంతో సహా ఆసియా, అమెరికా, యూరప్, ఆఫ్రికా, మధ్యప్రాచ్యం మరియు ఓషియానియాలోని 18 దేశాలు.',
    },
  },
  {
    value: '18',
    title: {
      en: 'Languages of Expression',
      hi: 'अठारह अभिव्यक्ति भाषाएँ',
      te: '18 భాషలలో గీతా సందేశం',
    },
    detail: {
      en: 'Participants honor both Sanskrit and their own mother tongues—uniting eighteen linguistic traditions around one shared text.',
      hi: 'संस्कृत और १८ मातृभाषाओं के माध्यम से एक ही सार्वभौमिक संदेश की बहुभाषी अभिव्यक्ति।',
      te: 'సంస్కృతంతో పాటు 18 మాతృభాషలలో ఒకే విశ్వసందేశాన్ని వినిపించే బహుభాషా వేదిక.',
    },
  },
  {
    value: '700',
    title: {
      en: 'Verses of Timeless Counsel',
      hi: 'सात सौ शाश्वत श्लोक',
      te: '700 శాశ్వత శ్లోకాలు',
    },
    detail: {
      en: 'Eighteen chapters encompassing 700 shlokas—traditionally studied as the complete philosophy of righteous human life.',
      hi: 'धर्मसम्मत मानवीय जीवन का सम्पूर्ण दर्शन समेटने वाले १८ अध्यायों के ७०० श्लोक।',
      te: 'ధర్మబద్ధమైన మానవ జీవన విధానాన్ని సంపూర్ణంగా బోధించే 700 గీతా శ్లోకాలు.',
    },
  },
];

export const OFFICIAL_FAQS: ReadonlyArray<FaqItem> = [
  {
    id: 'faq-what-is-bgvm',
    category: 'general',
    question: {
      en: 'What is Bhagavad Gita Vishwa Mahotsav 2027, and who organizes it?',
      hi: 'भगवद्गीता विश्व महोत्सव 2027 क्या है और इसका आयोजन कौन कर रहा है?',
      te: 'భగవద్గీత విశ్వ మహోత్సవం 2027 అంటే ఏమిటి? దీనిని ఎవరు నిర్వహిస్తున్నారు?',
    },
    answer: {
      en: 'Bhagavad Gita Vishwa Mahotsav 2027 ("Project Eternal") is an international cultural and philosophical celebration bringing together 18 countries around the 18 chapters and 18 languages of the Bhagavad Gita. It is organized by Aishwarya Sarvahith Foundation (ASF), Hyderabad, in association with Sree Media.',
      hi: 'भगवद्गीता विश्व महोत्सव 2027 ("प्रोजेक्ट इटर्नल") १८ देशों को भगवद्गीता के १८ अध्यायों और १८ भाषाओं से जोड़ने वाला अंतर्राष्ट्रीय सांस्कृतिक महोत्सव है। इसका आयोजन हैदराबाद स्थित ऐश्वर्या सर्वहित फाउंडेशन (ASF) द्वारा श्री मीडिया के सहयोग से किया जा रहा है।',
      te: 'భగవద్గీత విశ్వ మహోత్సవం 2027 ("ప్రాజెక్ట్ ఎటర్నల్") భగవద్గీతలోని 18 అధ్యాయాలు, 18 భాషల స్ఫూర్తితో 18 దేశాలను అనుసంధానించే అంతర్జాతీయ సాంస్కృతిక వేడుక. దీనిని హైదరాబాద్‌లోని ఐశ్వర్య సర్వహిత ఫౌండేషన్ (ASF) శ్రీ మీడియా సహకారంతో నిర్వహిస్తోంది.',
    },
  },
  {
    id: 'faq-key-dates',
    category: 'general',
    question: {
      en: 'What are the confirmed key event dates?',
      hi: 'इस महोत्सव की मुख्य और पुष्ट तिथियाँ क्या हैं?',
      te: 'ఈ మహోత్సవం యొక్క ప్రధాన తేదీలు ఏమిటి?',
    },
    answer: {
      en: 'Two primary calendar anchors are officially published: 20 December 2026 for the Vishwa Ahvanam Curtain Raiser (online global recitation), and 27 February 2027 for the Main Bhagavad Gita Vishwa Mahotsav in Hyderabad, India.',
      hi: 'दो मुख्य तिथियाँ आधिकारिक रूप से घोषित हैं: २० दिसम्बर २०२६ को विश्व आह्वानम् (ऑनलाइन कर्टेन रेज़र) और २७ फरवरी २०२७ को हैदराबाद में मुख्य भगवद्गीता विश्व महोत्सव।',
      te: 'అధికారికంగా ప్రకటించిన రెండు ప్రధాన తేదీలు: 20 డిసెంబర్ 2026న విశ్వ ఆహ్వానమ్ (ఆన్‌లైన్ కర్టెన్ రైజర్), మరియు 27 ఫిబ్రవరి 2027న హైదరాబాద్‌లో ప్రధాన భగవద్గీత విశ్వ మహోత్సవం.',
    },
  },
  {
    id: 'faq-participation-format',
    category: 'curtain-raiser',
    question: {
      en: 'How does the 20 December 2026 Curtain Raiser connect to 27 February 2027?',
      hi: '२० दिसम्बर २०२६ का कर्टेन रेज़र २७ फरवरी २०२७ के मुख्य समारोह से कैसे जुड़ा है?',
      te: '20 డిసెంబర్ 2026 కర్టెన్ రైజర్, 27 ఫిబ్రవరి 2027 ప్రధాన వేడుకతో ఎలా అనుసంధానమై ఉంటుంది?',
    },
    answer: {
      en: 'Under official participation guidelines, registered international participants join online on 20 December 2026 (Vishwa Ahvanam) to recite six designated shlokas in their mother tongue and Sanskrit. Selected participants are invited to recite at least two shlokas live on stage on 27 February 2027 in Hyderabad, with training material provided by the organizers.',
      hi: 'आधिकारिक दिशानिर्देशों के अनुसार, पंजीकृत अंतर्राष्ट्रीय प्रतिभागी २० दिसम्बर २०२६ को ऑनलाइन जुड़कर ६ निर्धारित श्लोकों का मातृभाषा व संस्कृत में पाठ करेंगे। चयनित प्रतिभागियों को २७ फरवरी २०२७ को हैदराबाद में मुख्य मंच पर कम-से-कम २ श्लोक प्रस्तुत करने हेतु आमंत्रित किया जाएगा।',
      te: 'అధికారిక నియమావళి ప్రకారం, నమోదైన ప్రతినిధులు 20 డిసెంబర్ 2026న ఆన్‌లైన్ ద్వారా 6 నిర్దేశిత శ్లోకాలను మాతృభాష మరియు సంస్కృతంలో పఠిస్తారు. ఎంపికైన వారికి 27 ఫిబ్రవరి 2027న హైదరాబాద్ ప్రధాన వేదికపై కనీసం 2 శ్లోకాలు పఠించే అవకాశం కల్పిస్తారు.',
    },
  },
  {
    id: 'faq-who-can-join',
    category: 'participation',
    question: {
      en: 'Is participation restricted to any specific faith, age, or nationality?',
      hi: 'क्या इसमें सहभागिता किसी विशेष धर्म, आयु या राष्ट्रीयता तक सीमित है?',
      te: 'ఇందులో పాల్గొనడానికి ఏదైనా మతం, వయస్సు లేదా దేశ పరిమితి ఉందా?',
    },
    answer: {
      en: 'No. The Bhagavad Gita Vishwa Mahotsav is conceived as a universal philosophical and cultural celebration open to individuals, families, students, youth (with dedicated Youth Gita focus for ages 15–35), academic institutions, and volunteers worldwide, subject to organizer registration confirmation.',
      hi: 'नहीं। यह एक सार्वभौमिक दार्शनिक व सांस्कृतिक उत्सव है जो विश्वभर के सभी व्यक्तियों, परिवारों, विद्यार्थियों, युवाओं (१५–३५ आयु वर्ग हेतु युवा गीता), संस्थानों और स्वयंसेवकों के लिए खुला है।',
      te: 'లేదు. ఇది సకల మానవాళికి ఉద్దేశించిన విశ్వజనీన తత్వ వేడుక. ప్రపంచవ్యాప్తంగా ఉన్న వ్యక్తులు, కుటుంబాలు, యువత (15–35 ఏళ్లకు యువ గీత), విద్యాసంస్థలు మరియు సేవకులు నిర్వాహకుల నిర్ధారణతో పాల్గొనవచ్చు.',
    },
  },
  {
    id: 'faq-hospitality',
    category: 'travel',
    question: {
      en: 'What hospitality and travel arrangements apply for selected international participants?',
      hi: 'चयनित अंतर्राष्ट्रीय प्रतिभागियों के लिए आवास और यात्रा की क्या व्यवस्था है?',
      te: 'ఎంపికైన అంతర్జాతీయ ప్రతినిధులకు వసతి మరియు ప్రయాణ సదుపాయాలు ఎలా ఉంటాయి?',
    },
    answer: {
      en: 'Per the published Terms & Conditions (Version 2026-11-05), for selected international participants, the Organising Team provides accommodation, food, and local transportation in Hyderabad for four (4) days after arrival. International airfare, visa fees, travel insurance, and personal expenses remain the responsibility of the participant unless specifically agreed in writing.',
      hi: 'प्रकाशित नियमों (संस्करण 2026-11-05) के अनुसार, चयनित अंतर्राष्ट्रीय प्रतिभागियों को हैदराबाद आगमन के पश्चात् चार (४) दिनों का आवास, भोजन और स्थानीय परिवहन आयोजक टीम द्वारा उपलब्ध कराया जाएगा। अंतर्राष्ट्रीय हवाई किराया, वीज़ा शुल्क और यात्रा बीमा प्रतिभागी के स्वयं के दायित्व हैं।',
      te: 'ప్రకటిత నిబంధనల (2026-11-05) ప్రకారం, ఎంపికైన అంతర్జాతీయ ప్రతినిధులకు హైదరాబాద్ చేరుకున్న తర్వాత నాలుగు (4) రోజుల పాటు వసతి, భోజనం మరియు స్థానిక రవాణా సదుపాయాలను నిర్వాహక బృందం అందిస్తుంది. విమాన ఛార్జీలు, వీసా మరియు ప్రయాణ బీమా ప్రతినిధుల స్వీయ బాధ్యత.',
    },
  },
  {
    id: 'faq-refund-donations',
    category: 'governance',
    question: {
      en: 'How are contributions and refunds handled?',
      hi: 'योगदान और रिफंड नीति का संचालन किस प्रकार होता है?',
      te: 'విరాళాలు మరియు రీఫండ్ విధానం ఎలా పనిచేస్తుంది?',
    },
    answer: {
      en: 'All contributions are managed by Aishwarya Sarvahith Foundation through authorized payment channels. Voluntary charitable donations are generally non-refundable once received except in cases of verified duplicate payment, processing error, or legal requirement. Full clauses are published under Cancellation & Refund Policy.',
      hi: 'समस्त योगदान ऐश्वर्या सर्वहित फाउंडेशन द्वारा अधिकृत भुगतान माध्यमों से प्रबंधित किए जाते हैं। स्वैच्छिक दान सामान्यतः नॉन-रिफंडेबल हैं, सिवाय सत्यापित डुप्लिकेट भुगतान, तकनीकी त्रुटि या विधिक अनिवार्यता के।',
      te: 'అన్ని విరాళాలు ఐశ్వర్య సర్వహిత ఫౌండేషన్ ద్వారా అధికారిక చెల్లింపు మార్గాలలో నిర్వహించబడతాయి. స్వచ్ఛంద విరాళాలు సాధారణంగా రీఫండ్ చేయబడవు; కానీ డూప్లికేట్ చెల్లింపులు లేదా సాంకేతిక లోపాలు నిర్ధారించబడితే వర్తించే నిబంధనల ప్రకారం పరిశీలించబడతాయి.',
    },
  },
];

export const OFFICIAL_POLICY_DOCUMENTS: Record<PolicyDocument['id'], PolicyDocument> = {
  privacy: {
    id: 'privacy',
    route: '/privacy-policy',
    title: {
      en: 'Privacy Policy',
      hi: 'गोपनीयता नीति',
      te: 'గోప్యతా విధానం',
    },
    subtitle: {
      en: 'Aishwarya Sarvahith Foundation (ASF) — Stewardship of Personal & Registration Data',
      hi: 'ऐश्वर्या सर्वहित फाउंडेशन (ASF) — व्यक्तिगत और पंजीकरण डेटा संरक्षण',
      te: 'ఐశ్వర్య సర్వహిత ఫౌండేషన్ (ASF) — వ్యక్తిగత మరియు నమోదు సమాచార భద్రత',
    },
    effectiveDate: '5 November 2026',
    version: '2026-11-05',
    governingEntity: 'Aishwarya Sarvahith Foundation (ASF)',
    sections: [
      {
        heading: {
          en: '1. Introduction & Institutional Commitment',
          hi: '१. परिचय और संस्थागत प्रतिबद्धता',
          te: '1. పరిచయం మరియు సంస్థాగత నిబద్ధత',
        },
        paragraphs: [
          {
            en: 'Aishwarya Sarvahith Foundation ("ASF", "we", "our" or "us"), the organising foundation of Bhagavadgita Vishwa Ahvanam – Curtain Raiser and Bhagavadgita Vishwa Mahotsav 2027, respects the privacy of individuals who visit our website, register for programmes, participate in events, make donations, or communicate with our team.',
            hi: 'भगवद्गीता विश्व आह्वानम् – कर्टेन रेज़र और भगवद्गीता विश्व महोत्सव 2027 की आयोजक संस्था ऐश्वर्या सर्वहित फाउंडेशन ("ASF") वेबसाइट आगंतुकों, प्रतिभागियों और दानदाताओं की निजता का पूर्ण सम्मान करती है।',
            te: 'భగవద్గీత విశ్వ ఆహ్వానమ్ – కర్టెన్ రైజర్ మరియు భగవద్గీత విశ్వ మహోత్సవం 2027 నిర్వహణ సంస్థ అయిన ఐశ్వర్య సర్వహిత ఫౌండేషన్ ("ASF") సందర్శకులు మరియు ప్రతినిధుల గోప్యతను గౌరవిస్తుంది.',
          },
          {
            en: 'We are committed to handling personal information responsibly and transparently in alignment with applicable Indian data protection standards.',
            hi: 'हम लागू डेटा संरक्षण मानकों के अनुरूप व्यक्तिगत जानकारी को जिम्मेदारी और पारदर्शिता के साथ संभालने के लिए प्रतिबद्ध हैं।',
            te: 'వర్తించే డేటా రక్షణ ప్రమాణాలకు అనుగుణంగా వ్యక్తిగత సమాచారాన్ని బాధ్యతాయుతంగా మరియు పారదర్శకంగా నిర్వహించడానికి మేము కట్టుబడి ఉన్నాము.',
          },
        ],
      },
      {
        heading: {
          en: '2. Information We Collect',
          hi: '२. एकत्र की जाने वाली जानकारी',
          te: '2. మేము సేకరించే సమాచారం',
        },
        paragraphs: [
          {
            en: 'Depending on your interaction with the platform, we may collect contact, registration, and hospitality coordination data solely for event execution and statutory receipts.',
            hi: 'वेबसाइट के साथ आपके संवाद के आधार पर हम केवल कार्यक्रम संचालन और वैधानिक रसीदों के लिए आवश्यक संपर्क व पंजीकरण जानकारी एकत्र करते हैं।',
            te: 'కార్యక్రమ నిర్వహణ మరియు అధికారిక రసీదుల కోసం మాత్రమే అవసరమైన సంప్రదింపు మరియు నమోదు వివరాలను సేకరిస్తాము.',
          },
        ],
        bullets: [
          {
            en: 'Personal & Contact Details: Full name, email address, phone number, country, and city of residence.',
            hi: 'व्यक्तिगत एवं संपर्क विवरण: पूरा नाम, ईमेल पता, फोन नंबर, देश और निवास नगर।',
            te: 'వ్యక్తిగత మరియు సంప్రదింపు వివరాలు: పూర్తి పేరు, ఇమెయిల్, ఫోన్ నంబర్, దేశం మరియు నగరం.',
          },
          {
            en: 'Event Registration Details: Participation category, event selection (Curtain Raiser / Main Mahotsav), language preference, and shloka training readiness.',
            hi: 'पंजीकरण विवरण: सहभागिता श्रेणी, चयनित कार्यक्रम, भाषा वरीयता और श्लोक प्रशिक्षण तैयारी।',
            te: 'నమోదు వివరాలు: పాల్గొనే విభాగం, ఎంచుకున్న కార్యక్రమాలు, భాషా ప్రాధాన్యత మరియు శ్లోక శిక్షణ వివరాలు.',
          },
          {
            en: 'Hospitality Coordination: Optional Visa, Accommodation, or Local Transport assistance requests submitted by delegates.',
            hi: 'आतिथ्य समन्वय: प्रतिभागियों द्वारा अनुरोधित वैकल्पिक वीज़ा, आवास या स्थानीय परिवहन सहायता।',
            te: 'ఆతిథ్య సమన్వయం: ప్రతినిధులు కోరిన వీసా, వసతి లేదా స్థానిక రవాణా సహాయ వివరాలు.',
          },
        ],
      },
      {
        heading: {
          en: '3. Local Interface Preferences & Payment Gateway Integrity',
          hi: '३. ब्राउज़र वरीयताएँ और भुगतान सुरक्षा',
          te: '3. ఇంటర్‌ఫేస్ ప్రాధాన్యతలు మరియు చెల్లింపు భద్రత',
        },
        paragraphs: [
          {
            en: 'This digital showcase stores only your selected display language (EN, HI, TE) and in-progress form draft locally in your browser session to prevent accidental loss while completing fields. Final payment authentication and receipts are processed exclusively on authorized official payment gateways.',
            hi: 'यह डिजिटल मंच केवल आपकी चयनित प्रदर्शन भाषा और अपूर्ण फॉर्म ड्राफ्ट को स्थानीय ब्राउज़र सत्र में सहेजता है। अंतिम भुगतान और रसीद प्रक्रिया केवल अधिकृत भुगतान गेटवे पर संपन्न होती है।',
            te: 'ఈ వేదిక కేవలం మీరు ఎంచుకున్న భాషను మరియు ఫారమ్ డ్రాఫ్ట్‌ను మీ బ్రౌజర్‌లో భద్రపరుస్తుంది. తుది చెల్లింపులు అధికారిక పేమెంట్ గేట్‌వే ద్వారా మాత్రమే ప్రాసెస్ చేయబడతాయి.',
          },
        ],
      },
    ],
  },
  terms: {
    id: 'terms',
    route: '/terms-conditions',
    title: {
      en: 'Terms & Conditions',
      hi: 'नियम एवं शर्तें',
      te: 'నియమ నిబంధనలు',
    },
    subtitle: {
      en: 'Bhagavadgita Vishwa Ahvanam & Bhagavadgita Vishwa Mahotsav 2027 — Organized by ASF',
      hi: 'भगवद्गीता विश्व आह्वानम् एवं विश्व महोत्सव 2027 — ऐश्वर्या सर्वहित फाउंडेशन द्वारा आयोजित',
      te: 'భగవద్గీత విశ్వ ఆహ్వానమ్ మరియు విశ్వ మహోత్సవం 2027 — ASF నిర్వహణ నియమాలు',
    },
    effectiveDate: '5 November 2026',
    version: '2026-11-05',
    governingEntity: 'Aishwarya Sarvahith Foundation (ASF)',
    sections: [
      {
        heading: {
          en: '1. Acceptance, Eligibility & Registration',
          hi: '१. स्वीकृति, पात्रता एवं पंजीकरण',
          te: '1. అంగీకారం, అర్హత మరియు నమోదు',
        },
        paragraphs: [
          {
            en: 'Participation is open to individuals, institutions, and organisations from India and abroad, subject to organisers’ selection and confirmation. Registrants must provide accurate, complete, and current information; organisers reserve the right to review, accept, or decline any submission.',
            hi: 'यह आयोजन भारत और विदेश के सभी व्यक्तियों, संस्थानों व संगठनों के लिए खुला है। प्रतिभागियों को सटीक जानकारी प्रदान करनी होगी; पंजीकरण स्वीकृति व चयन का अंतिम अधिकार आयोजकों के पास सुरक्षित है।',
            te: 'భారతదేశం మరియు విదేశాలలోని వ్యక్తులు, సంస్థలకు ప్రవేశం కల్పించబడుతుంది. నమోదుదారులు ఖచ్చితమైన వివరాలు అందించాలి; ఆమోదం మరియు ఎంపికపై తుది నిర్ణయం నిర్వాహకులదే.',
          },
        ],
      },
      {
        heading: {
          en: '2. Event Participation Structure',
          hi: '२. कार्यक्रम सहभागिता प्रारूप',
          te: '2. కార్యక్రమ భాగస్వామ్య విధానం',
        },
        paragraphs: [
          {
            en: 'All registered international participants join online on 20 December 2026 (Vishwa Ahvanam) reciting six (6) designated shlokas in their mother tongue and Sanskrit. Selected participants take part in the live stage event on 27 February 2027 at Hyderabad, India, reciting at least two (2) of the six designated shlokas. Organizers furnish selection guidance and training material.',
            hi: 'पंजीकृत अंतर्राष्ट्रीय प्रतिभागी २० दिसम्बर २०२६ को ऑनलाइन छह (६) निर्धारित श्लोकों का मातृभाषा एवं संस्कृत में पाठ करेंगे। चयनित प्रतिभागी २७ फरवरी २०२७ को हैदराबाद के मुख्य मंच पर कम-से-कम दो (२) श्लोक प्रस्तुत करेंगे।',
            te: 'నమోదు చేసుకున్న అంతర్జాతీయ ప్రతినిధులు 20 డిసెంబర్ 2026న ఆన్‌లైన్ ద్వారా ఆరు (6) శ్లోకాలను మాతృభాష మరియు సంస్కృతంలో పఠిస్తారు. ఎంపికైనవారు 27 ఫిబ్రవరి 2027న హైదరాబాద్ వేదికపై కనీసం రెండు (2) శ్లోకాలను పఠించాల్సి ఉంటుంది.',
          },
        ],
      },
      {
        heading: {
          en: '3. Travel, Accommodation & Hospitality',
          hi: '३. यात्रा, आवास एवं आतिथ्य व्यवस्था',
          te: '3. ప్రయాణం, వసతి మరియు ఆతిథ్య సదుపాయాలు',
        },
        paragraphs: [
          {
            en: 'For selected international participants, the Organising Team provides accommodation, food, and local transportation in Hyderabad, India for four (4) days after arrival. International airfare, visa fees, travel insurance, and personal incidental expenses remain the responsibility of the participant unless explicitly agreed in writing.',
            hi: 'चयनित अंतर्राष्ट्रीय प्रतिभागियों को हैदराबाद आगमन के पश्चात् चार (४) दिनों हेतु आवास, भोजन व स्थानीय परिवहन आयोजक दल द्वारा प्रदान किया जाएगा। अंतर्राष्ट्रीय विमान यात्रा, वीज़ा शुल्क और बीमा प्रतिभागी के स्वयं के दायित्व होंगे।',
            te: 'ఎంపికైన అంతర్జాతీయ ప్రతినిధులకు హైదరాబాద్ వచ్చిన తర్వాత నాలుగు (4) రోజుల పాటు వసతి, భోజనం మరియు స్థానిక రవాణాను నిర్వాహకులు సమకూరుస్తారు. విమాన టికెట్లు, వీసా రుసుములు మరియు బీమా ప్రతినిధుల బాధ్యత.',
          },
        ],
      },
      {
        heading: {
          en: '4. Content Integrity & Intellectual Property',
          hi: '४. सामग्री प्रमाणिकता एवं बौद्धिक संपदा',
          te: '4. సమాచార ప్రామాణికత మరియు మేధో సంపత్తి',
        },
        paragraphs: [
          {
            en: 'Official event logos, partner emblems, visual studies, recordings, and programmatic announcements remain governed by Aishwarya Sarvahith Foundation and Sree Media editorial stewardship.',
            hi: 'आधिकारिक प्रतीक चिह्न, दृश्य सामग्री, रिकॉर्डिंग और कार्यक्रम घोषणाएँ ऐश्वर्या सर्वहित फाउंडेशन तथा श्री मीडिया के संपादकीय स्वामित्व के अधीन हैं।',
            te: 'అధికారిక లోగోలు, చిత్రాలు, వీడియోలు మరియు ప్రకటనలు ఐశ్వర్య సర్వహిత ఫౌండేషన్ మరియు శ్రీ మీడియా పరిధిలో ఉంటాయి.',
          },
        ],
      },
    ],
  },
  refund: {
    id: 'refund',
    route: '/cancellation-refund-policy',
    title: {
      en: 'Cancellation & Refund Policy',
      hi: 'रद्दीकरण एवं रिफंड नीति',
      te: 'రద్దు మరియు రీఫండ్ విధానం',
    },
    subtitle: {
      en: 'Transparency, Accountability & Responsible Fund Stewardship — Aishwarya Sarvahith Foundation',
      hi: 'पारदर्शिता, उत्तरदायित्व एवं निधि प्रबंधन — ऐश्वर्या सर्वहित फाउंडेशन (ASF)',
      te: 'పారదర్శకత మరియు బాధ్యతాయుత నిధుల నిర్వహణ — ఐశ్వర్య సర్వహిత ఫౌండేషన్ (ASF)',
    },
    effectiveDate: '5 November 2026',
    version: '2026-11-05',
    governingEntity: 'Aishwarya Sarvahith Foundation (ASF)',
    sections: [
      {
        heading: {
          en: '1. Charitable Donations',
          hi: '१. धर्मार्थ दान एवं योगदान',
          te: '1. స్వచ్ఛంద విరాళాలు',
        },
        paragraphs: [
          {
            en: 'Voluntary donations made to ASF support the Foundation’s charitable objectives across education, cultural preservation inspired by the Bhagavadgita, humanitarian welfare, and event execution. Accordingly, donations are generally non-refundable once received, except under verified exceptional circumstances.',
            hi: 'ASF को दिए गए स्वैच्छिक दान शिक्षा, भगवद्गीता सांस्कृतिक प्रचार व मानव कल्याण के उद्देश्यों का समर्थन करते हैं। अतः दान सामान्यतः वापस नहीं किए जा सकते, सिवाय सत्यापित अपवाद स्थितियों के।',
            te: 'ASFకు అందించే స్వచ్ఛంద విరాళాలు విద్య, భగవద్గీత విశ్వవ్యాప్తి మరియు సేవా కార్యక్రమాలకు వినియోగించబడతాయి. అందువల్ల సాధారణంగా ఇవి తిరిగి చెల్లించబడవు.',
          },
        ],
        bullets: [
          {
            en: 'Verified duplicate payment made for the same transaction.',
            hi: 'एक ही लेनदेन के लिए सत्यापित दोहरा (डुप्लिकेट) भुगतान होने पर।',
            te: 'ఒకే లావాదేవీకి పొరపాటున రెండుసార్లు చెల్లింపు జరిగినట్లు నిర్ధారించబడినప్పుడు.',
          },
          {
            en: 'Demonstrable technical payment error approved following Secretariat verification.',
            hi: 'सचिवालय द्वारा सत्यापित तकनीकी या प्रक्रियागत भुगतान त्रुटि सिद्ध होने पर।',
            te: 'సచివాలయ పరిశీలనలో సాంకేతిక చెల్లింపు లోపం నిర్ధారించబడినప్పుడు.',
          },
          {
            en: 'Refund expressly mandated under applicable Indian law or official event cancellation provisions.',
            hi: 'प्रचलित भारतीय कानून या आधिकारिक आयोजन निरस्तीकरण नियम के अंतर्गत अनिवार्य होने पर।',
            te: 'భారతీయ చట్టాల ప్రకారం లేదా అధికారిక కార్యక్రమ రద్దు నిబంధనల మేరకు తప్పనిసరి అయినప్పుడు.',
          },
        ],
      },
      {
        heading: {
          en: '2. Event Registration & Postponement',
          hi: '२. कार्यक्रम पंजीकरण एवं स्थगन स्थिति',
          te: '2. కార్యక్రమ నమోదు మరియు వాయిదా నిబంధనలు',
        },
        paragraphs: [
          {
            en: 'If an event is postponed or rescheduled due to unforeseen force majeure circumstances beyond ASF’s reasonable control, confirmed registrations are transferred cleanly to the revised date, or participants are notified by the Secretariat regarding eligible options.',
            hi: 'अपरिहार्य परिस्थितियों में कार्यक्रम स्थगित होने पर पंजीकरण नवीन तिथि हेतु स्थानांतरित किया जाएगा अथवा सचिवालय द्वारा पात्र विकल्पों की सूचना दी जाएगी।',
            te: 'అనివార్య కారణాల వల్ల కార్యక్రమం వాయిదా పడితే, నమోదులు తదుపరి తేదీకి బదిలీ చేయబడతాయి లేదా అర్హత గల ప్రత్యామ్నాయాలు తెలియజేయబడతాయి.',
          },
        ],
      },
      {
        heading: {
          en: '3. Requesting Verification or Clarification',
          hi: '३. सत्यापन एवं संपर्क प्रक्रिया',
          te: '3. విచారణ మరియు సంప్రదింపు విధానం',
        },
        paragraphs: [
          {
            en: 'Donors and registrants seeking reconciliation of duplicate or unauthorized transactions should contact the ASF Secretariat with transaction reference details at Sasi8372@gmail.com or +91 73967 56590.',
            hi: 'डुप्लिकेट अथवा त्रुटिपूर्ण लेनदेन के सत्यापन हेतु लेनदेन संदर्भ विवरण के साथ सचिवालय से Sasi8372@gmail.com अथवा +91 73967 56590 पर संपर्क करें।',
            te: 'డూప్లికేట్ లేదా తప్పు లావాదేవీల పరిశీలన కోసం లావాదేవీ వివరాలతో Sasi8372@gmail.com లేదా +91 73967 56590 ద్వారా సచివాలయాన్ని సంప్రదించండి.',
          },
        ],
      },
    ],
  },
};
