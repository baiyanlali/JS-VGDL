import Sprite2DRenderer from "../Sprite2DRenderer";
import Phaser from "phaser";

export default class HumanPlayerScene extends Phaser.Scene{

    init = (data) => {
        this.rendererName = data.rendererName
        this.renderConfig = data.renderConfig
        this.avatarObject = data.avatarObject
        this.grenderer = new Sprite2DRenderer(this, this.rendererName, this.renderConfig, this.avatarObject)
        this.vgdl = data.vgdl
    }

    updateState = (state)=> {
        const newObjectIds = state.objects.map(o=>o.id)

        // this.grenderer.recenter()
        this.grenderer.beginUpdate(state.objects)

        state.objects.forEach(object=>{

        })
    }

    preload = ()=> {

    }

    create = () => {

    }

    update = (time, delta)=> {
        if(this.currentState)
            this.updateState(this.currentState)
    }

}