Interactive Music Visualisation Suite

A sophisticated real-time audio visualizer that transforms sound into diverse geometric and abstract patterns. Built with p5.js, this project utilizes Fast Fourier Transform (FFT) analysis to map different frequency bands (bass, mid, treble) to visual parameters.

- Fetured Visualisations
Rave Tunnel: A pseudo-3D experience with three distinct modes: 3D Blocks, Shard Explosion, and Hex Tunnel. It reacts to bass for radius pulsing and treble for flashing.

Beat Tiles Rush: A rhythm-game inspired visualizer where tiles fall from the top of the screen synced to the beat.

Circular Waveform: A radial frequency display featuring a "vinyl record" aesthetic with particle systems that respond to specific energy levels.

Block Mid High Low: Uses Perlin noise lines and 3D primitives (spheres, cubes, stars) to represent different frequency ranges.

Color Blast: An energetic visualizer featuring expanding color splashes, strobe flashes, and depth rings triggered by beat detection.

Spectrum: A classic bar-style frequency analyzer with support for both horizontal and vertical orientations and mirrored modes.

- Technical Architecture
The project is built on a modular Object-Oriented architecture, making it easy to add new visualizations without modifying the core engine.

Core Components
Visualisations.js (Manager): Acts as a container for all visualizer objects. It handles the switching logic and ensures that only the selected visualizer is active and rendering.

Sketch.js (Engine): The main entry point that initializes the canvas, handles global assets like audio files, and runs the main p5.js draw loop.

FFT Analysis: Uses p5.FFT to analyze the audio spectrum into 1024 bins, which are then grouped into bass, mid, and treble for easier mapping.

GUI & Interactivity
Each visualization includes a dedicated Dat.GUI or custom interface, allowing users to tweak parameters in real-time, such as:

Color palettes and saturation.

Sensitivity thresholds for beat detection.

Particle lifespans and speeds.

Visualization-specific modes (e.g., Hex vs. Shard in Rave Tunnel).

- Installation & Setup
Clone the repository:

Bash
git clone https://github.com/your-username/music-vis-suite.git
Add your audio:
Place your .mp3 files in the assets/ folder.

Run locally:
Since this project fetches local assets (audio and scripts), you must run it through a local server to avoid CORS issues.

VS Code: Use the Live Server extension.

Terminal: Run npx serve or python -m http.server.

- Controls
Spacebar: Play / Pause the audio.

Mouse Click: Interact with specific visualizers (like the Circular Waveform attraction) or UI buttons.

GUI Panels: Use the sliders on the top-right to customize the current visual.

- Design Patterns Used
State Pattern: Used to manage the transition between different visualization states and modes.

Observer-like Management: The Visualisations class manages the lifecycle (setup, draw, unselect) of each visualizer.

Perlin Noise: Utilized in the blockMidHighLow visualizer to create organic, non-linear movements that feel more "natural" than pure randomness.
