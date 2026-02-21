// raveTunnel (v5.1 — Pause Fix)
// - 3D tunnel visualisation with multiple modes
// - Cycles between Blocks, Shards, and Hex patterns and Reacts to bass (radius pulse), mid (rotation speed), treble (flash)
class raveTunnel {
  constructor() {
    this.name = "Rave Tunnel";

    // Modes
    this.modes = ["3D Blocks", "Shard Explosion", "Hex Tunnel"];
    this.currentMode = 0;
    this.lastModeChangeTime = 0;
    this.modeDuration = 12000; // ms between automatic mode switches

    // Scene State
    this.segments = [];     // Depth segments that recycle forward
    this.cameraZ = 0;       // "camera" forward motion
    this.rotationAngle = 0; // tunnel spin angle

    // Timing and Smoothing
    this._lastMs = null; // last frame timestamp
    this._rotVel = 0;    // smoothed angular velocity

    // Color Tables
    this.blockColors = [];
    this.shardColors = [];
    this.hexColors = [];

    // GUI Controls
    var gui;
    window.quality = 3;
    window.patternComplexity = 8;
    window.travelSpeed = 180;
    window.bassPulseStrength = 1.3;
    window.rotationSpeed = 0.18;
    window.trebleFlashThreshold = 200;
    window.blockColor1 = [255, 0, 127]; window.blockColor2 = [255, 105, 0];
    window.shardColor1 = [0, 191, 255]; window.shardColor2 = [75, 0, 130];
    window.hexColor1 = [0, 255, 127];  window.hexColor2 = [255, 215, 0];
    window.flashColor = [255, 255, 255];

    // Tunnel Geometry
    const tunnelDepth = 2000;
    const segmentLength = 50;
    const numSegments = tunnelDepth / segmentLength;

    // Setup
    this.setup = function () {
      gui = createGui("Rave Tunnel Controls");
      gui.setPosition(width - 260, 20);

      sliderRange(1, 5, 1);       gui.addGlobals("quality");
      sliderRange(2, 24, 2);      gui.addGlobals("patternComplexity");
      sliderRange(0, 500, 10);    gui.addGlobals("travelSpeed");
      sliderRange(1.0, 2.5, 0.05);gui.addGlobals("bassPulseStrength");
      sliderRange(0, 1.0, 0.01);  gui.addGlobals("rotationSpeed");
      sliderRange(150, 255, 5);   gui.addGlobals("trebleFlashThreshold");
      gui.addGlobals("blockColor1", "blockColor2", "shardColor1", "shardColor2",
                     "hexColor1", "hexColor2", "flashColor");

      for (let i = 0; i < numSegments; i++) {
        this.segments.push({ z: i * segmentLength, noiseSeed: random(1000) });
      }
    };
    this.setup();
    gui.hide();

    // Helper: Project and Recycle Segments
    const recycleAndProject = (segment, bass) => {
      let zRelative = segment.z - this.cameraZ;
      if (zRelative < 0) {
        segment.z += tunnelDepth;
        segment.noiseSeed = random(1000);
        zRelative = segment.z - this.cameraZ;
      }
      const scale = map(zRelative, 0, tunnelDepth, 2, 0);
      const baseRadius = width * 0.45;
      const pulse = map(bass, 0, 255, 1.0, window.bassPulseStrength);
      const r = baseRadius * scale * pulse;
      return { r, scale };
    };

    // Helper: Precompute Gradient Colors
    this.precomputeColors = () => {
      this.blockColors = []; this.shardColors = []; this.hexColors = [];
      const cBlock1 = color(window.blockColor1), cBlock2 = color(window.blockColor2);
      const cShard1 = color(window.shardColor1), cShard2 = color(window.shardColor2);
      const cHex1 = color(window.hexColor1),     cHex2 = color(window.hexColor2);
      for (let i = 0; i < numSegments; i++) {
        const t = i / (numSegments - 1);
        this.blockColors.push(lerpColor(cBlock1, cBlock2, t));
        this.shardColors.push(lerpColor(cShard1, cShard2, t));
        this.hexColors.push(lerpColor(cHex1, cHex2, t));
      }
    };

    // Draw Loop
    this.draw = () => {
      if (!sound.isPlaying()) return; // Pause fix

      fourier.analyze();
      const bass   = fourier.getEnergy("bass");
      const mid    = fourier.getEnergy("mid");
      const treble = fourier.getEnergy("treble");

      const nowMs = millis();
      if (this._lastMs == null) this._lastMs = nowMs;
      let dtMs = Math.min(nowMs - this._lastMs, 64);
      this._lastMs = nowMs;
      const dtSec = dtMs / 1000;

      if (nowMs - this.lastModeChangeTime > this.modeDuration) {
        this.currentMode = (this.currentMode + 1) % this.modes.length;
        this.lastModeChangeTime = nowMs;
      }

      const speed = map(bass, 0, 255, window.travelSpeed, window.travelSpeed * 4);
      this.cameraZ += speed * dtSec;

      const targetRotVel = window.rotationSpeed * map(mid, 0, 255, 0.5, 2);
      this._rotVel = lerp(this._rotVel, targetRotVel, 0.15);
      this.rotationAngle += this._rotVel * dtSec;

      background(0);
      push();
      translate(width / 2, height / 2);
      this.renderSymmetryLayer(window.patternComplexity, bass, treble);
      pop();
    };

    // Render Symmetry Layer
    this.renderSymmetryLayer = (symmetry, bass, treble) => {
      const safeSym = Math.max(2, Math.floor(Number(symmetry) || 2));
      const angleStep = TWO_PI / safeSym;
      for (let i = 0; i < safeSym; i++) {
        push();
        rotate(angleStep * i);
        if (i % 2 === 1) scale(1, -1);
        this.drawQuadrant(bass, treble, safeSym);
        pop();
      }
    };

    // Draw Quadrant
    this.drawQuadrant = (bass, treble, symmetry) => {
      switch (this.modes[this.currentMode]) {
        case "3D Blocks":      drawMode3DBlocks(bass, treble, symmetry); break;
        case "Shard Explosion":drawModeShardExplosion(bass, treble, symmetry); break;
        case "Hex Tunnel":     drawModeHexTunnel(bass, treble, symmetry); break;
      }
    };

    // Mode: 3D Blocks
    const cFlash = color(window.flashColor);
    const drawMode3DBlocks = (bass, treble, symmetry) => {
      const isTrebleBeat = treble > window.trebleFlashThreshold;
      for (let i = 0; i < this.segments.length; i++) {
        const { r, scale } = recycleAndProject(this.segments[i], bass);
        if (scale < 0.1) continue;
        const c = isTrebleBeat ? cFlash : this.blockColors[i];
        const maxBlocks = map(window.quality, 1, 5, 8, 12);
        const numBlocks = floor(map(scale, 0, 2, 2, maxBlocks));
        for (let j = 0; j < numBlocks; j++) {
          const angle = map(j, 0, numBlocks, 0, TWO_PI / symmetry);
          const x = r * cos(angle + this.rotationAngle);
          const y = r * sin(angle + this.rotationAngle);
          draw3DBlock(x, y, scale * 25, angle + this.rotationAngle, c);
        }
      }
    };

    // Mode: Shard Explosion
    const drawModeShardExplosion = (bass, treble, symmetry) => {
      const isTrebleBeat = treble > window.trebleFlashThreshold;
      for (let i = 0; i < this.segments.length; i++) {
        const { r, scale } = recycleAndProject(this.segments[i], bass);
        if (scale < 0.05) continue;
        const c = isTrebleBeat ? cFlash : this.shardColors[i];
        const maxShards = map(window.quality, 1, 5, 15, 25);
        const numShards = floor(map(scale, 0, 2, 4, maxShards));
        for (let j = 0; j < numShards; j++) {
          const angle = map(j, 0, numShards, 0, TWO_PI / symmetry);
          const x = r * cos(angle - this.rotationAngle);
          const y = r * sin(angle - this.rotationAngle);
          drawShard(x, y, scale * 1.5, angle - this.rotationAngle, c, this.segments[i].noiseSeed + j);
        }
      }
    };

    // Mode: Hex Tunnel
    const drawModeHexTunnel = (bass, treble, symmetry) => {
      const isTrebleBeat = treble > window.trebleFlashThreshold;
      for (let i = 0; i < this.segments.length; i++) {
        const { r, scale } = recycleAndProject(this.segments[i], bass);
        if (scale < 0.1) continue;
        const c = isTrebleBeat ? cFlash : this.hexColors[i];
        const maxHex = map(window.quality, 1, 5, 6, 10);
        const numHex = floor(map(scale, 0, 2, 2, maxHex));
        for (let j = 0; j < numHex; j++) {
          const angle = map(j, 0, numHex, 0, TWO_PI / symmetry);
          const x = r * cos(angle + this.rotationAngle * 0.5);
          const y = r * sin(angle + this.rotationAngle * 0.5);
          drawHexagon(x, y, scale * 20, angle, c);
        }
      }
    };

    // Shape Renderer: 3D Block
    const draw3DBlock = (x, y, size, angle, c) => {
      push();
      translate(x, y); rotate(angle); scale(size); noStroke();
      if (window.quality < 3) {
        stroke(0, 150); strokeWeight(0.15); fill(c);
        rect(-0.5, -0.8, 1, 1.6);
      } else {
        const darkC = color(red(c) * 0.6, green(c) * 0.6, blue(c) * 0.6);
        const midC  = color(red(c) * 0.8, green(c) * 0.8, blue(c) * 0.8);
        fill(darkC);
        beginShape(); vertex(0, -1); vertex(0.5, -0.8); vertex(0.5, 0.8); vertex(0, 1); endShape(CLOSE);
        fill(midC);
        beginShape(); vertex(0, -1); vertex(-0.5, -0.8); vertex(0, -0.6); vertex(0.5, -0.8); endShape(CLOSE);
        fill(c);
        rect(-0.5, -0.8, 1, 1.6);
      }
      pop();
    };

    // Shape Renderer: Shard
    const drawShard = (x, y, size, angle, c, noiseSeed) => {
      push();
      translate(x, y); rotate(angle); scale(size); noStroke(); fill(c);
      const nf = 20;
      const v1x = 15 + sin(noiseSeed) * nf;
      const v1y = -15 + cos(noiseSeed * 0.7) * nf;
      const v2x = 40 + sin(noiseSeed * 1.3) * nf;
      const v3x = 15 + cos(noiseSeed * 2.1) * nf;
      const v3y = 15 + sin(noiseSeed * 1.8) * nf;
      beginShape(); vertex(0, 0); vertex(v1x, v1y); vertex(v2x, 0); vertex(v3x, v3y); endShape(CLOSE);
      pop();
    };

    // Shape Renderer: Hexagon
    const drawHexagon = (x, y, radius, angle, c) => {
      push();
      translate(x, y); rotate(angle);
      stroke(c); strokeWeight(radius * 0.1); noFill();
      beginShape();
      for (let a = 0; a < TWO_PI; a += PI / 3) {
        vertex(cos(a) * radius, sin(a) * radius);
      }
      endShape(CLOSE);
      pop();
    };

    // Lifecycle
    this.onResize = () => { if (gui) gui.setPosition(width - 260, 20); };

    this.selectVisual = () => {
      this.cameraZ = 0; this.rotationAngle = 0; this.currentMode = 0;
      this.lastModeChangeTime = millis();
      this._lastMs = null; this._rotVel = 0;
      this.segments = [];
      for (let i = 0; i < numSegments; i++) {
        this.segments.push({ z: i * segmentLength, noiseSeed: random(1000) });
      }
      this.precomputeColors();
      if (gui) gui.show();
    };

    this.unselectVisual = () => { if (gui) gui.hide(); };
    this.toggleControls = (show) => { if (gui) (show ? gui.show() : gui.hide()); };
  }
}
