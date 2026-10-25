import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSchema, buildHours, validate, toScriptTag, DAYS } from '../src/schema.js';

const weekday = (opens, closes) =>
  DAYS.map((day, i) => ({ day, open: i < 5, opens, closes }));

const acme = {
  type: 'Plumber',
  name: 'Acme Plumbing',
  url: 'https://www.example.com/',
  telephone: '+1-555-555-0100',
  logo: 'https://www.example.com/logo.png',
  address: { street: '123 Main St', city: 'Springfield', region: 'IL', postalCode: '62701', country: 'US' },
  latitude: '39.7817',
  longitude: '-89.6501',
  hours: weekday('08:00', '17:00'),
  sameAs: ['https://www.facebook.com/example', 'not a link'],
};

test('buildSchema: core fields, @id and type', () => {
  const s = buildSchema(acme);
  assert.equal(s['@context'], 'https://schema.org');
  assert.equal(s['@type'], 'Plumber');
  assert.equal(s['@id'], 'https://www.example.com/#localbusiness');
  assert.equal(s.name, 'Acme Plumbing');
  assert.equal(s.telephone, '+1-555-555-0100');
  assert.deepEqual(s.address, {
    '@type': 'PostalAddress',
    streetAddress: '123 Main St',
    addressLocality: 'Springfield',
    addressRegion: 'IL',
    postalCode: '62701',
    addressCountry: 'US',
  });
  assert.deepEqual(s.geo, { '@type': 'GeoCoordinates', latitude: 39.7817, longitude: -89.6501 });
  assert.deepEqual(s.sameAs, ['https://www.facebook.com/example']); // junk dropped
});

test('buildSchema: unknown type falls back, empty fields are left out', () => {
  const s = buildSchema({ type: 'Nonsense', name: 'X', url: 'not-a-url', latitude: '999', longitude: '0' });
  assert.equal(s['@type'], 'LocalBusiness');
  assert.equal(s.url, undefined);
  assert.equal(s['@id'], undefined);
  assert.equal(s.geo, undefined);
  assert.equal(s.address, undefined);
  assert.equal(s.description, undefined);
});

test('buildSchema: service-area business hides the street, keeps areas', () => {
  const s = buildSchema({ ...acme, hideStreet: true, areaServed: 'Springfield\nChatham\n' });
  assert.equal(s.address.streetAddress, undefined);
  assert.equal(s.address.addressLocality, 'Springfield');
  assert.deepEqual(s.areaServed, ['Springfield', 'Chatham']);
  assert.equal(buildSchema({ name: 'X', areaServed: ['Springfield'] }).areaServed, 'Springfield');
});

test('buildHours: groups identical days, single day is a string', () => {
  const hours = [
    ...weekday('08:00', '17:00').slice(0, 5),
    { day: 'Saturday', open: true, opens: '09:00', closes: '12:00' },
    { day: 'Sunday', open: false, opens: '09:00', closes: '12:00' },
  ];
  assert.deepEqual(buildHours({ hours }), [
    { '@type': 'OpeningHoursSpecification', dayOfWeek: DAYS.slice(0, 5), opens: '08:00', closes: '17:00' },
    { '@type': 'OpeningHoursSpecification', dayOfWeek: 'Saturday', opens: '09:00', closes: '12:00' },
  ]);
});

test('buildHours: 24/7 and bad times', () => {
  assert.deepEqual(buildHours({ open24: true })[0].dayOfWeek, DAYS);
  assert.deepEqual(buildHours({ hours: [{ day: 'Monday', open: true, opens: '25:00', closes: '17:00' }] }), []);
});

test('validate: errors and warnings', () => {
  const empty = validate({});
  assert.ok(empty.errors.some((e) => e.includes('name')));
  assert.ok(empty.warnings.length >= 4);

  const bad = validate({ name: 'X', url: 'example.com', latitude: '10' });
  assert.ok(bad.errors.some((e) => e.startsWith('Website')));
  assert.ok(bad.errors.some((e) => e.startsWith('Latitude')));

  const good = validate({ ...acme, sameAs: ['https://www.facebook.com/example'] });
  assert.deepEqual(good.errors, []);
  assert.deepEqual(good.warnings, []);
});

test('toScriptTag escapes "<" so the tag cannot be broken out of', () => {
  const tag = toScriptTag(buildSchema({ name: 'Evil</script><script>alert(1)</script>' }));
  assert.ok(tag.startsWith('<script type="application/ld+json">'));
  assert.equal((tag.match(/<\/script>/g) || []).length, 1);
  assert.ok(tag.includes('\\u003c/script>'));
  // Still valid JSON once unwrapped.
  const json = tag.replace(/^<script[^>]*>\n/, '').replace(/\n<\/script>$/, '');
  assert.equal(JSON.parse(json).name, 'Evil</script><script>alert(1)</script>');
});
