// RendererBase is from https://github.com/Bam4d/Griddly/blob/develop/js/griddlyjs-app/src/renderer/Sprite2DRenderer.js


import { random } from "../core/tools";
import RendererBase from "./RendererBase";
import Phaser from "phaser";

class Sprite2DRenderer extends RendererBase {
    constructor(scene, rendererName, renderConfig, avatarObject, centerObjects) {
        super(scene, rendererName, renderConfig, avatarObject, centerObjects);

        this.objectTemplates = {};

        this.tileLocations = new Map();
    }

    init(gridWidth, gridHeight, container) {
        super.init(gridWidth, gridHeight, container);

        this.updateBackgroundTiling({ minx: 0, miny: 0, gridWidth, gridHeight });
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

    addObject = (objectName, objectTemplateName, x, y, orientation) => {

        console.log(`[Sprite2DRenderer] Add Sprite ${objectName}`)

        if (objectName === "background") {
            return;
        }

        const objectTemplate = this.objectTemplates[objectTemplateName];

        let sprite;
        if(objectTemplate) {
            console.log(`[Sprite2D Renderer] ${this.getCenteredX(x)},${this.getCenteredY(y)}`)
            sprite = this.scene.add.sprite(
                this.getCenteredX(x),
                this.getCenteredY(y),
                this.getTilingImage(objectTemplate, x, y)
            );


            sprite.setDisplaySize(
                this.renderConfig.TileSize * objectTemplate.scale,
                this.renderConfig.TileSize * objectTemplate.scale
            );
            //sprite.setOrigin(0, 0);
            
            sprite.setTint(objectTemplate.color instanceof String?
                Phaser.Display.Color.HexStringToColor(objectTemplate.color):
                Phaser.Display.Color.GetColor(
                    objectTemplate.color.r * 255,
                    objectTemplate.color.g * 255,
                    objectTemplate.color.b * 255
                )
            );

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
                "unknown"
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

        sprite.setTint(
            objectTemplate.color instanceof String?
            Phaser.Display.Color.HexStringToColor(objectTemplate.color):
            Phaser.Display.Color.GetColor(
                objectTemplate.color.r * 255,
                objectTemplate.color.g * 255,
                objectTemplate.color.b * 255
            )
        );

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

        objects.forEach((object) => {
            const objectTemplate = {
                name: object.name,
                id: object.name + object.ID,
                internal: object.Internal ? true : false,
                tilingMode: "NONE",
                scale: object.shrinkfactor === 0 ? 1.0 : object.shrinkfactor,
                color: object.color ?? { r: 1, g: 1, b: 1 },
                zIdx: object.Z || 0,
            };
            if(object.image){
                //if have image
                this.loadImage(objectTemplate.id, object.image);
            }else{
                //if not
                this.loadImage(objectTemplate.id, 
                    this.getShapeImage(random.choice(['circle', 'triangle', 'square'])));
            }

            this.objectTemplates[objectTemplate.id] = objectTemplate;
        });

        this.scene.load.image("alien", "oryx/alien1.png");
        const sprite = this.scene.add.sprite(
            200,
            300,
            "aline"
        );
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
