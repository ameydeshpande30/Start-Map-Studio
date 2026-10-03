# Third-Party Notices

The root MIT license applies to application code. It does not relicense the following assets or dependencies. Full notices are shipped in `web/public/licenses` and copied into production builds. Preserve them when redistributing the app.

## Sky Catalogs

The bundled `stars.8.json`, `constellations.json`, `constellations.lines.json`, and `mw.json` are GeoJSON files supplied by [d3-celestial](https://github.com/ofrohn/d3-celestial), copyright 2015 Olaf Frohn. Its distribution carries the [BSD-3-Clause notice](web/public/licenses/d3-celestial.txt). No d3-celestial JavaScript library is included; the app uses its data files.

The files were retrieved from `https://raw.githubusercontent.com/ofrohn/d3-celestial/master/data/` on 2026-10-04 and are preserved without content changes. [Upstream source descriptions](https://github.com/ofrohn/d3-celestial/blob/master/readme.md#files) identify:

| Asset                         | Original source credited upstream                                                                                                                                                                      |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Stars                         | XHIP: An Extended Hipparcos Compilation, Anderson E. and Francis C. (2012), [VizieR V/137D](https://cdsarc.cds.unistra.fr/viz-bin/cat/V/137D)                                                          |
| Constellation names and lines | [International Astronomical Union](https://www.iau.org/public/themes/constellations/); name positions and some line modifications by Olaf Frohn; translated names from Wikipedia, as credited upstream |
| Milky Way outlines            | Milky Way Outline Catalog by Jose R. Vieira, [source cited upstream](http://www.skymap.com/milkyway_cat.htm)                                                                                           |

The upstream coordinates are converted to GeoJSON at J2000 epoch. The app displays the Latin constellation names. The BSD notice is the d3-celestial distribution notice, not a claim that the original scientific catalogs or Wikipedia content are independently MIT/BSD licensed. Refer to the original providers for their source terms when extracting or republishing the underlying datasets separately.

## Indian PIN Coordinates

`india-pins.json` is a transformed subset of the [GeoNames India postal dataset](https://download.geonames.org/export/zip/IN.zip), downloaded 2026-10-04. Attribution: [GeoNames](https://www.geonames.org/), under [Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/), as stated in its [source README](web/public/licenses/geonames-source.txt).

The transformation keeps one representative location per six-digit PIN, preferring the highest source accuracy rating. Coordinates are approximate and may be incomplete or wrong. The dataset is provided as-is, without a warranty of accuracy, timeliness, or completeness. See [PIN-SOURCE.md](web/public/data/PIN-SOURCE.md) for regeneration details. The upstream README states version 4.0 but retains an older 3.0 link; that original notice is preserved rather than silently rewritten.

## Fonts

The four bundled DejaVu fonts are DejaVu Serif (regular, bold, italic) and DejaVu Sans (regular), copied from Matplotlib's font distribution without modification. Fonts are copyright Bitstream; DejaVu changes are public domain; imported Arev glyphs are copyright Tavmjong Bah. The complete [Bitstream Vera and Arev notice](web/public/licenses/dejavu.txt) is included. [DejaVu project](https://dejavu-fonts.github.io/).

## Runtime Software

| Package                                                    | License                                    | Notice                                                                                                                                             |
| ---------------------------------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Astronomy Engine 2.1.19, Don Cross                         | MIT                                        | [astronomy-engine.txt](web/public/licenses/astronomy-engine.txt)                                                                                   |
| React, React DOM, Scheduler, Meta Platforms and affiliates | MIT                                        | [react.txt](web/public/licenses/react.txt), [react-dom.txt](web/public/licenses/react-dom.txt), [scheduler.txt](web/public/licenses/scheduler.txt) |
| Luxon 3.7.2, JS Foundation and contributors                | MIT                                        | [luxon.txt](web/public/licenses/luxon.txt)                                                                                                         |
| Lucide 1.51.0, Lucide Icons and contributors               | ISC; Feather-derived icons MIT, Cole Bemis | [lucide.txt](web/public/licenses/lucide.txt)                                                                                                       |

Exact installed versions are recorded in `web/package-lock.json`. Development-only packages are not part of the browser bundle; their own package license files still apply. Review notices when updating dependencies or assets. No endorsement by these projects or their contributors is implied.
