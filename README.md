# tandava.trishul.re

Terminal-themed audio player. Static site (code only) + audio served from R2.
No build step, no backend, no external font/CDN requests.

## Structure
```
tandava/                  # -> Cloudflare Pages (code only, no media)
├── index.html            
├── _headers              # Cloudflare Pages security headers + CSP
└── assets/
    ├── style.css         # styles + @font-face
    ├── config.js         # AUDIO_BASE + TRACKS + player + visualizer
    └── fonts/            # self-hosted JetBrains Mono 
```

## Security posture
- **No external requests from the page** — font self-hosted; only the audio comes from R2.
- **Strict CSP**: default-src 'none'; script/style/font/img = 'self';
  media-src + connect-src = 'self' https://audio.trishul.re (exactly the R2 origin, nothing else).
  No inline css/js, so no 'unsafe-inline'.
- X-Frame-Options: DENY + frame-ancestors 'none' (anti-clickjacking),
  Referrer-Policy: no-referrer, nosniff, Permissions-Policy off for camera/mic/geo.
- Tracklist + attribution built with textContent / DOM nodes, never innerHTML on data.
