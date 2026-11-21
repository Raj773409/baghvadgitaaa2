import type { LocalizedText } from '../types/cms';

export interface ChapterRecitationEntry {
  chapterNumber: number;
  verseReference: string;
  sanskritDevanagari: string;
  transliteration: string;
  meaning: LocalizedText;
}

export const CHAPTER_KEY_RECITATIONS: ReadonlyArray<ChapterRecitationEntry> = [
  {
    chapterNumber: 1,
    verseReference: 'Bhagavad Gita 1.1',
    sanskritDevanagari:
      'धर्मक्षेत्रे कुरुक्षेत्रे समवेता युयुत्सवः ।\nमामकाः पाण्डवाश्चैव किमकुर्वत सञ्जय ॥',
    transliteration:
      'dharma-kṣetre kuru-kṣetre samavetā yuyutsavaḥ |\nmāmakāḥ pāṇḍavāś caiva kim akurvata sañjaya ||',
    meaning: {
      en: 'Dhritarashtra asked: On the sacred field of Kurukshetra, gathered together eager for battle, what did my sons and the sons of Pandu do, O Sanjaya?',
      hi: 'धृतराष्ट्र ने कहा: हे संजय! धर्मभूमि कुरुक्षेत्र में युद्ध की इच्छा से एकत्रित हुए मेरे और पाण्डु के पुत्रों ने क्या किया?',
      te: 'ధృతరాష్ట్రుడు అడిగెను: ఓ సంజయా! ధర్మక్షేత్రమైన కురుక్షేత్రములో యుద్ధోత్సాహముతో చేరిన నా కుమారులు మరియు పాండవులు ఏమి చేసిరి?',
    },
  },
  {
    chapterNumber: 2,
    verseReference: 'Bhagavad Gita 2.47',
    sanskritDevanagari:
      'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन ।\nमा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि ॥',
    transliteration:
      'karmaṇy evādhikāras te mā phaleṣu kadācana |\nmā karma-phala-hetur bhūr mā te saṅgo ’stv akarmaṇi ||',
    meaning: {
      en: 'Your rightful sphere is action alone, never anxiety over its fruits; let not the reward be your sole motive, nor yield ever to inaction.',
      hi: 'तुम्हारा अधिकार केवल कर्तव्य-कर्म करने में है, उसके फलों में कभी नहीं। तुम कर्मफल के हेतु मत बनो और अकर्मण्यता में भी आसक्त न हो।',
      te: 'కర్మలు ఆచరించడంలో మాత్రమే నీకు అధికారం ఉన్నది, ఫలితాలపై ఎన్నడూ కాదు; కర్మఫల ఆపేక్షతో కాకుండా కర్తవ్యాన్ని నిర్వర్తించుము.',
    },
  },
  {
    chapterNumber: 3,
    verseReference: 'Bhagavad Gita 3.19',
    sanskritDevanagari:
      'तस्मादसक्तः सततं कार्यं कर्म समाचर ।\nअसक्तो ह्याचरन्कर्म परमाप्नोति पूरुषः ॥',
    transliteration:
      'tasmād asaktaḥ satataṁ kāryaṁ karma samācara |\nasakto hy ācaran karma param āpnoti pūruṣaḥ ||',
    meaning: {
      en: 'Therefore, without attachment, constantly perform the duty that ought to be done; for by acting without attachment, one attains the Supreme.',
      hi: 'अतः आसक्ति से रहित होकर निरंतर कर्तव्य-कर्म का भली-भांति आचरण करो; क्योंकि अनासक्त भाव से कर्म करता हुआ मनुष्य परम पद को प्राप्त होता है।',
      te: 'కావున ఆసక్తి రహితుడవై నీ కర్తవ్య కర్మను నిరంతరం చక్కగా ఆచరించుము; నిస్సంగత్వంతో కర్మ చేసే మనిషి పరమపదాన్ని పొందుతాడు.',
    },
  },
  {
    chapterNumber: 4,
    verseReference: 'Bhagavad Gita 4.7',
    sanskritDevanagari:
      'यदा यदा हि धर्मस्य ग्लानिर्भवति भारत ।\nअभ्युत्थानमधर्मस्य तदात्मानं सृजाम्यहम् ॥',
    transliteration:
      'yadā yadā hi dharmasya glānir bhavati bhārata |\nabhyutthānam adharmasya tadātmānaṁ sṛjāmy aham ||',
    meaning: {
      en: 'Whenever righteousness declines and unrighteousness rises, O Bharata, in every age the Divine manifests to restore harmony.',
      hi: 'हे भारत! जब-जब धर्म की हानि होती है और अधर्म की वृद्धि होती है, तब-तब सद्भाव की पुनर्स्थापना के लिए मैं स्वयं प्रकट होता हूँ।',
      te: 'ఓ అర్జునా! ఎప్పుడెప్పుడు ధర్మానికి హాని కలిగి అధర్మం పెరుగుతుందో, అప్పుడప్పుడు ధర్మ పునరుద్ధరణ కోసం నేను నన్ను సృజించుకుంటాను.',
    },
  },
  {
    chapterNumber: 5,
    verseReference: 'Bhagavad Gita 5.10',
    sanskritDevanagari:
      'ब्रह्मण्याधाय कर्माणि सङ्गं त्यक्त्वा करोति यः ।\nलिप्यते न स पापेन पद्मपत्रमिवाम्भसा ॥',
    transliteration:
      'brahmaṇy ādhāya karmāṇi saṅgaṁ tyaktvā karoti yaḥ |\nlipyate na sa pāpena padma-patram ivāmbhasā ||',
    meaning: {
      en: 'One who acts dedicating all actions to the Supreme and relinquishing attachment is untouched by stain, just as a lotus leaf remains untouched by water.',
      hi: 'जो व्यक्ति समस्त कर्मों को परमात्मा में अर्पित करके आसक्ति त्यागकर कर्म करता है, वह जल में कमल के पत्ते की भांति पाप से लिप्त नहीं होता।',
      te: 'సమస్త కర్మలను పరబ్రహ్మకు అర్పించి ఆసక్తిని విడిచి కర్మ చేసేవాడు, నీటిలోని తామరాకు వలె పాపముచే అంటబడడు.',
    },
  },
  {
    chapterNumber: 6,
    verseReference: 'Bhagavad Gita 6.5',
    sanskritDevanagari:
      'उद्धरेदात्मनात्मानं नात्मानमवसादयेत् ।\nआत्मैव ह्यात्मनो बन्धुरात्मैव रिपुरात्मनः ॥',
    transliteration:
      'uddhared ātmanātmānaṁ nātmānam avasādayet |\nātmaiva hy ātmano bandhur ātmaiva ripur ātmanaḥ ||',
    meaning: {
      en: 'Let one uplift oneself by one’s own disciplined mind and never degrade oneself; for the mind alone is one’s friend, and the mind alone can be one’s foe.',
      hi: 'मनुष्य को चाहिए कि वह अपने द्वारा अपना उद्धार करे और अपने को पतन में न डाले; क्योंकि वह स्वयं ही अपना मित्र और स्वयं ही अपना शत्रु है।',
      te: 'మనిషి తనను తానే ఉద్ధరించుకోవాలి కానీ అధోగతి పాలు చేసుకోకూడదు; తనకు తానే మిత్రుడు మరియు తనకు తానే శత్రువు కాగలడు.',
    },
  },
  {
    chapterNumber: 7,
    verseReference: 'Bhagavad Gita 7.7',
    sanskritDevanagari:
      'मत्तः परतरं नान्यत्किञ्चिदस्ति धनञ्जय ।\nमयि सर्वमिदं प्रोतं सूत्रे मणिगणा इव ॥',
    transliteration:
      'mattaḥ parataraṁ nānyat kiñcid asti dhanañjaya |\nmayi sarvam idaṁ protaṁ sūtre maṇi-gaṇā iva ||',
    meaning: {
      en: 'There is nothing higher than Me, O Dhananjaya; all this universe is strung upon Me like clusters of pearls upon a thread.',
      hi: 'हे धनंजय! मुझसे श्रेष्ठ अन्य कुछ भी नहीं है; यह सम्पूर्ण जगत सूत्र में पिरोए हुए मणियों के समूह की भांति मुझमें गुंथा हुआ है।',
      te: 'ఓ ధనంజయా! నాకంటే పరమైనది మరేదీ లేదు; దారంలో గుచ్చిన మణుల సమూహం వలె ఈ విశ్వమంతా నా యందే ప్రోతమై ఉన్నది.',
    },
  },
  {
    chapterNumber: 8,
    verseReference: 'Bhagavad Gita 8.7',
    sanskritDevanagari:
      'तस्मात्सर्वेषु कालेषु मामनुस्मर युध्य च ।\nमय्यर्पितमनोबुद्धिर्मामेवैष्यस्यसंशयः ॥',
    transliteration:
      'tasmāt sarveṣu kāleṣu mām anusmara yudhya ca |\nmayy arpita-mano-buddhir mām evaiṣyasy asaṁśayaḥ ||',
    meaning: {
      en: 'Therefore, at all times remember Me and fulfill your noble duty; with mind and intellect offered to Me, you shall assuredly attain Me.',
      hi: 'अतः सब समय में मेरा स्मरण कर और अपने कर्तव्य का पालन कर; मुझमें अर्पित मन-बुद्धि वाला तू निःसंदेह मुझे ही प्राप्त होगा।',
      te: 'కావున అన్ని వేళలా నన్ను స్మరిస్తూ నీ కర్తవ్యాన్ని నిర్వర్తించుము; నా యందు మనోబుద్ధులను అర్పించిన నీవు నిస్సందేహంగా నన్నే పొందుతావు.',
    },
  },
  {
    chapterNumber: 9,
    verseReference: 'Bhagavad Gita 9.22',
    sanskritDevanagari:
      'अनन्याश्चिन्तयन्तो मां ये जनाः पर्युपासते ।\nतेषां नित्याभियुक्तानां योगक्षेमं वहाम्यहम् ॥',
    transliteration:
      'ananyāś cintayanto māṁ ye janāḥ paryupāsate |\nteṣāṁ nityābhiyuktānāṁ yoga-kṣemaṁ vahāmy aham ||',
    meaning: {
      en: 'For those who worship Me with single-minded devotion, ever steadfast in harmony, I personally sustain their spiritual and worldly well-being.',
      hi: 'जो अनन्य भाव से मेरा चिंतन करते हुए निरंतर मेरी उपासना करते हैं, उन नित्य युक्त भक्तों का योगक्षेम मैं स्वयं वहन करता हूँ।',
      te: 'అనన్యమైన భక్తితో నన్ను నిరంతరం ధ్యానించి ఉపాసించేవారి యోగక్షేమాలను నేనే స్వయంగా వహిస్తాను.',
    },
  },
  {
    chapterNumber: 10,
    verseReference: 'Bhagavad Gita 10.20',
    sanskritDevanagari:
      'अहमात्मा गुडाकेश सर्वभूताशयस्थितः ।\nअहमादिश्च मध्यं च भूतानामन्त एव च ॥',
    transliteration:
      'aham ātmā guḍākeśa sarva-bhūtāśaya-sthitaḥ |\naham ādiś ca madhyaṁ ca bhūtānām anta eva ca ||',
    meaning: {
      en: 'I am the Self, O Gudakesha, seated within the hearts of all beings; I am the beginning, the middle, and also the end of all existence.',
      hi: 'हे गुडाकेश! मैं ही समस्त प्राणियों के हृदय में स्थित आत्मा हूँ, और समस्त भूतों का आदि, मध्य तथा अंत भी मैं ही हूँ।',
      te: 'ఓ గుడాకేశా! సకల ప్రాణుల హృదయాలలో వసించే ఆత్మను నేనే; సమస్త జీవరాశుల ఆది, మధ్యమము మరియు అంతము నేనే.',
    },
  },
  {
    chapterNumber: 11,
    verseReference: 'Bhagavad Gita 11.55',
    sanskritDevanagari:
      'मत्कर्मकृन्मत्परमो मद्भक्तः सङ्गवर्जितः ।\nनिर्वैरः सर्वभूतेषु यः स मामेति पाण्डव ॥',
    transliteration:
      'mat-karma-kṛn mat-paramo mad-bhaktaḥ saṅga-varjitaḥ |\nnirvairaḥ sarva-bhūteṣu yaḥ sa mām eti pāṇḍava ||',
    meaning: {
      en: 'One who performs work as service to Me, holds Me as supreme, is devoted, free from attachment, and without enmity toward any creature, comes to Me, O Pandava.',
      hi: 'हे पाण्डव! जो मेरे लिए कर्म करने वाला, मेरे परायण, मेरा भक्त, आसक्ति से रहित और समस्त प्राणियों के प्रति वैरभाव से मुक्त है, वह मुझे ही प्राप्त होता है।',
      te: 'ఓ పాండవా! నా కోసమే కర్మలు చేస్తూ, నన్నే పరమగతిగా భావించి, ఆసక్తి లేకుండా సకల భూతాల పట్ల వైరం లేనివాడు నన్నే పొందుతాడు.',
    },
  },
  {
    chapterNumber: 12,
    verseReference: 'Bhagavad Gita 12.13',
    sanskritDevanagari:
      'अद्वेष्टा सर्वभूतानां मैत्रः करुण एव च ।\nनिर्ममो निरहङ्कारः समदुःखसुखः क्षमी ॥',
    transliteration:
      'adveṣṭā sarva-bhūtānāṁ maitraḥ karuṇa eva ca |\nnirmamo nirahaṅkāraḥ sama-duḥkha-sukhaḥ kṣamī ||',
    meaning: {
      en: 'Free from malice toward all beings, friendly and compassionate, devoid of possessiveness and ego, balanced in sorrow and joy, and ever forgiving.',
      hi: 'जो समस्त प्राणियों के प्रति द्वेषभाव से रहित, मित्रवत, करुणावान, ममता व अहंकार से मुक्त, सुख-दुःख में सम और क्षमाशील है—वह मुझे अत्यंत प्रिय है।',
      te: 'సకల ప్రాణుల యందు ద్వేషం లేనివాడు, మైత్రి మరియు కరుణ కలవాడు, మమకార అహంకారాలు లేనివాడు, సుఖదుఃఖాలలో సమభావం గల క్షమాశీలి నాకు ప్రియుడు.',
    },
  },
  {
    chapterNumber: 13,
    verseReference: 'Bhagavad Gita 13.3',
    sanskritDevanagari:
      'क्षेत्रज्ञं चापि मां विद्धि सर्वक्षेत्रेषु भारत ।\nक्षेत्रक्षेत्रज्ञयोर्ज्ञानं यत्तज्ज्ञानं मतं मम ॥',
    transliteration:
      'kṣetra-jñaṁ cāpi māṁ viddhi sarva-kṣetreṣu bhārata |\nkṣetra-kṣetrajñayor jñānaṁ yat taj jñānaṁ mataṁ mama ||',
    meaning: {
      en: 'Know Me also as the Knower of the Field in all fields, O Bharata; the understanding of the Field and its Knower is true wisdom in My view.',
      hi: 'हे भारत! समस्त क्षेत्रों में क्षेत्रज्ञ (चेतना) भी मुझे ही जानो; क्षेत्र और क्षेत्रज्ञ का जो यथार्थ ज्ञान है, वही मेरे मत में वास्तविक ज्ञान है।',
      te: 'ఓ భారతా! సమస్త క్షేత్రములందు క్షేత్రజ్ఞుడను నేనే అని తెలుసుకొనుము; క్షేత్రము మరియు క్షేత్రజ్ఞుని గురించిన జ్ఞానమే నిజమైన జ్ఞానమని నా మతము.',
    },
  },
  {
    chapterNumber: 14,
    verseReference: 'Bhagavad Gita 14.26',
    sanskritDevanagari:
      'मां च योऽव्यभिचारेण भक्तियोगेन सेवते ।\nस गुणान्समतीत्यैतान्ब्रह्मभूयाय कल्पते ॥',
    transliteration:
      'māṁ ca yo ’vyabhicāreṇa bhakti-yogena sevate |\nsa guṇān samatītyaitān brahma-bhūyāya kalpate ||',
    meaning: {
      en: 'And whoever serves Me with unswerving yoga of devotion transcends these three qualities of nature and becomes fit for realization of the Absolute.',
      hi: 'जो व्यक्ति अव्यभिचारी भक्तियोग के द्वारा मेरी सेवा करता है, वह इन तीनों गुणों को लांघकर ब्रह्मभाव को प्राप्त होने के योग्य हो जाता है।',
      te: 'ఎవరు అవ్యభిచారిణియైన భక్తియోగంతో నన్ను సేవిస్తారో, వారు ఈ త్రిగుణాలను అధిగమించి బ్రహ్మత్వాన్ని పొందడానికి అర్హులవుతారు.',
    },
  },
  {
    chapterNumber: 15,
    verseReference: 'Bhagavad Gita 15.15',
    sanskritDevanagari:
      'सर्वस्य चाहं हृदि सन्निविष्टो मत्तः स्मृतिर्ज्ञानमपोहनं च ।\nवेदैश्च सर्वैरहमेव वेद्यो वेदान्तकृद्वेदविदेव चाहम् ॥',
    transliteration:
      'sarvasya cāhaṁ hṛdi sanniviṣṭo mattaḥ smṛtir jñānam apohanaṁ ca |\nvedaiś ca sarvair aham eva vedyo vedānta-kṛd veda-vid eva cāham ||',
    meaning: {
      en: 'I am seated in the hearts of all; from Me come memory, wisdom, and discernment. I am indeed that which is known by all the Vedas, the author of Vedanta, and the knower of the Vedas.',
      hi: 'मैं ही सबके हृदय में स्थित हूँ; मुझसे ही स्मृति, ज्ञान और उनका निवारण होता है। समस्त वेदों के द्वारा जानने योग्य, वेदांत का कर्ता और वेदवेत्ता भी मैं ही हूँ।',
      te: 'నేనే అందరి హృదయాలలో స్థితుడనై ఉన్నాను; నా నుండే స్మృతి, జ్ఞానం కలుగుతున్నాయి. సకల వేదాల ద్వారా తెలుసుకోదగినవాడను, వేదాంతకర్తను మరియు వేదవేత్తను నేనే.',
    },
  },
  {
    chapterNumber: 16,
    verseReference: 'Bhagavad Gita 16.1',
    sanskritDevanagari:
      'अभयं सत्त्वसंशुद्धिर्ज्ञानयोगव्यवस्थितिः ।\nदानं दमश्च यज्ञश्च स्वाध्यायस्तप आर्जवम् ॥',
    transliteration:
      'abhayaṁ sattva-saṁśuddhir jñāna-yoga-vyavasthitiḥ |\ndānaṁ damaś ca yajñaś ca svādhyāyas tapa ārjavam ||',
    meaning: {
      en: 'Fearlessness, purity of heart, steadfastness in wisdom and yoga, charity, self-restraint, sacrifice, sacred study, austerity, and uprightness.',
      hi: 'अभय, अंतःकरण की शुद्धता, ज्ञानयोग में दृढ़ स्थिति, दान, इंद्रिय-संयम, यज्ञ, स्वाध्याय, तप और सरलता—ये दैवी संपदा के लक्षण हैं।',
      te: 'నిర్భయత్వము, అంతఃకరణ శుద్ధి, జ్ఞానయోగ నిష్ఠ, దానము, ఇంద్రియ నిగ్రహము, యజ్ఞము, స్వాధ్యాయము, తపస్సు మరియు ఋజుత్వము దైవీ సంపద లక్షణాలు.',
    },
  },
  {
    chapterNumber: 17,
    verseReference: 'Bhagavad Gita 17.3',
    sanskritDevanagari:
      'सत्त्वानुरूपा सर्वस्य श्रद्धा भवति भारत ।\nश्रद्धामयोऽयं पुरुषो यो यच्छ्रद्धः स एव सः ॥',
    transliteration:
      'sattvānurūpā sarvasya śraddhā bhavati bhārata |\nśraddhāmayo ’yaṁ puruṣo yo yac-chraddhaḥ sa eva saḥ ||',
    meaning: {
      en: 'The faith of every person accords with their inner nature, O Bharata; a human being is shaped by their deepest faith—as one’s faith is, so indeed is one.',
      hi: 'हे भारत! सभी मनुष्यों की श्रद्धा उनके अंतःकरण के अनुरूप होती है; यह पुरुष श्रद्धामय है, इसलिए जिसकी जैसी श्रद्धा होती है, वह स्वयं वैसा ही होता है।',
      te: 'ఓ భారతా! ప్రతీ మనిషి యొక్క శ్రద్ధ వారి అంతఃకరణ స్వభావానికి అనుగుణంగా ఉంటుంది; మనిషి శ్రద్ధామయుడు, అతని శ్రద్ధ ఎలాంటిదో అతను అలాంటివాడే అవుతాడు.',
    },
  },
  {
    chapterNumber: 18,
    verseReference: 'Bhagavad Gita 18.66',
    sanskritDevanagari:
      'सर्वधर्मान्परित्यज्य मामेकं शरणं व्रज ।\nअहं त्वां सर्वपापेभ्यो मोक्षयिष्यामि मा शुचः ॥',
    transliteration:
      'sarva-dharmān parityajya mām ekaṁ śaraṇaṁ vraja |\nahaṁ tvāṁ sarva-pāpebhyo mokṣayiṣyāmi mā śucaḥ ||',
    meaning: {
      en: 'Setting aside every lesser anxiety and limited attachment, take refuge in the One Reality alone; fear not, for you shall be freed from sorrow.',
      hi: 'समस्त संकीर्ण आसक्तियों को त्यागकर एक मात्र परम सत्य की शरण में आओ। मैं तुम्हें समस्त बंधनों व दुःखों से मुक्त कर दूँगा—शोक मत करो।',
      te: 'సమస్త పరిమిత ఆసక్తులను విడిచి నన్ను ఒక్కడినే శరణు పొందుము; నేను నిన్ను సకల బంధముల నుండి విముక్తుడిని చేస్తాను, చింతించకుము.',
    },
  },
];

export function getChapterRecitation(chapterNumber: number): ChapterRecitationEntry {
  const safeChapter = Number.isFinite(chapterNumber)
    ? Math.min(18, Math.max(1, Math.round(chapterNumber)))
    : 1;
  return (
    CHAPTER_KEY_RECITATIONS[safeChapter - 1] ?? CHAPTER_KEY_RECITATIONS[0]
  );
}
