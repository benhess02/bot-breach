var neighbors = [
    { x: 1, y: 0 }, 
    { x:-1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
    { x: 1, y: 1 },
    { x: 1, y: -1 },
    { x: -1, y: 1 },
    { x: -1, y: -1 }
];

class Level extends Phaser.Scene {

    distanceMapCache;

    robotGroup;

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

    getDistanceMap(targetX, targetY) {
        targetX = Math.floor(targetX);
        targetY = Math.floor(targetY);
        if(this.distanceMapCache[targetX] !== undefined) {
            if(this.distanceMapCache[targetX][targetY] !== undefined) {
                return this.distanceMapCache[targetX][targetY];
            }
        }

        console.log(targetX + ", " + targetY);

        var distanceMap = [];
        for(var y = 0; y < this.map.height; y++) {
            var row = [];
            for(var x = 0; x < this.map.width; x++) {
                row.push(Infinity);
            }
            distanceMap.push(row);
        }
        distanceMap[targetX][targetY] = 0;

        var explored = [];
        for(var y = 0; y < this.map.height; y++) {
            var row = [];
            for(var x = 0; x < this.map.width; x++) {
                row.push(false);
            }
            explored.push(row);
        }

        var fringe = [{ x: targetX, y: targetY }];
        while(fringe.length > 0) {
            var nextFringe = [];
            for(var i = 0; i < fringe.length; i++) {
                explored[fringe[i].x][fringe[i].y] = true;
                for(var j = 0; j < neighbors.length; j++) {
                    var nextX = fringe[i].x + neighbors[j].x;
                    var nextY = fringe[i].y + neighbors[j].y;
                    if(this.isWalkable(nextX, nextY)) {
                        var step = (neighbors[j].x != 0 && neighbors[j].y != 0) ? Math.sqrt(2) : 1;
                        var nextDist = distanceMap[fringe[i].x][fringe[i].y] + step;
                        if(nextDist < distanceMap[nextX][nextY]) {
                            distanceMap[nextX][nextY] = nextDist;
                        }
                        if(!explored[nextX][nextY]) {
                            explored[nextX][nextY] = true;
                            nextFringe.push({ x: nextX, y: nextY });
                        }
                    }
                }
            }
            fringe = nextFringe;
        }

        if(this.distanceMapCache[targetX] == undefined) {
            this.distanceMapCache[targetX] = [];
        }
        this.distanceMapCache[targetX][targetY] = distanceMap;

        return distanceMap;
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

    createRobot(baseSprite) {
        this.physics.world.enable(baseSprite, Phaser.Physics.Arcade.DYNAMIC_BODY);
        this.physics.add.collider(baseSprite, this.groundLayer);
        this.robotGroup.add(baseSprite);
        this.physics.add.collider(baseSprite, this.robotGroup);
        return {
            xVelocity: 0,
            yVelocity: 0,
            oldXVelocity: 0,
            oldYVelcoity: 0,
            baseRotation: baseSprite.rotation,
            blasterRotation: baseSprite.rotation,
            baseSprite: baseSprite,
            blasterSprite: this.add.sprite(baseSprite.x, baseSprite.y, "blaster")
        }
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
    }

    fireLazer(robot) {
        var x = robot.baseSprite.x + Math.cos(robot.blasterRotation) * 35; 
        var y = robot.baseSprite.y + Math.sin(robot.blasterRotation) * 35; 
        var lazer = this.add.sprite(x, y, "lazer");
        lazer.rotation = robot.blasterRotation;
        this.physics.world.enable(lazer, Phaser.Physics.Arcade.DYNAMIC_BODY);
        lazer.body.setVelocityX(Math.cos(lazer.rotation) * this.LAZER_SPEED);
        lazer.body.setVelocityY(Math.sin(lazer.rotation) * this.LAZER_SPEED);
        this.physics.world.addCollider(lazer, this.groundLayer, function() {
            lazer.destroy();
        });
        this.physics.world.addCollider(lazer, this.robotGroup, function() {
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
            robot.active = true;
            robot.lastSeenX = x2;
            robot.lastSeenY = y2;
            robot.blasterRotation = Math.atan2(y2 - y1, x2 - x1);
        }

        if(robot.active) {
            var targetXVelocity = robot.lastSeenX - x1;
            var targetYVelocity = robot.lastSeenY - y1;

            if(Math.abs(targetXVelocity) > Math.abs(targetYVelocity)) {
                robot.xVelocity = targetXVelocity > 0 ? this.PLAYER_SPEED : -this.PLAYER_SPEED;
                robot.yVelocity = 0
            } else if (Math.abs(targetXVelocity) < Math.abs(targetYVelocity)) {
                robot.xVelocity = 0;
                robot.yVelocity = targetYVelocity > 0 ? this.PLAYER_SPEED : -this.PLAYER_SPEED;
            }
        }
    }

    create() {

        this.distanceMapCache = [];

        this.map = this.add.tilemap("tilemap");

        this.tileset = this.map.addTilesetImage("tilesheet", "tilesheet");

        // // Create the layers
        this.groundLayer = this.map.createLayer("Tiles", this.tileset, 0, 0);
        this.groundLayer.setCollisionByProperty({
            collides: true
        });

        this.robotGroup = this.add.group();

        var playerSprite = this.map.createFromObjects("Player", { key: "robots_sheet", frame: 0 })[0];
        this.player = this.createRobot(playerSprite);
        this.cameras.main.startFollow(playerSprite, true, 0.25, 0.25);
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.setDeadzone(50, 50);

        var enemySprites = this.map.createFromObjects("Enemies", { key: "robots_sheet", frame: 3 });
        this.enemies = [];
        for(var i = 0; i < enemySprites.length; i++) {
            this.enemies.push(this.createRobot(enemySprites[i]));
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
        }
    }

    update() {
        this.getDistanceMap(this.player.baseSprite.x / this.map.tileWidth, this.player.baseSprite.y / this.map.tileHeight);
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
