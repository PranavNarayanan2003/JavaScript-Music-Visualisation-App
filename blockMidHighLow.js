//GUI CONTROLS
var rotateThresh;
var progThresh;
var seedThresh;
var energyBand = 'bass';
var energyBandOptions = ['bass', 'mid', 'treble'];
var shapeType = 'sphere';
var shapeOptions = ['sphere', 'cube', 'star'];
var blockColor = [245, 180, 0];
var lineColor = [0, 255, 225];
var noiseStep = 0.01;
var glowIntensity;

//constructor for the Block Mid High Low visualization
class blockMidHighLow {
  constructor() {

    this.name = "Block Mid High Low";
    var rot = 0;
    var prog = 0;
    var gui;


    this.setup = function () {
      //Default values for thresholds and visual properties
      rotateThresh = 60;
      progThresh = 180;
      seedThresh = 100;
      glowIntensity = 25;
      //Options to the global scope for GUI library
      window.energyBand = energyBand;
      window.energyBandOptions = energyBandOptions;
      window.shapeOptions = shapeOptions;

      gui = createGui('Audio visualisation');
      gui.setPosition(width - 200, 20);

      //Add sliders and color pickers to the GUI
      sliderRange(0.001, 1, 0.001);
      gui.addGlobals('noiseStep');
      sliderRange(0, 250, 1);
      gui.addGlobals('rotateThresh');
      gui.addGlobals('progThresh');
      sliderRange(0, 250, 1);
      gui.addGlobals('seedThresh');
      sliderRange(0, 50, 1);
      gui.addGlobals('glowIntensity');
      gui.addGlobals('blockColor');
      gui.addGlobals('lineColor');
      gui.addGlobals('energyBandOptions');
      gui.addGlobals('shapeOptions');

    };
    this.setup();
    gui.hide();
    // Resize function to adjust GUI position
    this.onResize = function () {
      if (gui) gui.setPosition(width - 250, 20);
    };
    this.onResize();

    //Main draw loop. Analyzes audio and calls helper functions to draw the visualization
    this.draw = function () {
      fourier.analyze();
      let energy = fourier.getEnergy(energyBand);
      let mid = fourier.getEnergy("mid");
      let treble = fourier.getEnergy("treble");

      // Set background color based on energy levels
      let bgAlpha = map(energy, 0, 255, 40, 150);
      let r = map(energy, 0, 255, 10, 80);
      let g = map(energy, 0, 255, 5, 30);
      let b = map(energy, 0, 255, 20, 100);
      background(r, g, b, bgAlpha);

      //Draw the two main visual components
      rotatingBlocks(energy, mid);
      noiseLine(energy, treble);
    };

    // Function to check if the mouse is over the GUI panel
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

    //Hides the GUI when the visualization is no longer selected
    this.unselectVisual = function () {
      gui.hide();

    };
    //Shows the GUI when the visualization is selected
    this.selectVisual = function () {
      gui.show();
    };


    //Draws the rotating blocks based on the energy levels
    //Uses the global variables to determine the shape and color of the blocks
    function rotatingBlocks(energy, midEnergy) {
      let rotationSpeed = map(rotateThresh, 0, 250, 0, 0.1);
      rot += rotationSpeed;

      if (energy > 5 || midEnergy > 5) {
        var baseSize = map(energy, 0, 255, 20, 100);

        push();

        // Apply a glow effect using the canvas rendering context
        drawingContext.shadowBlur = glowIntensity;
        drawingContext.shadowColor = color(blockColor);

        ellipseMode(CENTER);
        translate(width / 2, height / 2);
        rotate(rot);
        noStroke();
        //Determine the number and spacing of blocks based on energy level
        let spacingMultiplier = 1.5;
        let numBlocks = int(map(energy, 0, 255, 4, 20));
        numBlocks = constrain(numBlocks, 4, 20);
        let incr = (width / (numBlocks - 1)) * spacingMultiplier;
        let totalWidth = incr * (numBlocks - 1);
        let xOffset = -totalWidth / 2;

        for (let i = 0; i < numBlocks; i++) {
          let depthFactor = abs(i - (numBlocks - 1) / 2);
          let scale = map(depthFactor, 0, (numBlocks - 1) / 2, 1.2, 0.6);
          let x = i * incr + xOffset;

          fill(blockColor);

          //Draw the selected shape
          if (shapeOptions === 'sphere') {
            ellipse(x, 0, baseSize * scale);
          } else if (shapeOptions === 'cube') {
            rectMode(CENTER);
            rect(x, 0, baseSize * scale, baseSize * scale);
          } else if (shapeOptions === 'star') {
            drawStar(x, 0, baseSize * scale * 0.4, baseSize * scale * 0.8, 5);
          }
        }

        // Reset the shadow properties so other elements aren't affected
        drawingContext.shadowBlur = 0;
        pop();
      }
    }

    //Draws a noise line based on the energy levels
    function noiseLine(energy1, energy2) {
      push();
      translate(width / 2, height / 2);

      //start drawing of the noise line
      beginShape();
      noFill();
      stroke(lineColor);
      strokeWeight(2);

      //get the noise value
      for (var i = 0; i < 100; i++) {
        var x = map(noise(i * noiseStep + prog), 0, 1, -250, 250);
        var y = map(noise(i * noiseStep + prog + 500), 0, 1, -250, 250);
        vertex(x, y);
      }
      endShape();

      // Progress the noise animation if energy exceeds a threshold
      if (energy1 > progThresh) {
        prog += 0.06;
      }
      //Reset the noise seed if another energy threshold is met
      if (energy2 > seedThresh) {
        noiseSeed();
      }
      pop();
    }
    // Draws a star shape at the specified position
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
    // Allow the UIManager to toggle the GUI
    this.toggleControls = function (show) {
      if (gui) {
        if (show) {
          gui.show();
        } else {
          gui.hide();
        }
      }
    };
  }
}