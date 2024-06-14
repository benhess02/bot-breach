const CREDITS_TEXT = `Game created by Ben Hess.

Asset packs used:
 - UI Pack (Space Expansion) from Kenny Assets
 - Top-down Shooter from Kenny Assets
`

class Credits extends Phaser.Scene {
    constructor() {
        super("creditsScene");
    }

    preload() {
    }

    create() {
        var my = this;
        this.add.text(70, 100, CREDITS_TEXT, { fontSize: 42, align: "left" });
        createButton(this, "Back", config.width / 2, 600, 400, 70, 50, function() {
            my.scene.start("mainMenuScene");
        });
    }

    update() {
    }
}