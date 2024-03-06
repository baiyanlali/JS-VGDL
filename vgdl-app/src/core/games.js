import {GOLD, Termination} from "./ontology";
import {defaultDict} from "./tools";

const MAX_SPRITS = 10000

export class BasicGame{
    default_mapping = {
        'w': ['wall'],
        'A': ['avatar']
    }

    block_size = 10
    load_save_enabled = true
    disableContinuousKeyPress = true
    image_dir = '../sprites'

    //用于显示游戏画面，这样做可以解耦游戏核心和显示部分
    displayHook = []
    args = {}

    score = 0
    bonus_score = 0
    real_start_time = 0
    real_time = 0
    time = 0
    ended = false
    num_sprites = 0
    kill_list = []
    all_killed = []

    frame_rate = 20

    sprite_constr = {'wall': [Immovable, {'color': DARKGRAY}, ['wall']],
        'avatar': [MovingAvatar, {}, ['avatar']]};

    // z-level of sprite types (in case of overlap)
    sprite_order = ['wall', 'avatar'];

    // contains instance lists
    sprite_groups = {};
    // which sprite types (abstract or not) are singletons?
    singletons = [];
    // collision effects (ordered by execution order)
    collision_eff = [];


    playback_actions = [];
    playbacx_index = 0;
    // for reading levels
    char_mapping = {};
    // temination criteria
    terminations = [new Termination()];
    // conditional criteria
    conditions = [];
    // resource properties
    resources_limits = new defaultDict(2);
    resources_colors = new defaultDict(GOLD);

    is_stochastic = false;
    _lastsaved = null;
    win = null;
    effectList = []; // list of effects that happened this current time step
    spriteDistribution = {};
    movement_options = {};
    all_objects = null;

    lastcollisions = {};
    steps = 0;
    gameStates = [];
    realGameStates = [];
    keystate = {}
    EOS = new EOS();
    sprite_bonus_granted_on_timestep = -1; // to ensure you only grant bonus once per timestep (since you check _isDone() multiple times)
    timeout_bonus_granted_on_timestep = -1; // to ensure you only grant bonus once per timestep (since you check _isDone() multiple times)

    constructor(displayHook, args) {
        this.displayHook = displayHook
        this.args = args

        for (const argsKey in args) {
            this[argsKey] = args[argsKey]
        }

        this.reset()
    }

    reset = ()=>{
        this.score = 0
        this.bonus_score = 0
        this.real_start_time = 0
        this.real_time = 0
        this.time = 0
        this.ended = false
        this.num_sprites = 0
        this.kill_list = []
        this.all_killed = []
    }

    buildLevel = (lstr) => {
        
    }



}