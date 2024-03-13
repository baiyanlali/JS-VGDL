import {Component} from "react";
import HumanPlayerScene from "./HumanPlayerScene.js";
import Phaser from "phaser";
import {Row, Col, Button, ButtonGroup, Card} from "react-bootstrap";

export default class Player extends Component {

    constructor(props) {
        super(props)

        this.state = {
            result: ""
        }
    }

    updateCanvasSize = () => {
        this.game.scale.resize(this.props.width, this.props.height)
    }

    componentDidMount() {
        const config = {
            type: Phaser.AUTO,
            parent: this.divElement,
            backgroundColor: "#00000",
            scale: {
                expandParent: false
            },
            scene: [HumanPlayerScene]
        }
        this.game = new Phaser.Game(config)

        this.updateCanvasSize()

        this.sceneManager = this.game.scene.start("HumanPlayerScene", this.getSceneData())

    }

    onFocus = () => {
        this.props.onFocus(this)
    }

    onBlur = ()=> {
        this.props.onBlur()
    }

    getSceneData = () => {
        return {
            rendererConfig: this.props.rendererConfig,
            rendererName: this.props.rendererName,
            vgdl: this.props.vgdl,
            onGameEnd: this.onGameEnd,
            onFocus: this.onFocus,
            onBlur: this.onBlur,
        }
    }



    onGameEnd = (result) => {
        console.trace(`Reuslt: ${JSON.stringify(result.win)}`)
        this.setState(state => {
            return {
                ...state,
                result: result.win ? "Win" : "Lose"
            }
        })
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        this.updateCanvasSize()
        if (this.props.vgdl !== prevProps.vgdl) {
            this.game.scene.start("HumanPlayerScene", this.getSceneData())
        }
        // console.log()
        if(this.game.scene.scenes.length >= 1) {
            // console.log("active", this.props.active)
            this.game.scene.scenes[0]['active'] = this.props.active
        }
        // this.game.scene.scenes[0].active = this.props.active
    }

    resetLevel=()=> {
        this.props.onFocus(this)
        this.props.vgdl.resetLevel()
        this.setState(e=>
        {
            return {...e, result: ""}
        })
    }

    startGame = ()=> {
        this.props.onFocus(this)
        this.props.vgdl.startGame()
        console.log("enable")
        this.game.input.keyboard.enabled = true
        this.setState(e=>
        {
            return {...e, result: "Running..."}
        })
    }

    render() {

        let state = "Running..."
        if(this.props.vgdl.paused)
            state = "Paused"
        if(this.props.vgdl.ended)
            state = `Result: ${this.state.result}`

        return (
            <>
                <Row>
                    <ButtonGroup aria-label="Basic example">
                        <Button variant="secondary" onClick={this.startGame}
                                disabled={this.state.result !== ""}>Play</Button>
                        <Button variant="secondary" onClick={() => this.props.onFocus(this)}>{
                            state
                        }</Button>
                        <Button variant="secondary" onClick={this.resetLevel}>Reset</Button>
                    </ButtonGroup>

                    <div
                        ref={(divElement) => {
                            this.divElement = divElement;
                        }}
                        onFocus={() => { this.props.onFocus(this)}}
                    >
                    </div>
                </Row>
            </>

        )
    }

}