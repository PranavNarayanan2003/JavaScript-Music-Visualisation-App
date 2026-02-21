class beatTilesRush {
    constructor() {
        this.name = "Beat Tiles Rush";
        
        // Encapsulate configuration as instance properties
        this.config = {
            tileSpeed: 8,
            tileSpawnIntervalMs: 700,
            tileBaseWidth: 85,
            glowSpeed: 50,
            bassThreshold: 180,
            lowMidThreshold: 120,
            highMidThreshold: 50,
            trebleThreshold: 50,
            bassColor: [138, 43, 226],
            lowMidColor: [255, 69, 0],
            highMidColor: [255, 215, 0],
            trebleColor: [0, 255, 255]
        };
        
        this.tiles = [];
        this.particles = [];
        this.floatingScores = [];
        this.lastSpawnTime = { bass: 0, lowMid: 0, highMid: 0, treble: 0 };
        this.score = 0;
        this.gui = null;
        
        this.setup();
    }
    
    // No more resetGuiDefaults - defaults are set in constructor
    
    draw() {
        // Use this.config instead of window globals
        if (bassEnergy > this.config.bassThreshold && 
            (currentTime - this.lastSpawnTime.bass > this.config.tileSpawnIntervalMs)) {
            
            const tileW = map(bassEnergy, 0, 255, 
                this.config.tileBaseWidth * 0.8, 
                this.config.tileBaseWidth * 1.6);
            // ...
        }
    }
}