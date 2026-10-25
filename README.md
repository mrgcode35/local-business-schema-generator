# LocalBusiness Schema Generator

Free, open-source tool that turns a simple form into ready-to-paste **LocalBusiness JSON-LD**
(schema.org structured data) for any local business website.

- 30 business types (Plumber, Dentist, Restaurant, Law firm, HVAC…)
- Address, map position, opening hours (grouped automatically), price range, logo, photo
- **Service-area businesses:** hide the street and list the areas you serve
- Social profiles (`sameAs`) and a stable `@id`
- **Live checks** while you type: errors (e.g. broken links) and recommendations (e.g. missing phone)
- One-click copy, plus links to Google's Rich Results Test and the Schema.org validator

Everything runs **in the browser**. No API key, no server, no sign-up, nothing is stored.

**Live version:** https://tools.serpnetic.cloud/local-business-schema-generator/

## Run it locally

```bash
npm install
npm run dev     # demo page at http://localhost:5173
npm test        # unit tests (Node 18+)
npm run build   # static files in dist/
```

## Use it in your own site

```js
import 'local-business-schema-generator/style.css';
import { mountSchemaTool } from 'local-business-schema-generator';

mountSchemaTool(document.getElementById('tool'));
```

Theme it by overriding the `--lbs-*` CSS variables on `.lbs`. The logic works on its own too:

```js
import { buildSchema, validate, toScriptTag } from 'local-business-schema-generator';

const data = { type: 'Plumber', name: 'Acme Plumbing', url: 'https://www.example.com/' };
validate(data);                    // { errors: [], warnings: [...] }
toScriptTag(buildSchema(data));    // <script type="application/ld+json">…</script>
```

`toScriptTag` escapes `<`, so text such as `</script>` in a field can't break out of the tag.

## Good practice

Only mark up information that is also visible on the page, and keep it in sync with the
business's Google Business Profile. Test the result with
[Google's Rich Results Test](https://search.google.com/test/rich-results).

## Licence

[MIT](LICENSE) — free to use, copy and modify. Made by [Serpnetic](https://serpnetic.com).
