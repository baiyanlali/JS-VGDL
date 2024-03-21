// RendererBase is from https://github.com/Bam4d/Griddly/blob/develop/js/griddlyjs-app/src/renderer/Sprite2DRenderer.js


import { random } from "../core/tools";
import RendererBase from "./RendererBase";
import Phaser from "phaser"
import {BLUE, GREEN, RED, WHITE, YELLOW} from "../core/ontology/constants";


class HealthBar{
    constructor(scene, config, sprite){
        console.log("create health bar")
        this.scene = scene
        this.config = config
        this.sprite = sprite

        this.bgSprite = this.scene.add.graphics();
        this.bgSprite.fillStyle(this.config.bg.color, 1.0);
        this.bgSprite.setPosition(this.config.x - this.config.width/2, this.config.y - 10)
        this.bgSprite.fillRect(0, 0, this.config.width, this.config.height);
        this.bgSprite.setDepth(999)

        this.barSprite = this.scene.add.graphics();
        this.barSprite.fillStyle(this.config.bar.color, 1.0);
        this.barSprite.setPosition(this.config.x - this.config.width/2, this.config.y - 10)
        this.barSprite.fillRect(0, 0, this.config.width, this.config.height);
        this.barSprite.setDepth(999)

        this.sprite.on(Phaser.Core.Events.DESTROY, ()=>{
            this.destroy()
        })

    }

    setPercent = (percent) => {
        // 更新前景血条的宽度
        this.barSprite.setScale(percent, 1)
    }

    destroy = () => {
        // 销毁血条的图形对象
        this.bgSprite.destroy();
        this.barSprite.destroy();
    }
}

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

    addObject = (objectName, objectTemplateName, x, y, orientation, id, object) => {

        // console.log(`[Sprite2D Renderer] Add Sprite ${objectName}`)

        // if (objectName === "background") {
        //     return;
        // }

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

            if(object.healthPoints > 0){
                sprite.HealthBar = new HealthBar(this.scene, {
                    width: this.renderConfig.TileSize * objectTemplate.scale,
                    height: 10,
                    x: sprite.x,
                    y: sprite.y - 20, // 将血条放在精灵的上方
                    bg: {
                        color: 0x651828 // 背景颜色
                    },
                    bar: {
                        color: 0x2ecc71 // 血条颜色
                    }
                }, sprite)
            }


            sprite.setDisplaySize(
                this.renderConfig.TileSize * objectTemplate.scale,
                this.renderConfig.TileSize * objectTemplate.scale
            );
            //sprite.setOrigin(0, 0);

            // console.log(objectTemplate.color, typeof(objectTemplate.color), typeof(objectTemplate.color) === 'string'? Phaser.Display.Color.HexStringToColor(objectTemplate.color):Phaser.Display.Color.GetColor(
            //     objectTemplate.color.r * 255,
            //     objectTemplate.color.g * 255,
            //     objectTemplate.color.b * 255
            // ))

            // console.log(Phaser.Display.Color.HexStringToColor("#e61c1c").color)
            // sprite.setTint(Phaser.Display.Color.HexStringToColor("#e61c1c").color)
            // sprite.tint = 0xe61c1c
            // sprite.tint = Phaser.Display.Color.HexStringToColor("#e61c1c")

            sprite.tint = typeof(objectTemplate.color) === 'string'? Phaser.Display.Color.HexStringToColor(objectTemplate.color).color
                :
                Phaser.Display.Color.GetColor(
                objectTemplate.color.r * 255,
                objectTemplate.color.g * 255,
                objectTemplate.color.b * 255
            )
            
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
            sprite.setDepth(objectTemplate.zIdx);

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
        orientation,
        object
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

        if(sprite.HealthBar){
            sprite.HealthBar.setPercent(object.healthPoints/object.maxHealthPoints)
        }

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
        sprite.setDepth(objectTemplate.zIdx);
    };

    loadTemplates = (objects) => {
        this.scene.load.baseURL = "sprites/";

        if ("BackgroundTile" in this.renderConfig) {
            this.loadImage("__background__", this.renderConfig.BackgroundTile);
        }


        const choosable_shape = ['circle', 'triangle', 'square', "pentagon", "hexagon"]
        const choosable_color = [RED, BLUE, WHITE, GREEN, YELLOW]

        const combinations = choosable_shape.reduce((acc, shape) => {
            const shapeCombinations = choosable_color.map(color => ([ shape, color ]));
            return acc.concat(shapeCombinations);
        }, []);

        objects.forEach((object) => {


            const objectTemplate = {
                name: object.name,
                id: object.name,
                tilingMode: object.autotiling ? "AutoTiling": object.randomtiling? "RandomTiling": "None",
                scale: !object.shrinkfactor ? 1.0 : object.shrinkfactor,
                color: object.color ?? { r: 1, g: 1, b: 1 },
                zIdx: object.Z || 0,
            };
            if(object.img){
                if(object.img === "background"){
                    object.img = "oryx/backBiege"
                }else if(object.img === "avatar"){
                    object.img = "oryx/swordman1"
                }else if(object.img === "goal"){
                    object.img = "oryx/dooropen1"
                }else if(object.img === "wall"){
                    object.img = "oryx/wall1"
                }
                if(object.autotiling === true || object.randomtiling === true || object.frameRate){
                    //非常trick的解决broken的方法
                    if(!object.img.includes("_"))
                        object.img = `${object.img}_0`
                }

                if(object.img.indexOf('.png') === -1){
                    object.img = `${object.img}.png`
                }
                //if have image
                // console.info(`[Sprite2D Renderer] Add sprite ${objectTemplate.name} ${object.img}`)
                this.loadImage(objectTemplate.id, object.img);
            }else{
                //if not

                // const shape = random.choice(['circle', 'triangle', 'square', "pentagon", "hexagon"])
                const [shape, color] = random.choice(combinations)
                combinations.splice(combinations.indexOf([shape, color]))
                objectTemplate.color = color
                // console.info(`[Sprite2D Renderer] Add sprite ${objectTemplate.name} ${shape}`)
                this.loadImage(objectTemplate.id, this.getShapeImage(shape));

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
