# Indian PIN Coordinates

Source: [GeoNames postal-code dataset](https://download.geonames.org/export/zip/IN.zip), downloaded 2026-10-04.

Attribution: [GeoNames](https://www.geonames.org/), licensed under [Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/), as stated in the source README.

The bundled JSON is a reduced transformation of the source TSV, retaining one representative location per PIN code. The builder chooses the highest source accuracy rating, keeping the first record on ties. Postal coordinates are estimates, not exact addresses, and coverage and accuracy are not guaranteed. Users may override coordinates manually.

Regenerate with `node scripts/build-pin-index.mjs /path/to/IN.zip` from the web directory. Lookup requests only the bundled same-origin JSON; entered PIN codes are not sent to GeoNames or any geocoding API.
