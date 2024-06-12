class Pathfinder extends Phaser.Scene {

    player;

    wKey; aKey; sKey; dKey;

    constructor() {
        super("pathfinderScene");
    }

    preload() {
    }

    init() {
        this.TILESIZE = 16;
        this.SCALE = 2.0;
        this.TILEWIDTH = 40;
        this.TILEHEIGHT = 25;

        this.PLAYER_SPEED = 200;
    }

    create() {
        // Create a new tilemap which uses 16x16 tiles, and is 40 tiles wide and 25 tiles tall
        this.map = this.add.tilemap("tilemap", this.TILESIZE, this.TILESIZE, this.TILEHEIGHT, this.TILEWIDTH);

        // Add a tileset to the map
        this.tileset = this.map.addTilesetImage("tilesheet", "tilesheet");

        // // Create the layers
        this.groundLayer = this.map.createLayer("Tiles", this.tileset, 0, 0);
        this.groundLayer.setCollisionByProperty({
            collides: true
        });

        this.player = this.map.createFromObjects("Player", { key: "robots_sheet", frame: 0 })[0];
        this.physics.world.enable(this.player, Phaser.Physics.Arcade.DYNAMIC_BODY);
        this.physics.add.collider(this.player, this.groundLayer);
        this.cameras.main.startFollow(this.player, true, 0.25, 0.25);
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

        this.wKey = this.input.keyboard.addKey("W");
        this.aKey = this.input.keyboard.addKey("A");
        this.sKey = this.input.keyboard.addKey("S");
        this.dKey = this.input.keyboard.addKey("D");

        // this.treesLayer = this.map.createLayer("Trees-n-Bushes", this.tileset, 0, 0);
        // this.housesLayer = this.map.createLayer("Houses-n-Fences", this.tileset, 0, 0);

        // // Create townsfolk sprite
        // // Use setOrigin() to ensure the tile space computations work well  
        // my.sprite.purpleTownie = this.add.sprite(this.tileXtoWorld(5), this.tileYtoWorld(5), "purple").setOrigin(0,0);
        
        // // Camera settings
        // this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        // this.cameras.main.setZoom(this.SCALE);

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

    update() {
        this.player.body.setVelocityX(0);
        this.player.body.setVelocityY(0);
        if(this.wKey.isDown) {
            this.player.body.setVelocityY(-this.PLAYER_SPEED);
        }
        if(this.aKey.isDown) {
            this.player.body.setVelocityX(-this.PLAYER_SPEED);
        }
        if(this.sKey.isDown) {
            this.player.body.setVelocityY(this.PLAYER_SPEED);
        }
        if(this.dKey.isDown) {
            this.player.body.setVelocityX(this.PLAYER_SPEED);
        }
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
