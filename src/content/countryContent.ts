export interface ParticipatingCountry {
  id: string;
  code: string;
  nameKey: string;
  regionKey: string;
  lat: number;
  lon: number;
  /**
   * Intentionally null until organizers publish verified country-level stories,
   * photographs, or schedule updates. Never invent participant counts or reps.
   */
  approvedSummaryKey: string | null;
}

/**
 * The exact eighteen countries published on the official website:
 * India, USA, Canada, Brazil, South Africa, UK, Ireland, France, Germany,
 * Italy, Spain, Netherlands, Russia, China, Japan, UAE, Australia, New Zealand.
 */
export const PARTICIPATING_COUNTRIES: ReadonlyArray<ParticipatingCountry> = [
  { id: 'india', code: 'IN', nameKey: 'countries.india', regionKey: 'regions.asia', lat: 20.5937, lon: 78.9629, approvedSummaryKey: null },
  { id: 'usa', code: 'US', nameKey: 'countries.usa', regionKey: 'regions.americas', lat: 37.0902, lon: -95.7129, approvedSummaryKey: null },
  { id: 'canada', code: 'CA', nameKey: 'countries.canada', regionKey: 'regions.americas', lat: 56.1304, lon: -106.3468, approvedSummaryKey: null },
  { id: 'brazil', code: 'BR', nameKey: 'countries.brazil', regionKey: 'regions.americas', lat: -14.235, lon: -51.9253, approvedSummaryKey: null },
  { id: 'south-africa', code: 'ZA', nameKey: 'countries.southAfrica', regionKey: 'regions.africa', lat: -30.5595, lon: 22.9375, approvedSummaryKey: null },
  { id: 'uk', code: 'GB', nameKey: 'countries.uk', regionKey: 'regions.europe', lat: 55.3781, lon: -3.436, approvedSummaryKey: null },
  { id: 'ireland', code: 'IE', nameKey: 'countries.ireland', regionKey: 'regions.europe', lat: 53.4129, lon: -8.2439, approvedSummaryKey: null },
  { id: 'france', code: 'FR', nameKey: 'countries.france', regionKey: 'regions.europe', lat: 46.2276, lon: 2.2137, approvedSummaryKey: null },
  { id: 'germany', code: 'DE', nameKey: 'countries.germany', regionKey: 'regions.europe', lat: 51.1657, lon: 10.4515, approvedSummaryKey: null },
  { id: 'italy', code: 'IT', nameKey: 'countries.italy', regionKey: 'regions.europe', lat: 41.8719, lon: 12.5674, approvedSummaryKey: null },
  { id: 'spain', code: 'ES', nameKey: 'countries.spain', regionKey: 'regions.europe', lat: 40.4637, lon: -3.7492, approvedSummaryKey: null },
  { id: 'netherlands', code: 'NL', nameKey: 'countries.netherlands', regionKey: 'regions.europe', lat: 52.1326, lon: 5.2913, approvedSummaryKey: null },
  { id: 'russia', code: 'RU', nameKey: 'countries.russia', regionKey: 'regions.eurasia', lat: 61.524, lon: 105.3188, approvedSummaryKey: null },
  { id: 'china', code: 'CN', nameKey: 'countries.china', regionKey: 'regions.asia', lat: 35.8617, lon: 104.1954, approvedSummaryKey: null },
  { id: 'japan', code: 'JP', nameKey: 'countries.japan', regionKey: 'regions.asia', lat: 36.2048, lon: 138.2529, approvedSummaryKey: null },
  { id: 'uae', code: 'AE', nameKey: 'countries.uae', regionKey: 'regions.middleEast', lat: 23.4241, lon: 53.8478, approvedSummaryKey: null },
  { id: 'australia', code: 'AU', nameKey: 'countries.australia', regionKey: 'regions.oceania', lat: -25.2744, lon: 133.7751, approvedSummaryKey: null },
  { id: 'new-zealand', code: 'NZ', nameKey: 'countries.newZealand', regionKey: 'regions.oceania', lat: -40.9006, lon: 174.886, approvedSummaryKey: null },
];
