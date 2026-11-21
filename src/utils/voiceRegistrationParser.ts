import type {
  RegistrationFormValues,
  RegistrationStepNumber,
  RegistrationTypeId,
} from './registrationValidation';
import type { CoreLocale } from './i18nHelpers';

export type VoiceCommandIntent =
  | 'next'
  | 'previous'
  | 'repeat'
  | 'skip'
  | 'confirm'
  | 'change-language'
  | 'correct'
  | 'provide-data';

export interface VoiceParseResult {
  intent: VoiceCommandIntent;
  targetLocale?: CoreLocale;
  updates: Partial<RegistrationFormValues>;
  extractedSummary: string[];
  sensitiveBlocked: boolean;
  needsEmailPhoneConfirmation: boolean;
  assistantReply: string;
}

const CARD_OR_UPI_SENSITIVE_PATTERN =
  /\b(?:\d[ -]?){13,19}\b|\bcvv\b|\bpin\b|\botp\b|\bupi\s*pin\b|\bifsc\b|\bcard\s*number\b|\bdebit\s*card\b|\bcredit\s*card\b/i;

export function sanitizeSensitiveUtterance(raw: string): {
  cleaned: string;
  hadSensitiveTokens: boolean;
} {
  const hadSensitiveTokens = CARD_OR_UPI_SENSITIVE_PATTERN.test(raw);
  const cleaned = raw
    .replace(/\b(?:\d[ -]?){13,19}\b/g, '[redacted]')
    .replace(/\b(?:cvv|pin|otp|ifsc)\s*[:#-]?\s*\d{3,8}\b/gi, '[redacted]')
    .trim();
  return { cleaned, hadSensitiveTokens };
}

const COUNTRY_NAME_MAP: ReadonlyArray<{ pattern: RegExp; id: string }> = [
  { pattern: /\bindia\b|भारत|భారత్/i, id: 'india' },
  { pattern: /\busa\b|united states|america|अमेरिका|అమెరికా/i, id: 'usa' },
  { pattern: /\bcanada\b/i, id: 'canada' },
  { pattern: /\bbrazil\b/i, id: 'brazil' },
  { pattern: /\bsouth africa\b/i, id: 'southAfrica' },
  { pattern: /\buk\b|united kingdom|england|britain|लंदन/i, id: 'uk' },
  { pattern: /\bireland\b/i, id: 'ireland' },
  { pattern: /\bfrance\b|paris/i, id: 'france' },
  { pattern: /\bgermany\b/i, id: 'germany' },
  { pattern: /\bitaly\b/i, id: 'italy' },
  { pattern: /\bspain\b/i, id: 'spain' },
  { pattern: /\bnetherlands\b|holland/i, id: 'netherlands' },
  { pattern: /\brussia\b/i, id: 'russia' },
  { pattern: /\bchina\b/i, id: 'china' },
  { pattern: /\bjapan\b/i, id: 'japan' },
  { pattern: /\buae\b|dubai|abu dhabi|emirates/i, id: 'uae' },
  { pattern: /\baustralia\b/i, id: 'australia' },
  { pattern: /\bnew zealand\b/i, id: 'newZealand' },
];

const TYPE_PATTERNS: ReadonlyArray<{ pattern: RegExp; id: RegistrationTypeId }> = [
  { pattern: /\bgroup\b|బృందం|समूह/i, id: 'group' },
  { pattern: /\bfamily\b|కుటుంబం|परिवार/i, id: 'family' },
  { pattern: /\byouth\b|student|యువ|युवा/i, id: 'youth' },
  { pattern: /\binstitution|university|school|college|సంస్థ|संस्था|विश्वविद्यालय/i, id: 'institutional' },
  { pattern: /\bvolunteer|seva|సేవ|स्वयंसेवक/i, id: 'volunteer' },
  { pattern: /\bscholar|speaker|faculty|విద్వాంస|विद्वान/i, id: 'scholar' },
  { pattern: /\bindividual|self|myself|వ్యక్తిగత|व्यक्तिगत/i, id: 'individual' },
];

export function formatEmailForReadback(email: string): string {
  const trimmed = email.trim();
  if (!trimmed) return '';
  return trimmed.replace('@', ' at ').replace(/\./g, ' dot ');
}

export function formatPhoneForReadback(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, '');
  if (!digits) return '';
  return digits.split('').join(' ');
}

export function getVoiceStepPrompt(step: RegistrationStepNumber, locale: CoreLocale): string {
  const prompts: Record<RegistrationStepNumber, Record<CoreLocale, string>> = {
    1: {
      en: 'Namaste and welcome to Bhagavad Gita Vishwa Mahotsav 2027 registration. Please select your preferred language, or tell me how you wish to continue.',
      hi: 'नमस्ते, भगवद्गीता विश्व महोत्सव २०२७ पंजीकरण में स्वागत है। कृपया अपनी भाषा चुनें या आगे बढ़ने के लिए कहें।',
      te: 'నమస్తే, భగవద్గీత విశ్వ మహోత్సవం 2027 నమోదుకు స్వాగతం. దయచేసి మీ భాషను ఎంచుకుని ముందుకు సాగండి.',
    },
    2: {
      en: 'Step 2: Which participation type applies to you—Individual, Family, Group, Youth, Institutional, Volunteer, or Scholar?',
      hi: 'चरण २: आप किस श्रेणी में भाग ले रहे हैं—व्यक्तिगत, परिवार, समूह, युवा, संस्थागत, स्वयंसेवक या विद्वान?',
      te: 'దశ 2: మీరు ఏ విభాగంలో పాల్గొంటున్నారు—వ్యక్తిగత, కుటుంబం, బృందం, యువత, సంస్థ, సేవ లేదా విద్వాంసులు?',
    },
    3: {
      en: 'Step 3: Please share your full name, email address, phone number, country, and city.',
      hi: 'चरण ३: कृपया अपना पूरा नाम, ईमेल, फ़ोन नंबर, देश और शहर बताएँ।',
      te: 'దశ 3: దయచేసి మీ పూర్తి పేరు, ఇమెయిల్, ఫోన్ నంబర్, దేశం మరియు నగరం తెలపండి.',
    },
    4: {
      en: 'Step 4: Select the Curtain Raiser (20 Dec 2026) and Main Mahotsav (27 Feb 2027), and enter your contribution amount in Rupees.',
      hi: 'चरण ४: कर्टेन रेज़र (२० दिसम्बर २०२६) व मुख्य महोत्सव (२७ फरवरी २०२७) चुनें और रुपये में योगदान राशि दर्ज करें।',
      te: 'దశ 4: కర్టెన్ రైజర్ (20 డిసెంబర్ 2026), ప్రధాన మహోత్సవం (27 ఫిబ్రవరి 2027) మరియు మీ విరాళం మొత్తాన్ని తెలపండి.',
    },
    5: {
      en: 'Step 5: Do you need assistance with Visa, Accommodation, or Local Transport, or any accessibility notes? You may say skip if none.',
      hi: 'चरण ५: क्या आपको वीज़ा, आवास या स्थानीय परिवहन सहायता चाहिए? आवश्यकता न होने पर "स्किप" कहें।',
      te: 'దశ 5: మీకు వీసా, వసతి లేదా స్థానిక రవాణా సహాయం అవసరమా? లేకపోతే "స్కిప్" అని చెప్పండి.',
    },
    6: {
      en: 'Step 6: Please review the Terms & Conditions, Privacy Policy, and Refund Policy, and confirm your consent.',
      hi: 'चरण ६: कृपया नियम, गोपनीयता और रिफंड नीति की समीक्षा कर सहमति प्रदान करें।',
      te: 'దశ 6: దయచేసి నిబంధనలు, గోప్యతా మరియు రీఫండ్ విధానాన్ని అంగీకరించండి.',
    },
    7: {
      en: 'Step 7: Please review every detail carefully. Tell me to edit any section, or advance to Step 8 confirmation.',
      hi: 'चरण ७: कृपया अपने सभी विवरण जाँचें। किसी संशोधन के लिए कहें या चरण ८ पर आगे बढ़ें।',
      te: 'దశ 7: దయచేసి మీ వివరాలను సమీక్షించండి. ఏదైనా మార్పు ఉంటే చెప్పండి లేదా దశ 8కు వెళ్ళండి.',
    },
    8: {
      en: 'Step 8: I can read back your full registration summary. Once you confirm, please click the golden MAKE PAYMENT button manually to complete checkout.',
      hi: 'चरण ८: मैं आपका पूरा विवरण पढ़कर सुना सकता हूँ। पुष्टि के बाद भुगतान हेतु स्वयं सुनहरे MAKE PAYMENT बटन पर क्लिक करें।',
      te: 'దశ 8: నేను మీ పూర్తి వివరాలను చదివి వినిపిస్తాను. మీరు నిర్ధారించిన తర్వాత, చెల్లింపు పూర్తి చేయడానికి దయచేసి బంగారు రంగు MAKE PAYMENT బటన్‌ను స్వయంగా క్లిక్ చేయండి.',
    },
  };
  return prompts[step][locale] ?? prompts[step].en;
}

export function buildStep8SpokenSummary(
  values: RegistrationFormValues,
  locale: CoreLocale,
): string {
  const name = values.fullName.trim() || 'Participant';
  const email = values.email.trim() || 'not provided';
  const phone = values.phone.trim() || 'not provided';
  const type = values.registrationType || 'individual';
  const city = values.city.trim() || 'not specified';
  const amount = values.donationAmount.trim() || '0';

  if (locale === 'te') {
    return `మీరు నమోదు చేసిన వివరాలు ఇవి: పేరు ${name}. విభాగం ${type}. ఇమెయిల్ ${formatEmailForReadback(email)}. ఫోన్ నంబర్ ${formatPhoneForReadback(phone)}. నగరం ${city}, వ్యక్తులు ${values.noOfPersons}. విరాళం ₹${amount}. వివరాలు సరిగ్గా ఉంటే నిర్ధారించండి, ఆపై MAKE PAYMENT బటన్ క్లిక్ చేయండి.`;
  }
  if (locale === 'hi') {
    return `आपके द्वारा दर्ज विवरण इस प्रकार हैं: नाम ${name}, श्रेणी ${type}, ईमेल ${formatEmailForReadback(email)}, फ़ोन ${formatPhoneForReadback(phone)}, शहर ${city}, सदस्य ${values.noOfPersons}, योगदान ₹${amount}। विवरण सही होने पर पुष्टि करें और फिर MAKE PAYMENT बटन दबाएँ।`;
  }
  return `Here is your registration summary: Name ${name}, Track ${type}, Email ${formatEmailForReadback(email)}, Phone ${formatPhoneForReadback(phone)}, City ${city}, Persons ${values.noOfPersons}, Contribution ₹${amount}. Please confirm your details, then click MAKE PAYMENT manually to proceed.`;
}

export function parseRegistrationUtterance(params: {
  utterance: string;
  step: RegistrationStepNumber;
  locale: CoreLocale;
  currentValues: RegistrationFormValues;
}): VoiceParseResult {
  const { utterance, locale, currentValues } = params;
  const { cleaned, hadSensitiveTokens } = sanitizeSensitiveUtterance(utterance);

  if (hadSensitiveTokens) {
    return {
      intent: 'repeat',
      updates: {},
      extractedSummary: [],
      sensitiveBlocked: true,
      needsEmailPhoneConfirmation: false,
      assistantReply:
        locale === 'te'
          ? 'భద్రతా కారణాల దృష్ట్యా వాయిస్ సహాయకం కార్డు, UPI లేదా OTP వివరాలను తీసుకోదు. దయచేసి మీ సాధారణ నమోదు వివరాలు మాత్రమే చెప్పండి.'
          : locale === 'hi'
            ? 'सुरक्षा के लिए वॉइस सहायक कार्ड, पिन या ओटीपी विवरण स्वीकार नहीं करता। कृपया केवल सामान्य पंजीकरण जानकारी दें।'
            : 'For your security, the voice assistant never accepts card numbers, UPI PINs, or OTPs. Those payment steps happen only after you manually click MAKE PAYMENT.',
    };
  }

  // Command detection
  if (/\b(repeat|say again|pardon)\b|మళ్లీ చెప్పండి|दोबारा कहें/i.test(cleaned)) {
    return {
      intent: 'repeat',
      updates: {},
      extractedSummary: [],
      sensitiveBlocked: false,
      needsEmailPhoneConfirmation: false,
      assistantReply: getVoiceStepPrompt(params.step, locale),
    };
  }

  if (/\b(previous|go back|back)\b|వెనుకకు|पिछला/i.test(cleaned)) {
    return {
      intent: 'previous',
      updates: {},
      extractedSummary: [],
      sensitiveBlocked: false,
      needsEmailPhoneConfirmation: false,
      assistantReply:
        locale === 'te'
          ? 'ముందు దశకు వెళ్తున్నాము.'
          : locale === 'hi'
            ? 'पिछले चरण पर जा रहे हैं।'
            : 'Returning to the previous registration step.',
    };
  }

  if (/\bskip\b|దాటవేయండి|छोड़ें/i.test(cleaned)) {
    return {
      intent: 'skip',
      updates: {},
      extractedSummary: [],
      sensitiveBlocked: false,
      needsEmailPhoneConfirmation: false,
      assistantReply:
        locale === 'te'
          ? 'ఈ ఐచ్ఛిక దశను దాటి తదుపరి దశకు వెళ్తున్నాము.'
          : locale === 'hi'
            ? 'यह वैकल्पिक चरण छोड़कर आगे बढ़ रहे हैं।'
            : 'Skipping optional step and continuing forward.',
    };
  }

  if (/\btelugu\b|తెలుగు/i.test(cleaned) && /\b(language|switch|change)\b|భాష/i.test(cleaned)) {
    return {
      intent: 'change-language',
      targetLocale: 'te',
      updates: { preferredLanguage: 'te' },
      extractedSummary: ['Language: తెలుగు'],
      sensitiveBlocked: false,
      needsEmailPhoneConfirmation: false,
      assistantReply: 'భాషను తెలుగుకు మార్చాము. ' + getVoiceStepPrompt(params.step, 'te'),
    };
  }

  if (/\bhindi\b|हिन्दी|हिंदी/i.test(cleaned) && /\b(language|switch|change)\b|भाषा/i.test(cleaned)) {
    return {
      intent: 'change-language',
      targetLocale: 'hi',
      updates: { preferredLanguage: 'hi' },
      extractedSummary: ['Language: हिन्दी'],
      sensitiveBlocked: false,
      needsEmailPhoneConfirmation: false,
      assistantReply: 'भाषा हिन्दी कर दी गई है। ' + getVoiceStepPrompt(params.step, 'hi'),
    };
  }

  if (/\benglish\b/i.test(cleaned) && /\b(language|switch|change)\b/i.test(cleaned)) {
    return {
      intent: 'change-language',
      targetLocale: 'en',
      updates: { preferredLanguage: 'en' },
      extractedSummary: ['Language: English'],
      sensitiveBlocked: false,
      needsEmailPhoneConfirmation: false,
      assistantReply: 'Language switched to English. ' + getVoiceStepPrompt(params.step, 'en'),
    };
  }

  // Extract structured fields
  const updates: Partial<RegistrationFormValues> = {};
  const extractedSummary: string[] = [];

  // Email
  const emailMatch = /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/.exec(cleaned);
  if (emailMatch) {
    updates.email = emailMatch[1].toLowerCase();
    extractedSummary.push(`Email: ${updates.email}`);
  }

  // Phone (+91... or 7-15 digits)
  const phoneMatch = /(?:(?:\+|00)\d{1,3}[\s-]?)?(?:\d[\s-]?){8,13}\d/.exec(
    cleaned.replace(emailMatch?.[0] ?? '', ''),
  );
  if (phoneMatch) {
    const candidate = phoneMatch[0].replace(/\s+/g, ' ').trim();
    const digits = candidate.replace(/\D/g, '');
    if (digits.length >= 7 && digits.length <= 15) {
      updates.phone = candidate;
      extractedSummary.push(`Phone: ${candidate}`);
    }
  }

  // Donation Amount (₹ / rs / rupees / donate / contribution)
  const donationMatch = /(?:₹|rs\.?|inr|rupees|donate|donation|contribution)\s*(\d[\d,]{1,7})/i.exec(cleaned) ??
    /(\d[\d,]{2,6})\s*(?:rupees|inr|rs)/i.exec(cleaned);
  if (donationMatch) {
    const amt = donationMatch[1].replace(/,/g, '');
    if (Number(amt) > 0) {
      updates.donationAmount = amt;
      extractedSummary.push(`Contribution: ₹${amt}`);
    }
  }

  // Number of persons
  const personsMatch = /(\d{1,2})\s*(?:people|persons|members|family members|మంది|लोग|सदस्य)/i.exec(cleaned);
  if (personsMatch) {
    const cnt = Math.max(1, Math.min(50, Number(personsMatch[1])));
    updates.noOfPersons = String(cnt);
    extractedSummary.push(`Persons: ${cnt}`);
  }

  // Name extraction ("my name is X" / "I am X" / "name: X")
  const nameMatch = /(?:my name is|i am|name\s*[:is]+|నా పేరు|मेरा नाम)\s+([a-zA-Z][a-zA-Z .'-]{1,48}?)(?=,|\.|\band\b|\bfrom\b|\bemail\b|\bphone\b|\bmy\b|$)/i.exec(
    cleaned,
  );
  if (nameMatch) {
    const candidateName = nameMatch[1].trim();
    if (candidateName.length >= 2) {
      updates.fullName = candidateName;
      extractedSummary.push(`Name: ${candidateName}`);
    }
  }

  // Country extraction
  for (const c of COUNTRY_NAME_MAP) {
    if (c.pattern.test(cleaned)) {
      updates.country = c.id;
      extractedSummary.push(`Country: ${c.id}`);
      break;
    }
  }

  // City extraction ("from X" / "city X" / "in X")
  const cityMatch = /(?:from|city\s*(?:is|:)?|live in|నగరం|शहर)\s+([a-zA-Z][a-zA-Z .-]{1,32}?)(?=,|\.|\band\b|\bemail\b|\bphone\b|\bcountry\b|$)/i.exec(
    cleaned,
  );
  if (cityMatch) {
    let candidateCity = cityMatch[1].trim();
    for (const c of COUNTRY_NAME_MAP) {
      candidateCity = candidateCity.replace(c.pattern, '').trim();
    }
    candidateCity = candidateCity.replace(/[,\s-]+$/g, '').trim();
    if (candidateCity.length >= 2) {
      updates.city = candidateCity;
      extractedSummary.push(`City: ${candidateCity}`);
    }
  }

  // Registration type extraction
  for (const tp of TYPE_PATTERNS) {
    if (tp.pattern.test(cleaned)) {
      updates.registrationType = tp.id;
      extractedSummary.push(`Type: ${tp.id}`);
      break;
    }
  }

  // Events
  const eventsUpdate = { ...currentValues.events };
  let eventsChanged = false;
  if (/curtain raiser|vishwa ahvanam|december|20 dec/i.test(cleaned)) {
    eventsUpdate.curtainRaiser = true;
    eventsChanged = true;
  }
  if (/main mahotsav|mahotsav|february|27 feb|both events/i.test(cleaned)) {
    eventsUpdate.mahotsav = true;
    eventsChanged = true;
    if (/both events/i.test(cleaned)) eventsUpdate.curtainRaiser = true;
  }
  if (eventsChanged) {
    updates.events = eventsUpdate;
    extractedSummary.push('Events updated');
  }

  // Assistance
  const assistUpdate = { ...currentValues.assistance };
  let assistChanged = false;
  if (/\bvisa\b/i.test(cleaned)) {
    assistUpdate.visa = true;
    assistChanged = true;
  }
  if (/\baccommodation|stay|hotel|room\b/i.test(cleaned)) {
    assistUpdate.accommodation = true;
    assistChanged = true;
  }
  if (/\btransport|pickup|travel\b/i.test(cleaned)) {
    assistUpdate.localTransport = true;
    assistChanged = true;
  }
  if (assistChanged) {
    updates.assistance = assistUpdate;
    extractedSummary.push('Assistance updated');
  }

  // Governance policy consent
  if (params.step === 6 && /\b(agree|accept|confirm|consent|yes)\b|అంగీకరిస్తున్నాను|सहमत/i.test(cleaned)) {
    updates.consent = true;
    extractedSummary.push('Policies accepted');
  }

  // Confirmation / Next navigation
  const wantsConfirm = /\b(confirm|verify|correct|all good)\b|నిర్ధారించండి|పుష్టి|पुष्टि/i.test(cleaned);
  const wantsNext = /\b(next|continue|proceed)\b|తదుపరి|आगे/i.test(cleaned);

  const needsEmailPhoneConfirmation = Boolean(updates.email || updates.phone);
  const confirmNote = needsEmailPhoneConfirmation
    ? [
        updates.email ? `Email: ${formatEmailForReadback(updates.email)}` : '',
        updates.phone ? `Phone: ${formatPhoneForReadback(updates.phone)}` : '',
      ]
        .filter(Boolean)
        .join(' · ')
    : '';

  if (extractedSummary.length > 0) {
    const replyBase =
      locale === 'te'
        ? `నమోదు చేసుకున్నాము: ${extractedSummary.join(', ')}.`
        : locale === 'hi'
          ? `दर्ज किया गया: ${extractedSummary.join(', ')}।`
          : `Recorded: ${extractedSummary.join(', ')}.`;
    const replyConfirm = confirmNote
      ? locale === 'te'
        ? ` దయచేసి నిర్ధారించండి — ${confirmNote}`
        : locale === 'hi'
          ? ` कृपया सत्यापित करें — ${confirmNote}`
          : ` Please confirm — ${confirmNote}`
      : '';
    return {
      intent: wantsConfirm ? 'confirm' : wantsNext ? 'next' : 'provide-data',
      updates,
      extractedSummary,
      sensitiveBlocked: false,
      needsEmailPhoneConfirmation,
      assistantReply: `${replyBase}${replyConfirm}`,
    };
  }

  if (wantsConfirm) {
    return {
      intent: 'confirm',
      updates: params.step === 6 ? { consent: true } : {},
      extractedSummary: [],
      sensitiveBlocked: false,
      needsEmailPhoneConfirmation: false,
      assistantReply:
        params.step === 8
          ? buildStep8SpokenSummary(currentValues, locale)
          : locale === 'te'
            ? 'మీ వివరాలు నిర్ధారించబడ్డాయి.'
            : locale === 'hi'
              ? 'आपके विवरण की पुष्टि हो गई है।'
              : 'Details confirmed.',
    };
  }

  if (wantsNext) {
    return {
      intent: 'next',
      updates: {},
      extractedSummary: [],
      sensitiveBlocked: false,
      needsEmailPhoneConfirmation: false,
      assistantReply:
        locale === 'te'
          ? 'తదుపరి దశకు వెళ్తున్నాము.'
          : locale === 'hi'
            ? 'अगले चरण पर आगे बढ़ रहे हैं।'
            : 'Moving to the next step.',
    };
  }

  return {
    intent: 'provide-data',
    updates: {},
    extractedSummary: [],
    sensitiveBlocked: false,
    needsEmailPhoneConfirmation: false,
    assistantReply:
      locale === 'te'
        ? 'క్షమించండి, ఆ వివరాలను స్పష్టంగా గుర్తించలేకపోయాను. దయచేసి పేరు, ఇమెయిల్, ఫోన్ లేదా నగరం చెప్పండి.'
        : locale === 'hi'
          ? 'क्षमा करें, विवरण स्पष्ट नहीं हो सका। कृपया अपना नाम, ईमेल, फ़ोन या शहर बताएँ।'
          : 'I did not catch specific form fields there. You can share details like name, email, phone, city, contribution amount, or say Next, Previous, or Skip.',
  };
}
