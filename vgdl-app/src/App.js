import logo from './logo.svg';
import './App.css';
import {aliens_map, game} from './core/aliens';
import Player from "./renderer/level_player/Player";
import {Component} from "react";
import Phaser from 'phaser';

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
        <div className="App">
          <header className="App-header">
            <img src={logo} className="App-logo" alt="logo" />
            <p>
              Edit <code>src/App.js</code> and save to reload.
            </p>
            <Player
                rendererName={this.state.rendererName}
                rendererConfig={this.state.rendererConfig}
                selectedLevelId={this.state.selectedLevelId}
                onTrajectoryComplete={this.onTrajectoryComplete}

                width = {600}
                height = {400}
                vgdl = {this.game}
            >
            </Player>
          </header>
        </div>
    );
  }


}

export default App;
