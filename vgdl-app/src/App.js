import './App.css';
import {aliens_game, aliens_map} from './core/aliens';
import Player from "./renderer/level_player/Player";
import {Component} from "react";
import VGDLEditor from './VGDLEditor';
import 'bootstrap/dist/css/bootstrap.min.css';
import {Card, Col, Container, Navbar, NavbarCollapse, Row} from 'react-bootstrap';
import Nav from 'react-bootstrap/Nav'
import NavDropdown from 'react-bootstrap/NavDropdown';
import {VGDLParser} from './core/core';
import Alert from 'react-bootstrap/Alert';
import LLMs from "./LLMs";
import React from 'react';
class App extends Component {

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
            gameName: "Aliens",
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
                "grid_physics": {}
            },
            newProject: {
                name: "",
                showModal: false,
                template: "",
            },
            projectName: "",
            game: new VGDLParser().parseGame(aliens_game),
            theme: "dark",
            activeWindow: null,
            compileState: {
                hidden: true,
                state: "secondary",
                message: ""
            }
        };

        this.state.game.buildLevel(aliens_map)
    }

    updatePhaserCanvasSize = () => {
        const width = this.playerContentElement.offsetWidth
        this.setState(state => {
            return {
                ...state,
                levelPlayer: {
                    phaserWidth: width,
                    phaserHeight: window.innerHeight * 6 / 9
                }
            }

        })
    }

    loadConfig = async () => {
        const res = await fetch("config/config.json")
        return await res.json()
    }

    async componentDidMount() {
        document.body.className = 'bg-dark'
        window.addEventListener('resize', this.updatePhaserCanvasSize, false)
        this.updatePhaserCanvasSize()

        const projects = {"grid_physics": {}}
        this.loadConfig().then((configs)=> {
            // console.log(configs)
            for (const game in configs['grid_physics']) {
                // console.log(game, configs['grid_physics'][game])
                projects['grid_physics'][game] = configs['grid_physics'][game]
            }

            // console.log(projects)

            this.setState(e=>{
                return {
                    ...e,
                    projects
                }
            })
        })
    }

    playLevel = (levelString) => {
        this.state.game.buildLevel(levelString)
    }

    updateLevelString = (levelString) => {
        // if (levelString === this.state.vgdlLevel) {
        //     return
        // }

        this.state.game.buildLevel(levelString)

        this.setState(e => {
            return {
                ...e,
                vgdlLevel: levelString,
                compileState: {
                    hidden: false,
                    state: "success",
                    message: "Update Level Success!"
                }
            }
        }, ()=> {
            window.setTimeout(() => {
                this.setState(e=> {
                    return {
                        ...e,
                        compileState: {
                            ...e.compileState,
                            hidden: true
                        }
                    }

                });
              }, 2000)
        })

    }

    updateGame = (vgdlString) => {
        // if (vgdlString === this.state.vgdlString) {
        //     return
        // }

        try{
            const new_game = new VGDLParser().parseGame(vgdlString)

            this.setState(e => {
                return {
                    ...e,
                    game: new_game,
                    vgdlString: vgdlString,
                    compileState: {
                        hidden: false,
                        state: "success",
                        message: "Update Game Success!"
                    }
                }
            },
                ()=> {
            window.setTimeout(() => {
                this.setState(e=> {
                    return {
                        ...e,
                        compileState: {
                            ...e.compileState,
                            hidden: true
                        }
                    }

                });
              }, 2000)
        })

        }catch(e){
            console.log("catch error")
            this.setState(s=> {
                return {
                    ...s,
                    compileState:{
                        hidden: false,
                        state: "danger",
                        message: e.message
                    }
                }
            })
        }

        
        // new_game.buildLevel(this.state.vgdlLevel)

    }



    updateGameAndLevel = (vgdl, level, gameName = null) => {
        // if (vgdl === this.state.vgdlString && level === this.state.levelString) {
        //     return
        // } else if (vgdl === this.state.vgdlString && level !== this.state.levelString) {
        //     this.updateLevelString(level)
        //     return
        // }

        this.setState(e => {
            return {
                ...e,
                vgdlString: vgdl,
                vgdlLevel: level,
                gameName: gameName ?? this.state.gameName
            }
        })

        try{
            const new_game = new VGDLParser().parseGame(vgdl)
            new_game.buildLevel(level)

            console.log("update game and level")
            this.setState(e => {
                return {
                    ...e,
                    game: new_game,
                    vgdlString: vgdl,
                    vgdlLevel: level,
                    compileState: {
                            hidden: false,
                            state: "success",
                            message: "Update Game&Level Success!"
                    }
                }
            }, ()=> {
            window.setTimeout(() => {
                this.setState(e=> {
                    return {
                        ...e,
                        compileState: {
                            ...e.compileState,
                            hidden: true
                        }
                    }

                });
              }, 2000)
        })
        }catch (e) {
            this.setState(s => {
                return {
                    ...s,
                    compileState: {
                            hidden: false,
                            state: "danger",
                            message: e.message
                    }
                }
            })
        }


    }

    onElementFocus = (element) => {
        this.setState(e=> {
            return {
                ...e,
                activeWindow: element
            }
        })
    }

    onElementUnFocus = (element) => {
        this.setState(e=> {
            return {
                ...e,
                activeWindow: null
            }
        })
    }

    loadGame = async (gameName, gameLevels, paths = "./games/gridphysics/") => {
        // console.log("load ", gameName, `${paths}${gameName}.txt`, `${paths}${gameLevels[0]}`)
        const gameFile = await (await fetch(`${paths}${gameName}.txt`)).text()
        const gameLevel = await (await fetch(`${paths}${gameLevels[0]}`)).text()
        // console.log(gameFile)
        // console.log(gameLevel)
        this.updateGameAndLevel(gameFile, gameLevel, gameName)
    }

    onLLMGen = (level_json) => {
        level_json = JSON.parse(level_json)
        this.updateGameAndLevel(level_json.VGDL, level_json.Level)
    }

    render() {

        const get_projects = ()=> {
            const projects = this.state.projects

            const games = Object.keys(projects['grid_physics'])

            return (
                <>
                    <NavDropdown title="GridPhysics" drop="end">
                    {
                        games.map((game)=> {
                            return <NavDropdown.Item
                                key={game}
                                onClick={() => this.loadGame(game, projects['grid_physics'][game])}>
                                {game}</NavDropdown.Item>}
                        )
                    }
                    </NavDropdown>
                </>
            )
        }

        return (
            <>
                <Navbar collapseOnSelect expand="lg" className="bg-body-tertiary" data-bs-theme={this.state.theme}>

                    <Navbar.Brand>
                        <img
                            src="logo192.png"
                            height="40"
                        />
                        {' '}{this.state.gameName}
                    </Navbar.Brand>


                    <Navbar.Toggle aria-controls="basic-navbar-nav"/>
                    <NavbarCollapse id="basic-navbar-nav">
                        <Nav className="me-auto">
                            <Nav.Link href="#features">Features</Nav.Link>
                            <NavDropdown title="Project">
                                {
                                    
                                }
                                <NavDropdown.Item>New Project</NavDropdown.Item>
                                <NavDropdown.Item>Existing Project</NavDropdown.Item>
                                <NavDropdown.Divider/>
                                {
                                    get_projects()
                                }
                            </NavDropdown>

                            <NavDropdown title="Help">
                                <NavDropdown.Item>New Project</NavDropdown.Item>
                                <NavDropdown.Item>Existing Project</NavDropdown.Item>
                                <NavDropdown.Divider/>
                            </NavDropdown>
                        </Nav>


                    </NavbarCollapse>



                </Navbar>


                <Container fluid style={{marginTop: '20px', textAlign: 'center'}}>

                    <Row md={10}>
                        <Col md={6} >
                            <Card body data-bs-theme={this.state.theme}
                                  border={this.state.activeWindow === this.playerElement?"primary":"dark"}>

                                <div
                                    ref={(playerContentElement) => {
                                        this.playerContentElement = playerContentElement
                                    }}
                                    
                                >
                                    <Player
                                        ref={e=> {
                                            this.playerElement = e
                                        }}
                                        rendererName={this.state.rendererName}
                                        rendererConfig={this.state.rendererConfig}
                                        selectedLevelId={this.state.selectedLevelId}
                                        width={this.state.levelPlayer.phaserWidth}
                                        height={this.state.levelPlayer.phaserHeight}
                                        vgdl={this.state.game}
                                        active={this.state.activeWindow === this.playerElement}
                                        onFocus={this.onElementFocus}
                                        onBlur = {this.onElementUnFocus}
                                    />

                                </div>

                            </Card>

                        <Alert variant={this.state.compileState.state} dismissible hidden={this.state.compileState.hidden}>
                            {this.state.compileState.message}
                        </Alert>


                        </Col>
                        <Col md={6}>
                            <Row>
                                <LLMs
                                    onLLMGen = {this.onLLMGen}
                                />
                            </Row>
                            <Row>
                                <VGDLEditor ref={e=> {
                                    this.editorElement = e
                                }}
                                    vgdlString={this.state.vgdlString}
                                    levelString={this.state.vgdlLevel}
                                    updateVGDL={this.updateGame}
                                    updateLevelString={this.updateLevelString}
                                    updateGameAndLevel={this.updateGameAndLevel}
                                    theme={this.state.theme}
                                    active = {this.state.activeWindow === this.editorElement}
                                    onFocus = {this.onElementFocus}
                                    onBlur = {this.onElementUnFocus}
                                />
                            </Row>

                        </Col>
                    </Row>


                </Container>
            </>
        );
    }


}

export default App;
