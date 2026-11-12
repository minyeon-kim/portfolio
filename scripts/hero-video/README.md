# Devsign cover film

How the film on the Devsign case cover is made. Outputs go to `public/images/devsign/hero/`.

1. **Scene.** `source/start-frame.png` is an AI-generated office scene (Figma AI, file FIGMA_FILE, node 1115:2, zoomed 1.3x) with both monitor screens pure black.
2. **Motion.** Google Flow animated that frame for 8 seconds (image to video, 24 credits): locked camera, only the hands move, screens stay black. The download is `source/flow-typing.mp4` (720p, colour matrix smpte170m).
3. **Screens.** Real recordings of the prototype at the monitor's size:
   - `UI=en node record-screen.cjs <dir>` records Merge Studio at 1920x1080 for 16 seconds (`screen-merge16-en.mp4`). `UI=ko` for Korean.
   - `UI=en W=1280 H=720 NAME=shot-code-en node shot-code.cjs <dir>` takes the Code view still.
4. **Corners.** `python -I find-screens.py source/flow-typing.mp4 quads.json` fits the two black screens.
5. **Composite.** `START=312 GRAIN=0 DIMS=0.55 WEB=1 CRF=21 NAME=hero-en python -I compose.py source/flow-typing.mp4 <screen.mp4> <code.png> quads.json <out>` writes `hero-en.mp4`, `hero-en-720.mp4` and `hero-en-poster.png`. Convert the poster to WebP for the site.

Needs ffmpeg, Python with numpy and Pillow, and Playwright from the devsign checkout.
