import Sprite2DRenderer from "../Sprite2DRenderer";
import Phaser from "phaser";


export default class HumanPlayerScene extends Phaser.Scene{

    constructor() {
        super("HumanPlayerScene");
    }

    init = (data) => {
        // console.log('[HumanPlayerScene] Init')
        this.rendererName = data.rendererName
        this.renderConfig = data.rendererConfig
        this.avatarObject = data.avatarObject
        this.renderConfig = {
          ...this.renderConfig,
          TileSize: Math.min(this.game.scale.height/data.vgdl.height, this.game.scale.width/data.vgdl.width)
        }
        this.grenderer = new Sprite2DRenderer(this, this.rendererName, this.renderConfig, this.avatarObject)
        this.vgdl = data.vgdl
        this.gridHeight = data.vgdl.height
        this.gridWidth = data.vgdl.width

        this.onGameEnd = data.onGameEnd

        this.renderData = {
          objects: {},
        }
    }

    updateState = (state)=> {
        /**
         * state {
         *              'frame': this.time,
         *             'score': this.bonus_score,
         *             'ended': this.ended,
         *             'win'  : this.win,
         *             'objects': objects,
         *             'killed': killed,
         *             'actions': actions,
         *             'events': this.effectList,
         *             'real_time': this.real_time,
         *         };
         */
        // console.log(state)

        const newObjectIds = state.objects.map(o=>o.ID)

        // this.grenderer.recenter()
        this.grenderer.beginUpdate(state.objects)

        state.objects.forEach((object) => {
            const objectTemplateName = object.name;
            if (object.ID in this.renderData.objects) {
                const currentObjectData = this.renderData.objects[object.ID];
                this.grenderer.updateObject(
                  currentObjectData.sprite,
                  object.name,
                  objectTemplateName,
                  object.location.x,
                  object.location.y,
                  object.orientation
                );

                this.renderData.objects[object.ID] = {
                  ...currentObjectData,
                  object,
                };
              } else {
                const sprite = this.grenderer.addObject(
                  object.name,
                  objectTemplateName,
                  object.location.x,
                  object.location.y,
                  object.orientation,
                  object.ID
                );

                // sprite.object_id = object.ID

                this.renderData.objects[object.ID] = {
                  object,
                  sprite,
                };
              }
    });

    for (const k in this.renderData.objects) {
          const id = this.renderData.objects[k].object.ID;
          if (!newObjectIds.includes(id)) {
            this.renderData.objects[k].sprite?.destroy();
            delete this.renderData.objects[k];
          }
    }
    }

    preload = ()=> {
      // console.log('[HumanPlayerScene] Preload')
      if (this.grenderer) {
        const sprites = [...Object.keys(this.vgdl.sprite_constr)]
        
        const objects = sprites.map(s=>{
            return {name: s, shrinkfactor: 1.0, img: this.vgdl.sprite_constr[s][1]['img']}
        })
        this.grenderer.loadTemplates(objects);
      }
    }


    initInput = () => {
        this.A = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A, false)
        this.D = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D, false)
        this.W = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W, false)
        this.S = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S, false)
        this.SPACE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE, false)


        this.inputMap = {}

        this.inputMap[this.A.keyCode] = "LEFT"
        this.inputMap[this.D.keyCode] = "RIGHT"
        this.inputMap[this.W.keyCode] = "UP"
        this.inputMap[this.S.keyCode] = "DOWN"
        this.inputMap[this.SPACE.keyCode] = "SPACE"
    }

    handleInput = () =>{
      // console.log('[HumanPlayerScene] Handle Input')
      for (const key of [this.A, this.D, this.W, this.S, this.SPACE]) {
        if(Phaser.Input.Keyboard.JustDown(key)){
            // console.log(`[HumanPlayerScene] Press ${this.inputMap[key.keyCode]}`)
            this.vgdl.presskey(this.inputMap[key.keyCode])
        }else if(Phaser.Input.Keyboard.JustUp(key)){
            // console.log(`[HumanPlayerScene] PressUp ${this.inputMap[key.keyCode]}`)
            this.vgdl.presskeyUp(this.inputMap[key.keyCode])
        }
      }
    }

    create = () => {

      // console.log('[HumanPlayerScene] Create')

      this.initInput()

      
        if(this.grenderer){
            this.grenderer.init(this.gridWidth, this.gridHeight, undefined, this.handlecollision)
            this.updateState(this.vgdl.getFullState())
        }
      
        if(this.vgdl){
          const start_game = this.vgdl.run(this.handle_game_end)
          // start_game()
        }
    }

    handle_game_end = (state)=> {
        this.onGameEnd(state)
    }

    handlecollision = (a, b)=> {
        this.vgdl.addCollisions(this.renderData.objects[a].object,
          this.renderData.objects[b].object)
    }

    update = (time, delta)=> {
      // console.log("[HumanPlayerScene] Update")
      
      if(this.vgdl){
        this.handleInput()
        // console.log("[HumanPlayerScene] Update")
        this.vgdl.update(delta)
      }

      if(this.grenderer){
          this.currentState = this.vgdl.getFullState()
          if(this.currentState)
          {
            this.updateState(this.currentState)
          }
      }

      
    }

}