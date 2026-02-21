// ColorBlast
// features splashes, strobes, tunnel rings, spectrum BG

class colorBlast {
    constructor() {
        this.name = "Color Blast";

        // State Variables
        this.colorSplashes = []; // Active expanding splashes
        this.strobeFlashes = []; // Short-lived strobe overlays
        this.tunnelRings = []; // Depth rings flying forward
        this.energyHistory = []; // Rolling average for beat detection
        this.backgroundPulse = 0; // Sin/cos pulse for background tint
        this.lastBeatTime = 0; // Prevents too-frequent beat triggers
        this.beatCounter = 0; // Used for strobe cadence



        //  GUI Controls (updated) 
        // Direct color pickers instead of palettes
        window.bassColor = [255, 0, 100];
        window.midColor = [0, 255, 200];
        window.trebleColor = [255, 200, 0];

        window.splashSensitivity = 100; // Higher = more reactive
        window.strobeSensitivity = 55;
        window.splashSize = 80;
        window.strobeRate = 3;
        window.colorSaturation = 90;
        window.pulseSpeed = 0.1;

        //  GUI Setup 
        var gui;
        this.setup = function () {
            gui = createGui('Color Blast Controls');
            gui.setPosition(width - 280, 20);

            // Core sliders
            sliderRange(0, 200, 5); gui.addGlobals('splashSensitivity');
            sliderRange(0, 255, 5); gui.addGlobals('strobeSensitivity');
            sliderRange(30, 150, 5); gui.addGlobals('splashSize');
            sliderRange(1, 10, 1); gui.addGlobals('strobeRate');
            sliderRange(50, 100, 1); gui.addGlobals('colorSaturation');
            sliderRange(0.05, 0.3, .01); gui.addGlobals('pulseSpeed');

            //  Updated: color pickers 
            gui.addGlobals('bassColor', 'midColor', 'trebleColor');

            gui.hide();
        };
        this.setup();

        // Inner Class: ColorSplash
        // Expanding ripple with particles (single color version)
        function ColorSplash(x, y, energy, colorValue) {
            this.pos = createVector(x, y);
            this.maxRadius = map(energy, 0, 255, 20, window.splashSize * 2);
            this.currentRadius = 0;
            this.alpha = 255;
            this.color = colorValue; // Single color picker value
            this.particles = [];
            this.ringCount = floor(map(energy, 0, 255, 2, 6));

            // Spawn outward particles
            for (let i = 0; i < this.ringCount * 3; i++) {
                this.particles.push({
                    pos: this.pos.copy(),
                    vel: p5.Vector.random2D().mult(random(2, 8)),
                    life: 255,
                    size: random(3, 12)
                });
            }

            this.update = function () {
                this.currentRadius += 3;
                this.alpha = map(this.currentRadius, 0, this.maxRadius, 255, 0);

                // Update particles
                for (let p of this.particles) {
                    p.pos.add(p.vel);
                    p.vel.mult(0.96);
                    p.life -= 8;
                }
                this.particles = this.particles.filter(p => p.life > 0);
            };

            this.draw = function () {
                push();
                // Ripple rings
                for (let ring = 0; ring < this.ringCount; ring++) {
                    let ringRadius = (this.currentRadius - ring * 15) * (1 + ring * 0.1);
                    if (ringRadius > 0) {
                        let ringAlpha = this.alpha * (1 - ring * 0.2);
                        drawingContext.shadowBlur = 20;
                        drawingContext.shadowColor = `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, 0.6)`;
                        noFill();
                        stroke(this.color[0], this.color[1], this.color[2], ringAlpha);
                        strokeWeight(4 - ring * 0.5);
                        ellipse(this.pos.x, this.pos.y, ringRadius * 2);
                    }
                }
                drawingContext.shadowBlur = 0;

                // Foreground particles
                noStroke();
                for (let p of this.particles) {
                    let pAlpha = map(p.life, 0, 255, 0, 200);
                    fill(this.color[0], this.color[1], this.color[2], pAlpha);
                    ellipse(p.pos.x, p.pos.y, p.size);
                }
                pop();
            };

            this.isDead = () => this.currentRadius > this.maxRadius && this.particles.length === 0;
        }

        // ==================================================
        // Inner Class: StrobeFlash
        // Brief white overlay tied to beat events
        // ==================================================
        function StrobeFlash(intensity) {
            this.intensity = intensity;
            this.life = 255;
            this.update = () => { this.life -= 25; };
            this.draw = () => {
                push();
                fill(255, 255, 255, map(this.life, 0, 255, 0, this.intensity) * 0.3);
                rect(0, 0, width, height);
                pop();
            };
            this.isDead = () => this.life <= 0;
        }

        // ==================================================
        // Inner Class: TunnelRing
        // Perspective rings advancing towards screen
        // ==================================================
        function TunnelRing(speed, colorArray) {
            this.speed = speed;
            this.z = 1000;
            this.color = colorArray;
            this.rotation = random(TWO_PI);
            this.update = () => { this.z -= this.speed; };
            this.draw = () => {
                if (this.z > 0) {
                    push();
                    translate(width / 2, height / 2);
                    rotate(this.rotation);
                    let screenRadius = map(1000 / this.z, 0, 10, 0, width);
                    let alpha = map(this.z, 0, 1000, 255, 0);
                    stroke(this.color[0], this.color[1], this.color[2], alpha);
                    strokeWeight(map(this.z, 0, 1000, 8, 1));
                    noFill();
                    ellipse(0, 0, screenRadius * 2);
                    pop();
                }
            };
            this.isDead = () => this.z < 0;
        }

        // ---------- Main Draw Loop ----------
        this.draw = function () {
            const spectrum = fourier.analyze();
            const bassEnergy = fourier.getEnergy("bass");
            const midEnergy = fourier.getEnergy("mid");
            const trebleEnergy = fourier.getEnergy("treble");
            const totalEnergy = (bassEnergy + midEnergy + trebleEnergy) / 3;

            // Maintain rolling history for beat detection
            this.energyHistory.push(totalEnergy);
            if (this.energyHistory.length > 60) this.energyHistory.shift();
            const avgEnergy = this.energyHistory.reduce((a, b) => a + b, 0) / this.energyHistory.length;

            // Beat detection
            const isOnBeat = totalEnergy > avgEnergy * 1.3 && millis() - this.lastBeatTime > 200;
            if (isOnBeat) {
                this.lastBeatTime = millis();
                this.beatCounter++;
            }

            // Background reactive pulse
            this.backgroundPulse += window.pulseSpeed;
            let bgR = map(sin(this.backgroundPulse), -1, 1, 5, 25) + map(bassEnergy, 0, 255, 0, 20);
            let bgG = map(cos(this.backgroundPulse * 1.3), -1, 1, 0, 15) + map(midEnergy, 0, 255, 0, 15);
            let bgB = map(sin(this.backgroundPulse * 0.7), -1, 1, 10, 30) + map(trebleEnergy, 0, 255, 0, 25);
            background(bgR, bgG, bgB, 255);

            // Trigger thresholds (inverse mapping with sensitivity)
            const splashThreshold = 255 - window.splashSensitivity;
            const strobeThreshold = 255 - window.strobeSensitivity;

            // Bass splash
            if (bassEnergy > splashThreshold && bassEnergy > avgEnergy * 1.4) {
                this.colorSplashes.push(new ColorSplash(random(width), random(height), bassEnergy, window.bassColor));
            }
            // Mid splash
            if (midEnergy > splashThreshold * 0.8 && midEnergy > avgEnergy * 1.2) {
                this.colorSplashes.push(new ColorSplash(random(width), random(height), midEnergy, window.midColor));
            }
            // Strobe flash
            if (totalEnergy > strobeThreshold && isOnBeat && this.beatCounter % window.strobeRate === 0) {
                this.strobeFlashes.push(new StrobeFlash(totalEnergy));
            }

            // Tunnel rings (dominant band picks color)
            if (isOnBeat && bassEnergy > 150) {
                let ringColor = window.bassColor;
                if (midEnergy > trebleEnergy && midEnergy > bassEnergy) ringColor = window.midColor;
                else if (trebleEnergy > bassEnergy) ringColor = window.trebleColor;
                let speed = map(bassEnergy, 150, 255, 5, 20);
                this.tunnelRings.push(new TunnelRing(speed, ringColor));
            }

            // Update + draw active elements
            this.tunnelRings.forEach(r => { r.update(); r.draw(); });
            this.tunnelRings = this.tunnelRings.filter(r => !r.isDead());

            this.colorSplashes.forEach(s => { s.update(); s.draw(); });
            this.colorSplashes = this.colorSplashes.filter(s => !s.isDead());

            this.strobeFlashes.forEach(f => { f.update(); f.draw(); });
            this.strobeFlashes = this.strobeFlashes.filter(f => !f.isDead());

            // Spectrum background with adaptive alpha
            const intensity = map(totalEnergy, avgEnergy, avgEnergy * 2, 0, 1, true);
            if (intensity < 0.8) {
                this.drawSpectrumBackground(spectrum, 1 - intensity / 0.8);
            }
        };

        // ---------- Spectrum Bars Background ----------
        this.drawSpectrumBackground = function (spectrum, alphaFactor) {
            push();
            noStroke();
            let bands = 64;
            let bandWidth = width / bands;
            for (let i = 0; i < bands; i++) {
                let amp = spectrum[i];
                let h = map(amp, 0, 255, 0, height * 0.4);
                let hue = map(i, 0, bands, 200, 360);
                colorMode(HSB);
                let c = color(hue, window.colorSaturation, map(amp, 0, 255, 30, 90), alphaFactor);
                fill(c);
                rect(i * bandWidth, height - h, bandWidth, h);
            }
            colorMode(RGB);
            pop();
        };

        // ---------- Visual Lifecycle ----------
        this.selectVisual = function () {
            this.colorSplashes = [];
            this.strobeFlashes = [];
            this.tunnelRings = [];
            this.energyHistory = [];
            this.backgroundPulse = 0;
            if (gui) gui.show();
        };
        this.unselectVisual = function () { if (gui) gui.hide(); };
        this.onResize = function () { if (gui) gui.setPosition(width - 280, 20); };
        this.toggleControls = function (show) { if (gui) (show ? gui.show() : gui.hide()); };
    }
}
