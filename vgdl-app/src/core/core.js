import * as tools from "./tools.js";

export class Node{
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

        const content = line.trim()

        if(content.length > 0){
            const indent = line.length - line.trim().length
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


// var parse = {
//     // parseInteractions
//     'InteractionSet' : function (inodes) {
//         inodes.forEach(function (inode) {
//             if (inode.content.indexOf('>') != -1) {
//                 var [pair, edef] = inode.content.split('>').map(function (s) {
//                     return s.trim();
//                 });
//                 var [eclass, args] = _parseArgs(edef);
//                 parser.game.collision_eff.push(
//                     pair.split(' ').map(s => {
//                         return s.trim();
//                     }).filter(s => {return s}).concat([eclass, args])
//                 );
//                 if (verbose) {
//                     console.log('Collision', pair, 'has effect:', edef);
//                 }
//             }
//         });

//     },
//     //parseSprites
//     'SpriteSet' : function (snodes, parentClass = null, parentargs = {}, parenttypes = []) {
//         snodes.forEach(function (snode) {
//             console.assert(snode.content.indexOf('>') != -1);
//             var [key, sdef] = snode.content.split('>').map(function (s) {
//                 return s.trim();
//             });
//             var [sclass, args] = _parseArgs(sdef, parentClass, Object.assign({}, parentargs));

//             if ('image' in args) {
//                 images.push(args.image)
//             }
//             var stypes = parenttypes.concat(key);
//             if ('singleton' in args) {
//                 if (args['singleton'] == true) 
//                     parser.game.singletons.push(key);
//                 args = tools.clone(args);
//                 delete args['singleton'];
//             }

//             if (snode.children.length == 0) {
//                 if (verbose) 
//                     console.log('Defining:', key, sclass, args, stypes);
//                 parser.game.sprite_constr[key] = [sclass, args, stypes];

//                 if (args.color && !('color' in parentargs) && !(ignore_colors.contains(key))) {
//                     var_colors[key] = args.color;
//                 }

//                 if (parser.game.sprite_order.contains(key)); 
//                     parser.game.sprite_order.remove(key)
//                 parser.game.sprite_order.push(key);
//             } else {
//                 parse['SpriteSet'](snode.children, sclass, args, stypes);
//             }
//         })
//     },
//     //parseTerminations
//     'TerminationSet' : function (tnodes) {
//         tnodes.forEach(function (tnode) {
//             var [sclass, args] = _parseArgs(tnode.content);
//             if (verbose)
//                 console.log('Adding:', sclass, args);
//             parser.game.terminations.push(new sclass(args));
//         });
//     },
//     //parseConditions
//     'ConditionalSet' : function (cnodes) {
//         cnodes.forEach(function (cnode) {
//             if (cnode.content.indexOf('>') != -1) {
//                 var [conditional, interaction] = cnode.content.split('>').map(function (s) {
//                     return s.trim();
//                 });

//                 var [cclass, cargs] = _parseArgs(conditional);
//                 var [eclass, eargs] = _parseArgs(interaction);

//                 parser.game.conditions.push([new cclass(cargs), [eclass, eargs]]);
//             }
//         });

//     },

//     //parseMapping
//     'LevelMapping' : function (mnodes) {
//         mnodes.forEach(function (mnode) {
//             var [c, val] = mnode.content.split('>').map(function (x) {
//                 return x.trim();
//             });

//             console.assert(c.length == 1, "Only single character mappings allowed");

//             var keys = val.split(' ').map(function (x) {
//                 return x.trim();
//             });

//             if (verbose) 
//                 console.log("Mapping", c, keys);

//             parser.game.char_mapping[c] = keys;
//         });			
//     }
// }

export class VGDLParser{
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
                    // this.parseSprites(c.children)
                    break
                case "InteractionSet":
                    break
                case "LevelMapping":
                    break
                case "TerminationSet":
                    this.parseTermination(c.children)
                    break
                case "ConditionSet":
                    break
                default:
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

    parseInteraction = (inodes)=> {
        inodes.forEach(i=> {
            if(i.content.indexOf('>') != -1){
                const [pair, edef] = i.content.split('>').map(s=>s.trim())
                var [eclass, args] = this.parseArgs(edef)

                this.game.collision_eff.push(
                    pair.split(' ').map(s=>s.trim()).filter(s=>s).concat([eclass, args])
                )

                console.debug(`Collision ${pair} has effect: ${edef}`)
            }
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
                    this.var_colors[key] = args.color
                }

                if (this.game.sprite_order.contains(key))
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


export class VGDLSprite{
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
            // this.physics
        }
    }

    updatePosition = (orientation, speed = null)=>{
        speed = speed ?? this.speed
        if(!(this.cooldown > this.lastmove || Math.abs(orientation[0]) + Math.abs(orientation[1]) === 0 )){

            this.lastmove = 0
        }
    }
}
