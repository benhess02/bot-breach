class MainMenu extends Phaser.Scene {
    constructor() {
        super("mainMenuScene");
    }

    preload() {
    }

    create() {
        var my = this;
        var titleText = this.add.text(0, 100, "BOT BREACH", { fontSize: 148, align: "left", color: "lightblue", fontFamily: "Impact" });
        titleText.x = config.width / 2 - titleText.width / 2;
        createButton(this, "Play", config.width / 2, 500, 400, 70, 50, function() {
            my.scene.start("levelScene");
        });
        createButton(this, "Credits", config.width / 2, 600, 400, 70, 50, function() {
            my.scene.start("creditsScene");
        });
    }

    update() {
    }
}