class Level extends Phaser.Scene {

    robotGroup;

    player;
    enemies;

    wKey; aKey; sKey; dKey;

    constructor() {
        super("levelScene");
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
            robot.blasterRotation = Math.atan2(y2 - y1, x2 - x1);
            var targetXVelocity = x2 - x1;
            var targetYVelocity = y2 - y1;

            if(Math.abs(targetXVelocity) > Math.abs(targetYVelocity)) {
                robot.xVelocity = targetXVelocity > 0 ? this.PLAYER_SPEED : -this.PLAYER_SPEED;
                robot.yVelocity = 0
            } else if (Math.abs(targetXVelocity) < Math.abs(targetYVelocity)) {
                robot.xVelocity = 0;
                robot.yVelocity = targetYVelocity > 0 ? this.PLAYER_SPEED : -this.PLAYER_SPEED;
            }
        } else {
            robot.xVelocity = 0;
            robot.yVelocity = 0;
        }
    }

    create() {
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

        console.log(this.groundLayer.getTileAt(0, 0));

        // // Create grid of visible tiles for use with path planning
        // let tinyTownGrid = this.layersToGrid([this.groundLayer, this.treesLayer, this.housesLayer]);

        // let walkables = [1, 2, 3, 30, 40, 41, 42, 43, 44, 95, 13, 14, 15, 25, 26, 27, 37, 38, 39, 70, 84];

        // // Initialize EasyStar pathfinder
        // this.finder = new EasyStar.js();

        // // Pass grid information to EasyStar
        // // EasyStar doesn't natively understand what is currently on-screen,
        // // so, you need to provide it that information
        // this.finder.setGrid(tinyTownGrid);

        // // Tell EasyStar which tiles can be walked on
        // this.finder.setAcceptableTiles(walkables);

        // this.activeCharacter = my.sprite.purpleTownie;

        // // Handle mouse clicks
        // // Handles the clicks on the map to make the character move
        // // The this parameter passes the current "this" context to the
        // // function this.handleClick()
        // this.input.on('pointerup',this.handleClick, this);

        // this.cKey = this.input.keyboard.addKey('C');
        // this.lowCost = false;

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

    resetCost(tileset) {
        for (let tileID = tileset.firstgid; tileID < tileset.total; tileID++) {
            let props = tileset.getTileProperties(tileID);
            if (props != null) {
                if (props.cost != null) {
                    this.finder.setTileCost(tileID, 1);
                }
            }
        }
    }

    tileXtoWorld(tileX) {
        return tileX * this.TILESIZE;
    }

    tileYtoWorld(tileY) {
        return tileY * this.TILESIZE;
    }

    // layersToGrid
    //
    // Uses the tile layer information in this.map and outputs
    // an array which contains the tile ids of the visible tiles on screen.
    // This array can then be given to Easystar for use in path finding.
    layersToGrid() {
        let grid = [];
        // Initialize grid as two-dimensional array
        for(var y = 0; y < this.map.height; y++) {
            grid[y] = [];
        }

        // Loop over layers to find tile IDs, store in grid
        let arrayOfLayers = this.map.layers;
        for(var i = 0; i < arrayOfLayers.length; i++) {
            for(var y = 0; y < this.map.height; y++) {
                for(var x = 0; x < this.map.width; x++) {
                    var tile = arrayOfLayers[i].tilemapLayer.getTileAt(x,y);
                    if(tile) {
                        grid[y][x] = tile.index;
                    }
                }
            }
        }

        return grid;
    }


    handleClick(pointer) {
        let x = pointer.x / this.SCALE;
        let y = pointer.y / this.SCALE;
        let toX = Math.floor(x/this.TILESIZE);
        var toY = Math.floor(y/this.TILESIZE);
        var fromX = Math.floor(this.activeCharacter.x/this.TILESIZE);
        var fromY = Math.floor(this.activeCharacter.y/this.TILESIZE);
        console.log('going from ('+fromX+','+fromY+') to ('+toX+','+toY+')');
    
        this.finder.findPath(fromX, fromY, toX, toY, (path) => {
            if (path === null) {
                console.warn("Path was not found.");
            } else {
                console.log(path);
                this.moveCharacter(path, this.activeCharacter);
            }
        });
        this.finder.calculate(); // ask EasyStar to compute the path
        // When the path computing is done, the arrow function given with
        // this.finder.findPath() will be called.
    }
    
    moveCharacter(path, character) {
        // Sets up a list of tweens, one for each tile to walk, that will be chained by the timeline
        var tweens = [];
        for(var i = 0; i < path.length-1; i++){
            var ex = path[i+1].x;
            var ey = path[i+1].y;
            tweens.push({
                x: ex*this.map.tileWidth,
                y: ey*this.map.tileHeight,
                duration: 200
            });
        }
    
        this.tweens.chain({
            targets: character,
            tweens: tweens
        });

    }

    // A function which takes as input a tileset and then iterates through all
    // of the tiles in the tileset to retrieve the cost property, and then 
    // uses the value of the cost property to inform EasyStar, using EasyStar's
    // setTileCost(tileID, tileCost) function.
    setCost(tileset) {
        for (let tileID = tileset.firstgid; tileID < tileset.total; tileID++) {
            let props = tileset.getTileProperties(tileID);
            if (props != null) {
                if (props.cost != null) {
                    this.finder.setTileCost(tileID, props.cost);
                }
            }
        }
    }
}
