import {Component} from "react";
import Phaser from "Phaser"
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