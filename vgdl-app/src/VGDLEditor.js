import Editor from "@monaco-editor/react"
import { Component } from "react";

export default class VGDLEditor extends Component{
    constructor(props){
        super(props)

        this.state = {
            fileName: "VGDL",
            
        }
    }

    render(){
        return (
            <>
                <Editor
                    theme="vs-dark"
                    height="70vh"
                />
            </>
        )
    }
}