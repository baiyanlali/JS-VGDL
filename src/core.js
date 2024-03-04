class Node{
    constructor(content, indent, parent = null){
        this.children = []
        this.content = content
        this.indent = indent
        this.parent = null
        if(parent)
            parent.insert(this)
    }

    insert = (node)=> {
        if(this.indent < node.indent){
            this.children.push(node)
            node.parent = this
        }else{
            this.parent.insert(node)
        }
    }

    getRoot = ()=>{
        if(this.parent)
            return this.parent.getRoot()
        else
            return this
    }
}

function indentTreeParser(s = '', tabsize = 8){
    s = s.replace('\t', ' '.repeat(tabsize))
    s = s.replace('(', ' ').replace(')', ' ').replace(',', ' ')
    let lines = s.split('\n')

    let last = new Node('', -1)

    const root = last

    for (let line of lines) {
        if(line.includes("#")){
            line = line.split("#")[0]
        }

        const content = line.trimStart()

        if(content.length > 0){
            const indent = line.length - line.trim().trimStart
            last = new Node(content, indent, last)
        }
    }
    return root
}

class VGDLParser{
    constructor() {
    }

    parseGame = (tree)=> {
        tree = indentTreeParser(tree)
        const root = tree.children[0]

        // Parse Parameter Set first
        for (const c of root.children) {
            if(c.content === "ParameterSet"){

            }
        }

        for (const c of root.children) {
            switch (c.content) {
                case "SpriteSet":
                    break
                case "InteractionSet":
                    break
                case "LevelMapping":
                    break
                case "TerminationSet":
                    break
            }
        }
    }

    parseSprites = ()=>{

    }

    parseArgs = (s, sclass = null, args = null) => {
        if(!args)
            args = {}
        const sparts = s.split(' ').filter(c=>c.length>0).map(c=>c.trimStart())
        if(sparts.length === 0)
            return [sclass, args]

    }

}


class VGDLSprite{
    name = ""
    COLOR_DISC = [20,80,140,200]
    dirtyrects = []

    is_static= false
    only_active =false
    is_avatar= false
    is_stochastic = false
    color    = null
    cooldown = 0 // pause ticks in-between two moves
    speed    = null
    mass     = 1
    physicstype=null
    shrinkfactor=0

    lastmove = 0
    constructor(pos, size=[10, 10], color = null,
                speed = null, cooldown=null, physicstype=null) {
        this.pos = pos
        this.size = size
        this.physicstype = physicstype
        this.physics = new this.physicstype()
        this.speed = speed ?? this.speed
        this.cooldown = cooldown ?? this.cooldown
        this.color = color ?? this.cooldown
    }

    update = ()=>{
        this.lastmove += 1
        if(this.is_static === false && this.only_active){
            this.physics
        }
    }

    updatePosition = (orientation, speed = null)=>{
        speed = speed ?? this.speed
        if(!(this.cooldown > this.lastmove || abs(orientation[0]) + abs(orientation[1]) === 0 )){

            this.lastmove = 0
        }
    }
}
