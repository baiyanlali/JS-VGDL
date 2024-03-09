import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import {aliens_map, game, aliens_game} from './core/aliens';
import Player from "./renderer/level_player/Player";
import {Component} from "react";
import VGDLEditor from './VGDLEditor';
import {Container, Row, Col} from 'react-bootstrap';
import Nav from 'react-bootstrap/Nav'
import NavDropdown from 'react-bootstrap/NavDropdown';
import { VGDLParser } from './core/core';

class App extends Component{

  constructor() {
    super();

    this.state = {
      levelPlayer: {
        phaserWidth: 500,
        phaserHeight: 250,
      },
      levelEditor: {
        phaserWidth: 500,
        phaserHeight: 250,
      },
      policyDebugger: {
        phaserWidth: 500,
        phaserHeight: 250,
      },
      levelSelector: {
        phaserWidth: 1000,
        phaserHeight: 120,
      },
      vgdlString: aliens_game,
      vgdlLevel: aliens_map,
      levelId: 0,
      rendererName: "",
      rendererConfig: {
          TileSize: 24,
          RotateAvatarImage: true
      },
      messages: {},
      selectedLevelId: 0,
      trajectories: [],
      projects: {
        names: [],
        templates: {},
        blankTemplate: "",
      },
      newProject: {
        name: "",
        showModal: false,
        template: "",
      },
      projectName: "",
    };

    this.parser = new VGDLParser()
    this.game = this.parser.parseGame(aliens_game)
    this.game.buildLevel(aliens_map)
  }

  updatePhaserCanvasSize = ()=> {
    const width = this.playerContentElement.offsetWidth
    this.setState(state=> {
      return {
        ...state, 
        levelPlayer:{
          phaserWidth: width,
          phaserHeight: window.innerHeight * 6 / 9
        }
      }

    })
  }

  async componentDidMount(){
    window.addEventListener('resize', this.updatePhaserCanvasSize, false)
    this.updatePhaserCanvasSize()
  }

  playLevel = (levelString) => {
    this.game.buildLevel(levelString)
  }

  updateLevelString = (levelString)=> {
    console.log("update level string")
  }

  updateGame = (vgdlString)=> {

  }

  render() {
    return (
        <Container className="App">
          <Row>
            <Col name="Menu" md={4}>
              <Nav>
                <Nav.Item>
                  <a href="https://griddly.ai">
                    <img
                      alt="Griddly Bear"
                      src="logo_ai_white.png"
                      height="40"
                    />
                  </a>
                </Nav.Item>

                <NavDropdown title="New">
                  <NavDropdown.Item>New Project</NavDropdown.Item>
                  <NavDropdown.Item>Existing Project</NavDropdown.Item>
                </NavDropdown>
                
              </Nav>
            </Col>

            <Col name="Project Name" md={4}>
              "VGDL Example"
            </Col>

            <Col name="Link" md={4}>

            </Col>
          </Row>

          <Row>
            <Col md={6}>

              <div
                ref={(playerContentElement)=> {
                  this.playerContentElement = playerContentElement
                }}
              >
                <Player
                    rendererName={this.state.rendererName}
                    rendererConfig={this.state.rendererConfig}
                    selectedLevelId={this.state.selectedLevelId}
                    onTrajectoryComplete={this.onTrajectoryComplete}
                    width = {this.state.levelPlayer.phaserWidth}
                    height = {this.state.levelPlayer.phaserHeight}
                    vgdl = {this.game}
                />

              </div>
              
            </Col>
            <Col md={6}>
              <VGDLEditor
                gdyString = {this.state.vgdlString}
                levelString = {this.state.vgdlLevel}
                updateGame = {this.updateGame}
                updateLevelString = {this.updateLevelString}
              />
            </Col>
          </Row>

          <Row>

          </Row>

              

        </Container>
    );
  }


}

export default App;
