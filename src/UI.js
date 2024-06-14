function createButton(scene, text, x, y, width, height, size, cb) {
    var buttonBackground = scene.add.image(x, y, "ui", "barHorizontal_blue_mid.png");
    buttonBackground.displayWidth = width;
    buttonBackground.displayHeight = height;
    buttonBackground.setInteractive();

    scene.input.on("pointerdown", function(pointer, currentlyOver) {
        if(currentlyOver.includes(buttonBackground)) {
            cb();
        }
    });

    var buttonText = scene.add.text(0, 0, text, { fontSize: size, align: "center" });
    buttonText.x = buttonBackground.x - (buttonText.width / 2);
    buttonText.y = buttonBackground.y - (buttonText.height / 2);
    return buttonBackground;
}