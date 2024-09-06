import React, {Component} from "react";
import FloatingLabel from 'react-bootstrap/FloatingLabel';
import Form from 'react-bootstrap/Form';
import {Button, Card} from "react-bootstrap";
import Accordion from 'react-bootstrap/Accordion'
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
        this.custom_url = null
        this.llm_model = null

        this.state = {
            processing : false
        }

        this.onLLMGen = this.props.onLLMGen
    }

    async onSubmit() {
        let keys = this.key_area?.value ?? ""
        let base_url = this.custom_url?.value ?? ""
        let llm_model = this.llm_model?.value ?? "gpt-4o"
        let prompt = this.prompt_area?.value ?? ""

        localStorage.setItem('OPENAIAPIKEY', keys)
        localStorage.setItem('BASE_URL', base_url)
        localStorage.setItem('LLM_MODEL', llm_model)
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
            dangerouslyAllowBrowser: true,
            baseURL: base_url
        })

        this.setState(e=>{
            return {
                ...e,
                processing: true
            }
        })

        const completion = await client.chat.completions.create({
            messages: messages,
            model: llm_model ?? "gpt-4o"
        })

        let result = completion.choices[0].message.content.replace("```json", "").replace("```", "")

        // let vgdl_rule_level = JSON.parse(result)

        console.log(result)
        const messages2 = [
            {role: "system", content: "You are a game designer." },
            {role: "user", content: `Given a vgdl and level game file, please refine and add image for each sprite. 
Here is the original file:
${result}

Here is the image you can use: 
oryx/floor2_0
oryx/ogre2
oryx/angel1_1
oryx/space2
oryx/prince1
oryx/belt1
oryx/wall3_12
oryx/dragon3
oryx/rogue_0
oryx/druid1
oryx/rogue_1
oryx/dragon2
oryx/rogue
oryx/wall3_13
oryx/cspell1
oryx/gold1
oryx/space3
oryx/cloak1
oryx/angel1_0
oryx/floor2_1
oryx/ogre1
oryx/devil1_0
oryx/space1
oryx/cloak3
oryx/floor4
oryx/gold3
oryx/cspell3
oryx/belt2
oryx/wall3_11
oryx/grass_8
oryx/eyes2
oryx/dragon1
oryx/candle1
oryx/grass_9
oryx/bookDown
oryx/wall3_10
oryx/fireleft4
oryx/cspell2
oryx/belt3
oryx/gold2
oryx/cloak2
oryx/devil1_1
oryx/wolf3
oryx/floorTileYellow
oryx/guard1
oryx/floor1
oryx/scroll1
oryx/space4
oryx/wall3_14
oryx/backGreen
oryx/planet
oryx/spelunky_1
oryx/key3
oryx/spelunky_0
oryx/key2
oryx/dragon4
oryx/wall3_15
oryx/evilTree1
oryx/mineral1
oryx/iceright1
oryx/fireleft1
oryx/space5
oryx/mushroom1
oryx/wolf2
oryx/scorpion1
oryx/worm1
oryx/scorpion3
oryx/iceleft1
oryx/guard2
oryx/floor2
oryx/fireleft3
oryx/cspell5
oryx/fire1
oryx/floorTileGreen
oryx/mineral3
oryx/silver1
oryx/dooropen1
oryx/swordman1_1
oryx/swordman1_0
oryx/key1
oryx/dwarf1
oryx/amulat1
oryx/mineral2
oryx/cspell4
oryx/fireleft2
oryx/floor3
oryx/mushroom2
oryx/scorpion2
oryx/wolf1
oryx/worm2
oryx/dirtWall_11
oryx/book3
oryx/sparkle2
oryx/barrel2
oryx/yeti1
oryx/wall3_3
oryx/devil1
oryx/staff1
oryx/dirtWall_2
oryx/backOBrown
oryx/sword3
oryx/sword2
oryx/dirtWall_3
oryx/genie1
oryx/doorclosed1
oryx/wall3_2
oryx/wall1
oryx/sparkle3
oryx/book2
oryx/dirtWall_10
oryx/dirtWall_12
oryx/sparkle1
oryx/barrel1
oryx/wall3
oryx/yeti2
oryx/firedown4
oryx/wall3_0
oryx/backOrange
oryx/staff2
oryx/floor3_0
oryx/dirtWall_1
oryx/backRed
oryx/king1
oryx/archer1
oryx/dirtWall_0
oryx/sword1
oryx/floor3_1
oryx/staff3
oryx/backGrey
oryx/wall3_1
oryx/yeti3
oryx/eviltwin1
oryx/wall2
oryx/book1
oryx/dirtWall_13
oryx/wall6
oryx/sparkle4
oryx/alien3
oryx/goldsack
oryx/firedown1
oryx/bee2
oryx/wall3_5
oryx/paper2
oryx/dirtWall_4
oryx/helmet1
oryx/orb3
oryx/backBrown
oryx/orb2
oryx/dirtWall_5
oryx/sword4
oryx/shield1
oryx/paper3
oryx/wall3_4
oryx/alien2
oryx/queen1
oryx/bullet2
oryx/backBiege
oryx/evilonion1
oryx/dirtWall_14
oryx/wall5
oryx/yeti4
oryx/wall3_6
oryx/paper1
oryx/bee1
oryx/firedown2
oryx/shield3
oryx/dirtWall_7
oryx/helmet2
oryx/helmet3
oryx/orb1
oryx/dirtWall_6
oryx/shield2
oryx/firedown3
oryx/wall3_7
oryx/alien1
oryx/icedown1
oryx/wall4
oryx/bullet1
oryx/dirtWall_15
oryx/reaper1
oryx/grass_15
oryx/boots3
oryx/vampire1
oryx/coins2
oryx/trapChest1
oryx/fireright1
oryx/slime1
oryx/mummy1
oryx/coins3
oryx/boots2
oryx/grass_14
oryx/diamond1
oryx/diamond3
oryx/skull1
oryx/wall3_9
oryx/time1
oryx/coins1
oryx/dirtWall_8
oryx/slime3
oryx/fireright2
oryx/fireright3
oryx/slime2
oryx/tombstone1
oryx/dirtWall_9
oryx/iceup1
oryx/wall3_8
oryx/boots1
oryx/diamond2
oryx/axeman1
oryx/ring3
oryx/spike3
oryx/cyclop2
oryx/slash1
oryx/cape3
oryx/grass_13
oryx/necromancer1
oryx/slime6
oryx/seaWater
oryx/planet1
oryx/rat2
oryx/grass_12
oryx/cape2
oryx/spike2
oryx/ring2
oryx/backBlue
oryx/cyclop1
oryx/knight1
oryx/skeleton1
oryx/grass_10
oryx/heart1
oryx/fireright4
oryx/slime5
oryx/smoke
oryx/slime4
oryx/rat1
oryx/grass_11
oryx/cape1
oryx/spike1
oryx/ring1
oryx/bird1
oryx/fireup1
oryx/explosion1
oryx/stairsdown3
oryx/treasure2
oryx/pants1
oryx/spaceship3
oryx/bookLeft
oryx/wall11
oryx/grass_2
oryx/eye1
oryx/hammer2
oryx/spider1
oryx/feather1
oryx/grass_3
oryx/swordmankey1
oryx/ghost1
oryx/spaceship2
oryx/mage1
oryx/bat2
oryx/bow1
oryx/stairsdown2
oryx/necklace1
oryx/bird2
oryx/fireup2
oryx/explosion2
oryx/swordmankey1_1
oryx/torch1
oryx/backBlack
oryx/backLBlue
oryx/treasure1
oryx/pants2
oryx/ghost3
oryx/wall12
oryx/elf1
oryx/potion5
oryx/grass_1
oryx/hammer1
oryx/bush4
oryx/spider2
oryx/spider3
oryx/bush5
oryx/priest1
oryx/grass_0
oryx/feather2
oryx/potion4
oryx/wall13
oryx/stairsup4
oryx/ghost2
oryx/spaceship1
oryx/pants3
oryx/pickaxe
oryx/bat1
oryx/bow2
oryx/stairsdown1
oryx/swordmankey1_0
oryx/explosion3
oryx/fireup3
oryx/bird3
oryx/necklace2
oryx/floorTileOrange
oryx/bookRight
oryx/bear3
oryx/tree2
oryx/arrows2
oryx/wall17
oryx/ghost6
oryx/freak2
oryx/grass_4
oryx/mace2
oryx/bush1
oryx/angel1
oryx/grass_5
oryx/freak3
oryx/potion1
oryx/stairsup1
oryx/wall16
oryx/axe2
oryx/stairsdown4
oryx/bear2
oryx/fireup4
oryx/tree1
oryx/swordman1
oryx/bookUp
oryx/snake
oryx/arrows1
oryx/wall14
oryx/stairsup3
oryx/ghost5
oryx/potion3
oryx/freak1
oryx/grass_7
oryx/mace1
oryx/bush2
oryx/backLBrown
oryx/bush3
oryx/grass_6
oryx/potion2
oryx/ghost4
oryx/stairsup2
oryx/wall15
oryx/butcher1
oryx/axe1
oryx/door2
oryx/circleEffect1
oryx/princess1
oryx/bear1

The refine format is shown as below.
For "background > Immovable", you need to refine to "background > Immovable img=oryx/space1".`},
            {role: "user", content:
                    `Return your answer in the form of a JSON file, with field names "VGDL", "Level"
                    You only need to return this JSON file, and no other things needed. Here is the format: {"VGDL":"Your VGDL Output", \n"Level": "Your Level Output"}`
            }
        ]

        const completion2 = await client.chat.completions.create({
            messages: messages2,
            model: llm_model ?? "gpt-4o"
        })

        result = completion2.choices[0].message.content.replace("```json", "").replace("```", "")
        
        console.log(result)

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
                    <Form.Control data-bs-theme="dark" as="textarea" rows={20}
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

                <br></br>

                <Accordion data-bs-theme="dark">
                    <Accordion.Item eventKey="0">
                        <Accordion.Header>Advanced Setting</Accordion.Header>
                            <Accordion.Body>
                            <Form>

                                <FloatingLabel
                                    controlId="floatingInput"
                                    label="Model Name"
                                    className="mb-3"
                                    data-bs-theme="dark"
                                >
                                    <Form.Control data-bs-theme="dark" as="textarea" rows={3}
                                                ref={p=> this.llm_model = p}
                                                defaultValue={localStorage.getItem('LLM_MODEL') ?? "GPT-4o"}
                                                // defaultValue="GPT-4o"
                                    />

                                </FloatingLabel>

                                <FloatingLabel
                                    controlId="floatingInput"
                                    label="Custom URL"
                                    className="mb-3"
                                    data-bs-theme="dark"
                                >
                                    
                                    <Form.Control data-bs-theme="dark" as="textarea" rows={3}
                                                ref={p=> this.custom_url = p}
                                                defaultValue={localStorage.getItem('BASE_URL') ?? "https://api.openai.com/v1"}
                                    />

                                </FloatingLabel>

                            </Form>
                            </Accordion.Body>
                    </Accordion.Item>
                </Accordion>

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