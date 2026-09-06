# SAME-Limb

**Synchronized AMG and EMG Dataset of Lower-limb Muscle Activities in Everyday Training**

Website: https://dongxutang918-afk.github.io/SAME-Limb/

- Paper: https://arxiv.org/abs/2608.11958
- Dataset: https://doi.org/10.57967/hf/9950
- Author: https://dongxutang918-afk.github.io/academic-site/
- Laboratory: https://humitlab.github.io/index.html

The English website contains an interactive 3D acquisition illustration, the original SI activity overview, concise task instructions, and benchmark/ablation charts from the released source data.

## Development and publishing

The maintained application is in `website/`. Use Node.js 22:

```sh
cd website
npm ci
npm run dev
```

Run `npm run build:pages` to generate `website/pages-export/` with the `/SAME-Limb/` URL prefix. GitHub Actions builds and publishes this artifact after changes to `website/` are pushed to `main`. GitHub Pages uses **GitHub Actions** as its source.

The original root `index.html` is retained for repository history; the Pages workflow publishes the current application artifact.

## Scientific data and assets

Numerical results follow arXiv v1 and dataset v2.0.3. The 3D human, movement, muscle geometry, and marker coordinates are illustrative. Marker groups and joint-angle definitions follow SI Table S6. Original research figures and institutional logos are retained without altering their artwork.

Website code follows the repository license. Research data and third-party assets retain their own licenses and rights; see `website/public/assets/PROVENANCE.md` and `website/public/assets/identity/SOURCES.md`.
