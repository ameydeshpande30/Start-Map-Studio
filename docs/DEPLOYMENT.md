# Deployment

## Static Hosting

Build from `web` with `npm ci` followed by `npm run build`. Publish the contents of `web/dist`. Do not publish the source directory, local environment, or Python reference. No server-side environment variables or API credentials are needed.

Use HTTPS so browser geolocation can request permission. Serve JSON, font, image, and license files normally. The app has no client-side routes requiring a rewrite rule. Host access logs are separate from the app's browser-only privacy behavior.

## Subdirectory Hosts

Vite's base path must match the host path. For this repository's GitHub Pages path:

```sh
npm run build -- --base=/Start-Map-Studio/
```

Preview the built output using `npm run preview` and open the base path. Verify the catalogs, fonts, PIN lookup, and credits links before publishing. Do not move only `index.html`; its adjacent assets are required.

## GitHub Pages

The workflow at `.github/workflows/deploy-pages.yml` validates and deploys the site after every push to `main`. It derives the Vite base path from the repository name, uploads `web/dist` as a Pages artifact, and deploys through the `github-pages` environment.

Enable it once under **Settings > Pages** by setting **Source** to **GitHub Actions**. The expected URL is `https://ameydeshpande30.github.io/Start-Map-Studio/`. A repository rename changes the workflow's build path automatically, but the source and published URL references in the documentation must be updated separately.

## Source Link

The default GitHub URL is `https://github.com/ameydeshpande30/Start-Map-Studio`. `VITE_GITHUB_SOURCE_URL` can override it at build time. Invalid URLs disable the source action. Environment values beginning with `VITE_` are visible to clients.

## Release Checklist

- Run formatting, typecheck, lint, unit tests, and the production build.
- Check Controls/Preview switching on mobile and the left-side controls rail on desktop.
- Test allowed/denied location permission, manual edits, valid/unknown PIN codes, and both themes.
- Download PNG and JPEG; verify 2490 x 3510 dimensions and 300 DPI metadata.
- Keep `credits.html`, the `licenses` directory, and source attribution notices in the deployed output.
- Ensure no Python reference, private `.env` files, credentials, generated posters, or dependency/build directories are staged.

The unit tests are not a substitute for browser download and visual checks. Scientific/reference parity is an additional validation activity, not a guaranteed release property.
