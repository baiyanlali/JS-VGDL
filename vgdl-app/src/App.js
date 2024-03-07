import logo from './logo.svg';
import './App.css';
import { game } from './core/aliens';
import Player from "./renderer/level_player/Player";
import {Component} from "react";

class App extends Component{

  constructor() {
    super();

    this.game = game
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
                width = {400}
                height = {500}
                vgdl = {game}
            ></Player>
          </header>
        </div>
    );
  }


}

export default App;
