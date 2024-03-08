import {Component} from "react";
import HumanPlayerScene from "./HumanPlayerScene.js";
import Phaser from "phaser";
export default class Player extends Component{

    updateCanvasSize = ()=> {
        this.game.scale.resize(this.props.width, this.props.height)
    }

    componentDidMount() {
        console.log("[Player] did mount")
        const config = {
            type: Phaser.AUTO,
            parent: this.divElement,
            backgroundColor: "#00000",
            scale:{
                expandParent: false
            },
            physics:{
                default: 'matter',
                matter: {debug: true}
            },
            scene: [HumanPlayerScene]
        }
        this.game = new Phaser.Game(config)
        
        this.updateCanvasSize()

        this.game.scene.start("HumanPlayerScene", {
            rendererConfig: this.props.rendererConfig,
            rendererName: this.props.rendererName,
            vgdl: this.props.vgdl,
        })
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        this.updateCanvasSize()

        console.log("[Player] Did update")
    }

    render() {
        return (
            <div id="Player"
                ref={(divElement)=> {
                    this.divElement = divElement;
                    }}
                    >
            </div>
        )
    }

}