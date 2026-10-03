# Star Map Studio

A browser-only star map generator for a date, time, and location. Create an A4 celestial poster, preview it locally, and download a PNG or JPEG without a backend or API key.

[Source on GitHub](https://github.com/ameydeshpande30/Start-Map-Studio)

## Features

- Current date and time defaults, optional browser geolocation, and editable coordinates.
- Optional Indian PIN lookup using 19,238 bundled postal locations, with approximate coordinates and manual override.
- Explicit UTC offset and timezone label for historical or future dates.
- Night and white themes, constellation lines and names, Milky Way outlines, and visible Sun, Moon, and planets.
- Separate Controls and Preview tabs on mobile; controls on the left on desktop.
- PNG and JPEG exports at 2490 x 3510 pixels, with 300 DPI metadata.

## Quick Start

Use Node.js 22.12+ or 24+ and npm. From the repository root:

```sh
cd web
npm ci
npm run dev -- --host 127.0.0.1
```

Open the URL printed by Vite, normally http://127.0.0.1:5173. Geolocation requires permission and a secure context, such as HTTPS or localhost. If it fails, editable sample coordinates for Hyderabad are used.

## Development

Run from `web`:

```sh
npm run format
npm run format:check
npm run typecheck
npm run lint
npm test
npm run build
```

Formatting uses Prettier with the root configuration. Generated catalogs, license texts, local Python reference files, and build output are excluded. Commit the lockfile, not `node_modules` or `dist`.

## Configuration

The header source link defaults to this repository. To override it, set `VITE_GITHUB_SOURCE_URL` in `web/.env.local` using the format in `web/.env.example`, then restart Vite or rebuild. Vite environment variables are public build-time values, not a place for secrets.

Timezone offsets are explicit, not inferred from arbitrary coordinates. PIN lookup sets the offset to UTC+5:30 and the label to IST. For other locations, set the offset for the selected date yourself, including daylight-saving changes. The timezone label is display text only.

## Deploy

Pushes to `main` deploy through [the GitHub Pages workflow](.github/workflows/deploy-pages.yml). In the repository's GitHub settings, select **Pages**, then set **Source** to **GitHub Actions**. The published site is:

https://ameydeshpande30.github.io/Start-Map-Studio/

For a local production build at the same repository path:

```sh
cd web
npm ci
npm run build -- --base=/Start-Map-Studio/
```

Serve `web/dist` on any static host over HTTPS. Keep the bundled `data`, `fonts`, `licenses`, and `credits.html` files with the build. See [deployment notes](docs/DEPLOYMENT.md) for validation and hosting constraints.

## Privacy And Accuracy

Rendering and exports run in the browser. The app does not send entered dates, coordinates, or PIN codes to a geocoding service. Catalogs, fonts, and PIN data are fetched from the same host as the app; normal hosting access logs may still exist. There are no application accounts, analytics, or backend storage. Reloading resets edits.

PIN coordinates represent approximate postal areas, not an address. This is a decorative visualization, not a navigation or scientific-observation instrument. Atmospheric refraction is disabled. Preview and export share the same renderer, but exact pixel parity with the local reference has not been certified. PDF export is not supported.

## Project Structure

```text
web/src/domain/       Settings, validation, and UTC conversion
web/src/astro/        Astronomy Engine transforms and body positions
web/src/data/         Catalog loading and local PIN lookup
web/src/renderer/     Shared Canvas poster renderer
web/src/export/       Downloads and 300 DPI metadata
web/src/components/   Reusable UI controls
web/public/           Catalogs, fonts, credits, and third-party licenses
web/scripts/          Reproducible PIN index transformation
docs/                 Architecture and deployment details
```

Python reference tooling is local-only and intentionally excluded from Git. Running or building the website does not require Python.

## License And Credits

Application code is [MIT licensed](LICENSE), copyright 2026 Amey Deshpande. Bundled assets and dependencies retain their own licenses, not the application's MIT license. See [third-party notices](THIRD_PARTY_NOTICES.md) and the app's [credits page](web/public/credits.html).

Thanks to Olaf Frohn's d3-celestial project, the XHIP authors, Jose R. Vieira, GeoNames, DejaVu/Bitstream/Arev font contributors, Astronomy Engine, React, Luxon, and Lucide.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the development workflow.
