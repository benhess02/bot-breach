var totalEnemies;
var destroyedEnemies;

class Level extends Phaser.Scene {

    robotGroup;
    lazerGroup;
    healthGroup;

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
        this.ENEMY_SPEED = 100;
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
        this.physics.world.addCollider(lazer, this.groundLayer, function() {
            lazer.destroy();
        });
    }

    lineOfSight(x1, y1, x2, y2) {
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
        var x1 = robot.baseSprite.x / this.map.tileWidth;
        var y1 = robot.baseSprite.y / this.map.tileHeight;
        var x2 = this.player.baseSprite.x / this.map.tileWidth;
        var y2 = this.player.baseSprite.y / this.map.tileHeight;
        if(this.lineOfSight(x1, y1, x2, y2)) {
            if(Math.random() < 0.025) {
                robot.blasterRotation = Math.atan2(y2 - y1, x2 - x1) + (Math.random() * 0.3 - 0.15);
                this.fireLazer(robot);
            }

            if(Math.abs(robot.xVelocity) > Math.abs(robot.yVelocity)) {
                if(Math.abs(x1 - x2) < 1) {
                    robot.xVelocity = 0;
                    robot.yVelocity = y2 > y1 ? this.ENEMY_SPEED : -this.ENEMY_SPEED;
                }
            }
            else if (Math.abs(robot.xVelocity) < Math.abs(robot.yVelocity)) {
                if(Math.abs(y1 - y2) < 1) {
                    robot.xVelocity = x2 > x1 ? this.ENEMY_SPEED : -this.ENEMY_SPEED;
                    robot.yVelocity = 0;
                }
            } else if (Math.abs(x1 - x2) > Math.abs(y1 - y2)) {
                robot.xVelocity = x2 > x1 ? this.ENEMY_SPEED : -this.ENEMY_SPEED;
                robot.yVelocity = 0;
            } else {
                robot.xVelocity = 0;
                robot.yVelocity = y2 > y1 ? this.ENEMY_SPEED : -this.ENEMY_SPEED;
            }
        } else {
            robot.xVelocity = 0;
            robot.yVelocity = 0;
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
        this.healthGroup = this.add.group();

        var playerSprite = this.map.createFromObjects("Player", { key: "robots_sheet", frame: 0 })[0];
        this.player = this.createRobot(playerSprite, 20);
        this.cameras.main.startFollow(playerSprite, true, 0.25, 0.25);
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.setDeadzone(50, 50);

        this.physics.world.addCollider(playerSprite, this.healthGroup, function(ojb1, obj2) {
            scene.addHealth(scene.player, 10);
            obj2.destroy();
        });

        var enemySprites = this.map.createFromObjects("Enemies", { key: "robots_sheet", frame: 3 });
        this.enemies = [];
        for(var i = 0; i < enemySprites.length; i++) {
            this.enemies.push(this.createRobot(enemySprites[i], 20));
        }
        totalEnemies = enemySprites.length;
        destroyedEnemies = 0;

        this.wKey = this.input.keyboard.addKey("W");
        this.aKey = this.input.keyboard.addKey("A");
        this.sKey = this.input.keyboard.addKey("S");
        this.dKey = this.input.keyboard.addKey("D");

        var scene = this;

        this.input.keyboard.addKey("R").on("down", function() {
            scene.scene.start("levelScene");
        });

        this.input.on("pointerdown", function() {
            scene.fireLazer(scene.player);
        });

        this.events.on("postupdate", function(time, delta) {
            scene.postUpdate();
        });
    }

    postUpdate() {
        for(var i = 0; i < this.enemies.length; i++) {
            this.updateEnemy(this.enemies[i]);
        }

        this.updateRobot(this.player);
        if(this.player.health == 0 || destroyedEnemies == totalEnemies) {
            this.scene.start("endScene");
        }

        for(var i = 0; i < this.enemies.length; i++) {
            this.updateRobot(this.enemies[i]);
            if(this.enemies[i].health == 0) {
                var health = this.add.sprite(this.enemies[i].baseSprite.x, this.enemies[i].baseSprite.y, "health");
                this.physics.world.enable(health, Phaser.Physics.Arcade.STATIC_BODY);
                this.healthGroup.add(health);

                this.enemies[i].baseSprite.destroy();
                this.enemies[i].blasterSprite.destroy();
                this.enemies[i].healthBar.destroy();
                this.enemies[i].healthBarBackground.destroy();
                this.enemies.splice(i, 1);
                destroyedEnemies += 1;
                i--;
            }
        }
    }

    update() {
        this.player.xVelocity = 0;
        this.player.yVelocity = 0;
        if(this.wKey.isDown) {
            this.player.yVelocity = -1;
        }
        if(this.aKey.isDown) {
            this.player.xVelocity = -1;
        }
        if(this.sKey.isDown) {
            this.player.yVelocity = 1;
        }
        if(this.dKey.isDown) {
            this.player.xVelocity = 1;
        }

        if(this.player.xVelocity != 0 || this.player.yVelocity != 0) {
            var mag = Math.sqrt(this.player.xVelocity * this.player.xVelocity + this.player.yVelocity * this.player.yVelocity);
            this.player.xVelocity = (this.player.xVelocity / mag) * this.PLAYER_SPEED;
            this.player.yVelocity = (this.player.yVelocity / mag) * this.PLAYER_SPEED;
        }

        var mx = this.input.mousePointer.x - config.width / 2;
        var my = this.input.mousePointer.y - config.height / 2;
        var px = this.player.baseSprite.x - (this.cameras.main.scrollX + config.width / 2);
        var py = this.player.baseSprite.y - (this.cameras.main.scrollY + config.height / 2);
        this.player.blasterRotation = Math.atan2(my - py, mx - px);
    }
}
