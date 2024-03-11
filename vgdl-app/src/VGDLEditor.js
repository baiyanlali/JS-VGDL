import Editor from "@monaco-editor/react"
import { Component } from "react";
import {Card, Nav, Tab, Tabs} from "react-bootstrap";
export default class VGDLEditor extends Component{
    constructor(props){
        super(props)

        const editorModels = {
            VGDL: {
                name: "VGDL",
                language: "text",
                value: this.props.gdyString
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

    changeModel(fileName){
        this.setState(state=> {
            return {
                ...state,
                fileName
            }
        })

    }

    onChangeContent = (newvalue, e)=> {
        const file = this.state.editorModels[this.state.fileName]
        file.value = newvalue
    }

    handleEditorDidMount = (editor, monaco) => {
        if(editor){
            this.editor = editor

            this.editor.addCommand(
                monaco.KeyMod.CtrlCmd| monaco.KeyCode.KeyS,
                ()=> {
                    // if(this.state.fileName === "VGDL"){
                        this.props.updateGameAndLevel(this.state.editorModels.VGDL.value, this.state.editorModels.Level.value)
                        // this.updateVGDL(this.state.editorModels.VGDL.value)
                        // this.updateLevelString(this.state.editorModels.Level.value)
                    // }else if(this.state.fileName === "Level"){
                    // }
                }
            )
        }
    }

    render(){
        const file = this.state.editorModels[this.state.fileName]
        return (
            <>
                <Tabs
                    activeKey={file}
                    onSelect={(k) => {
                        console.log(k)
                        this.changeModel(k)
                    }}
                    className="mb-3">
                    <Tab eventKey="VGDL" title="VGDL"/>
                    <Tab eventKey="Level" title="Level"/>
                </Tabs>

                {/*<Nav variant="tabs" defaultActiveKey="VGDL">*/}
                {/*    <Nav.Item>*/}
                {/*        <Nav.Link key="VGDL" onClick={()=> this.changeModel("VGDL")}>VGDL</Nav.Link>*/}
                {/*    </Nav.Item>*/}

                {/*    <Nav.Item>*/}
                {/*        <Nav.Link key="Level" onClick={()=> this.changeModel("Level")}>Level</Nav.Link>*/}
                {/*    </Nav.Item>*/}
                {/*</Nav>*/}
                <Editor
                    path = {file.name}
                    value = {file.value}
                    language = {file.language}
                    theme="vs-dark"
                    height="70vh"
                    onMount = {this.handleEditorDidMount}
                    onChange={this.onChangeContent}
                />
            </>
        )
    }
}