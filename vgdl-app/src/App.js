import './App.css';
import {aliens_map, game, aliens_game} from './core/aliens';
import Player from "./renderer/level_player/Player";
import {Component} from "react";
import VGDLEditor from './VGDLEditor';
import 'bootstrap/dist/css/bootstrap.min.css';
import {Container, Row, Col, Navbar, NavbarBrand, NavbarCollapse, Card} from 'react-bootstrap';
import DropdownButton from 'react-bootstrap/DropdownButton';
import Nav from 'react-bootstrap/Nav'
import NavDropdown from 'react-bootstrap/NavDropdown';
import {VGDLParser} from './core/core';

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
            game: new VGDLParser().parseGame(aliens_game),
            theme: "dark",
            activeWindow: null
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

    async componentDidMount() {
        document.body.className = 'bg-dark'
        window.addEventListener('resize', this.updatePhaserCanvasSize, false)
        this.updatePhaserCanvasSize()
    }

    playLevel = (levelString) => {
        this.state.game.buildLevel(levelString)
    }

    updateLevelString = (levelString) => {
        if (levelString === this.state.vgdlLevel) {
            return
        }
        this.state.game.buildLevel(levelString)
        this.setState(e => {
            return {
                ...e,
                vgdlLevel: levelString
            }
        })
    }

    updateGame = (vgdlString) => {
        if (vgdlString === this.state.vgdlString) {
            return
        }
        const new_game = new VGDLParser().parseGame(vgdlString)
        // new_game.buildLevel(this.state.vgdlLevel)
        this.setState(e => {
            return {
                ...e,
                game: new_game,
                vgdlString: vgdlString
            }
        })
    }

    updateGameAndLevel = (vgdl, level) => {
        if (vgdl === this.state.vgdlString && level === this.state.levelString) {
            return
        } else if (vgdl === this.state.vgdlString && level !== this.state.levelString) {
            this.updateLevelString(level)
            return
        }
        //  else if (vgdl !== this.state.vgdlString && level === this.state.levelString) {
        //     this.updateGame(vgdl)
        //     return
        // }

        const new_game = new VGDLParser().parseGame(vgdl)
        new_game.buildLevel(level)

        this.setState(e => {
            return {
                ...e,
                game: new_game,
                vgdlString: vgdl,
                levelString: level
            }
        })

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

    render() {
        return (
            <>
                <Navbar collapseOnSelect expand="lg" className="bg-body-tertiary" data-bs-theme={this.state.theme}>

                    <Navbar.Brand>
                        <img
                            src="logo192.png"
                            height="40"
                        />
                        {' '}VGDL
                    </Navbar.Brand>

                    <Navbar.Toggle aria-controls="basic-navbar-nav"/>
                    <NavbarCollapse id="basic-navbar-nav">
                        <Nav className="me-auto">
                            <Nav.Link href="#features">Features</Nav.Link>
                            <NavDropdown title="Project">
                                <NavDropdown.Item>New Project</NavDropdown.Item>
                                <NavDropdown.Item>Existing Project</NavDropdown.Item>
                                <NavDropdown.Divider/>
                                <NavDropdown title="Haha" drop="end">
                                    <NavDropdown.Item>New Project</NavDropdown.Item>
                                    <NavDropdown.Item>Existing Project</NavDropdown.Item>
                                </NavDropdown>
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
                        <Col md={6}>
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


                        </Col>
                        <Col md={6}>
                                <VGDLEditor ref={e=> {
                                    this.editorElement = e
                                }}
                                    gdyString={this.state.vgdlString}
                                    levelString={this.state.vgdlLevel}
                                    updateVGDL={this.updateGame}
                                    updateLevelString={this.updateLevelString}
                                    updateGameAndLevel={this.updateGameAndLevel}
                                    theme={this.state.theme}
                                    active = {this.state.activeWindow === this.editorElement}
                                    onFocus = {this.onElementFocus}
                                    onBlur = {this.onElementUnFocus}
                                />
                        </Col>
                    </Row>


                </Container>
            </>
        );
    }


}

export default App;
