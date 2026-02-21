// Global Variables
let uiManager = null;          // UI Manager for controls and input
let vis = null;                // Container for visualisations
let sound = null;              // p5.Sound object
let fourier;                   // p5.FFT object
let blockMidHighLowApp;        // Reference to BlockMidHighLow visualisation

// Preload Assets
function preload() {
    sound = loadSound('assets/stomper_reggae_bit.mp3');
}

// Setup
function setup() {
    createCanvas(windowWidth, windowHeight);
    background(0);

    // Instantiate FFT object for frequency analysis
    fourier = new p5.FFT();

    // Create visualisation container and add all visuals
    vis = new Visualisations();
    vis.add(new circularWaveform());
    vis.add(new beatTilesRush());
    vis.add(new raveTunnel());
    vis.add(new Spectrum());
    blockMidHighLowApp = new blockMidHighLow();
    vis.add(blockMidHighLowApp);
    vis.add(new colorBlast());
   
    // Initialize new UI Manager
    uiManager = new UIManager();
    uiManager.setup();
}

// Draw Loop
function draw() {
    background(0);

    // Draw the currently selected visualisation
    vis.selectedVisual.draw();

    // Draw the UI on top of visuals
    uiManager.draw();
}

// Mouse Interaction
function mouseClicked() {
    // First let UI Manager handle mouse presses
    if (!uiManager.mousePressed()) {
        // If the UI didn't handle it, check if the current visual has its own handler
        if (vis.selectedVisual.hasOwnProperty('mouseClicked')) {
            vis.selectedVisual.mouseClicked();
        }
    }
}

// Keyboard Interaction
function keyPressed() {
    if (keyCode === 32) { // Spacebar
        if (sound.isPlaying()) {
            sound.pause();
        } else {
            sound.loop();
        }
    }
}

// Window Resize
function windowResized() {
    // Resize canvas to new window dimensions
    resizeCanvas(windowWidth, windowHeight);

    // Let the current visualisation adjust if it supports onResize()
    if (vis.selectedVisual.hasOwnProperty('onResize')) {
        vis.selectedVisual.onResize();
    }

    // Resize the UI as well
    if (uiManager && uiManager.onResize) {
        uiManager.onResize();
    }
}