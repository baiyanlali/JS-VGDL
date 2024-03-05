import * as tools from "./tools";

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

function _eval (estr) {
    if(estr === "True")
        return true
    if(estr === "False")
        return false
    return eval(estr)
}

class VGDLParser{
    game = null
    images = ['error.png']
    ignore_colors = ['wall', 'avatar']
    constructor() {
    }

    parseGame = (tree)=> {

        if(!(tree instanceof Node))
            tree = indentTreeParser(tree)
        const root = tree.children[0]
        const [sclass, args] = this.parseArgs(root.content)
        this.game = new sclass(args)

        // Parse Parameter Set first
        for (const c of root.children) {
            if(c.content === "ParameterSet"){

            }
        }

        for (const c of root.children) {
            switch (c.content) {
                case "SpriteSet":
                    this.parseSprites(c.children)
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

    parseTermination = (tnodes)=>{
        tnodes.forEach(t=>{
            const [sclass, args] = this.parseArgs(t.content)
            console.debug(`Adding: ${sclass} ${args}`)
            this.game.terminations.push(new sclass(args))
        })
    }

    parseSprites = (snodes, parentClass = null, parentargs = {}, parenttypes = [])=>{
        snodes.forEach(s => {
            console.assert(s.content.indexOf('>') !== -1)
            const [key, sdef] = s.content.split('>').map(function (s) {
                return s.trim()
            })
            let [sclass, args] = this.parseArgs(sdef, parentClass, Object.assign({}, parentargs))

            if ('image' in args) {
                this.images.push(args.image)
            }

            const stypes = parenttypes.concat(key);
            if ('singleton' in args) {
                if (args['singleton'] === true)
                    this.game.singletons.push(key)
                args = tools.clone(args)
                delete args['singleton']
            }

            if (s.children.length === 0) {

                console.debug(`Defining: ${key} ${sclass} ${args} ${stypes}`)
                this.game.sprite_constr[key] = [sclass, args, stypes]

                if (args.color && !('color' in parentargs) && !(this.ignore_colors.contains(key))) {
                    var_colors[key] = args.color
                }

                if (parser.game.sprite_order.contains(key))
                this.game.sprite_order.remove(key)
                this.game.sprite_order.push(key)
            } else {
                this.parseSprites(s.children, sclass, args, stypes)
            }
        })
    }

    parseArgs = (s, sclass = {}, args = {}) => {
        let sparts = s.split(' ').filter(c=>c.length>0).map(c=>c.trim())
        if(sparts.length === 0)
            return [sclass, args]

        if(sparts[0].indexOf('=') === -1){
            sclass = _eval(sparts[0])
            sparts = sparts.slice(1)
        }

        sparts.forEach(spart => {
            const [k, val] = spart.split('=')

            try {
                args[k] = _eval(val)
            }catch (e) {
                args[k] = val
            }
        })
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
