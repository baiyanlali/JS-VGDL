import React, {Component} from "react";
import FloatingLabel from 'react-bootstrap/FloatingLabel';
import Form from 'react-bootstrap/Form';
import {Button} from "react-bootstrap";
import {OpenAI} from 'openai';


import * as Games from "./core/games.js";
import * as Sprite from "./core/ontology/vgdl-sprite.js";
import * as Constants from "./core/ontology/constants.js";
import * as Avatars from "./core/ontology/avatar.js";
import * as Termination from "./core/ontology/termination.js";
import * as Condition from "./core/ontology/conditional.js";
import * as Effect from "./core/ontology/effect.js";
import * as Physics from "./core/ontology/physics.js";



const INSTRUCTION = `Please create a VGDL representation for a maze game. Please create a game level as well.
Use "W" to represent walls, "A" for the avatar, and "G" for the goal.
`



const RULE = `
Here is the rule of VGDL:
A game is defined by two separate components, the level description, which essentially describes the positions of all objects and the layout of the game in 2D (i.e., the initialconditions), and the game description proper, which describes the dynamics and potential interactions of all the objects in the game.
The level description is simply a text string/file with a number of equal-length lines, where each character maps to (read: instantiates) one or more objects at the corresponding location of the rectangular grid. See Figure 1 for an example level description. 
The game description is composed of four blocks of instructions. 
The LevelMapping describes how to translate the characters in the level description into (one or more) objects, to generate the initial game state. For example, each ‘1’ spawns an object of the ‘monster’ class. 
The SpriteSet defines the classes of objects used, all of which are defined in the ontology, and derive from an abstract VGDLSprite class. Object classes are organized in a tree (using nested indentations), where a child class will inherit the properties of its ancestors. For example, there are two subclasses of avatars, one where Link possesses the key and one where he does not. Furthermore, all class definitions can be augmented by keyword options. For example, the ‘key’ and ‘goal’ classes differ only by their color and how they interact.
The InteractionSet defines the potential events that happen when two objects collide. Each such interaction maps two object classes to an event method (defined in the ontology), possibly augmented by keyword options. For example, swords kill monsters, monsters kill the avatar (both subclasses), nobody is allowed to pass through walls, and when Link finds a ‘key’ object, the avatar class is transformed. 
The TerminationSet defines different ways by which the game can end, each line is a termination criterion, different criteria are available through the ontology and can be further specialized with keyword options. Here, it is sufficient to capture the goal (bring the sprite counter of the ‘goal’ class to zero) to win.
What permits the descriptions to be so concise is an underlying ontology which defines many high-level building blocks for games, including the types of physics used (continuous, or grid based, friction, gravity, etc.), movement dynamics of objects (straight or random motion, player-control, etc.) and interaction effects upon object collisions (bouncing, destruction, spawning, transformation, etc.).

`


const GRAMMAR = `
Here is the grammar:

〈game〉 ::= BasicGame 〈eol〉 INDENT 〈level-block〉 〈sprite-block〉 〈interaction-block〉 〈termination-block〉 
〈level-block〉 ::= LevelMapping 〈eol〉 INDENT { 〈char-map〉 NEWLINE } DEDENT 
〈sprite-block〉 ::= SpriteSet 〈eol〉 INDENT { 〈sprite-def 〉 NEWLINE } DEDENT 
〈interaction-block〉 ::= InteractionSet 〈eol〉 INDENT { 〈interaction-def 〉 〈eol〉 } DEDENT 
〈termination-block〉 ::= TerminationSet 〈eol〉 INDENT { 〈termination-def 〉 〈eol〉 } DEDENT 
〈char-map〉 ::= CHAR ‘ > ’ 〈sprite-type〉 { ‘ ’ 〈sprite-type〉 } 
〈sprite-def 〉 ::= 〈sprite-simple〉 [ 〈eol〉 INDENT { 〈sprite-def 〉 〈eol〉 } DEDENT ] 〈sprite-simple〉 ::= 〈sprite-type〉 ‘ > ’ [ sprite class ] { ‘ ’ 〈option〉 } 
〈interaction-def 〉 ::= 〈sprite-type〉 〈sprite-type〉 ‘ > ’ interaction method { ‘ ’ 〈option〉 } 
〈termination-def 〉 ::= termination class { ‘ ’ 〈option〉 } 
〈eol〉 ::= { ‘ ’ } [ ‘#’ { CHAR | ‘ ’ } ] NEWLINE 
〈option〉 ::= IDENTIFIER ‘=’ ( 〈sprite-type〉 | evaluable ) 
〈sprite-type〉 ::= IDENTIFIER | ‘avatar’ | ‘wall’ | ‘EOS’

The sprite classes you can choose are 'MovingAvatar', 'Immovable'. 
The interaction methods you can choose are 'removeSprite', 'stepBack'. When using 'removeSprite', follow the format '<Sprite Not Be Removed> <Sprite Be Removed> > removeSprite'. 
The termination classes you can choose are 'SpriteCounter'. When using 'SpriteCounter', follow the format 'SpriteCounter stype=<Your Sprite Type> limit=<The number of your sprite type> win=<True/False>'.
`

const WAGRGCR = INSTRUCTION + "\n" + GRAMMAR+"\n"+RULE

export default class LLMs extends Component {
    constructor(props) {
        super(props)

        this.key_area = null
        this.prompt_area = null

        this.state = {
            processing : false
        }

        this.onLLMGen = this.props.onLLMGen
    }

    async onSubmit() {
        let keys = this.key_area?.value
        let prompt = this.prompt_area?.value

        localStorage.setItem('OPENAIAPIKEY', keys)
        const messages = [
            {role: "system", content: "You are a game designer." },
            {role: "user", content: prompt},
            {role: "user", content:
                    `Return your answer in the form of a JSON file, with field names "VGDL", "Level"
                    You only need to return this JSON file, and no other things needed. Here is the format: {"VGDL":"Your VGDL Output", \n"Level": "Your Level Output"}`
            }
        ]


        const client = new OpenAI({
            apiKey: keys,
            dangerouslyAllowBrowser: true
        })

        this.setState(e=>{
            return {
                ...e,
                processing: true
            }
        })

        const completion = await client.chat.completions.create({
            messages: messages,
            model: "gpt-4o-2024-05-13"
        })

        let result = completion.choices[0].message.content.replace("```json", "").replace("```", "")


        this.setState(e=>{
            return {
                ...e,
                processing: false
            }
        })

        this.onLLMGen(result)
        // return JSON.parse(result)
    }

    async onTest(){

        this.setState(e=>{
            return {
                ...e,
                processing: true
            }
        })
        let detailed_keywords = "For sprite, you can choose: "
        console.log(Sprite, Avatars, Termination, Condition, Effect)

        for(let s in Sprite){
            detailed_keywords += `${s}, `
        }

        detailed_keywords += "\nFor avatars, you can choose: "

        for(let s in Avatars){
            detailed_keywords += `${s}, `
        }

        detailed_keywords += "\nFor termination, you can choose: "

        for(let s in Termination){
            detailed_keywords += `${s}, `
        }

        detailed_keywords += "\nFor condition, you can choose: "

        for(let s in Condition){
            detailed_keywords += `${s}, `
        }

        detailed_keywords += "\nFor effect, you can choose: "

        for(let s in Effect){
            detailed_keywords += `${s}, `
        }

        let keys = this.key_area?.value
        let prompt = this.prompt_area?.value

        localStorage.setItem('OPENAIAPIKEY', keys)

        const client = new OpenAI({
            apiKey: keys,
            dangerouslyAllowBrowser: true
        })

        const messages = [
            {role: "system", content: "You are a game designer who use VGDL to make games." },
            {role: "user", content: prompt},
            {role: "user", content: `Now you need to do two things: 
                1) generate the complete list of game objects you use in the game.
                2) for each game objects, use one word as a key to denote the game.
                Return a dictionary containing the key and the game object.
                For example, if a game contains wall, avatar and goal three game objects. 
                You need to return a json format {"W": "wall", "A": "avatar", "G": "goal"}
                You only need to return this JSON file, and no other things needed.`},
        ]

        console.log(messages)

        let objs = await client.chat.completions.create({
            messages: messages,
            model: "gpt-4o-2024-05-13"
        })


        console.log(objs)
        let gos = JSON.parse(objs.choices[0].message.content.replace("```json", "").replace("```", ""))
        
        let build = ""

        for (const k in gos) {
            if (Object.hasOwnProperty.call(gos, k)) {
                const v = gos[k];

                build += `Use "${v}" to represent "${k}", `
                
            }
        }

        let messages2 = [
            {role: "system", content: "You are a game designer." },
            {role: "user", content: prompt},
            {role: "user", content: `${build}\n${GRAMMAR}\n${detailed_keywords}`},
            {role: "user", content:
                `Return your answer in the form of a JSON file, with field names "VGDL", "Level"
                You only need to return this JSON file, and no other things needed. Here is the format: {"VGDL":"Your VGDL Output", \n"Level": "Your Level Output"}`
            }
        ]

        console.log(messages2)

        let result2 = await client.chat.completions.create({
            messages: messages2,
            model: "gpt-4o-2024-05-13"
        })


        console.log(result2)

        let result = result2.choices[0].message.content.replace("```json", "").replace("```", "")


        this.setState(e=>{
            return {
                ...e,
                processing: false
            }
        })

        console.log(result)
        this.onLLMGen(result)

    }

    render() {
        return (
            <Form>
                <FloatingLabel
                    controlId="floatingInput"
                    label="Prompt"
                    className="mb-3"
                    data-bs-theme="dark"
                >
                    <Form.Control data-bs-theme="dark" as="textarea" rows={3}
                                  ref={p=> this.prompt_area = p}
                                  defaultValue={WAGRGCR}
                    />
                </FloatingLabel>

                <FloatingLabel controlId="floatingPassword" label="OPEN AI KEY" data-bs-theme="dark" >
                    <Form.Control data-bs-theme="dark"
                                  type="password"
                                  ref={p=> this.key_area = p}
                                  defaultValue={localStorage.getItem('OPENAIAPIKEY') ?? ""}
                    />
                </FloatingLabel>

                <Button variant="primary" onClick={()=> this.onSubmit()} disabled={this.state.processing}>
                    {this.state.processing ? "Processing" : "Submit"}
                </Button>

                <Button variant="primary" onClick={()=> this.onTest()}>
                    Test
                </Button>
            </Form>
        )
    }
}