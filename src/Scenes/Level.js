var neighbors = [
    { x: 1, y: 0 }, 
    { x:-1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
    /* { x: 1, y: 1 },
    { x: 1, y: -1 },
    { x: -1, y: 1 },
    { x: -1, y: -1 } */
];

class Level extends Phaser.Scene {

    robotGroup;
    lazerGroup;

    player;
    enemies;

    wKey; aKey; sKey; dKey;

    constructor() {
        super("levelScene");
    }

    isWalkable(x, y) {
        var tile = this.groundLayer.getTileAt(x, y);
        if(!tile) return false;
        return !tile.properties.collides;
    }

    preload() {
    }

    init() {
        this.TILESIZE = 16;
        this.SCALE = 2.0;
        this.TILEWIDTH = 40;
        this.TILEHEIGHT = 25;

        this.PLAYER_SPEED = 200;
        this.LAZER_SPEED = 1000;
    }

    createRobot(baseSprite, totalHealth) {

        this.physics.world.enable(baseSprite, Phaser.Physics.Arcade.DYNAMIC_BODY);
        this.robotGroup.add(baseSprite);
        this.physics.add.collider(baseSprite, this.groundLayer);
        this.physics.add.collider(baseSprite, this.robotGroup);

        var healthBarBackground = this.add.sprite(baseSprite.x, baseSprite.y - 50, "ui", "barHorizontal_shadow_mid.png");
        healthBarBackground.displayWidth = 100;
        healthBarBackground.displayHeight = 10;

        var healthBar = this.add.sprite(baseSprite.x, baseSprite.y - 50, "ui", "barHorizontal_green_mid.png");
        healthBar.displayWidth = 100;
        healthBar.displayHeight = 10;

        var robot = {
            xVelocity: 0,
            yVelocity: 0,
            totalHealth: totalHealth,
            health: totalHealth,
            baseRotation: baseSprite.rotation,
            blasterRotation: baseSprite.rotation,
            baseSprite: baseSprite,
            blasterSprite: this.add.sprite(baseSprite.x, baseSprite.y, "blaster"),
            healthBarBackground: healthBarBackground,
            healthBar: healthBar
        }

        var scene = this;
        this.physics.world.addCollider(baseSprite, this.lazerGroup, function(ojb1, obj2) {
            scene.addHealth(robot, -1);
            obj2.destroy();
        });
        return robot;
    }

    updateRobot(robot) {
        if(robot.xVelocity != 0 || robot.yVelocity != 0) {
            var sqMag = robot.xVelocity * robot.xVelocity + robot.yVelocity * robot.yVelocity;
            if(sqMag > 1.01) {
                var mag = Math.sqrt(sqMag);
                robot.xVelocity = (robot.xVelocity / mag) * this.PLAYER_SPEED;
                robot.yVelocity = (robot.yVelocity / mag) * this.PLAYER_SPEED;
            }
            robot.baseRotation = Math.atan2(robot.yVelocity, robot.xVelocity);
        }

        var rot = robot.baseRotation - robot.baseSprite.rotation;

        if(rot > Math.PI) {
            rot -= Math.PI * 2;
        } else if(rot < -Math.PI) {
            rot += Math.PI * 2;
        }

        robot.baseSprite.body.setVelocityX(robot.xVelocity);
        robot.baseSprite.body.setVelocityY(robot.yVelocity);
        robot.baseSprite.rotation += rot / 4;

        robot.blasterSprite.x = robot.baseSprite.x;
        robot.blasterSprite.y = robot.baseSprite.y;
        robot.blasterSprite.rotation = robot.blasterRotation;

        robot.healthBar.displayWidth = (robot.health / robot.totalHealth) * 100;
        robot.healthBarBackground.x = robot.baseSprite.x;
        robot.healthBarBackground.y = robot.baseSprite.y - 50;
        robot.healthBar.x = (robot.baseSprite.x - 50) + (robot.healthBar.displayWidth / 2);
        robot.healthBar.y = robot.baseSprite.y - 50;
    }

    addHealth(robot, health) {
        robot.health += health;
        if(robot.health > robot.totalHealth) {
            robot.health = robot.totalHealth;
        }
        if(robot.health <= 0) {
            robot.health = 0;
        }
    }

    fireLazer(robot) {
        var x = robot.baseSprite.x + Math.cos(robot.blasterRotation) * 35; 
        var y = robot.baseSprite.y + Math.sin(robot.blasterRotation) * 35; 
        var lazer = this.add.sprite(x, y, "lazer");
        lazer.rotation = robot.blasterRotation;
        this.physics.world.enable(lazer, Phaser.Physics.Arcade.DYNAMIC_BODY);
        this.lazerGroup.add(lazer);
        lazer.body.setVelocityX(Math.cos(lazer.rotation) * this.LAZER_SPEED);
        lazer.body.setVelocityY(Math.sin(lazer.rotation) * this.LAZER_SPEED);
        this.physics.world.addCollider(lazer, this.robotGroup, function() {
            lazer.destroy();
        });
        this.physics.world.addCollider(lazer, this.groundLayer, function() {
            lazer.destroy();
        });
    }

    lineOfSight(x1, y1, x2, y2) {
        x1 /= this.tileset.tileWidth;
        y1 /= this.tileset.tileHeight;
        x2 /= this.tileset.tileWidth;
        y2 /= this.tileset.tileHeight;
        var m = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
        var sx = (x2 - x1) / m;
        var sy = (y2 - y1) / m;
        var d = 1;
        while(d < m) {
            var x = Math.floor(x1 + sx * d);
            var y = Math.floor(y1 + sy * d);
            var tile = this.groundLayer.getTileAt(x, y);
            if(tile) {
                if(tile.properties.collides) {
                    return false;
                }
            }
            d += 1;
        }
        return true;
    }

    updateEnemy(robot) {
        var x1 = robot.baseSprite.x;
        var y1 = robot.baseSprite.y;
        var x2 = this.player.baseSprite.x;
        var y2 = this.player.baseSprite.y;
        if(this.lineOfSight(x1, y1, x2, y2)) {
            if(!robot.active) {
                robot.blasterRotation = Math.atan2(y2 - y1, x2 - x1) + (Math.random() * 0.3 - 0.15);
            }
            if(Math.random() < 0.015) {
                robot.blasterRotation = Math.atan2(y2 - y1, x2 - x1) + (Math.random() * 0.3 - 0.15);
                this.fireLazer(robot);
            }
            robot.active = true;
        } else {
            robot.active = false;
        }
    }

    create() {
        this.map = this.add.tilemap("tilemap");

        this.tileset = this.map.addTilesetImage("tilesheet", "tilesheet");

        // Create the layers
        this.groundLayer = this.map.createLayer("Tiles", this.tileset, 0, 0);
        this.groundLayer.setCollisionByProperty({
            collides: true
        });

        this.lazerGroup = this.add.group();
        this.robotGroup = this.add.group();

        var playerSprite = this.map.createFromObjects("Player", { key: "robots_sheet", frame: 0 })[0];
        this.player = this.createRobot(playerSprite, 20);
        this.cameras.main.startFollow(playerSprite, true, 0.25, 0.25);
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.setDeadzone(50, 50);

        var enemySprites = this.map.createFromObjects("Enemies", { key: "robots_sheet", frame: 3 });
        this.enemies = [];
        for(var i = 0; i < enemySprites.length; i++) {
            this.enemies.push(this.createRobot(enemySprites[i], 10));
        }

        this.wKey = this.input.keyboard.addKey("W");
        this.aKey = this.input.keyboard.addKey("A");
        this.sKey = this.input.keyboard.addKey("S");
        this.dKey = this.input.keyboard.addKey("D");

        var scene = this;

        this.input.on("pointerdown", function() {
            scene.fireLazer(scene.player);
        });

        this.events.on("postupdate", function() {
            scene.postUpdate();
        });
    }

    postUpdate() {
        for(var i = 0; i < this.enemies.length; i++) {
            this.updateEnemy(this.enemies[i]);
        }

        this.updateRobot(this.player);
        for(var i = 0; i < this.enemies.length; i++) {
            this.updateRobot(this.enemies[i]);
            if(this.enemies[i].health == 0) {
                this.enemies[i].baseSprite.destroy();
                this.enemies[i].blasterSprite.destroy();
                this.enemies[i].healthBar.destroy();
                this.enemies[i].healthBarBackground.destroy();
                this.enemies.splice(i, 1);
                i--;
            }
        }
    }

    update() {
        this.player.xVelocity = 0;
        this.player.yVelocity = 0;
        if(this.wKey.isDown) {
            this.player.yVelocity = -this.PLAYER_SPEED;
        }
        if(this.aKey.isDown) {
            this.player.xVelocity = -this.PLAYER_SPEED;
        }
        if(this.sKey.isDown) {
            this.player.yVelocity = this.PLAYER_SPEED;
        }
        if(this.dKey.isDown) {
            this.player.xVelocity = this.PLAYER_SPEED;
        }

        var mx = this.input.mousePointer.x - config.width / 2;
        var my = this.input.mousePointer.y - config.height / 2;
        var px = this.player.baseSprite.x - (this.cameras.main.scrollX + config.width / 2);
        var py = this.player.baseSprite.y - (this.cameras.main.scrollY + config.height / 2);
        this.player.blasterRotation = Math.atan2(my - py, mx - px);
    }
}
