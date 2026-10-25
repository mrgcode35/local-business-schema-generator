import { BUSINESS_TYPES, DAYS, buildSchema, validate, toScriptTag } from './schema.js';

const RICH_RESULTS_TEST = 'https://search.google.com/test/rich-results';
const SCHEMA_VALIDATOR = 'https://validator.schema.org/';

const EXAMPLE = {
  type: 'Plumber',
  bizName: 'Acme Plumbing',
  description: 'Family-run plumbers for repairs, leaks and water heaters.',
  url: 'https://www.example.com/',
  telephone: '+1-555-555-0100',
  email: 'hello@example.com',
  logo: 'https://www.example.com/logo.png',
  image: 'https://www.example.com/team.jpg',
  priceRange: '$$',
  street: '123 Main St',
  city: 'Springfield',
  region: 'IL',
  postalCode: '62701',
  country: 'US',
  latitude: '39.7817',
  longitude: '-89.6501',
  mapUrl: '',
  areaServed: 'Springfield\nChatham\nRochester',
  sameAs: 'https://www.facebook.com/example\nhttps://www.instagram.com/example',
};

/**
 * Render the LocalBusiness Schema Generator into `root`.
 * @param {HTMLElement} root
 */
export function mountSchemaTool(root) {
  root.classList.add('lbs');
  // Static structure only — user text is always written with textContent / value.
  root.innerHTML = `
    <div class="lbs-layout">
      <form class="lbs-panel lbs-form" novalidate>
        <div class="lbs-head">
          <h3 class="lbs-h">Business details</h3>
          <button class="lbs-btn lbs-example" type="button">Fill in an example</button>
        </div>

        <label class="lbs-label" for="lbs-type">Business type</label>
        <select id="lbs-type" class="lbs-input" name="type"></select>

        <label class="lbs-label" for="lbs-name">Business name *</label>
        <input id="lbs-name" class="lbs-input" name="bizName" type="text" autocomplete="organization" />

        <label class="lbs-label" for="lbs-desc">Short description</label>
        <textarea id="lbs-desc" class="lbs-input" name="description" rows="2"></textarea>

        <div class="lbs-2">
          <div><label class="lbs-label" for="lbs-url">Website</label>
            <input id="lbs-url" class="lbs-input" name="url" type="url" placeholder="https://" /></div>
          <div><label class="lbs-label" for="lbs-tel">Phone</label>
            <input id="lbs-tel" class="lbs-input" name="telephone" type="tel" placeholder="+1-555-555-0100" /></div>
          <div><label class="lbs-label" for="lbs-email">Email</label>
            <input id="lbs-email" class="lbs-input" name="email" type="email" /></div>
          <div><label class="lbs-label" for="lbs-price">Price range</label>
            <input id="lbs-price" class="lbs-input" name="priceRange" type="text" placeholder="$$" maxlength="20" /></div>
          <div><label class="lbs-label" for="lbs-logo">Logo URL</label>
            <input id="lbs-logo" class="lbs-input" name="logo" type="url" placeholder="https://" /></div>
          <div><label class="lbs-label" for="lbs-image">Photo URL</label>
            <input id="lbs-image" class="lbs-input" name="image" type="url" placeholder="https://" /></div>
        </div>

        <h3 class="lbs-h lbs-h-gap">Address</h3>
        <label class="lbs-check"><input type="checkbox" name="hideStreet" /> Service-area business (customers don't visit us, so hide the street)</label>
        <label class="lbs-label lbs-street-label" for="lbs-street">Street</label>
        <input id="lbs-street" class="lbs-input lbs-street" name="street" type="text" autocomplete="street-address" />
        <div class="lbs-2">
          <div><label class="lbs-label" for="lbs-city">City</label>
            <input id="lbs-city" class="lbs-input" name="city" type="text" autocomplete="address-level2" /></div>
          <div><label class="lbs-label" for="lbs-region">State / region</label>
            <input id="lbs-region" class="lbs-input" name="region" type="text" autocomplete="address-level1" /></div>
          <div><label class="lbs-label" for="lbs-zip">Postal code</label>
            <input id="lbs-zip" class="lbs-input" name="postalCode" type="text" autocomplete="postal-code" /></div>
          <div><label class="lbs-label" for="lbs-country">Country</label>
            <input id="lbs-country" class="lbs-input" name="country" type="text" placeholder="US" autocomplete="country" /></div>
          <div><label class="lbs-label" for="lbs-lat">Latitude</label>
            <input id="lbs-lat" class="lbs-input" name="latitude" type="text" inputmode="decimal" /></div>
          <div><label class="lbs-label" for="lbs-lng">Longitude</label>
            <input id="lbs-lng" class="lbs-input" name="longitude" type="text" inputmode="decimal" /></div>
        </div>
        <label class="lbs-label" for="lbs-map">Google Maps link</label>
        <input id="lbs-map" class="lbs-input" name="mapUrl" type="url" placeholder="https://" />
        <label class="lbs-label" for="lbs-areas">Areas served (one per line)</label>
        <textarea id="lbs-areas" class="lbs-input" name="areaServed" rows="3"></textarea>

        <h3 class="lbs-h lbs-h-gap">Opening hours</h3>
        <label class="lbs-check"><input type="checkbox" name="open24" /> Open 24/7</label>
        <div class="lbs-hours"></div>

        <h3 class="lbs-h lbs-h-gap">Social profiles</h3>
        <label class="lbs-label" for="lbs-same">Profile links (one per line)</label>
        <textarea id="lbs-same" class="lbs-input" name="sameAs" rows="3" placeholder="https://www.facebook.com/…"></textarea>
      </form>

      <div class="lbs-panel lbs-out">
        <h3 class="lbs-h">Your schema code</h3>
        <ul class="lbs-issues" aria-live="polite"></ul>
        <pre class="lbs-code" tabindex="0"><code></code></pre>
        <div class="lbs-row">
          <button class="lbs-btn lbs-btn-primary lbs-copy" type="button">Copy code</button>
          <a class="lbs-btn" href="${RICH_RESULTS_TEST}" target="_blank" rel="noopener noreferrer">Google Rich Results Test ↗</a>
          <a class="lbs-btn" href="${SCHEMA_VALIDATOR}" target="_blank" rel="noopener noreferrer">Schema validator ↗</a>
        </div>
        <p class="lbs-note">Paste the code into the <code>&lt;head&gt;</code> of the page about this business (or your SEO plugin's custom code box), then run Google's test.</p>
      </div>
    </div>
  `;

  const form = root.querySelector('.lbs-form');
  const field = (name) => form.elements.namedItem(name);
  const codeEl = root.querySelector('.lbs-code code');
  const issuesEl = root.querySelector('.lbs-issues');
  const copyBtn = root.querySelector('.lbs-copy');

  const typeSelect = field('type');
  for (const [value, label] of BUSINESS_TYPES) {
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = label;
    typeSelect.appendChild(opt);
  }

  const hoursBox = root.querySelector('.lbs-hours');
  DAYS.forEach((day, i) => {
    const row = document.createElement('div');
    row.className = 'lbs-hour';
    const weekday = i < 5;
    row.innerHTML = `
      <label class="lbs-check"><input type="checkbox" name="open-${day}" ${weekday ? 'checked' : ''} /> <span></span></label>
      <input class="lbs-input lbs-time" type="time" name="opens-${day}" value="09:00" aria-label="${day} opens" />
      <span class="lbs-to">to</span>
      <input class="lbs-input lbs-time" type="time" name="closes-${day}" value="17:00" aria-label="${day} closes" />`;
    row.querySelector('span').textContent = day;
    hoursBox.appendChild(row);
  });

  let currentTag = '';

  function read() {
    const v = (n) => field(n).value;
    return {
      type: v('type'),
      name: v('bizName'),
      description: v('description'),
      url: v('url'),
      telephone: v('telephone'),
      email: v('email'),
      logo: v('logo'),
      image: v('image'),
      priceRange: v('priceRange'),
      hideStreet: field('hideStreet').checked,
      address: { street: v('street'), city: v('city'), region: v('region'), postalCode: v('postalCode'), country: v('country') },
      latitude: v('latitude'),
      longitude: v('longitude'),
      mapUrl: v('mapUrl'),
      areaServed: v('areaServed'),
      sameAs: v('sameAs'),
      open24: field('open24').checked,
      hours: DAYS.map((day) => ({
        day,
        open: field(`open-${day}`).checked,
        opens: v(`opens-${day}`),
        closes: v(`closes-${day}`),
      })),
    };
  }

  function update() {
    const data = read();
    const { errors, warnings } = validate(data);
    currentTag = toScriptTag(buildSchema(data));
    codeEl.textContent = currentTag;

    issuesEl.replaceChildren(
      ...errors.map((t) => item(t, 'lbs-issue lbs-issue--error')),
      ...warnings.map((t) => item(t, 'lbs-issue lbs-issue--warn')),
    );
    if (!errors.length && !warnings.length) issuesEl.appendChild(item('Looks complete. Copy the code and run Google\'s test.', 'lbs-issue lbs-issue--ok'));

    root.classList.toggle('lbs-is-sab', data.hideStreet);
    hoursBox.classList.toggle('lbs-hours--off', data.open24);
    copyBtn.disabled = errors.length > 0;
  }

  form.addEventListener('input', update);
  form.addEventListener('change', update);
  form.addEventListener('submit', (e) => e.preventDefault());

  root.querySelector('.lbs-example').addEventListener('click', () => {
    for (const [name, value] of Object.entries(EXAMPLE)) field(name).value = value;
    update();
  });

  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(currentTag);
    } catch {
      const range = document.createRange();
      range.selectNodeContents(codeEl);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      document.execCommand('copy');
    }
    const original = copyBtn.textContent;
    copyBtn.textContent = 'Copied!';
    setTimeout(() => { copyBtn.textContent = original; }, 1500);
  });

  update();
  return { update };
}

function item(text, className) {
  const li = document.createElement('li');
  li.className = className;
  li.textContent = text;
  return li;
}
