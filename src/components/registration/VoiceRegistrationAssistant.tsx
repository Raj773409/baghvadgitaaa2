import React, { useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Languages,
  Mic,
  MicOff,
  RotateCcw,
  Send,
  ShieldAlert,
  SkipForward,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { CoreLocale } from '../../utils/i18nHelpers';
import type {
  RegistrationFormValues,
  RegistrationStepNumber,
} from '../../utils/registrationValidation';
import {
  buildStep8SpokenSummary,
  formatEmailForReadback,
  formatPhoneForReadback,
  getVoiceStepPrompt,
  type VoiceParseResult,
} from '../../utils/voiceRegistrationParser';

interface VoiceRegistrationAssistantProps {
  currentStep: RegistrationStepNumber;
  locale: CoreLocale;
  values: RegistrationFormValues;
  onLocaleChange: (next: CoreLocale) => void;
  onApplyUpdates: (updates: Partial<RegistrationFormValues>) => void;
  onStepCommand: (command: 'next' | 'previous' | 'skip' | 'confirm') => void;
}

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  0: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionInstanceLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionInstanceLike;

const SPEECH_LANG_CODES: Record<CoreLocale, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  te: 'te-IN',
};

export const VoiceRegistrationAssistant: React.FC<VoiceRegistrationAssistantProps> = ({
  currentStep,
  locale,
  values,
  onLocaleChange,
  onApplyUpdates,
  onStepCommand,
}) => {
  const [expanded, setExpanded] = useState(true);
  const [listening, setListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [utteranceText, setUtteranceText] = useState('');
  const [assistantMessage, setAssistantMessage] = useState(() =>
    getVoiceStepPrompt(currentStep, locale),
  );
  const [pendingConfirmation, setPendingConfirmation] = useState<string | null>(null);
  const [securityWarning, setSecurityWarning] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstanceLike | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const w = window as unknown as {
      SpeechRecognition?: SpeechRecognitionCtor;
      webkitSpeechRecognition?: SpeechRecognitionCtor;
    };
    setSpeechSupported(Boolean(w.SpeechRecognition || w.webkitSpeechRecognition));
  }, []);

  useEffect(() => {
    setAssistantMessage(getVoiceStepPrompt(currentStep, locale));
    setSecurityWarning(false);
  }, [currentStep, locale]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore stop race on unmount
        }
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
  };

  const speakText = async (text: string, lang: CoreLocale, trackTag = `reg-step-${currentStep}`) => {
    stopAudio();
    setSpeaking(true);
    try {
      const res = await fetch('/api/voice/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackId: `${trackTag}-${lang}`,
          language: lang,
          gender: 'female',
          text,
        }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => {
          URL.revokeObjectURL(url);
          setSpeaking(false);
        };
        audio.onerror = () => {
          URL.revokeObjectURL(url);
          setSpeaking(false);
        };
        await audio.play().catch(() => setSpeaking(false));
        return;
      }
    } catch {
      // Fallback cleanly to browser SpeechSynthesis
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = SPEECH_LANG_CODES[lang];
      utter.onend = () => setSpeaking(false);
      utter.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(utter);
    } else {
      setSpeaking(false);
    }
  };

  const submitUtterance = async (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    setSecurityWarning(false);

    try {
      const res = await fetch('/api/voice/parse-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          utterance: trimmed,
          step: currentStep,
          locale,
          currentValues: values,
        }),
      });
      if (!res.ok) {
        throw new Error('Could not process voice assistant message.');
      }
      const parsed = (await res.json()) as VoiceParseResult;
      setAssistantMessage(parsed.assistantReply);

      if (parsed.sensitiveBlocked) {
        setSecurityWarning(true);
        setPendingConfirmation(null);
        return;
      }

      setUtteranceText('');

      if (parsed.targetLocale && parsed.targetLocale !== locale) {
        onLocaleChange(parsed.targetLocale);
      }

      if (parsed.updates && Object.keys(parsed.updates).length > 0) {
        onApplyUpdates(parsed.updates);
      }

      if (parsed.needsEmailPhoneConfirmation) {
        const parts = [
          parsed.updates.email ? `Email: ${formatEmailForReadback(parsed.updates.email)}` : '',
          parsed.updates.phone ? `Phone: ${formatPhoneForReadback(parsed.updates.phone)}` : '',
        ].filter(Boolean);
        setPendingConfirmation(parts.join(' | '));
      } else {
        setPendingConfirmation(null);
      }

      if (parsed.intent === 'next') {
        onStepCommand('next');
      } else if (parsed.intent === 'previous') {
        onStepCommand('previous');
      } else if (parsed.intent === 'skip') {
        onStepCommand('skip');
      } else if (parsed.intent === 'confirm') {
        onStepCommand('confirm');
      } else if (parsed.intent === 'repeat') {
        void speakText(parsed.assistantReply, parsed.targetLocale ?? locale);
      }
    } catch {
      setAssistantMessage(
        locale === 'te'
          ? 'మీ సందేశాన్ని ప్రాసెస్ చేయడంలో లోపం జరిగింది. దయచేసి ఫారమ్ ద్వారా వివరాలు నమోదు చేయండి.'
          : locale === 'hi'
            ? 'संदेश संसाधित नहीं हो सका। कृपया सीधे फ़ॉर्म में विवरण भरें।'
            : 'Unable to parse right now. Please enter or edit fields directly in the form.',
      );
    } finally {
      setBusy(false);
    }
  };

  const toggleMicrophone = () => {
    if (typeof window === 'undefined') return;
    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }

    const w = window as unknown as {
      SpeechRecognition?: SpeechRecognitionCtor;
      webkitSpeechRecognition?: SpeechRecognitionCtor;
    };
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) return;

    const rec = new Ctor();
    rec.lang = SPEECH_LANG_CODES[locale];
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript ?? '';
      if (transcript.trim()) {
        setUtteranceText(transcript);
        void submitUtterance(transcript);
      }
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);

    recognitionRef.current = rec;
    setListening(true);
    rec.start();
  };

  const handleReadStep8Summary = () => {
    const summary = buildStep8SpokenSummary(values, locale);
    setAssistantMessage(summary);
    void speakText(summary, locale, 'reg-step8-summary');
  };

  const nextLocale = (): CoreLocale => (locale === 'en' ? 'hi' : locale === 'hi' ? 'te' : 'en');

  return (
    <aside
      data-testid="voice-registration-assistant"
      aria-label="Multilingual Voice Registration Assistant"
      className="mb-3 rounded-2xl border border-[#D6A447]/60 bg-[#17233A] text-[#FFFDF7] shadow-[0_12px_30px_rgba(16,20,38,0.28)] overflow-hidden"
    >
      <div className="px-3.5 py-2.5 flex items-center justify-between gap-2 bg-[#10182B]/70 border-b border-[#D4A537]/25">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex w-2 h-2 rounded-full bg-[#F7D774] shrink-0" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#F7D774] truncate">
            {locale === 'hi'
              ? 'गौरी · पंजीकरण सहायक (वैकल्पिक)'
              : locale === 'te'
                ? 'గౌరి · నమోదు వాయిస్ సహాయకం (ఐచ్ఛికం)'
                : 'Guided Voice Assistant (Optional)'}
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            data-testid="voice-locale-cycle"
            onClick={() => onLocaleChange(nextLocale())}
            aria-label="Switch voice assistant language"
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-[#D4A537]/45 text-[10px] font-semibold uppercase text-[#F7D774] hover:bg-[#D4A537]/15 cursor-pointer"
          >
            <Languages className="w-3 h-3" aria-hidden="true" />
            <span>{locale.toUpperCase()}</span>
          </button>

          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-label={expanded ? 'Collapse voice assistant' : 'Expand voice assistant'}
            className="p-1 rounded-full border border-[#D4A537]/35 text-[#F7D774] hover:bg-[#D4A537]/15 cursor-pointer"
          >
            {expanded ? (
              <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="p-3.5 space-y-2.5">
          <p
            data-testid="voice-assistant-reply"
            className={`text-xs leading-relaxed ${
              securityWarning ? 'text-amber-200 font-medium' : 'text-[#F4E8D3]'
            }`}
          >
            {securityWarning && (
              <ShieldAlert className="w-3.5 h-3.5 inline mr-1.5 text-amber-300" aria-hidden="true" />
            )}
            {assistantMessage}
          </p>

          {pendingConfirmation && (
            <div
              data-testid="voice-email-phone-confirmation"
              className="rounded-lg border border-[#F7D774]/50 bg-[#202F4C] px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-[11px]"
            >
              <span className="text-[#F7D774]">
                Confirm readback: <strong className="text-white">{pendingConfirmation}</strong>
              </span>
              <button
                type="button"
                onClick={() => setPendingConfirmation(null)}
                className="px-2.5 py-0.5 rounded-full bg-[#D4A537] text-[#171717] font-semibold text-[10px] uppercase cursor-pointer"
              >
                Looks Correct
              </button>
            </div>
          )}

          {/* Voice / Text Utterance Row */}
          <div className="flex items-center gap-2">
            {speechSupported && (
              <button
                type="button"
                onClick={toggleMicrophone}
                aria-label={listening ? 'Stop microphone listening' : 'Speak registration details'}
                className={`min-h-[34px] px-2.5 rounded-lg border flex items-center gap-1.5 text-[11px] font-medium transition-colors cursor-pointer shrink-0 ${
                  listening
                    ? 'border-red-400 bg-red-500/20 text-red-100'
                    : 'border-[#D4A537]/50 text-[#F7D774] hover:bg-[#D4A537]/15'
                }`}
              >
                {listening ? (
                  <MicOff className="w-3.5 h-3.5" aria-hidden="true" />
                ) : (
                  <Mic className="w-3.5 h-3.5" aria-hidden="true" />
                )}
                <span className="hidden sm:inline">{listening ? 'Listening…' : 'Mic'}</span>
              </button>
            )}

            <input
              type="text"
              data-testid="voice-text-input"
              aria-label="Type or speak registration details"
              value={utteranceText}
              onChange={(e) => setUtteranceText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void submitUtterance(utteranceText);
                }
              }}
              placeholder={
                locale === 'te'
                  ? 'ఉదా: నా పేరు రమేష్, email ramesh@example.com, హైదరాబాద్'
                  : locale === 'hi'
                    ? 'उदा: मेरा नाम रमेश, email ramesh@example.com, हैदराबाद'
                    : 'e.g. My name is Ananya, email ananya@org.in, Hyderabad India'
              }
              className="flex-1 min-w-0 min-h-[34px] px-3 rounded-lg border border-[#D4A537]/40 bg-[#0F172A] text-xs text-[#FFFDF7] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#F7D774]"
            />

            <button
              type="button"
              data-testid="voice-text-submit"
              disabled={busy || !utteranceText.trim()}
              onClick={() => void submitUtterance(utteranceText)}
              aria-label="Send message to registration assistant"
              className="min-h-[34px] px-3 rounded-lg bg-[#D4A537] text-[#171717] text-xs font-semibold inline-flex items-center gap-1 hover:bg-[#F7D774] disabled:opacity-50 cursor-pointer shrink-0"
            >
              <Send className="w-3 h-3" aria-hidden="true" />
              <span>Apply</span>
            </button>
          </div>

          {/* Quick Actions Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5 text-[10.5px]">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() =>
                  speaking
                    ? stopAudio()
                    : void speakText(getVoiceStepPrompt(currentStep, locale), locale)
                }
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-[#D4A537]/40 text-[#F7D774] hover:bg-[#D4A537]/15 cursor-pointer"
              >
                {speaking ? (
                  <VolumeX className="w-3 h-3" aria-hidden="true" />
                ) : (
                  <Volume2 className="w-3 h-3" aria-hidden="true" />
                )}
                <span>{speaking ? 'Stop Voice' : 'Listen Step'}</span>
              </button>

              <button
                type="button"
                onClick={() => void submitUtterance('Repeat')}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-[#D4A537]/35 text-[#E9DCC5] hover:text-white cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" aria-hidden="true" />
                <span>Repeat</span>
              </button>

              {currentStep === 5 && (
                <button
                  type="button"
                  onClick={() => onStepCommand('skip')}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-[#D4A537]/35 text-[#E9DCC5] hover:text-white cursor-pointer"
                >
                  <SkipForward className="w-3 h-3" aria-hidden="true" />
                  <span>Skip Step</span>
                </button>
              )}

              {currentStep === 8 && (
                <button
                  type="button"
                  data-testid="voice-step8-readback"
                  onClick={handleReadStep8Summary}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#D4A537]/25 border border-[#F7D774]/60 text-[#F7D774] hover:bg-[#D4A537]/35 cursor-pointer"
                >
                  <Volume2 className="w-3 h-3" aria-hidden="true" />
                  <span>Read Full Summary</span>
                </button>
              )}
            </div>

            <span className="text-[10px] text-[#94A3B8]">
              Privacy guard active: no card, OTP, or PIN accepted
            </span>
          </div>
        </div>
      )}
    </aside>
  );
};
