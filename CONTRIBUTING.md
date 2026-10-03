# Contributing

## Setup And Checks

Use the Node/npm versions described in the README and install with `npm ci` from `web`. Before proposing a change, run:

```sh
cd web
npm run format
npm run format:check
npm run typecheck
npm run lint
npm test
npm run build
```

Add a focused regression test for behavioral changes. Check desktop and mobile views for UI changes, including tab switching, manual coordinates, PIN errors, and both themes. For export changes, inspect downloaded dimensions and density metadata rather than relying only on the preview.

## Scope And Style

Use the existing React/TypeScript patterns and the shared renderer for preview and export. Keep astronomy calculations outside UI components. Prettier is the formatting authority; ESLint checks code quality. Keep generated data out of formatting passes.

Do not commit environment files, credentials, dependency directories, build output, personal generated posters, or the local Python reference. `VITE_` variables are public in the built app. The repository deliberately excludes the Python file and its local reference fixtures.

## Assets And Licenses

New assets must have a documented source and redistribution terms. Preserve upstream copyright and license notices. Update `THIRD_PARTY_NOTICES.md` and the deployed credits page when changing bundled assets or runtime dependencies. The original GeoNames postal data has approximate coordinates; do not present PIN results as exact addresses.

Keep pull requests focused and describe the change, motivation, checks run, and known limitations. Report incorrect map behavior with date, local time, UTC offset, latitude/longitude, and browser version. Avoid attaching personal location data publicly unless necessary and consented.
