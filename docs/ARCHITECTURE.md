# Architecture

## Data Flow

The React form stores a draft `StarmapSettings` value. Validation blocks invalid inputs from replacing the last valid preview. A 180 ms debounce and deferred update feed the shared Canvas renderer at 900 pixels wide. Export renders the valid draft on a detached canvas at 2490 x 3510, encodes PNG/JPEG, adds 300 DPI metadata, then downloads the blob.

Catalogs and fonts are same-origin static assets. India PIN data is lazy-loaded on the first lookup and cached for the page session. The PIN index chooses the highest GeoNames accuracy rating for each code, keeping the first record on ties; it is a representative point, not a postal-area boundary or exact address.

## Coordinates And Time

The settings module interprets the supplied date/time as wall time and subtracts the explicit UTC offset. The display label does not determine the offset. Coordinates use WGS84 latitude and longitude in degrees.

The astronomy module uses Astronomy Engine's J2000-equatorial-to-horizontal rotation matrix once per location/time, applying it to catalog stars and outline points. Solar-system positions are calculated separately. Refraction is disabled. Objects below the horizon are omitted.

The circular sky projection uses radial distance `(90 - altitude) / 90`, with north up and east left. The equidistant projection matches a view looking up at the sky; it is not a geographic map. The Sun altitude chooses the day/night title.

## UI State

Desktop uses a controls rail on the left and preview on the right. At widths of 800 pixels or less, Controls and Preview tabs display one panel at a time. Both panels stay mounted, retaining input values and canvas contents. Tabs support arrow keys, Home, and End.

Browser geolocation is requested on load. A manual coordinate edit or successful PIN lookup prevents a pending browser location callback from replacing that selection. Retrying browser location explicitly chooses it again. PIN input changes invalidate earlier PIN lookup responses.

## Boundaries

No server, geocoding API, persistent database, or service worker is required. Asset loading requires an HTTP(S) server rather than opening `index.html` directly. Unit coverage checks UTC offsets, geographic validation, projection, visible bodies, PIN decoding, filenames, and image-density metadata. Full scientific accuracy and reference-pixel parity are not certified by those checks.
