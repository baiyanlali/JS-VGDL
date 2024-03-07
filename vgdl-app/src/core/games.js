import {defaultDict} from "./tools.js";
import {DARKGRAY, GOLD} from "./ontology/constants.js";
import {Immovable, EOS} from "./ontology/vgdl-sprite.js";
import {Avatar, MovingAvatar} from "./ontology/avatar.js";
import {Termination} from "./ontology/termination.js";
import {stochastic_effects} from "./ontology/effect.js";

const MAX_SPRITES = 10000

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
    effectList = []; // list of effects this happened this current time step
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
        let lines = lstr.split('\n').map(l => {return l.trimEnd()}).filter(l => {return l.length > 0});
		let lengths = lines.map((line) => line.length);

		console.assert(Math.min.apply(null, lengths) === Math.max.apply(null, lengths), "Inconsistent line lengths");

		this.width = lengths[0];
		this.height = lines.length;

		console.assert(this.width > 1 && this.height > 1, 'Level too small');

		// rescale pixels per block to adapt to the level
		let window_width = window.innerWidth/1.5;
		let window_height = window.innerHeight/2;

		this.block_size =parseInt(Math.min(window_height/this.height, window_width/this.width));
		this.screensize = [this.width*this.block_size, this.height*this.block_size];

		//Set up resources
		for (let res_type in this.sprite_constr) {
		   if (!(this.sprite_constr.hasOwnProperty(res_type))) continue;
			let [sclass, args, _] = this.sprite_constr[res_type];
			if (new sclass(gamejs, 0, 0, args) instanceof Resource) {

				if (args['res_type']) {
					res_type = args['res_type'];
				}
				if (args['color']) {
					this.resources_colors[res_type] = args['color'];
				}
				if (args['limit']) {
					this.resources_limits[res_type] = args['limit'];
				}
			}
			else {
				this.sprite_groups[res_type] = []
			}
		};

		// create sprites
		lines.forEach( (line, row) => {
			for (let col in line) {
				let c = line[col];
				if (c in this.char_mapping) {
					let pos = [col*this.block_size, row*this.block_size];
					this._createSprite(this.char_mapping[c], pos);
				} else if (c in this.default_mapping) {
					let pos = [col*this.block_size, row*this.block_size];
					this._createSprite(this.default_mapping[c], pos);
				}
			}
		});

		this.kill_list = [];

		this.collision_eff.forEach((item) => {
            const effect = item[2]
			if (stochastic_effects.indexOf(effect) !== -1)
				this.is_stochastic = true;
		});
    }

    _createSprite = (keys, props) => {
        let res = [];
		keys.forEach((key) => {

			if (this.num_sprites > MAX_SPRITES) {
				console.log('Sprite limit reached.');
				return;
			}
			let [sclass, args, stypes] = this.sprite_constr[key];
			let anyother = false;

			stypes.reverse().forEach(pk => {
				if (this.singletons.contains(pk)){
					if (this.numSprites(pk) > 0) {
						anyother = true;
					}
				}					
			})
			if (anyother) return;
			args.key = key;
			let s = new sclass(pos, [this.block_size, this.block_size], args);
			s.stypes = stypes;

			if (this.sprite_groups[key])
				this.sprite_groups[key].push(s);
			else 
				this.sprite_groups[key] = [s];
			this.num_sprites += 1;
			if (s.is_stochastic)
				this.is_stochastic = true;
			res.push(s);
		});

		return res;
    }

    getSprites = (key) => {
        if (this.sprite_groups[key] instanceof Array)
			return this.sprite_groups[key].filter(s => {return this.kill_list.indexOf(s) === -1});
		else
			return this._iterAll().filter(s => {return (s.stypes.contains(key) && this.kill_list.indexOf(s) === -1)});
    }

    getAvatars = (key) => {
        const res = []
        if(this.sprite_groups.hasOwnProperty(key)){
            const ss = this.sprite_groups[key]
            if(ss && ss[0] instanceof Avatar)
                res.concat(ss.filter(s=> this.kill_list.indexOf(s) === -1))
        }
        return res
    }


}