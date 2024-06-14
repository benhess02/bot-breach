class End extends Phaser.Scene {
    constructor() {
        super("endScene");
    }

    preload() {
    }

    create() {
        var my = this;
        
        var titleText;
        if(destroyedEnemies == totalEnemies) {
            titleText = this.add.text(0, 100, "YOU WIN", { fontSize: 148, align: "left", color: "green", fontFamily: "Impact" });
        } else {
            titleText = this.add.text(0, 100, "GAME OVER", { fontSize: 148, align: "left", color: "red", fontFamily: "Impact" });
        }
        titleText.x = config.width / 2 - titleText.width / 2;

        var scoreText = this.add.text(0, 300, destroyedEnemies + " / " + totalEnemies, { fontSize: 72, align: "left", color: "white", fontFamily: "Impact" });
        scoreText.x = config.width / 2 - scoreText.width / 2;

        createButton(this, "Play Again", config.width / 2, 500, 400, 70, 50, function() {
            my.scene.start("levelScene");
        });
        createButton(this, "Main Menu", config.width / 2, 600, 400, 70, 50, function() {
            my.scene.start("mainMenuScene");
        });
    }

    update() {
    }
}