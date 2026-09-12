# KCH Kiosk — True 3D Interactive Prototype V3

This package contains an actual rotatable GLB model plus a browser demo.

## Files
- `KCH_Kiosk_True3D_V3.glb` — real 3D model
- `index.html` — interactive viewer and guided usage demo
- `kch-reference.png` — photoreal visual target / poster
- `screen_ui.png` — embedded KCH screen texture source
- `netlify.toml` / `render.yaml` — deploy configs

## Local preview
Run a static server in this folder, for example:
`python -m http.server 8080`
Then open `http://localhost:8080`.

## Netlify
Upload all files at repository root. No build command. Publish directory: `.`

## Render
Create Static Site from the same repository. Publish directory: `.`

## Notes
This is a concept prototype built from the frozen KCH hardware geometry. It aims to match the approved visual direction while staying light enough for browser/mobile use. It is not manufacturing-certified CAD.
