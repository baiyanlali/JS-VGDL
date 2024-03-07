import {Component} from "react";
import HumanPlayerScene from "./HumanPlayerScene.js";
export default class Player extends Component{

    updateCanvasSize = ()=> {
        this.game.scale.resize(this.props.width, this.props.height)
    }

    componentDidMount() {
        const config = {
            type: Phaser.AUTO,
            parent: this.divElement,
            backgroundColor: "#00000",
            scale:{
                expandParent: false
            },
            scene: [HumanPlayerScene]
        }
        this.game = new Phaser.Game(config)
        this.updateCanvasSize()

        this.game.scene.start("HumanPlayerScene", {
            rendererConfig: this.props.rendererConfig,
            rendererName: this.props.rendererName,
            vgdl: this.props.vgdl,
            onDisplayMessage: this.props.onDisplayMessage,
            onTrajectoryComplete: this.props.onTrajectoryComplete,
        })
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        this.updateCanvasSize()

    }

    render() {
        return (
            <div
                ref={(divElement)=> {
                    this.divElement = divElement}}>

            </div>
        )
    }

}