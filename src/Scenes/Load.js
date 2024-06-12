class Load extends Phaser.Scene {
    constructor() {
        super("loadScene");
    }

    preload() {
        this.load.setPath("./assets/");

        this.load.image("tilesheet", "tilesheet.png");
        this.load.tilemapTiledJSON("tilemap", "tilemap.tmj");

        this.load.image("robots", "robots.png");
        this.load.spritesheet("robots_sheet", "robots.png", {
            frameWidth: 62,
            frameHeight: 64,
            spacing: 10
        });
    }

    create() {
         this.scene.start("levelScene");
    }

    update() {
    }
}