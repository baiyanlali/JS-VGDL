import logo from './logo.svg';
import './App.css';
import {aliens_map, game} from './core/aliens';
import Player from "./renderer/level_player/Player";
import {Component} from "react";
import Phaser from 'phaser';
import VGDLEditor from './VGDLEditor';
import { Container, Row, Col } from 'react-bootstrap';

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
      gdyHash: 0,
      gdyString: "",
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

    this.game = game
    this.game.buildLevel(aliens_map)
  }

  render() {
    return (
        <Container className="App">
          <Row>
            <Col name="Menu" md={4}>

            </Col>

            <Col name="Project Name" md={4}>
              "VGDL Example"
            </Col>

            <Col name="Link" md={4}>

            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Player
                    rendererName={this.state.rendererName}
                    rendererConfig={this.state.rendererConfig}
                    selectedLevelId={this.state.selectedLevelId}
                    onTrajectoryComplete={this.onTrajectoryComplete}
                    width = {this.state.rendererConfig.TileSize * 32}
                    height = {this.state.rendererConfig.TileSize * 32}
                    vgdl = {this.game}
                />
            </Col>
            <Col md={6}>
              <VGDLEditor/>
            </Col>
          </Row>

          <Row>

          </Row>

              

        </Container>
    );
  }


}

export default App;
