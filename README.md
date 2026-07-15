# tandava.trishul.re

Terminal-themed audio player. Static site (code only) + audio served from R2.
No build step, no backend, no external font/CDN requests.

## Structure
```
tandava/                  # -> Cloudflare Pages (code only, no media)
├── index.html            # markup only — no inline css/js (so CSP can be strict)
├── _headers              # Cloudflare Pages security headers + CSP
└── assets/
    ├── style.css         # styles + @font-face
    ├── config.js         # AUDIO_BASE + TRACKS + player + visualizer
    └── fonts/            # self-hosted JetBrains Mono (OFL)

audio.trishul.re          # -> R2 bucket (the mp3 files live here)
├── aghori-tantrik-amavasya-tapasya.mp3
├── za7zay-divine-flame.mp3
└── ...
```

## Adding tracks
1. Upload the mp3 to the R2 bucket bound to https://audio.trishul.re
2. Add an entry to the `TRACKS` array in `assets/config.js` — note it takes `file`
   (just the filename); the full URL is built from `AUDIO_BASE`:
```js
{ title: "Amavasya Tapasya", artist: "Aghori Tantrik", bpm: 180,
  file: "aghori-tantrik-amavasya-tapasya.mp3",
  license: "CC BY-NC-SA", source: "Ektoplazm" }
```
The license / source / artist fields auto-populate the CC attribution block.

## R2 setup (one-time)
1. Create an R2 bucket, connect a custom domain -> `audio.trishul.re` (Cloudflare does the DNS).
2. Set the bucket CORS policy so the visualizer can read raw audio samples:
   ```json
   [{ "AllowedOrigins": ["https://tandava.trishul.re"],
      "AllowedMethods": ["GET"],
      "AllowedHeaders": ["*"] }]
   ```
   Use the exact origin — NOT `*`. Wildcard would let any site pull your audio.
3. Upload the mp3s.

## Deploy the site (Cloudflare Pages)
Connect the repo, framework preset **None**, build command empty, output dir = root.
Cloudflare reads `_headers` automatically. Add DNS: CNAME `tandava` -> your Pages domain.
The repo stays light — code only, no binaries, no history bloat.

## Security posture
- **No external requests from the page** — font self-hosted; only the audio comes from R2.
- **Strict CSP**: default-src 'none'; script/style/font/img = 'self';
  media-src + connect-src = 'self' https://audio.trishul.re (exactly the R2 origin, nothing else).
  No inline css/js, so no 'unsafe-inline'.
- X-Frame-Options: DENY + frame-ancestors 'none' (anti-clickjacking),
  Referrer-Policy: no-referrer, nosniff, Permissions-Policy off for camera/mic/geo.
- Tracklist + attribution built with textContent / DOM nodes, never innerHTML on data.

## Notes
- Devanagari glyphs fall back to the OS font (JetBrains Mono has no Devanagari). Harmless.
- Licence is Creative Commons **non-commercial** — keep both subdomains ad-free / unmonetised
  or the NC term breaks. Confirm each release's exact licence on its Ektoplazm download page.
