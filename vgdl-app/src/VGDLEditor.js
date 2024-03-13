import Editor from "@monaco-editor/react"
import {Component} from "react";
import {Card, Nav, NavLink, Tab, Tabs} from "react-bootstrap";

export default class VGDLEditor extends Component {
    constructor(props) {
        super(props)

        const editorModels = {
            VGDL: {
                name: "VGDL",
                language: "text",
                value: this.props.vgdlString
            },
            Level: {
                name: "Level",
                language: "text",
                value: this.props.levelString
            }
        }

        this.state = {
            fileName: "VGDL",
            editorModels
        }

        this.updateVGDL = this.props.updateVGDL
        this.updateLevelString = this.props.updateLevelString
    }

    changeModel(fileName) {
        this.setState(state => {
            return {
                ...state,
                fileName
            }
        })

    }

    onChangeContent = (newvalue, e) => {
        return
        const file = this.state.editorModels[this.state.fileName]
        file.value = newvalue
    }

    handleEditorDidMount = (editor, monaco) => {
        if (editor) {
            this.editor = editor

            this.editor.addCommand(
                monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
                () => {
                    this.props.updateGameAndLevel(this.state.editorModels.VGDL.value, this.state.editorModels.Level.value)
                }
            )

            this.editor.onDidBlurEditorWidget(() => {
                this.props.onBlur(this)
            })
            this.editor.onDidFocusEditorWidget(() => {
                this.props.onFocus(this)
            })
        }
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        // console.log(nextProps)
        const editorModels = {
            VGDL: {
                name: "VGDL",
                language: "text",
                value: nextProps.vgdlString
            },
            Level: {
                name: "Level",
                language: "text",
                value: nextProps.levelString
            }
        }

        return {
            ...prevState,
            editorModels,
        };
    }



    render() {
        const file = this.state.editorModels[this.state.fileName]
        return (
            <Card data-bs-theme={this.props.theme}
                // border="primary"
                  border={this.props.active ? "primary" : "dark"}
            >

                <Card.Header>
                    <Nav variant="tabs" defaultActiveKey="VGDL">
                        <Nav.Item><NavLink onClick={() => {
                            this.changeModel("VGDL")
                        }}>VGDL</NavLink></Nav.Item>
                        <Nav.Item><NavLink onClick={() => {
                            this.changeModel("Level")
                        }}>Level</NavLink></Nav.Item>
                    </Nav>
                </Card.Header>

                <Card.Body ref={editorElement => this.editorElement = editorElement}>
                    <Editor
                        path={file.name}
                        value={file.value}
                        language={file.language}
                        theme="vs-dark"
                        height="70vh"
                        onMount={this.handleEditorDidMount}
                        onChange={this.onChangeContent}
                    />
                </Card.Body>
            </Card>
        )
    }
}