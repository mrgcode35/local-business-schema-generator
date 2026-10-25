/**
 * Pure helpers for building LocalBusiness JSON-LD.
 * No DOM, no network — safe to use in the browser, in Node, or in tests.
 */

/** schema.org LocalBusiness subtypes offered in the picker: [type, label]. */
export const BUSINESS_TYPES = [
  ['LocalBusiness', 'Local business (general)'],
  ['HomeAndConstructionBusiness', 'Home services (general)'],
  ['Plumber', 'Plumber'],
  ['Electrician', 'Electrician'],
  ['HVACBusiness', 'HVAC / heating & cooling'],
  ['RoofingContractor', 'Roofing contractor'],
  ['GeneralContractor', 'General contractor'],
  ['HousePainter', 'Painter'],
  ['Locksmith', 'Locksmith'],
  ['MovingCompany', 'Moving company'],
  ['AutoRepair', 'Auto repair'],
  ['Dentist', 'Dentist'],
  ['MedicalClinic', 'Medical clinic'],
  ['Physician', 'Doctor / physician'],
  ['VeterinaryCare', 'Veterinary care'],
  ['BeautySalon', 'Beauty salon'],
  ['HairSalon', 'Hair salon'],
  ['DaySpa', 'Spa'],
  ['HealthClub', 'Gym / health club'],
  ['Restaurant', 'Restaurant'],
  ['CafeOrCoffeeShop', 'Café / coffee shop'],
  ['Bakery', 'Bakery'],
  ['Store', 'Store / shop'],
  ['LegalService', 'Law firm / legal service'],
  ['AccountingService', 'Accountant'],
  ['RealEstateAgent', 'Real estate agent'],
  ['InsuranceAgency', 'Insurance agency'],
  ['ChildCare', 'Child care'],
  ['LodgingBusiness', 'Hotel / lodging'],
  ['ProfessionalService', 'Professional service'],
];

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const TYPE_SET = new Set(BUSINESS_TYPES.map(([t]) => t));
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Build a LocalBusiness JSON-LD object from form data.
 *
 * @param {object} d
 * @param {string} [d.type]           One of BUSINESS_TYPES (defaults to LocalBusiness)
 * @param {string} d.name
 * @param {string} [d.description]
 * @param {string} [d.url]
 * @param {string} [d.telephone]
 * @param {string} [d.email]
 * @param {string} [d.logo]
 * @param {string} [d.image]
 * @param {string} [d.priceRange]
 * @param {boolean} [d.hideStreet]    Service-area business: leave the street out
 * @param {{street?:string,city?:string,region?:string,postalCode?:string,country?:string}} [d.address]
 * @param {string|number} [d.latitude]
 * @param {string|number} [d.longitude]
 * @param {string} [d.mapUrl]
 * @param {boolean} [d.open24]
 * @param {{day:string,open:boolean,opens?:string,closes?:string}[]} [d.hours]
 * @param {string[]} [d.areaServed]
 * @param {string[]} [d.sameAs]
 */
export function buildSchema(d = {}) {
  const url = clean(d.url);
  const schema = {
    '@context': 'https://schema.org',
    '@type': TYPE_SET.has(d.type) ? d.type : 'LocalBusiness',
  };

  if (isUrl(url)) schema['@id'] = url.replace(/#.*$/, '') + '#localbusiness';
  set(schema, 'name', clean(d.name));
  set(schema, 'description', clean(d.description));
  if (isUrl(url)) schema.url = url;
  set(schema, 'telephone', clean(d.telephone));
  set(schema, 'email', clean(d.email));
  if (isUrl(clean(d.logo))) schema.logo = clean(d.logo);
  if (isUrl(clean(d.image))) schema.image = clean(d.image);
  set(schema, 'priceRange', clean(d.priceRange));

  const a = d.address || {};
  const address = { '@type': 'PostalAddress' };
  if (!d.hideStreet) set(address, 'streetAddress', clean(a.street));
  set(address, 'addressLocality', clean(a.city));
  set(address, 'addressRegion', clean(a.region));
  set(address, 'postalCode', clean(a.postalCode));
  set(address, 'addressCountry', clean(a.country));
  if (Object.keys(address).length > 1) schema.address = address;

  const lat = toNumber(d.latitude);
  const lng = toNumber(d.longitude);
  if (validLat(lat) && validLng(lng)) {
    schema.geo = { '@type': 'GeoCoordinates', latitude: lat, longitude: lng };
  }

  if (isUrl(clean(d.mapUrl))) schema.hasMap = clean(d.mapUrl);

  const hours = buildHours(d);
  if (hours.length) schema.openingHoursSpecification = hours;

  const areas = list(d.areaServed);
  if (areas.length) schema.areaServed = areas.length === 1 ? areas[0] : areas;

  const sameAs = list(d.sameAs).filter(isUrl);
  if (sameAs.length) schema.sameAs = sameAs;

  return schema;
}

/** Group days that share the same hours into OpeningHoursSpecification entries. */
export function buildHours(d = {}) {
  if (d.open24) {
    return [{ '@type': 'OpeningHoursSpecification', dayOfWeek: [...DAYS], opens: '00:00', closes: '23:59' }];
  }
  const groups = new Map();
  for (const h of d.hours || []) {
    if (!h || !h.open || !DAYS.includes(h.day)) continue;
    if (!TIME_RE.test(h.opens || '') || !TIME_RE.test(h.closes || '')) continue;
    const key = `${h.opens}-${h.closes}`;
    if (!groups.has(key)) groups.set(key, { opens: h.opens, closes: h.closes, days: [] });
    groups.get(key).days.push(h.day);
  }
  return [...groups.values()].map((g) => ({
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: g.days.length === 1 ? g.days[0] : g.days,
    opens: g.opens,
    closes: g.closes,
  }));
}

/**
 * Check form data. Errors stop the schema from being usable; warnings are
 * recommendations.
 * @returns {{errors: string[], warnings: string[]}}
 */
export function validate(d = {}) {
  const errors = [];
  const warnings = [];
  const a = d.address || {};

  if (!clean(d.name)) errors.push('Add the business name.');

  for (const [field, label] of [['url', 'Website'], ['logo', 'Logo URL'], ['image', 'Image URL'], ['mapUrl', 'Google Maps link']]) {
    const v = clean(d[field]);
    if (v && !isUrl(v)) errors.push(`${label} must be a full link starting with https://`);
  }
  const badSocial = list(d.sameAs).filter((v) => !isUrl(v));
  if (badSocial.length) errors.push(`These profile links are not full https:// links: ${badSocial.join(', ')}`);

  const hasLat = clean(String(d.latitude ?? '')) !== '';
  const hasLng = clean(String(d.longitude ?? '')) !== '';
  if (hasLat || hasLng) {
    if (!validLat(toNumber(d.latitude)) || !validLng(toNumber(d.longitude))) {
      errors.push('Latitude must be between -90 and 90 and longitude between -180 and 180 (both needed).');
    }
  }

  if (!clean(a.city) && !clean(a.street)) {
    warnings.push('Add at least the city: Google expects an address for local businesses.');
  } else if (!d.hideStreet && !clean(a.street)) {
    warnings.push('No street address. If customers don\'t visit you, tick "Service-area business".');
  }
  if (!clean(a.country)) warnings.push('Add the country (for example US, GB, AU or CA).');
  if (!clean(d.telephone)) warnings.push('Add a phone number.');
  else if (!clean(d.telephone).startsWith('+')) warnings.push('Write the phone in international format, e.g. +1-555-555-0100.');
  if (!isUrl(clean(d.url))) warnings.push('Add the website address.');
  if (!isUrl(clean(d.image)) && !isUrl(clean(d.logo))) warnings.push('Add a logo or photo URL.');
  if (!d.open24 && !buildHours(d).length) warnings.push('Add opening hours (or tick "Open 24/7").');
  if (d.hideStreet && !list(d.areaServed).length) warnings.push('Service-area business: list the areas you serve.');

  return { errors, warnings };
}

/**
 * Wrap the schema in a <script type="application/ld+json"> tag, ready to paste.
 * "<" is escaped so text such as "</script>" in a description can't break out.
 */
export function toScriptTag(schema) {
  const json = JSON.stringify(schema, null, 2).replace(/</g, '\\u003c');
  return `<script type="application/ld+json">\n${json}\n</script>`;
}

function clean(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function set(obj, key, value) {
  if (value) obj[key] = value;
}

function list(v) {
  const arr = Array.isArray(v) ? v : String(v || '').split(/\r?\n/);
  return arr.map((x) => String(x).trim()).filter(Boolean);
}

function isUrl(v) {
  if (!v) return false;
  try {
    const u = new URL(v);
    return (u.protocol === 'https:' || u.protocol === 'http:') && u.hostname.includes('.');
  } catch {
    return false;
  }
}

function toNumber(v) {
  if (v === null || v === undefined || String(v).trim() === '') return NaN;
  return Number(v);
}

function validLat(n) {
  return Number.isFinite(n) && n >= -90 && n <= 90;
}

function validLng(n) {
  return Number.isFinite(n) && n >= -180 && n <= 180;
}
