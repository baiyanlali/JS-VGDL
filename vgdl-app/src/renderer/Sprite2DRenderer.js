// RendererBase is from https://github.com/Bam4d/Griddly/blob/develop/js/griddlyjs-app/src/renderer/Sprite2DRenderer.js


import { random } from "../core/tools";
import RendererBase from "./RendererBase";

class Sprite2DRenderer extends RendererBase {
    constructor(scene, rendererName, renderConfig, avatarObject, centerObjects) {
        super(scene, rendererName, renderConfig, avatarObject, centerObjects);

        this.objectTemplates = {};

        this.tileLocations = new Map();
    }

    init(gridWidth, gridHeight, container, oncollision = (a, b)=> {}) {
        super.init(gridWidth, gridHeight, container);
        this.updateBackgroundTiling({ minx: 0, miny: 0, gridWidth, gridHeight });

        // this.scene.matter.world.on('collisionstart', this.handleCollision)

        this.oncollision = oncollision
    }

    handleCollision = (collision)=> {
        collision.pairs.forEach(pair=>{
            const bodyA = pair.bodyA.label
            const bodyB = pair.bodyB.label

            this.oncollision(bodyA, bodyB)
        })
    } 

    updateBackgroundTiling = (state) => {
        return
        if ("BackgroundTile" in this.renderConfig) {
            if (this.backgroundSprite) {
                this.backgroundSprite.destroy();
            }

            this.backgroundSprite = this.scene.add.tileSprite(
                this.getCenteredX(state.minx - 0.5),
                this.getCenteredY(state.miny - 0.5),
                state.gridWidth * this.renderConfig.TileSize,
                state.gridHeight * this.renderConfig.TileSize,
                "__background__"
            );

            const backgroundSourceImage =
                this.scene.textures.get("__background__").source[0];

            this.backgroundSprite.tileScaleX =
                this.renderConfig.TileSize / backgroundSourceImage.width;
            this.backgroundSprite.tileScaleY =
                this.renderConfig.TileSize / backgroundSourceImage.height;

            if (this.container) {
                this.container.add(this.backgroundSprite);
            }

            this.backgroundSprite.setDepth(-1);
            this.backgroundSprite.setOrigin(0, 0);
        }
    };

    beginUpdate(objects, state) {
        super.beginUpdate(objects);

        this.tileLocations.clear();

        // Recalculate Grid width and height for background tiling
        objects.forEach((object) => {
            this.tileLocations.set(
                this.getObjectLocationKey(object.location.x, object.location.y),
                object.name
            );
        });

        if (state) {
            this.updateBackgroundTiling(state);
        } else {
            this.updateBackgroundTiling({
                minx: 0,
                miny: 0,
                gridWidth: this.gridWidth,
                gridHeight: this.gridHeight,
            });
        }
    }

    getObjectLocationKey = (x, y) => {
        return `${x},${y}`;
    };

    addObject = (objectName, objectTemplateName, x, y, orientation, id) => {

        // console.log(`[Sprite2D Renderer] Add Sprite ${objectName}`)

        if (objectName === "background") {
            return;
        }

        const objectTemplate = this.objectTemplates[objectTemplateName];

        let sprite;
        if(objectTemplate) {
            // console.info(`[Sprite2D Renderer] ${objectName}
            // Position: ${this.getCenteredX(x)},${this.getCenteredY(y)}
            // Scale: ${this.renderConfig.TileSize * objectTemplate.scale}, ${this.renderConfig.TileSize * objectTemplate.scale}`)


            sprite = this.scene.add.sprite(
                this.getCenteredX(x),
                this.getCenteredY(y),
                this.getTilingImage(objectTemplate, x, y),
                undefined,
                {
                    label: id,
                    scale: {
                        x: this.renderConfig.TileSize * objectTemplate.scale * 0.5,
                        y: this.renderConfig.TileSize * objectTemplate.scale * 0.5
                    }
                }
            );


            sprite.setDisplaySize(
                this.renderConfig.TileSize * objectTemplate.scale,
                this.renderConfig.TileSize * objectTemplate.scale
            );
            //sprite.setOrigin(0, 0);
            
            // sprite.setTint(typeof(objectTemplate.color) === 'string'?
            //     Phaser.Display.Color.HexStringToColor(objectTemplate.color):
            //     Phaser.Display.Color.GetColor(
            //         objectTemplate.color.r * 255,
            //         objectTemplate.color.g * 255,
            //         objectTemplate.color.b * 255
            //     )
            // );

            if (this.avatarObject !== objectName) {
                sprite.setRotation(this.getOrientationAngleRads(orientation));
            } else if (this.renderConfig.RotateAvatarImage) {
                sprite.setRotation(this.getOrientationAngleRads(orientation));
            }
            // sprite.setDepth(objectTemplate.zIdx);

            if (this.container) {
                this.container.add(sprite);
            }
        } else {
            sprite = this.scene.add.sprite(
                this.getCenteredX(x),
                this.getCenteredY(y),
                "unknown",
                undefined,
                {
                    label: id,
                    scale: {
                        x: this.renderConfig.TileSize * objectTemplate.scale * 0.8,
                        y: this.renderConfig.TileSize * objectTemplate.scale * 0.8
                    }
                }
            );

            sprite.setDisplaySize(
                this.renderConfig.TileSize,
                this.renderConfig.TileSize
            );
        }

        return sprite;
    };


    updateObject = (
        sprite,
        objectName,
        objectTemplateName,
        x,
        y,
        orientation
    ) => {

        

        // console.log("[Sprite2D Renderer] Update")
        if (!sprite) {
            return;
        }
        const objectTemplate = this.objectTemplates[objectTemplateName];

        sprite.setPosition(this.getCenteredX(x), this.getCenteredY(y));
        // sprite.setPosition(300, 200);
        sprite.setTexture(this.getTilingImage(objectTemplate, x, y));

        sprite.setDisplaySize(
            this.renderConfig.TileSize * objectTemplate.scale,
            this.renderConfig.TileSize * objectTemplate.scale
        );

        // sprite.setTint(
        //     typeof(objectTemplate.color) === 'string'?
        //     Phaser.Display.Color.HexStringToColor(objectTemplate.color):
        //     Phaser.Display.Color.GetColor(
        //         objectTemplate.color.r * 255,
        //         objectTemplate.color.g * 255,
        //         objectTemplate.color.b * 255
        //     )
        // );

        if (this.avatarObject !== objectName) {
            sprite.setRotation(this.getOrientationAngleRads(orientation));
        } else if (this.renderConfig.RotateAvatarImage) {
            sprite.setRotation(this.getOrientationAngleRads(orientation));
        }
        // sprite.setDepth(objectTemplate.zIdx);
    };

    loadTemplates = (objects) => {
        this.scene.load.baseURL = "sprites/";

        if ("BackgroundTile" in this.renderConfig) {
            this.loadImage("__background__", this.renderConfig.BackgroundTile);
        }

        const unknown_object_shape = {}

        objects.forEach((object) => {
            const objectTemplate = {
                name: object.name,
                id: object.name,
                internal: !!object.Internal,
                tilingMode: "NONE",
                scale: object.shrinkfactor === 0 ? 1.0 : object.shrinkfactor,
                color: object.color ?? { r: 1, g: 1, b: 1 },
                zIdx: object.Z || 0,
            };
            if(object.img){
                if(object.img.indexOf('.png') === -1){
                    object.img = `${object.img}.png`
                }
                //if have image
                // console.info(`[Sprite2D Renderer] Add sprite ${objectTemplate.name} ${object.img}`)
                this.loadImage(objectTemplate.id, object.img);
            }else{
                //if not
                if(unknown_object_shape.hasOwnProperty(objectTemplate.id)){

                }else{
                    const shape = random.choice(['circle', 'triangle', 'square', "pentagon", "hexagon"])
                    // console.info(`[Sprite2D Renderer] Add sprite ${objectTemplate.name} ${shape}`)
                    unknown_object_shape[objectTemplate.id] = shape
                    this.loadImage(objectTemplate.id, this.getShapeImage(shape));
                }
            }

            this.objectTemplates[objectTemplate.id] = objectTemplate;
        });


    };

    getShapeImage = (shape) => {
        switch (shape) {
          case "circle":
            return "block_shapes/circle.png";
          case "triangle":
            return "block_shapes/triangle.png";
          case "square":
            return "block_shapes/square.png";
          case "pentagon":
            return "block_shapes/pentagon.png";
          case "hexagon":
            return "block_shapes/hexagon.png";
          default:
            console.warn("Cannot find image for BLOCK_2D shape " + shape);
            return "block_shapes/square.png";
        }
      }

    getTilingImage = (objectTemplate, x, y) => {
        if (objectTemplate.tilingMode === "WALL_16") {
            const objectLeft = this.tileLocations.get(
                this.getObjectLocationKey(x - 1, y)
            );
            const objectRight = this.tileLocations.get(
                this.getObjectLocationKey(x + 1, y)
            );
            const objectUp = this.tileLocations.get(
                this.getObjectLocationKey(x, y - 1)
            );
            const objectDown = this.tileLocations.get(
                this.getObjectLocationKey(x, y + 1)
            );

            let idx = 0;
            if (objectLeft && objectLeft === objectTemplate.name) {
                idx += 1;
            }
            if (objectRight && objectRight === objectTemplate.name) {
                idx += 2;
            }
            if (objectUp && objectUp === objectTemplate.name) {
                idx += 4;
            }
            if (objectDown && objectDown === objectTemplate.name) {
                idx += 8;
            }

            return objectTemplate.id + idx;
        } else if (objectTemplate.tilingMode === "WALL_2") {
            const objectDown = this.tileLocations.get(
                this.getObjectLocationKey(x, y + 1)
            );
            let idx = 0;
            if (objectDown && objectDown === objectTemplate.name) {
                idx += 1;
            }

            return objectTemplate.id + idx;
        }

        return objectTemplate.id;
    };
}

export default Sprite2DRenderer;
