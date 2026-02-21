class blockMidHighLow {
  constructor() {
    this.name = "Block Mid High Low";
    var rot = 0;
    var prog = 0;
    var gui;

    // RESPONSIBILITY 1: GUI Setup and Management (lines 27-48)
    this.setup = function () {
      //Default values for thresholds and visual properties
      rotateThresh = 60;
      progThresh = 180;
      seedThresh = 100;
      glowIntensity = 25;
      
      gui = createGui('Audio visualisation');
      gui.setPosition(width - 200, 20);
      
      sliderRange(0.001, 1, 0.001);
      gui.addGlobals('noiseStep');
      sliderRange(0, 250, 1);
      gui.addGlobals('rotateThresh');
      gui.addGlobals('progThresh');
      // ... more GUI setup
    };

    // RESPONSIBILITY 2: Audio Analysis and Visual Rendering (lines 62-70)
    this.draw = function () {
      fourier.analyze();
      let energy = fourier.getEnergy(energyBand);
      let mid = fourier.getEnergy("mid");
      let treble = fourier.getEnergy("treble");

      // RESPONSIBILITY 3: Background Color Calculation (lines 71-75)
      let bgAlpha = map(energy, 0, 255, 40, 150);
      let r = map(energy, 0, 255, 10, 80);
      let g = map(energy, 0, 255, 5, 30);
      let b = map(energy, 0, 255, 20, 100);
      background(r, g, b, bgAlpha);

      // RESPONSIBILITY 4: Calling separate visual functions
      rotatingBlocks(energy, mid);
      noiseLine(energy, treble);
    };

    // RESPONSIBILITY 5: Mouse/UI Interaction Detection (lines 76-93)
    this.isMouseOverGui = function () {
      var overGui = false;
      var gui_x = gui.prototype._panel.style.left;
      var gui_y = gui.prototype._panel.style.top;
      var gui_height = gui.prototype._panel.clientHeight;
      var gui_width = gui.prototype._panel.clientWidth;

      gui_x = parseInt(gui_x, 10);
      gui_y = parseInt(gui_y, 10);
      gui_height = parseInt(gui_height, 10);
      gui_width = parseInt(gui_width, 10);

      if (mouseX > gui_x && mouseX < gui_x + gui_width &&
        mouseY > gui_y && mouseY < gui_y + gui_height) {
        overGui = true;
      }
      return overGui;
    };

    // RESPONSIBILITY 6: Visual Effect 1 - Rotating Blocks (lines 107-162)
    function rotatingBlocks(energy, midEnergy) {
      let rotationSpeed = map(rotateThresh, 0, 250, 0, 0.1);
      rot += rotationSpeed;

      if (energy > 5 || midEnergy > 5) {
        var baseSize = map(energy, 0, 255, 20, 100);
        push();
        
        // Apply glow effect
        drawingContext.shadowBlur = glowIntensity;
        drawingContext.shadowColor = color(blockColor);
        
        // Complex drawing logic for blocks...
        for (let i = 0; i < numBlocks; i++) {
          // Shape drawing based on shapeOptions
          if (shapeOptions === 'sphere') {
            ellipse(x, 0, baseSize * scale);
          } else if (shapeOptions === 'cube') {
            rect(x, 0, baseSize * scale, baseSize * scale);
          } else if (shapeOptions === 'star') {
            drawStar(x, 0, baseSize * scale * 0.4, baseSize * scale * 0.8, 5);
          }
        }
        pop();
      }
    }

    // RESPONSIBILITY 7: Visual Effect 2 - Noise Line (lines 165-189)
    function noiseLine(energy1, energy2) {
      push();
      translate(width / 2, height / 2);
      beginShape();
      noFill();
      stroke(lineColor);
      strokeWeight(2);

      for (var i = 0; i < 100; i++) {
        var x = map(noise(i * noiseStep + prog), 0, 1, -250, 250);
        var y = map(noise(i * noiseStep + prog + 500), 0, 1, -250, 250);
        vertex(x, y);
      }
      endShape();

      if (energy1 > progThresh) {
        prog += 0.06;
      }
      if (energy2 > seedThresh) {
        noiseSeed();
      }
      pop();
    }

    // RESPONSIBILITY 8: Helper function for star shape (lines 191-203)
    function drawStar(x, y, radius1, radius2, npoints) {
      let angle = TWO_PI / npoints;
      let halfAngle = angle / 2.0;
      beginShape();
      for (let a = 0; a < TWO_PI; a += angle) {
        let sx = x + cos(a) * radius2;
        let sy = y + sin(a) * radius2;
        vertex(sx, sy);
        sx = x + cos(a + halfAngle) * radius1;
        sy = y + sin(a + halfAngle) * radius1;
        vertex(sx, sy);
      }
      endShape(CLOSE);
    }
  }
}