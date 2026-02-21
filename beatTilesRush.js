/**
 * BeatTilesRush - 
 * - Fixes color pollution bug by resetting GUI variables on selection.
 * - Refactored to proper ES6 class syntax for consistency and clarity.
 */
class beatTilesRush {
    constructor() {
        this.name = "Beat Tiles Rush";
        this.tiles = [];
        this.particles = [];
        this.floatingScores = [];
        this.lastSpawnTime = { bass: 0, lowMid: 0, highMid: 0, treble: 0 };
        this.score = 0;
        this.gui = null;

        // Set up the GUI when the object is created
        this.setup();
    }

    // Resets all window variables to their defaults for this visualization
    resetGuiDefaults() {
        window.tileSpeed = 8;
        window.tileSpawnIntervalMs = 700;
        window.tileBaseWidth = 85;
        window.glowSpeed = 50;
        window.bassThreshold = 180;
        window.lowMidThreshold = 120;
        window.highMidThreshold = 50;
        window.trebleThreshold = 50;
        window.bassColor = [138, 43, 226];
        window.lowMidColor = [255, 69, 0];
        window.highMidColor = [255, 215, 0];
        window.trebleColor = [0, 255, 255]; // Critically resets the treble color
    }
    
    setup() {
        this.gui = createGui('Beat Tiles Rush Controls');
        this.gui.setPosition(width - 250, 20);
        
        // Set defaults before adding them to the GUI
        this.resetGuiDefaults();

        sliderRange(1, 25, 1); this.gui.addGlobals('tileSpeed');
        sliderRange(700, 1000, 10); this.gui.addGlobals('tileSpawnIntervalMs');
        sliderRange(20, 150, 5); this.gui.addGlobals('tileBaseWidth');
        sliderRange(1, 100, 1); this.gui.addGlobals('glowSpeed');
        sliderRange(50, 250, 5); this.gui.addGlobals('bassThreshold');
        sliderRange(0, 200, 5); this.gui.addGlobals('lowMidThreshold');
        sliderRange(0, 200, 5); this.gui.addGlobals('highMidThreshold');
        sliderRange(0, 200, 5); this.gui.addGlobals('trebleThreshold');
        this.gui.addGlobals('bassColor', 'lowMidColor', 'highMidColor', 'trebleColor');
        this.gui.hide();
    }

    draw() {
        const hitZoneY = height - 200;
        fourier.analyze();
        const bassEnergy = fourier.getEnergy("bass");
        const lowMidEnergy = fourier.getEnergy("lowMid");
        const highMidEnergy = fourier.getEnergy("highMid");
        const trebleEnergy = fourier.getEnergy("treble");
        const currentTime = millis();
        const laneWidth = width / 4;

        if (bassEnergy > window.bassThreshold && (currentTime - this.lastSpawnTime.bass > window.tileSpawnIntervalMs)) {
            this.lastSpawnTime.bass = currentTime;
            const tileW = map(bassEnergy, 0, 255, window.tileBaseWidth * 0.8, window.tileBaseWidth * 1.6);
            const tileH = map(bassEnergy, 0, 255, 150, 400);
            const tileX = (laneWidth * 0.5) - (tileW / 2);
            this.tiles.push(new Tile(tileX, -tileH, tileW, tileH, window.tileSpeed, color(window.bassColor), hitZoneY));
        }
        if (lowMidEnergy > window.lowMidThreshold && (currentTime - this.lastSpawnTime.lowMid > window.tileSpawnIntervalMs)) {
            this.lastSpawnTime.lowMid = currentTime;
            const tileW = map(lowMidEnergy, 0, 255, window.tileBaseWidth * 0.7, window.tileBaseWidth * 1.4);
            const tileH = map(lowMidEnergy, 0, 255, 120, 350);
            const tileX = (laneWidth * 1.5) - (tileW / 2);
            this.tiles.push(new Tile(tileX, -tileH, tileW, tileH, window.tileSpeed, color(window.lowMidColor), hitZoneY));
        }
        if (trebleEnergy > window.trebleThreshold && (currentTime - this.lastSpawnTime.treble > window.tileSpawnIntervalMs)) {
            this.lastSpawnTime.treble = currentTime;
            const tileW = map(trebleEnergy, 0, 255, window.tileBaseWidth * 0.6, window.tileBaseWidth * 1.1);
            const tileH = map(trebleEnergy, 0, 255, 80, 250);
            const tileX = (laneWidth * 3.5) - (tileW / 2);
            this.tiles.push(new Tile(tileX, -tileH, tileW, tileH, window.tileSpeed, color(window.trebleColor), hitZoneY));
        } else if (highMidEnergy > window.highMidThreshold && (currentTime - this.lastSpawnTime.highMid > window.tileSpawnIntervalMs)) {
            this.lastSpawnTime.highMid = currentTime;
            const tileW = map(highMidEnergy, 0, 255, window.tileBaseWidth * 0.7, window.tileBaseWidth * 1.3);
            const tileH = map(highMidEnergy, 0, 255, 100, 300);
            const tileX = (laneWidth * 2.5) - (tileW / 2);
            this.tiles.push(new Tile(tileX, -tileH, tileW, tileH, window.tileSpeed, color(window.highMidColor), hitZoneY));
        }

        stroke(200, 200, 200, 150);
        strokeWeight(2);
        line(0, hitZoneY, width, hitZoneY);

        for (let i = this.tiles.length - 1; i >= 0; i--) {
            const tile = this.tiles[i];
            tile.update();
            tile.draw();
            if (tile.y + tile.height >= hitZoneY) {
                const particlePosition = createVector(tile.x + tile.width / 2, hitZoneY);
                const numParticles = floor(map(bassEnergy, 0, 255, 5, 25));
                for (let j = 0; j < numParticles; j++) {
                    this.particles.push(new Particle(particlePosition, tile.glowColor));
                }
                this.score += 3;
                const scorePosition = createVector(tile.x + tile.width / 2, tile.y);
                this.floatingScores.push(new FloatingScore(scorePosition));
                this.tiles.splice(i, 1);
            }
        }
        this.particles.forEach(p => { p.update(); p.draw(); });
        this.particles = this.particles.filter(p => !p.isDead());
        this.floatingScores.forEach(fs => { fs.update(); fs.draw(); });
        this.floatingScores = this.floatingScores.filter(fs => !fs.isDead());

        push();
        textAlign(CENTER, TOP); textSize(32); fill(255);
        text('Score: ' + this.score, width / 2, 20);
        pop();
    }

    selectVisual() {
        this.resetGuiDefaults(); // Resets the global GUI variables
        this.score = 0;
        this.tiles = [];
        this.particles = [];
        this.floatingScores = [];
        if (this.gui) { this.gui.show(); }
    }

    unselectVisual() {
        if (this.gui) { this.gui.hide(); }
    }

    onResize() {
        if (this.gui) { this.gui.setPosition(width - 250, 20); }
    }

    toggleControls(show) {
        if (this.gui) {
            if (show) { this.gui.show(); } 
            else { this.gui.hide(); }
        }
    }
}

// --- Helper Classes 
class FloatingScore {
    constructor(position) {
        this.pos = position.copy();
        this.text = "+3";
        this.lifespan = 255;
    }
    update() { this.pos.y -= 0.5; this.lifespan -= 10; }
    draw() {
        push();
        textAlign(CENTER); textSize(24);
        fill(255, 255, 150, this.lifespan);
        text(this.text, this.pos.x, this.pos.y);
        pop();
    }
    isDead() { return this.lifespan < 0; }
}

class Particle {
    constructor(position, p5ColorObject) {
        this.pos = position.copy();
        this.vel = p5.Vector.random2D().mult(random(1, 4));
        this.lifespan = 255;
        this.color = p5ColorObject;
    }
    update() { this.pos.add(this.vel); this.vel.mult(0.97); this.lifespan -= 7; }
    draw() {
        push();
        noStroke();
        fill(red(this.color), green(this.color), blue(this.color), this.lifespan);
        ellipse(this.pos.x, this.pos.y, 8);
        pop();
    }
    isDead() { return this.lifespan < 0; }
}

class Tile {
    constructor(x, y, w, h, speed, glowColor, hitZoneY) {
        this.x = x; this.y = y; this.width = w; this.height = h;
        this.speed = speed; this.glowColor = glowColor; this.hitZoneY = hitZoneY;
        this.targetY = y;
    }
    update() { this.targetY += this.speed; this.y = lerp(this.y, this.targetY, 0.3); }
    draw() {
        push();
        fill(255); stroke(150); strokeWeight(1);
        rect(this.x, this.y, this.width, this.height);
        const glowDistance = map(window.glowSpeed, 1, 100, 600, 50);
        const glowZoneStartY = this.hitZoneY - glowDistance;
        const tileBottom = this.y + this.height;
        let glowProgress = (tileBottom > glowZoneStartY) ? map(tileBottom, glowZoneStartY, this.hitZoneY, 0, 1, true) : 0;
        if (glowProgress > 0) {
            const goldOverlayHeight = this.height * glowProgress;
            const overlayY = (this.y + this.height) - goldOverlayHeight;
            const ctx = drawingContext;
            const highlightColor = lerpColor(this.glowColor, color(255), 0.4);
            const gradient = ctx.createLinearGradient(this.x, overlayY, this.x, overlayY + goldOverlayHeight);
            gradient.addColorStop(0, highlightColor.toString());
            gradient.addColorStop(1, this.glowColor.toString());
            ctx.shadowBlur = glowProgress * 30;
            ctx.shadowColor = `rgba(${red(this.glowColor)}, ${green(this.glowColor)}, ${blue(this.glowColor)}, 0.7)`;
            ctx.fillStyle = gradient;
            ctx.fillRect(this.x, overlayY, this.width, goldOverlayHeight);
            ctx.shadowBlur = 0;
        }
        pop();
    }
}