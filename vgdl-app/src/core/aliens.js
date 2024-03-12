

export const aliens_game = `
BasicGame block_size=10
  SpriteSet
    background > Immovable randomtiling=0.9 img=oryx/floor3 hidden=True
    goal  > Immovable color=GREEN img=oryx/doorclosed1
    key   > Immovable color=ORANGE img=oryx/key2
    sword > OrientedFlicker limit=5 singleton=True img=oryx/slash1
    movable >
      avatar  > ShootAvatar   stype=sword frameRate=8
        nokey   > img=oryx/swordman1_0
        withkey > color=ORANGE img=oryx/swordmankey1_0
      enemy >
        monsterQuick > RandomNPC cooldown=2 cons=6 img=oryx/bat1
        monsterNormal > RandomNPC cooldown=4 cons=8 img=oryx/spider2
        monsterSlow > RandomNPC cooldown=8 cons=12 img=oryx/scorpion1
    wall > Immovable autotiling=true img=oryx/wall3


  LevelMapping
    . > background
    g > background goal
    + > background key      
    A > background nokey
    1 > background monsterQuick
    2 > background monsterNormal
    3 > background monsterSlow
    w > wall


  InteractionSet
    movable wall  > stepBack
    #nokey goal    > stepBack
    goal withkey  > killSprite scoreChange=1
    enemy sword > killSprite scoreChange=2
    enemy enemy > stepBack
    avatar enemy > killSprite scoreChange=-1
    nokey key     > transformTo stype=withkey
    key  avatar   > killSprite scoreChange=1

  TerminationSet
    SpriteCounter stype=goal   win=True
    SpriteCounter stype=avatar win=False`

export const aliens_map = `
wwwwwwwwwwwww
wA.......w..w
w..w........w
w...w...w.+ww
www.w2..wwwww
w.......w.g.w
w.2.........w
w.....2.....w
wwwwwwwwwwwww`

// export const aliens_game = `
// BasicGame block_size=5
//     SpriteSet
//         background > Immovable img=oryx/space1 hidden=True
//         base    > Immovable    color=WHITE img=oryx/space5
//         avatar  > FlakAvatar   stype=sam img=oryx/spaceship1
//         missile > Missile
//             sam  > orientation=UP    color=BLUE singleton=True img=oryx/bullet2
//             bomb > orientation=DOWN  color=RED  speed=0.5 img=oryx/bullet2
//         alien   > Bomber       stype=bomb   prob=0.05  cooldown=3 speed=0.8
//             alienGreen > img=oryx/alien3
//             alienBlue > img=oryx/alien1
//         portal  > invisible=True hidden=True
//             portalSlow  > SpawnPoint   stype=alienBlue  cooldown=16   total=20
//             portalFast  > SpawnPoint   stype=alienGreen  cooldown=12   total=20
    
//     LevelMapping
//         . > background
//         0 > background base
//         1 > background portalSlow
//         2 > background portalFast
//         A > background avatar

//     TerminationSet
//         SpriteCounter      stype=avatar               limit=0 win=False
//         MultiSpriteCounter stype1=portal stype2=alien limit=0 win=True
        
//     InteractionSet
//         avatar  EOS  > stepBack
//         alien   EOS  > turnAround
//         missile EOS  > killSprite

//         base bomb > killBoth
//         base sam > killBoth

//         base   alien > killSprite
//         avatar alien > killSprite scoreChange=-1
//         avatar bomb  > killSprite scoreChange=-1
//         alien  sam   > killSprite scoreChange=2`




// export const aliens_map = `
// 1.............................
// 000...........................
// 000...........................
// ..............................
// ..............................
// ..............................
// ..............................
// ....000......000000.....000...
// ...00000....00000000...00000..
// ...0...0....00....00...00000..
// ................A.............`

