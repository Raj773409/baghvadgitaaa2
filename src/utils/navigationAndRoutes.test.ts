import test from 'node:test';
import assert from 'node:assert/strict';
import { MORE_MENU_ITEMS } from '../content/navigationContent';
import { CANONICAL_GITA_VERSES, GITA_CHAPTER_CATALOG } from '../content/scriptureContent';
import { OFFICIAL_EVENTS_PROGRAM, VERIFIED_ORGANISING_COMMITTEE } from '../content/eventContent';
import { OFFICIAL_FAQS, OFFICIAL_POLICY_DOCUMENTS } from '../content/faqAndPolicyContent';
import { PARTICIPATION_PATHWAYS } from '../content/participationContent';
import {
  normalizePlatformRoute,
  parseChapterQueryParam,
  parseRegistrationTypeParam,
} from './navigationAndRoutes';

test('MORE menu exposes all 12 primary platform destinations organized into Discover, Experience, and Organization', () => {
  assert.equal(MORE_MENU_ITEMS.length, 12);
  assert.equal(MORE_MENU_ITEMS.filter((i) => i.section === 'discover').length, 5);
  assert.equal(MORE_MENU_ITEMS.filter((i) => i.section === 'experience').length, 3);
  assert.equal(MORE_MENU_ITEMS.filter((i) => i.section === 'organization').length, 4);
  assert.equal(MORE_MENU_ITEMS[0].to, '/');
  assert.equal(MORE_MENU_ITEMS[11].to, '/privacy-policy');
  assert.ok(MORE_MENU_ITEMS.some((i) => i.to === '/story'));
  assert.equal(new Set(MORE_MENU_ITEMS.map((i) => i.to)).size, 12);
});

test('parseRegistrationTypeParam validates allowed types and safely ignores invalid input', () => {
  assert.equal(parseRegistrationTypeParam('?type=youth'), 'youth');
  assert.equal(parseRegistrationTypeParam('?type=INSTITUTIONAL'), 'institutional');
  assert.equal(parseRegistrationTypeParam('?type=volunteer'), 'volunteer');
  assert.equal(parseRegistrationTypeParam('?type=unknown-hack'), '');
  assert.equal(parseRegistrationTypeParam(''), '');
});

test('parseChapterQueryParam validates 1..18 chapter query parameters', () => {
  assert.equal(parseChapterQueryParam('?chapter=1'), 1);
  assert.equal(parseChapterQueryParam('?chapter=18'), 18);
  assert.equal(parseChapterQueryParam('?chapter=0'), null);
  assert.equal(parseChapterQueryParam('?chapter=19'), null);
  assert.equal(parseChapterQueryParam('?chapter=abc'), null);
  assert.equal(parseChapterQueryParam(''), null);
});

test('normalizePlatformRoute resolves legacy and official portal aliases cleanly', () => {
  assert.equal(normalizePlatformRoute('/register'), '/participate/register');
  assert.equal(normalizePlatformRoute('/programme'), '/program');
  assert.equal(normalizePlatformRoute('/global-journey/18-countries/'), '/global-journey');
  assert.equal(normalizePlatformRoute('/connect'), '/contact');
  assert.equal(normalizePlatformRoute('/refund-policy'), '/cancellation-refund-policy');
});

test('scripture catalog preserves all 18 chapters and 4 canonical multilingual verses', () => {
  assert.equal(GITA_CHAPTER_CATALOG.length, 18);
  assert.equal(CANONICAL_GITA_VERSES.length, 4);
  for (const v of CANONICAL_GITA_VERSES) {
    assert.ok(v.sanskritDevanagari.length > 10);
    assert.ok(v.transliteration.length > 10);
    assert.ok(v.translationEn.length > 10);
    assert.ok(v.meaningHi.length > 10);
    assert.ok(v.meaningTe.length > 10);
  }
});

test('official program, committee, FAQs, policies, and participation datasets are complete', () => {
  assert.ok(OFFICIAL_EVENTS_PROGRAM.length >= 4);
  assert.equal(VERIFIED_ORGANISING_COMMITTEE.length, 5);
  assert.ok(OFFICIAL_FAQS.length >= 5);
  assert.ok(OFFICIAL_POLICY_DOCUMENTS.privacy.sections.length >= 3);
  assert.ok(OFFICIAL_POLICY_DOCUMENTS.terms.sections.length >= 3);
  assert.ok(OFFICIAL_POLICY_DOCUMENTS.refund.sections.length >= 3);
  assert.equal(PARTICIPATION_PATHWAYS.length, 6);
});
