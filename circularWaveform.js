// GUI Controls
// Global variables controlled by the GUI
window.colorPalette = 'Neon';
window.colorPaletteOptions = ['Neon', 'Sunset', 'Forest', 'Oceanic'];

// Default Neon Colors
window.barColor1 = [0, 255, 255];
window.barColor2 = [0, 191, 255];
window.glowingRingColor = [160, 32, 240];

window.particlesOn = true;
window.numBars = 200;
window.particleLifespan = 100;
window.particleSpeed = 1.5;
window.particleCurviness = 0.3;

// New: GUI control for mouse attraction
window.mouseAttraction = 0.1;

// Constructor for the CircularWaveform visualisation
function circularWaveform() {
    this.name = "Circular Waveform";
    let gui;

    // Particle System
    let particles = [];

    // State for the interaction prompt
    this.promptAlpha = 255;
    const promptFadeSpeed = 1.5;

    // Vinyl Record Colors (static)
    const vinylGoldColor = color(218, 165, 32, 230);
    const vinylGrooveColor = color(50, 40, 20, 150);
    const vinylLabelColor = color(180, 120, 20, 230);
    const vinylSpindleHoleColor = color(15, 15, 15, 255);
    const vinylLabelPlaceholderColor1 = color(240, 230, 200, 200);
    const vinylLabelPlaceholderColor2 = color(50, 40, 30, 220);

    // Vinyl Rotation
    let vinylRotationAngle = 0;

    // Setup GUI
    this.setup = function () {
        gui = createGui('Neon Waveform Controls');
        gui.setPosition(width - 250, 20);
        gui.addGlobals('colorPaletteOptions', 'particlesOn');
        sliderRange(50, 300, 10);  gui.addGlobals('numBars');
        sliderRange(20, 100, 1);   gui.addGlobals('particleLifespan');
        sliderRange(0.2, 5, 0.1);  gui.addGlobals('particleSpeed');
        sliderRange(-1.0, 1.0, 0.1); gui.addGlobals('particleCurviness');
        sliderRange(0, 0.5, 0.01); gui.addGlobals('mouseAttraction');
    };
    this.setup();
    gui.hide();

    // Handle Window Resize
    this.onResize = function () {
        if (gui) gui.setPosition(width - 250, 20);
    };
    this.onResize();

    // Visual Lifecycle
    this.selectVisual = function () {
        vinylRotationAngle = 0;
        particles = [];
        this.promptAlpha = 255; // Reset prompt visibility when selected
        if (gui) gui.show();
    };
    this.unselectVisual = function () { if (gui) gui.hide(); };
    this.toggleControls = function(show) { if (gui) (show ? gui.show() : gui.hide()); };

    // Update Colors Based on Palette Preset
    this.updateColorsFromPalette = function () {
        if (window.colorPaletteOptions == 'Sunset') {
            window.barColor1 = [252, 175, 69];
            window.barColor2 = [255, 85, 85];
            window.barColor3 = [228, 0, 120];
            window.glowingRingColor = [255, 20, 147];
        } else if (window.colorPaletteOptions == 'Forest') {
            window.barColor1 = [173, 255, 47];
            window.barColor2 = [0, 250, 154];
            window.barColor3 = [46, 139, 87];
            window.glowingRingColor = [34, 139, 34];
        } else if (window.colorPaletteOptions == 'Oceanic') {
            window.barColor1 = [0, 255, 255];
            window.barColor2 = [30, 144, 255];
            window.barColor3 = [0, 0, 205];
            window.glowingRingColor = [72, 61, 139];
        } else { // Neon (Default)
            window.barColor1 = [0, 255, 255];
            window.barColor2 = [0, 191, 255];
            window.barColor3 = [255, 0, 255];
            window.glowingRingColor = [160, 32, 240];
        }
    };

    // Draw Loop
    this.draw = function () {
        this.updateColorsFromPalette();
        const fullSpectrum = fourier.analyze();
        if (!fullSpectrum) return;

        const smallestDimension = min(width, height);
        const vinylRecordRadius = smallestDimension * 0.08;
        const glowingRingCenterRadius = smallestDimension * 0.13;
        const glowingRingThickness = smallestDimension * 0.018;
        const barStartRadius = smallestDimension * 0.145;
        const barEndMaxRadius = smallestDimension * 0.42;
        const maxPossibleBarHeightOverall = barEndMaxRadius - barStartRadius;

        push();
        translate(width / 2, height / 2);

        let vinylScaleFactor = 1;
        if (sound.isPlaying()) {
            const bassEnergy = fourier.getEnergy("bass");
            vinylScaleFactor = map(bassEnergy, 0, 255, 0.90, 1.20);
        }

        drawVinylRecord(vinylScaleFactor, vinylRecordRadius);
        drawGlowingRing(vinylScaleFactor, glowingRingCenterRadius, glowingRingThickness);
        drawSpectrumBarsAndEmitParticles(fullSpectrum, barStartRadius, maxPossibleBarHeightOverall, smallestDimension);
        updateAndDrawParticles();
        
        pop(); 

        this.drawInteractionPrompt();
    };

    // Helper function to draw the fading prompt
    this.drawInteractionPrompt = () => {
        if (this.promptAlpha > 0 && uiManager) {
            push();
            textAlign(CENTER, CENTER);
            textSize(18);
            fill(255, 255, 255, this.promptAlpha);
            const topOfBarY = height - uiManager.controlBarHeight - uiManager.bottomOffset;
            const textY = topOfBarY - 30;
            text("🖱️ Move your cursor to attract the particles", width / 2, textY);
            this.promptAlpha -= promptFadeSpeed;
            pop();
        }
    };
    
    // Particle Class
    function Particle(x, y, vx, vy, pColor, lifespan) {
        this.pos = createVector(x, y);
        this.vel = createVector(vx, vy);
        this.color = pColor;
        this.lifespan = lifespan;
        this.radius = 3.5;

        this.update = function () {
            if (window.mouseAttraction > 0) {
                const mouse = createVector(mouseX - width / 2, mouseY - height / 2);
                // --- BUG FIX: Changed pVect to p5.Vector ---
                const desired = p5.Vector.sub(mouse, this.pos).setMag(window.particleSpeed);
                const steer = p5.Vector.sub(desired, this.vel).limit(window.mouseAttraction);
                this.vel.add(steer);
            }
            this.vel.mult(0.99);
            if (window.mouseAttraction === 0 && window.particleCurviness !== 0) {
                this.vel.rotate(window.particleCurviness * 0.05);
            }
            this.pos.add(this.vel);
            this.lifespan -= 1.0;
        };

        this.draw = function () {
            noStroke();
            const alpha = map(this.lifespan, 0, window.particleLifespan, 0, 255);
            fill(red(this.color), green(this.color), blue(this.color), alpha);
            ellipse(this.pos.x, this.pos.y, this.radius * 2);
        };

        this.isDead = () => this.lifespan < 0;
    }

    // Vinyl Record Renderer
    const drawVinylRecord = (vinylScaleFactor, vinylRecordRadius) => {
        push();
        vinylRotationAngle += 0.04;
        rotate(vinylRotationAngle);
        scale(vinylScaleFactor);

        fill(vinylGoldColor); noStroke();
        ellipse(0, 0, vinylRecordRadius * 2);

        const labelOuterRadius = vinylRecordRadius * 0.45;
        const grooveZoneRadius = vinylRecordRadius * 0.88;
        if (vinylRecordRadius > 2) {
            stroke(vinylGrooveColor); strokeWeight(max(1, vinylRecordRadius * 0.02));
            noFill();
            for (let i = 0; i < 5; i++) {
                const r = map(i, 0, 4, labelOuterRadius + (vinylRecordRadius * 0.1), grooveZoneRadius);
                ellipse(0, 0, r * 2, r * 2);
            }
        }
        fill(vinylLabelColor); noStroke();
        ellipse(0, 0, labelOuterRadius * 2);

        const spindleHoleDrawRadius = vinylRecordRadius * 0.12;
        if (labelOuterRadius > 1.5) {
            push();
            fill(vinylLabelPlaceholderColor1); ellipse(0, 0, labelOuterRadius * 0.85);
            fill(vinylLabelPlaceholderColor2); ellipse(0, 0, labelOuterRadius * 0.65);
            
            // --- NEW: Add a reflective line to the vinyl label ---
            stroke(255, 255, 255, 50); // Faint, semi-transparent white
            strokeWeight(1.5);
            line(-labelOuterRadius * 0.8, 0, labelOuterRadius * 0.8, 0);
            
            pop();
        }
        fill(vinylSpindleHoleColor); ellipse(0, 0, spindleHoleDrawRadius * 2);
        pop();
    };

    // Glowing Ring Renderer
    const drawGlowingRing = (vinylScaleFactor, glowingRingCenterRadius, glowingRingThickness) => {
        const finalRingColor = color(window.glowingRingColor);
        push();
        scale(vinylScaleFactor);
        strokeWeight(glowingRingThickness);
        stroke(finalRingColor);
        drawingContext.shadowBlur = 30;
        drawingContext.shadowColor = finalRingColor;
        noFill();
        ellipse(0, 0, glowingRingCenterRadius * 2);
        drawingContext.shadowBlur = 0;
        pop();
    };

    // Spectrum Bars + Particle Emitters
    const drawSpectrumBarsAndEmitParticles = (fullSpectrum, barStartRadius, maxPossibleBarHeightOverall, smallestDimension) => {
        const relevantSpectrumLength = fullSpectrum.length * 0.75;
        const spectrumSegmentSize = floor(relevantSpectrumLength / window.numBars);

        for (let i = 0; i < window.numBars; i++) {
            const angle = map(i, 0, window.numBars, 0, TWO_PI);
            let energySum = 0;
            const startBin = i * spectrumSegmentSize;
            for (let j = 0; j < spectrumSegmentSize; j++) {
                const binIndex = startBin + j;
                if (binIndex < fullSpectrum.length) energySum += fullSpectrum[binIndex];
            }
            const energy = spectrumSegmentSize > 0 ? energySum / spectrumSegmentSize : 0;
            const colorProgress = map(i, 0, window.numBars, 0, 1);
            const c1 = color(window.barColor1), c2 = color(window.barColor2), c3 = color(window.barColor3);
            const barColor = (colorProgress < 0.5) ? lerpColor(c1, c2, colorProgress / 0.5)
                                                 : lerpColor(c2, c3, (colorProgress - 0.5) / 0.5);
            const potentialLengthFactor = map(i, 0, window.numBars, 0.6, 1.1);
            const currentMaxBarHeight = maxPossibleBarHeightOverall * potentialLengthFactor;
            const barHeight = map(energy, 0, 255, 0, currentMaxBarHeight);
            
            push();
            rotate(angle);
            stroke(barColor);
            const barStrokeWeight = map(energy, 0, 255,
                                      max(1, smallestDimension * 0.003),
                                      max(2, smallestDimension * 0.01));
            strokeWeight(barStrokeWeight);
            drawingContext.shadowBlur = 15;
            drawingContext.shadowColor = barColor;
            if (barHeight > 1) line(barStartRadius, 0, barStartRadius + barHeight, 0);
            drawingContext.shadowBlur = 0;
            pop();

            if (window.particlesOn && random(255) < energy) {
                const endX = cos(angle) * (barStartRadius + barHeight);
                const endY = sin(angle) * (barStartRadius + barHeight);
                const particleVel = p5.Vector.fromAngle(angle, random(0.8, 1.2) * window.particleSpeed);
                particles.push(new Particle(endX, endY, particleVel.x, particleVel.y, barColor, window.particleLifespan));
            }
        }
    };

    // Particle Update/Draw Manager
    const updateAndDrawParticles = () => {
        for (let i = particles.length - 1; i >= 0; i--) {
            particles[i].update();
            particles[i].draw();
            if (particles[i].isDead()) particles.splice(i, 1);
        }
    };
}