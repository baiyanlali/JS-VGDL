export default Ontology
const Ontology = {
    // game types
    "BasicGame": 0,
    // constants
    "GREEN": [0, 200, 0],
    "BLUE" : [0, 0, 200],
    "RED" : [200, 0, 0],
    "GRAY" : [90, 90, 90],
    "WHITE" : [250, 250, 250],
    "BROWN" : [140, 120, 100],
    "BLACK" : [0, 0, 0],
    "ORANGE" : [250, 160, 0],
    "YELLOW" : [250, 250, 0],
    "PINK" : [250, 200, 200],
    "GOLD" : [250, 212, 0],
    "LIGHTRED" : [250, 50, 50],
    "LIGHTORANGE" : [250, 200, 100],
    "LIGHTBLUE" : [50, 100, 250],
    "LIGHTGREEN" : [50, 250, 50],
    "LIGHTGRAY" : [150, 150, 150],
    "DARKGRAY" : [30, 30, 30],
    "DARKBLUE" : [20, 20, 100],
    "UP" : [0, -1],
    "DOWN" : [0, 1],
    "LEFT" : [-1, 0],
    "RIGHT" : [1, 0],
    "BASEDIRS" : [Ontology.UP, Ontology.LEFT, Ontology.DOWN, Ontology.RIGHT]
}

class GridPhysics{
    passiveMovement = (sprite) => {
        let speed = sprite.speed ?? 1

    }
}