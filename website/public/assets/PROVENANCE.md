# Anatomy and hardware sources

The interactive participant is an illustration, not a participant scan or a recording from SAME-Limb. The model walks with the arms crossed over the chest. Its movement is a presentation animation, not a reconstruction of measured trial trajectories. Muscle shapes and trajectories are schematic.

## Human mesh
- CC0 MakeHuman / MPFB2-derived mesh distributed through NAVER anny and three.ws.
- Source: https://github.com/nirholas/three.ws/blob/main/avatar-sources/anny/README.md
- Mesh: https://raw.githubusercontent.com/nirholas/three.ws/main/public/avatars/parametric-base.glb
- License copy: /assets/anatomy/LICENSE-CC0.md
- Locally baked to a 1.7175 m illustration with a 52-bone rig. Muscles, walking, and the crossed-arm pose are custom additions. The processing script and original source remain in research/anatomy-v2. The current motion implementation is app/rig-motion.ts.

## Hardware
- Biometrics LE230: https://www.biometricsltd.com/surface-emg-sensor.htm
- 42 × 24 × 14 mm enclosure; 17 g. Dry contacts: diameter 10 mm, spacing 20 mm.
- LE230 product photo is from Biometrics Ltd; manufacturer retains image rights.
- ST AIS2IHTR: https://www.st.com/en/mems-and-sensors/ais2ih.html
- Datasheet: https://www.st.com/resource/en/datasheet/ais2ih.pdf
- IC package: 2 × 2 mm, 0.93 mm nominal height (1 mm maximum). Product illustration is from STMicroelectronics; manufacturer retains image rights.
- The custom AMG carrier board has no reported dimensions. Its approximately 6 × 5 mm footprint is estimated from paper Fig. 1 relative to LE230, not a manufacturer specification. Board thickness and mount details are illustrative.
- All device geometry uses meters. Explosion changes position and orientation. The local front-view arrangement follows paper Fig. 1(a): AMG1 above EMG, AMG2 and AMG3 on its right, and AMG4 below, numbered from top to bottom. This relationship is preserved throughout explosion; inter-device spacing is an estimate from the photograph. To identify a selected device, the website temporarily enlarges EMG to 2.2× or AMG to 5× and adds a soft glow; the physical-scale layout returns when the selection closes.

Research basis: arXiv:2608.11958v1, Fig. 1 and sections II–III; dataset v2.0.3 channels.csv. Original research figures were not modified.

## Optical motion capture
- The study used 16 NOKOV Mars2H infrared cameras, 15 markers, and 90 Hz capture; software: NOKOV XINGYING 3.4.0.3957.
- Ten named landmarks and their zero-based frozen indices are verified against SI Table S6: L.Thigh (0), L.Knee (1), L.Shank (2), L.Ankle (3), L.Toe (5), R.Thigh (9), R.Knee (10), R.Shank (11), R.Ankle (12), and R.Toe (14).
- All 3D marker coordinates and the 14 mm sphere diameter are illustrative. Five additional markers use generic pelvic/foot reference labels; their exact official labels are not established by Table S6. The illustration must not be used as a measured marker-coordinate template.
- The Motion capture view connects the verified three-marker groups directly on the moving 3D body. A selectable knee/ankle overlay shows the two segment vectors, their interior-angle arc, and marker labels. The knee definition is 180° minus this angle; the ankle retains the interior angle. The overlay is a geometric illustration, not a measured trial.

## Acquisition photographs and instructions
- /assets/paper-task-protocol.jpg contains the original embedded image bytes from Supplementary Fig. S1, PDF page 14. The website displays the complete figure at its original aspect ratio, without individual crops.
- The 16 condition descriptions are concise summaries of SI sections S4–S6 and Table S2. The source PDF remains linked for the complete operational details, including participant-height bands and box setup.
- Source: https://arxiv.org/pdf/2608.11958
- The article and SI retain their publication licenses. The dataset license is not represented as an independent license for article artwork.

## Institutional identity
- The original HUMIT Lab wordmark and HIT Shenzhen logo are used unchanged and link to the respective institution websites.
- Original assets and source verification: /assets/identity/SOURCES.md.
- Logos retain the institutions' rights and their original embedded lettering.
