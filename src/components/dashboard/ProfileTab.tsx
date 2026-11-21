import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, RotateCcw, Save, UserRound } from 'lucide-react';
import { ApiError, portalApi, type PortalDashboard, type PortalProfile, type ProfileUpdate } from '../../utils/portalApi';
import { useToast } from '../ui/Toaster';
import { formatDate, titleCase } from './format';

type EditableKey = keyof Required<ProfileUpdate>;

const EDITABLE_KEYS: EditableKey[] = [
  'phone',
  'city',
  'country',
  'preferredLanguage',
  'organisationName',
  'organisationRole',
  'familyOrGroupMembers',
  'parayanaCity',
];

const LANGUAGES = [
  { value: '', label: 'No preference' },
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'हिन्दी (Hindi)' },
  { value: 'te', label: 'తెలుగు (Telugu)' },
  { value: 'sa', label: 'संस्कृतम् (Sanskrit)' },
];

const pickEditable = (p: PortalProfile): Record<EditableKey, string> =>
  Object.fromEntries(EDITABLE_KEYS.map((k) => [k, (p[k] as string) ?? ''])) as Record<EditableKey, string>;

const inputClass =
  'w-full min-h-[44px] rounded-xl border border-[#D4A537]/30 bg-black/25 px-3.5 text-sm text-[#FFFDF7] placeholder:text-[#E9DCC5]/35 outline-none focus:border-[#F7D774] focus:shadow-[0_0_0_3px_rgba(247,215,116,0.15)] transition';

export const ProfileTab: React.FC<{ profile: PortalProfile; onUpdated: (d: PortalDashboard) => void }> = ({
  profile,
  onUpdated,
}) => {
  const { notify } = useToast();
  const initial = useMemo(() => pickEditable(profile), [profile]);
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<EditableKey, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => setForm(initial), [initial]);

  const dirty = EDITABLE_KEYS.some((k) => form[k] !== initial[k]);

  const set = (key: EditableKey) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const validate = (): boolean => {
    const next: Partial<Record<EditableKey, string>> = {};
    if (!/^\+?[\d\s\-()]{7,20}$/.test(form.phone.trim())) next.phone = 'Enter a valid phone number (7–20 digits).';
    if (form.city.trim().length < 2) next.city = 'City is required.';
    if (form.country.trim().length < 2) next.country = 'Country is required.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dirty || !validate()) return;
    setSaving(true);
    setFormError(null);
    try {
      const update: ProfileUpdate = {};
      for (const k of EDITABLE_KEYS) if (form[k] !== initial[k]) update[k] = form[k].trim();
      const result = await portalApi.updateProfile(update);
      onUpdated(result);
      notify({ tone: 'success', title: 'Profile saved', body: 'Your details have been updated.' });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'INVALID_PHONE') setErrors({ phone: err.message });
        else if (err.code === 'INVALID_CITY') setErrors({ city: err.message });
        else setFormError(err.message);
      } else {
        setFormError('Could not save your profile. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const field = (key: EditableKey, label: string, opts: { placeholder?: string; type?: string; autoComplete?: string } = {}) => (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-[#E9DCC5]/85">{label}</span>
      <input
        type={opts.type ?? 'text'}
        value={form[key]}
        onChange={set(key)}
        placeholder={opts.placeholder}
        autoComplete={opts.autoComplete}
        aria-invalid={Boolean(errors[key])}
        className={`${inputClass} ${errors[key] ? 'border-red-400/70' : ''}`}
      />
      {errors[key] && <span className="block text-[11px] text-red-300">{errors[key]}</span>}
    </label>
  );

  const events = [profile.events.curtainRaiser && 'Curtain Raiser', profile.events.mahotsav && 'Main Mahotsav'].filter(Boolean);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-5">
      <aside className="cinematic-rise rounded-3xl border border-[#D4A537]/35 bg-[#0F1829]/85 p-5 sm:p-6 space-y-4 self-start">
        <div className="flex items-center gap-2 text-[10.5px] font-semibold tracking-[0.2em] uppercase text-[#D4A537]">
          <UserRound className="w-4 h-4" aria-hidden="true" /> Registered identity
        </div>
        <dl className="space-y-3 text-sm">
          {[
            ['Full name', profile.fullName],
            ['Email', profile.email],
            ['Reference', profile.referenceCode],
            ['Registration type', titleCase(profile.registrationType)],
            ['Persons', String(profile.noOfPersons)],
            ['Events', events.join(' & ') || '—'],
            ['Registered on', formatDate(profile.createdAt)],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="text-[10.5px] uppercase tracking-[0.14em] text-[#E9DCC5]/55">{k}</dt>
              <dd className={`text-[#FFFDF7] break-all ${k === 'Reference' ? 'font-mono text-[#F7D774]' : ''}`}>{v}</dd>
            </div>
          ))}
        </dl>
        <p className="text-[11px] text-[#E9DCC5]/55 leading-relaxed">
          Name, email and registration type are locked to your verified registration. Contact the Secretariat to change them.
        </p>
      </aside>

      <form
        onSubmit={handleSave}
        noValidate
        className="cinematic-rise rounded-3xl border border-[#D4A537]/35 bg-[#0F1829]/85 p-5 sm:p-6 space-y-5"
        style={{ animationDelay: '80ms' }}
      >
        <div>
          <h3 className="font-editorial text-2xl text-[#FFFDF7]">Contact & preferences</h3>
          <p className="text-xs text-[#E9DCC5]/65">Keep these up to date so we can reach you about your passes.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field('phone', 'Phone', { type: 'tel', autoComplete: 'tel', placeholder: '+91 98490 12345' })}
          {field('city', 'City', { autoComplete: 'address-level2' })}
          {field('country', 'Country', { autoComplete: 'country-name' })}
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-[#E9DCC5]/85">Preferred language</span>
            <select value={form.preferredLanguage} onChange={set('preferredLanguage')} className={`${inputClass} cursor-pointer`}>
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value} className="bg-[#131D30]">
                  {l.label}
                </option>
              ))}
            </select>
          </label>
          {field('organisationName', 'Organisation (optional)')}
          {field('organisationRole', 'Role (optional)')}
          {field('parayanaCity', 'Parayana city (optional)')}
          <label className="block space-y-1.5 sm:col-span-2">
            <span className="text-xs font-medium text-[#E9DCC5]/85">Family / group members (optional)</span>
            <textarea
              rows={3}
              value={form.familyOrGroupMembers}
              onChange={set('familyOrGroupMembers')}
              className={`${inputClass} py-2.5 resize-y`}
              placeholder="Names of people travelling with you"
            />
          </label>
        </div>

        {formError && (
          <p role="alert" className="rounded-xl border border-red-400/40 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-200">
            {formError}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-end gap-2.5 pt-1">
          {dirty && <span className="mr-auto text-xs text-amber-200/90">You have unsaved changes</span>}
          <button
            type="button"
            disabled={!dirty || saving}
            onClick={() => {
              setForm(initial);
              setErrors({});
              setFormError(null);
            }}
            className="inline-flex items-center gap-1.5 min-h-[42px] px-5 rounded-full border border-[#D4A537]/45 text-xs font-medium text-[#FFFDF7] hover:border-[#F7D774] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" /> Reset
          </button>
          <button
            type="submit"
            disabled={!dirty || saving}
            className="inline-flex items-center gap-1.5 min-h-[42px] px-6 rounded-full royal-gold-surface text-xs font-semibold disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> : <Save className="w-3.5 h-3.5" aria-hidden="true" />}
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  );
};
