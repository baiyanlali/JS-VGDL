import Editor from "@monaco-editor/react"
import {Component} from "react";
import {Card, Nav, NavLink, Tab, Tabs} from "react-bootstrap";

export default class VGDLEditor extends Component {
    constructor(props) {
        super(props)

        this.editorModels = {
            VGDL: {
                name: "VGDL",
                language: "text",
                value: this.props.vgdlString,
            },
            Level: {
                name: "Level",
                language: "text",
                value: this.props.levelString,
            }
        }

        this.fileName = "VGDL"

        this.state = {
            fileContent: this.props.vgdlString
        }

        this.updateVGDL = this.props.updateVGDL
        this.updateLevelString = this.props.updateLevelString
    }

    changeModel(fileName) {
        // console.log(fileName)
        this.fileName = fileName

        this.setState(e=>{
            return {...e, fileContent: this.editorModels[this.fileName].value }
        })
    }

    onChangeContent = (newvalue, e) => {
        const file = this.editorModels[this.fileName]
        file.value = newvalue
    }

    handleEditorDidMount = (editor, monaco) => {
        if (editor) {
            this.editor = editor

            this.editor.addCommand(
                monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
                () => {
                    this.props.updateGameAndLevel(this.editorModels.VGDL.value, this.editorModels.Level.value)
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

    componentDidUpdate(prevProps, prevState, snapshot) {
        if(prevProps.vgdlString !== this.props.vgdlString){
            this.editorModels['VGDL'].value = this.props.vgdlString
        }
        if(prevProps.levelString !== this.props.levelString){
            this.editorModels['Level'].value = this.props.levelString
        }
        if(this.editor){
            this.editor.setValue(this.editorModels[this.fileName].value)
        }
    }




    render() {
        const file = this.editorModels[this.fileName]
        return (
            <Card data-bs-theme={this.props.theme}
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
                        value={this.state.fileContent}
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