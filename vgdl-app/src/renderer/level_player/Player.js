import {Component} from "react";
import HumanPlayerScene from "./HumanPlayerScene.js";
import Phaser from "phaser";
import { Row, Col, Button } from "react-bootstrap";
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
            // physics:{
            //     default: 'matter',
            //     matter: {debug: true}
            // },
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
    }

    render() {
        return (
            <>
            <Row>
                <Col>
                    <Button onClick={()=> {
                        this.props.vgdl.startGame()
                    }}>Play</Button>

                    <Button>Stop</Button>
                    <>{this.state.result}</>
                </Col>
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