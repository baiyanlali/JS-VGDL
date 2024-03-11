import {Component} from "react";
import HumanPlayerScene from "./HumanPlayerScene.js";
import Phaser from "phaser";
import {Row, Col, Button, ButtonGroup, Card} from "react-bootstrap";
export default class Player extends Component{

    constructor(props){
        super(props)

        this.state = {
            result: ""
        }
    }

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

        this.sceneManager = this.game.scene.start("HumanPlayerScene", {
            rendererConfig: this.props.rendererConfig,
            rendererName: this.props.rendererName,
            vgdl: this.props.vgdl,
        })
    }

    onGameEnd = (result)=>{
        console.log(`Reuslt: ${JSON.stringify(result)}`)
        this.setState(state=> {
            return{
                ...state,
                result: result.win
            }
        })
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        this.updateCanvasSize()
        if(this.props.vgdl !== prevProps.vgdl){
            this.game.scene.start("HumanPlayerScene", {
                rendererConfig: this.props.rendererConfig,
                rendererName: this.props.rendererName,
                vgdl: this.props.vgdl,
            })
        }
    }

    render() {
        return (
            <>
            <Row>
                <ButtonGroup aria-label="Basic example">
                  <Button variant="secondary" onClick={this.props.vgdl.startGame}>Play</Button>
                  <Button variant="secondary">Stop</Button>
                  <Button variant="secondary">Reset</Button>
                </ButtonGroup>

                <div
                    ref={(divElement)=> {
                        this.divElement = divElement;
                        }}
                        >
                </div>
            </Row>
            </>
            
        )
    }

}