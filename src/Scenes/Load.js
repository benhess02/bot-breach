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
            spacing: 0
        });

        this.load.image("blaster", "blaster.png");
        this.load.image("lazer", "lazer.png");

        this.load.atlasXML("ui", "ui_sheet.png", "ui_sheet.xml");

        this.load.image("health", "health.png");
    }

    create() {
        this.scene.start("mainMenuScene");
    }

    update() {
    }
}