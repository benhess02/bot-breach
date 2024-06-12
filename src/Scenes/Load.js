class Load extends Phaser.Scene {
    constructor() {
        super("loadScene");
    }

    preload() {
        this.load.setPath("./assets/");

        // // Load townsfolk
        // this.load.image("purple", "purple_townie.png");
        // this.load.image("blue", "blue_townie.png");

        // // Load tilemap information
        // this.load.image("tilemap_tiles", "tilemap_packed.png");                   // Packed tilemap
        // this.load.tilemapTiledJSON("three-farmhouses", "three-farmhouses.tmj");   // Tilemap in JSON

        this.load.image("tilesheet", "tilesheet.png");                   // Packed tilemap
        this.load.tilemapTiledJSON("tilemap", "tilemap.tmj");   // Tilemap in JSON

        this.load.image("robots", "robots.png");                   // Packed tilemap
        this.load.spritesheet("robots_sheet", "robots.png", {
            frameWidth: 62,
            frameHeight: 64,
            spacing: 10
        });

    }

    create() {
        

         // ...and pass to the next Scene
         this.scene.start("pathfinderScene");
    }

    // Never get here since a new scene is started in create()
    update() {
    }
}