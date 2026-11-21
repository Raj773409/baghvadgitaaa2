import React from 'react';
import { ArrowLeft, Compass } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Footer } from '../../components/layout/Footer';
import { Header } from '../../components/layout/Header';
import { useI18n } from '../../i18n';

export const NotFoundPage: React.FC = () => {
  const { contentLocale: locale } = useI18n();

  const eyebrow =
    locale === 'hi' ? '404 · पृष्ठ नहीं मिला' : locale === 'te' ? '404 · పేజీ కనుగొనబడలేదు' : '404 · Page Not Found';
  const heading =
    locale === 'hi'
      ? 'यह पृष्ठ अस्तित्व में नहीं है'
      : locale === 'te'
        ? 'ఈ పేజీ ఉనికిలో లేదు'
        : 'This Page Does Not Exist';
  const lead =
    locale === 'hi'
      ? 'आपके द्वारा खोजा गया पृष्ठ स्थानांतरित हो गया है या कभी अस्तित्व में नहीं था। कृपया मुख्य पृष्ठ पर लौटें या नेविगेशन से सही गंतव्य चुनें।'
      : locale === 'te'
        ? 'మీరు వెతుకుతున్న పేజీ తరలించబడింది లేదా ఎప్పుడూ ఉనికిలో లేదు. దయచేసి హోమ్‌పేజీకి తిరిగి వెళ్లండి లేదా నావిగేషన్ నుండి సరైన గమ్యస్థానాన్ని ఎంచుకోండి.'
        : 'The page you were looking for has moved or never existed. Return to the homepage or choose a destination from the navigation.';
  const ctaHome =
    locale === 'hi' ? 'मुख्य पृष्ठ पर लौटें' : locale === 'te' ? 'హోమ్‌పేజీకి తిరిగి వెళ్ళండి' : 'Return to Homepage';
  const ctaRegister =
    locale === 'hi' ? 'सहभागिता पंजीकरण देखें' : locale === 'te' ? 'నమోదు వివరాలు చూడండి' : 'View Participation & Registration';

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-canvas)] text-[var(--color-ink)]">
      <Header variant="solid-dark" />
      <main className="flex-1 flex items-center justify-center px-5 sm:px-8 py-28">
        <div className="max-w-xl text-center space-y-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-bronze)]">
            {eyebrow}
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-normal text-[var(--color-ink)]">
            {heading}
          </h1>
          <p className="text-sm sm:text-base leading-relaxed text-[var(--color-muted)] max-w-prose mx-auto">
            {lead}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to="/"
              className="inline-flex items-center gap-2 min-h-[44px] px-6 rounded-full royal-gold-surface text-xs font-semibold uppercase tracking-[0.08em]"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{ctaHome}</span>
            </Link>
            <Link
              to="/participate"
              className="inline-flex items-center gap-2 min-h-[44px] px-6 rounded-full border border-[var(--color-border)] text-xs font-medium text-[var(--color-ink)] hover:bg-[var(--color-bronze)]/10"
            >
              <Compass className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{ctaRegister}</span>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFoundPage;
