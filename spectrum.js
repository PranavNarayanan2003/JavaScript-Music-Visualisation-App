// GUI controls for the Spectrum visualizer
window.spectrumStartColor = [252, 252, 252];
window.spectrumEndColor = [17, 0, 255];
window.spectrumBarCount = 128;
window.spectrumMinBarCount = 16;
window.spectrumMaxBarCount = 256;
window.spectrumBarStep = 16;
window.smoothing = 0.8;
window.smoothingMin = 0.0;
window.smoothingMax = 0.95;
window.smoothingStep = 0.05;

window.spectrumMirrorMode = false;
window.spectrumOrientation = 'Horizontal';
window.orientationOptions = ['Horizontal', 'Vertical'];

var smoothedSpectrum = [];
var lastBarCount = 0;

//Constructor for the Spectrum visualizer
class Spectrum {
    constructor() {
        this.name = "spectrum";
        var gui;
        //SEts up the GUI for the spectrum visualizer
        this.setup = function () {
            gui = createGui('Spectrum Controls');
            gui.setPosition(width - 250, 20);

            // Add color pickers, sliders, and toggles to the GUI
            gui.addGlobals('spectrumStartColor');
            gui.addGlobals('spectrumEndColor');

            sliderRange(window.smoothingMin, window.smoothingMax, window.smoothingStep);
            gui.addGlobals('smoothing');

            sliderRange(window.spectrumMinBarCount, window.spectrumMaxBarCount, window.spectrumBarStep);
            gui.addGlobals('spectrumBarCount');

            gui.addGlobals('spectrumMirrorMode');
            gui.addGlobals('orientationOptions');

            // Initialize the array for storing smoothed data
            this.initSmoothedSpectrum();
            gui.hide();
        };
        // Initializes the smoothed spectrum array based on the current bar count
        this.initSmoothedSpectrum = function () {
            smoothedSpectrum = new Array(window.spectrumBarCount).fill(0);
            lastBarCount = window.spectrumBarCount;
        };

        this.setup();
        // Hide the GUI when the visual is not selected
        this.unselectVisual = function () {
            if (gui) {
                gui.hide();
            }
        };
        // Show the GUI when the visual is selected
        this.selectVisual = function () {
            if (gui) {
                gui.show();
                if (window.spectrumBarCount !== lastBarCount) {
                    this.initSmoothedSpectrum();
                }
            }
        };
        // Resize function to adjust GUI position
        this.onResize = function () {
            if (gui) {
                gui.setPosition(width - 250, 20);
            }
        };
        // Check if the mouse is over the GUI panel
        this.isMouseOverGui = function () {
            var overGui = false;
            if (gui && gui.prototype._panel.style.display !== 'none') {
                var gui_x = parseInt(gui.prototype._panel.style.left, 10);
                var gui_y = parseInt(gui.prototype._panel.style.top, 10);
                var gui_width = parseInt(gui.prototype._panel.clientWidth, 10);
                var gui_height = parseInt(gui.prototype._panel.clientHeight, 10);

                if (mouseX > gui_x && mouseX < gui_x + gui_width &&
                    mouseY > gui_y && mouseY < gui_y + gui_height) {
                    overGui = true;
                }
            }
            return overGui;
        };
        //Main draw loop. Analyzes audio and calls helper functions to draw the visualization
        this.draw = function () {
            push();
            var rawFullSpectrum = fourier.analyze();
            //Re-initialise if bar count has changed
            if (window.spectrumBarCount !== lastBarCount) {
                this.initSmoothedSpectrum();
            }
            //Process the raw spectrum data
            let currentProcessedSpectrum = new Array(window.spectrumBarCount).fill(0);
            let binsPerBar = Math.floor(rawFullSpectrum.length / window.spectrumBarCount);
            let totalAmplitude = 0;

            for (let i = 0; i < window.spectrumBarCount; i++) {
                // Average the amplitude of the frequency bins for the current bar
                let sum = 0;
                for (let j = 0; j < binsPerBar; j++) {
                    let binIndex = i * binsPerBar + j;
                    if (binIndex < rawFullSpectrum.length) {
                        sum += rawFullSpectrum[binIndex];
                    }
                }
                let averageAmplitude = (binsPerBar > 0) ? (sum / binsPerBar) : 0;
                // Apply smoothing using linear interpolation (lerp)
                smoothedSpectrum[i] = lerp(smoothedSpectrum[i], averageAmplitude, 1.0 - window.smoothing);
                currentProcessedSpectrum[i] = smoothedSpectrum[i];
                totalAmplitude += smoothedSpectrum[i];
            }

            // Create a background pulse effect based on the average amplitude
            let avgAmplitude = totalAmplitude / window.spectrumBarCount;
            let pulseAmount = map(avgAmplitude, 0, 150, 0, 1);
            pulseAmount = constrain(pulseAmount, 0, 1);
            let baseColor = color(0, 0, 0);
            let pulseColor = color(window.spectrumEndColor);
            let bgColor = lerpColor(baseColor, pulseColor, pulseAmount);
            background(bgColor);

            let startC = color(window.spectrumStartColor);
            let endC = color(window.spectrumEndColor);
            noStroke();

            let orientation = window.orientationOptions;

            // Draw the bars based on orientation and mirror mode
            if (window.spectrumMirrorMode) {
                let halfCount = Math.floor(window.spectrumBarCount / 2);

                for (var i = 0; i < halfCount; i++) {
                    var amplitude = currentProcessedSpectrum[i];
                    var inter = map(amplitude, 0, 255, 0, 1);
                    var finalColor = lerpColor(startC, endC, inter);
                    fill(finalColor);

                    let barSlotThickness, w_amp, h_amp, rect_h_visual, rect_w_visual;

                    if (orientation === 'Horizontal') {
                        barSlotThickness = (height / 2) / halfCount;
                        w_amp = map(amplitude, 0, 255, 0, width);
                        rect_h_visual = barSlotThickness * 0.9;
                        let y1 = i * barSlotThickness + (barSlotThickness * 0.05);
                        //Draw top bar
                        rect(0, y1, w_amp, rect_h_visual);
                        //Draw bottom (mirrored) bar
                        let y2 = height - (i * barSlotThickness) - rect_h_visual - (barSlotThickness * 0.05);
                        rect(0, y2, w_amp, rect_h_visual);
                    } else {
                        barSlotThickness = (width / 2) / halfCount;
                        h_amp = map(amplitude, 0, 255, 0, height);
                        rect_w_visual = barSlotThickness * 0.9;
                        //Draw left bar
                        let x1 = i * barSlotThickness + (barSlotThickness * 0.05);
                        rect(x1, height - h_amp, rect_w_visual, h_amp);
                        //Draw right (mirrored) bar
                        let x2 = width - (i * barSlotThickness) - rect_w_visual - (barSlotThickness * 0.05);
                        rect(x2, height - h_amp, rect_w_visual, h_amp);
                    }
                }
            } else { // No mirror mode, draw all bars normally
                for (var i = 0; i < window.spectrumBarCount; i++) {
                    var amplitude = currentProcessedSpectrum[i];
                    var inter = map(amplitude, 0, 255, 0, 1);
                    var finalColor = lerpColor(startC, endC, inter);
                    fill(finalColor);

                    let x, y, w, h, barSlotThicknessVal;

                    if (orientation === 'Horizontal') {
                        barSlotThicknessVal = height / window.spectrumBarCount;
                        x = 0;
                        y = i * barSlotThicknessVal;
                        w = map(amplitude, 0, 255, 0, width);
                        h = barSlotThicknessVal * 0.95;
                        rect(x, y + (barSlotThicknessVal * 0.025), w, h);
                    } else { // Vertical orientation
                        barSlotThicknessVal = width / window.spectrumBarCount;
                        x = i * barSlotThicknessVal;
                        y = height;
                        w = barSlotThicknessVal * 0.95;
                        h = -map(amplitude, 0, 255, 0, height);
                        rect(x + (barSlotThicknessVal * 0.025), y, w, h);
                    }
                }
            }
            pop();
        };
        // Add this new function to allow the UIManager to toggle the GUI
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
