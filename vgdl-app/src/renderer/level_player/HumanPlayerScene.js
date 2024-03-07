import Sprite2DRenderer from "../Sprite2DRenderer";
import Phaser from "phaser";


export default class HumanPlayerScene extends Phaser.Scene{

    constructor() {
        super("HumanPlayerScene");
    }
    init = (data) => {
        this.rendererName = data.rendererName
        this.renderConfig = data.rendererConfig
        this.avatarObject = data.avatarObject
        this.grenderer = new Sprite2DRenderer(this, this.rendererName, this.renderConfig, this.avatarObject)
        this.vgdl = data.vgdl

        this.renderData = {
          objects: {},
        }
    }

    updateState = (state)=> {
        /**
         * return {
         *              'frame': this.time,
         *             'score': this.bonus_score,
         *             'ended': this.ended,
         *             'win'  : this.win,
         *             'objects': object_cur,
         *             'killed': killed,
         *             'actions': actions,
         *             'events': this.effectList,
         *             'real_time': this.real_time,
         *         };
         */
        // console.log(state)

        const newObjectIds = state.objects.map(o=>o.id)

        // this.grenderer.recenter()
        this.grenderer.beginUpdate(state.objects)

        state.objects.forEach((object) => {
            const objectTemplateName = object.name + object.renderTileId;
            if (object.id in this.renderData.objects) {
                const currentObjectData = this.renderData.objects[object.id];
                this.grenderer.updateObject(
                  currentObjectData.sprite,
                  object.name,
                  objectTemplateName,
                  object.location.x,
                  object.location.y,
                  object.orientation
                );

                this.renderData.objects[object.id] = {
                  ...currentObjectData,
                  object,
                };
              } else {
                const sprite = this.grenderer.addObject(
                  object.name,
                  objectTemplateName,
                  object.location.x,
                  object.location.y,
                  object.orientation
                );

            this.renderData.objects[object.id] = {
              object,
              sprite,
            };
      }
    });

    for (const k in this.renderData.objects) {
          const id = this.renderData.objects[k].object.id;
          if (!newObjectIds.includes(id)) {
            this.renderData.objects[k].sprite.destroy();
            delete this.renderData.objects[k];
          }
    }
    }

    preload = ()=> {
      this.input.mouse.disableContextMenu();
  
      this.loadingText = this.add.text(
        this.cameras.main.width / 2,
        this.cameras.main.height / 2,
        "Loading assets for VGDL",
        {
          fontFamily: "Droid Sans Mono",
          font: "32px",
          fill: 'WHITE',
          align: "center",
        }
      );
  
      this.loadingText.setX(this.cameras.main.width / 2);
      this.loadingText.setY(this.cameras.main.height / 2);
      this.loadingText.setOrigin(0.5, 0.5);
      if (this.grenderer) {
        this.grenderer.loadTemplates(this.vgdl.getFullState()['objects']);
      }
    }

    create = () => {
        if(this.grenderer){
            this.grenderer.init(this.gridWidth, this.gridHeight)
            this.updateState(this.vgdl.getFullState())
        }
    }

    update = (time, delta)=> {
        if(this.grenderer){
            this.currentState = this.vgdl.getFullState()
            if(this.currentState)
                this.updateState(this.currentState)
        }

    }

}