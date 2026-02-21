// UIManager
// - Manages the bottom control bar, playback button, progress bar, GUI toggle, and visualisation icons
// - Handles interaction (mouse clicks, hover effects) and automatically adjusts layout on resize

class UIManager {
    constructor() {
        //  Configuration
        this.controlBarHeight = 140; // Taller control bar
        this.bottomOffset = 20;      // Padding from bottom
        this.icons = [];             // Visualisation icons
        this.playbackButton = {};    // Play/Pause button
        this.progressBar = {};       // Progress bar (track time)
        this.guiToggleButton = {};   // GUI toggle button
        this.showControls = true;    // Toggle state for GUI panels

        //  Icon Setup
        const visualNames = vis.visuals.map(v => v.name);
        const iconPlaceholders = ['💿','タイル','🌀', '🎨', '🎛️', '🎆'];

        for (let i = 0; i < visualNames.length; i++) {
            this.icons.push({
                name: visualNames[i],
                x: 0, y: 0,
                size: 60,
                emoji: iconPlaceholders[i] || '❓'
            });
        }
    }

    //  Layout Setup
    setup() {
        const barCenterY = height - this.bottomOffset - this.controlBarHeight / 2;

        // Playback button (left side)
        this.playbackButton = { x: 70, y: barCenterY, size: 40 };

        // GUI toggle button (right side)
        const buttonWidth = 110, buttonHeight = 35;
        this.guiToggleButton = {
            w: buttonWidth, h: buttonHeight,
            x: width - buttonWidth - 60,
            y: barCenterY - buttonHeight / 2,
            label: "GUI Controls"
        };

        // Progress bar (left of toggle button)
        const progressBarWidth = width * 0.3;
        this.progressBar = {
            w: progressBarWidth, h: 8,
            x: this.guiToggleButton.x - progressBarWidth - 30,
            y: barCenterY,
        };

        // Icons (centered between playback and progress bar)
        const iconAreaStartX = this.playbackButton.x + 80;
        const iconAreaEndX = this.progressBar.x - 80;
        const iconAreaWidth = iconAreaEndX - iconAreaStartX;
        const spacing = iconAreaWidth / this.icons.length;

        for (let i = 0; i < this.icons.length; i++) {
            this.icons[i].x = iconAreaStartX + (spacing / 2) + (i * spacing);
            this.icons[i].y = barCenterY - 10;
        }
    }

    //  Draw
    draw() {
        this.drawControlBar();
        this.drawPlaybackControls();
        this.drawVisIcons();
        this.drawGuiToggleButton();
    }

    // Control Bar Background
    drawControlBar() {
        push();
        fill(25, 25, 25, 220); // Semi-transparent black
        noStroke();
        const barY = height - this.controlBarHeight - this.bottomOffset;
        rect(0, barY, width, this.controlBarHeight, 15, 15, 0, 0);
        stroke(180, 180, 180, 100);
        strokeWeight(1.5);
        line(0, barY, width, barY); // Top border
        pop();
    }

    // Playback Button + Progress Bar
    drawPlaybackControls() {
        // --- Play/Pause Button ---
        push();
        const pb = this.playbackButton;
        const isHover = dist(mouseX, mouseY, pb.x, pb.y) < pb.size / 2;
        const scaleFactor = isHover ? 1.15 : 1.0;

        translate(pb.x, pb.y);
        scale(scaleFactor);
        stroke(255); strokeWeight(3);
        fill(isHover ? [180, 180, 180] : [255, 255, 255]);

        if (sound.isPlaying()) {
            rect(-pb.size / 3, -pb.size / 2, pb.size / 3, pb.size);
            rect(pb.size / 6, -pb.size / 2, pb.size / 3, pb.size);
        } else {
            triangle(-pb.size / 3, -pb.size / 2, pb.size / 2, 0, -pb.size / 3, pb.size / 2);
        }
        pop();

        //  Progress Bar
        push();
        const p = this.progressBar;
        fill(100);
        rect(p.x, p.y - p.h / 2, p.w, p.h, 5);

        const progress = sound.currentTime() / sound.duration();
        fill(0, 180, 255);
        rect(p.x, p.y - p.h / 2, p.w * progress, p.h, 5);

        noStroke(); fill(255);
        textAlign(CENTER, CENTER);
        textSize(18);
        text("Stomper Reggae Bit", p.x + p.w / 2, p.y - 35);
        pop();
    }

    // Visualisation Icons
    drawVisIcons() {
        for (const icon of this.icons) {
            const isSelected = vis.selectedVisual.name === icon.name;
            const isHover = dist(mouseX, mouseY, icon.x, icon.y) < icon.size / 2;
            const scaleFactor = isHover ? 1.1 : 1.0;

            push();
            translate(icon.x, icon.y);
            scale(scaleFactor);

            if (isSelected) {
                drawingContext.shadowBlur = 25;
                drawingContext.shadowColor = 'rgb(0,220,255)';
                fill(0, 180, 255);
                noStroke(); ellipse(0, 0, icon.size + 10);
                drawingContext.shadowBlur = 0;
            } else if (isHover) {
                fill(100, 100, 100, 150);
                noStroke(); ellipse(0, 0, icon.size + 5);
            }

            textSize(icon.size * 0.7);
            textAlign(CENTER, CENTER);
            text(icon.emoji, 0, 0);
            pop();

            noStroke(); fill(255);
            textSize(14); textAlign(CENTER, TOP);
            text(icon.name, icon.x, icon.y + icon.size / 2 + 12);
        }
    }

    // GUI Toggle Button
    drawGuiToggleButton() {
        push();
        const btn = this.guiToggleButton;
        const isHover = mouseX > btn.x && mouseX < btn.x + btn.w && mouseY > btn.y && mouseY < btn.y + btn.h;

        if (this.showControls) fill(0, 180, 255);
        else if (isHover) fill(120);
        else fill(80);

        noStroke(); rect(btn.x, btn.y, btn.w, btn.h, 8);
        fill(255); textAlign(CENTER, CENTER);
        textSize(16); text(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2);
        pop();
    }

    //  Interaction
    mousePressed() {
        // Play/Pause button
        if (dist(mouseX, mouseY, this.playbackButton.x, this.playbackButton.y) < this.playbackButton.size / 2) {
            sound.isPlaying() ? sound.pause() : sound.loop();
            return true;
        }

        // GUI Toggle button
        const btn = this.guiToggleButton;
        if (mouseX > btn.x && mouseX < btn.x + btn.w && mouseY > btn.y && mouseY < btn.y + btn.h) {
            this.showControls = !this.showControls;
            if (vis.selectedVisual?.toggleControls) vis.selectedVisual.toggleControls(this.showControls);
            return true;
        }

        // Visualisation icons
        for (const icon of this.icons) {
            if (dist(mouseX, mouseY, icon.x, icon.y) < icon.size / 2) {
                vis.selectVisual(icon.name);
                if (vis.selectedVisual?.toggleControls) vis.selectedVisual.toggleControls(this.showControls);
                return true;
            }
        }

        // Progress bar (scrubbing)
        const p = this.progressBar;
        if (mouseX > p.x && mouseX < p.x + p.w && mouseY > p.y - p.h * 2 && mouseY < p.y + p.h * 2) {
            const newTime = map(mouseX, p.x, p.x + p.w, 0, sound.duration());
            sound.jump(newTime);
            return true;
        }

        return false;
    }

    //  Resize
    onResize() {
        this.setup();
    }
}