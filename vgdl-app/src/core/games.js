import {defaultDict} from "./tools.js";
import {colorDict, DARKGRAY, GOLD} from "./ontology/constants.js";
import {Immovable, EOS} from "./ontology/vgdl-sprite.js";
import {Avatar, MovingAvatar} from "./ontology/avatar.js";
import {Termination} from "./ontology/termination.js";
import {stochastic_effects} from "./ontology/effect.js";
import {Resource} from "./ontology/resource";

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

    ignoredattributes = ['stypes',
        'name',
        'lastmove',
        'color',
        'lastrect',
        'resources',
        'physicstype',
        'physics',
        'rect',
        'alternate_keys',
        'res_type',
        'stype',
        'ammo',
        'draw_arrow',
        'shrink_factor',
        'prob',
        'is_stochastic',
        'cooldown',
        'total',
        'is_static',
        'noiseLevel',
        'angle_diff',
        'only_active',
        'airsteering',
        'strength',
        'gamejs'
    ];

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
			if (new sclass(0, 0, args) instanceof Resource) {

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

    randomizeAvatar = ()=> {
        if(this.getAvatars().length === 0)
            this._createSprite(['avatar'], [0, 0])
    }

    _createSprite = (keys, pos) => {
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

    _createSprite_cheap = (key, pos) => {
        const [sclass, args, stypes] = this.sprite_constr[key];
        const s = new sclass(pos, [this.block_size, this.block_size], args);
        s.stypes = stypes;
        this.sprite_groups[key].push(s);
        this.num_sprites += 1;
        return s;
    }

    _iterAll = () => {
        if (this.sprite_order[this.sprite_order.length-1] !== 'avatar') {
            this.sprite_order.remove('avatar');
            this.sprite_order.push('avatar');
        }
        return this.sprite_order.reduce((base, key) => {
            if (this.sprite_groups[key] === undefined)
                return base;
            return base.concat(this.sprite_groups[key]);
        }, []);
    }

    numSprites = (key) => {

        const deleted = this.kill_list.filter((s) => {return s.stypes[key]}).length;
        if (key in this.sprite_groups) {
            return this.sprite_groups[key].length-deleted;
        }
        else{
            return this._iterAll().filter(s => {return s.stypes.contains(key)}).length - deleted; // Should be __iter__ - deleted
        }

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

    getObjects = () => {
        //TODO: Change position
        const obj_list = {};
        const fs = this.getFullState();
        const obs = Object.copy(fs['objects']);

        for (let obj_type in obs) {
            this.getSprites(obj_type).forEach((obj) => {
                const features = {'color': colorDict[obj.color.toString()],
                    'row': [obj.rect.top]};
                const type_vector = {'color': colorDict[obj.color.toString()],
                    'row': [obj.rect.top]};
                const sprite = obj;
                obj_list[obj.ID] = {'sprite': sprite,
                    'position': [obj.rect.left, obj.rect.top],
                    'features': features,
                    'type': type_vector};
            });
        }

        return obj_list;
    }
    getFirstState = () => {
        let ias = this.ignoredattributes;
        let obs = {};
        let killed = {};
        let actions = Object.keys(this.keystate).filter(key => {
            return this.keystate[key]
        })
        this.steps += actions.length;
        for (let key in this.sprite_groups) {
            if (!(this.sprite_groups.hasOwnProperty(key))) break;
            let ss = {};
            this.getSprites(key).forEach((s) => {

                let attrs = {};
                Object.keys(s).forEach((a) => {
                    let val = s[a];
                    if (ias.indexOf(a) === -1) {
                        attrs[a] = val;
                    }
                });
                if (s.resources) {
                    attrs['resources'] = s.resources; // Should be object
                }

                ss[s.ID] = Object.copy(attrs)
            });
            obs[key] = Object.copy(ss);
        };

        const object_cur = Object.copy(obs);
        const object_data = Object.copy(obs);

        function notEmpty(data) {
            if(typeof(data) == 'number' || typeof(data) == 'boolean') {
                return true;
            }

            if(typeof(data) == 'undefined' || data === null) {
                return false;
            }

            if(typeof(data.length) != 'undefined') {
                return data.length !== 0;
            }

            let count = 0;

            for(let i in data) {
                if(data.hasOwnProperty(i)) {
                    count ++;
                }
            }

            return count !== 0;
        }

        for (let sprite_type in object_cur) {
            if (sprite_type === 'avatar') {
                //for (instance in object_cur[sprite_type]) {
                //	object_data[sprite_type] = {};
                //	object_data[sprite_type][instance] = {};
                //	object_data[sprite_type][instance]['x'] = object_cur[sprite_type][instance]['x'];
                //	object_data[sprite_type][instance]['y'] = object_cur[sprite_type][instance]['y'];
                //	object_data[sprite_type][instance]['resources'] = object_cur[sprite_type][instance]['resources'];
                //	object_data[sprite_type][instance]['direction'] = object_cur[sprite_type][instance]['direction'];
                //}
                //object_data[sprite_type] = object_cur[sprite_type];
                continue;
            }
            // Else sprite type is not 'avatar'
            let sprite_info = object_cur[sprite_type];
            for (let index in sprite_info) {
                let one_sprite = sprite_info[index];
                let updated_info = {};
                if ('resources' in one_sprite) {
                    if (notEmpty(one_sprite['resources'])) {
                        //Object.keys(one_sprite['resources']).length > 0) {
                        updated_info['resources'] = one_sprite['resources'];
                        updated_info['x'] = one_sprite['x'];
                        updated_info['y'] = one_sprite['y'];
                        object_data[sprite_type][index] = updated_info;
                    } else {
                        updated_info['x'] = one_sprite['x'];
                        updated_info['y'] = one_sprite['y'];
                        object_data[sprite_type][index] = updated_info;
                    }
                } else {
                    updated_info['x'] = one_sprite['x'];
                    updated_info['y'] = one_sprite['y'];
                    object_data[sprite_type][index] = updated_info;
                }
            }
        }


        return {'frame': this.time,
            'score': this.bonus_score,
            //'bonus_score': this.bonus_score,
            'ended': this.ended,
            'win'  : this.win,
            'objects': object_data,
            //Object.copy(obs),
            'killed': killed,
            'actions': actions,
            'events': this.effectList,
            'real_time': this.real_time,
        };
    }

    getFullState = () => {
        let ias = this.ignoredattributes;
        let obs = {};
        let killed = {};
        let actions = Object.keys(this.keystate).filter(key => {
            return this.keystate[key]
        })
        this.steps += actions.length;
        for (let key in this.sprite_groups) {
            if (!(this.sprite_groups.hasOwnProperty(key))) break;
            let ss = {};
            this.getSprites(key).forEach((s) => {

                let attrs = {};
                Object.keys(s).forEach((a) => {
                    let val = s[a];
                    if (ias.indexOf(a) === -1) {
                        attrs[a] = val;
                    }
                });
                if (s.resources) {
                    attrs['resources'] = s.resources; // Should be object
                }

                ss[s.ID] = Object.copy(attrs)
            });
            obs[key] = Object.copy(ss);
        };

        const object_cur = Object.copy(obs);
        const object_data = Object.copy(obs);

        function notEmpty(data) {
            if(typeof(data) == 'number' || typeof(data) == 'boolean') {
                return true;
            }

            if(typeof(data) == 'undefined' || data === null) {
                return false;
            }

            if(typeof(data.length) != 'undefined') {
                return data.length !== 0;
            }

            let count = 0;

            for(let i in data) {
                if(data.hasOwnProperty(i)) {
                    count ++;
                }
            }

            return count !== 0;
        }

        for (let sprite_type in object_cur) {

            if (sprite_type === 'wall') {
                continue;
            }

            if (sprite_type === 'avatar') {
                for (let instance in object_cur[sprite_type]) {
                    object_data[sprite_type] = {};
                    object_data[sprite_type][instance] = {};
                    object_data[sprite_type][instance]['x'] = object_cur[sprite_type][instance]['x'];
                    object_data[sprite_type][instance]['y'] = object_cur[sprite_type][instance]['y'];
                    object_data[sprite_type][instance]['resources'] = object_cur[sprite_type][instance]['resources'];
                    object_data[sprite_type][instance]['direction'] = object_cur[sprite_type][instance]['direction'];
                }
                //object_data[sprite_type] = object_cur[sprite_type];
                continue;
            }

            let sprite_info = object_cur[sprite_type];
            for (let index in sprite_info) {
                let updated_info = {};
                let one_sprite = sprite_info[index];
                if ('resources' in one_sprite) {
                    if (notEmpty(one_sprite['resources'])) {
                        //Object.keys(one_sprite['resources']).length > 0) {
                        updated_info['resources'] = one_sprite['resources'];
                        updated_info['x'] = one_sprite['x'];
                        updated_info['y'] = one_sprite['y'];
                        object_data[sprite_type][index] = updated_info;
                    } else {
                        updated_info['x'] = one_sprite['x'];
                        updated_info['y'] = one_sprite['y'];
                        object_data[sprite_type][index] = updated_info;
                    }
                } else {
                    updated_info['x'] = one_sprite['x'];
                    updated_info['y'] = one_sprite['y'];
                    object_data[sprite_type][index] = updated_info;
                }
            }
        };

        delete object_data["wall"];

        return {'frame': this.time,
            'score': this.bonus_score,
            //'bonus_score': this.bonus_score,
            'ended': this.ended,
            'win'  : this.win,
            'objects': object_cur,
            //object_data
            'killed': killed,
            //Object.copy(obs),
            'actions': actions,
            'events': this.effectList,
            'real_time': this.real_time,
        };
    }


    _updateAll = () => {
        this._iterAll().forEach(sprite => {
            try {
                if (!(sprite.crashed))
                    sprite.update(this);
            } catch (err) {
                if ((!sprite.crashed)) {
                    console.error('could not update', sprite.name)
                    console.error(err);
                    sprite.crashed = true;
                }

            }
        })

    }

    _updateCollisionDict =  (changedsprite) => {
        for (let key in changedsprite.stypes) {
            if (key in this.lastcollisions)
                delete this.lastcollisions[key];
        }
    }

    _terminationHandling = ( ) => {
        let break_loop = false
        this.terminations.forEach(t => {
            //if (break_loop) return;
            if (break_loop) return;
            const [ended, win] = t.isDone(this);

            this.ended = ended;
            if (this.ended) {
                if (win) {
                    //if (this.score <= 0)
                    //this.score += 1;
                    this.win = true;
                } else {
                    //this.score -= 1;
                    this.win = false;
                }
                break_loop = true;
            }
        });
    }

    _getAllSpriteGroups =  () => {
        const lastcollisions = {};

        this.collision_eff.forEach((eff) => {
            const [class1, class2, effect, kwargs] = eff;

            [class1, class2].forEach((sprite_class) => {
                if (!(sprite_class in lastcollisions)) {
                    let sprite_array = [];
                    if (sprite_class in this.sprite_groups) {
                        sprite_array = this.sprite_groups[sprite_class].slice();
                    } else {
                        const sprites_array = []
                        Object.keys(this.sprite_groups).forEach(key => {

                            const sprites = this.sprite_groups[key].slice();
                            if (sprites.length && sprites[0].stypes.contains(sprite_class)) {
                                sprite_array = sprite_array.concat(sprites);
                            }

                        })
                    }
                    lastcollisions[sprite_class] = sprite_array;
                }
            })
        })
        return Object.assign(lastcollisions, this.sprite_groups);
    }

    _multi_effect = () => {
        function r (sprite, partner, game, kwargs) {
            let value;
            for (let i = 0; i < arguments.length; i++) {
                value = arguments[i](sprite, partner, game, kwargs)
            }
            return value;
        }
        return r;
    }

    _eventHandling = () => {

        this.effectList = [];

        let push_effect = 'bounceForward';
        let back_effect = 'stepBack';

        // list of objects sets
        let force_collisions = [];

        // object sets
        let new_collisions = {0: 0};
        let collisions = {};

        let new_effects = [];

        // make a copy of the kill list
        let dead = this.kill_list.slice();
        let loop = 0 // Simply to prevent infinitely looping
        while (Object.keys(new_collisions).length && loop < 7) {
            loop ++;
            if (loop > 5) {
                console.log('resolving too many collisions');
            }

            new_collisions = {};
            new_effects = [];

            // update collision sprites
            this.lastcollisions = this._getAllSpriteGroups();

            this.collision_eff.forEach((eff) => {
                let [class1, class2, effect, kwargs] = eff;

                // Special cases
                if (class2 === 'EOS') {
                    let ss1 = this.lastcollisions[class1];
                    ss1.forEach((s1) => {
                        if (!(new gamejs.Rect([0, 0], this.screensize).collideRect(s1.rect))) {
                            let e = effect(s1, this.EOS, this, kwargs);
                            if (e !== null) {
                                this.effectList.push(e);
                            }
                        }
                    });

                    return;
                }

                let sprite_array1 = this.lastcollisions[class1];
                let sprite_array2 = this.lastcollisions[class2];



                let score = 0;
                if ('scoreChange' in kwargs) {
                    kwargs = Object.assign({}, kwargs);
                    kwargs.score = kwargs['scoreChange'];
                    let effect = this._multi_effect(effect, scoreChange)
                    delete kwargs['scoreChange'];
                }
                let dim = null;
                if ('dim' in kwargs) {
                    kwargs = Object.assign({}, kwargs);
                    dim = kwargs['dim'];
                    delete kwargs['dim'];
                }

                sprite_array1.forEach(sprite1 => {
                    let rects = sprite_array2.map(os => {return os.rect});
                    if (sprite1.rect.collidelistall(rects) === -1) return ;
                    sprite1.rect.collidelistall(rects).forEach((ci) => {
                        let sprite2 = sprite_array2[ci];
                        if (sprite1 === sprite2
                            || dead.contains(sprite1)
                            || dead.contains(sprite2)
                            || (sprite1 in collisions
                                && collisions[sprite1].contains(sprite2))) {
                            return;
                        }

                        // update new collision set
                        if (sprite1 in new_collisions) {
                            new_collisions[sprite1].push(sprite2)
                        }
                        else {
                            new_collisions[sprite1] = [sprite2]
                        }


                        if (score > 0)
                            this.score += score;
                        this.bonus_score += score;

                        if ('applyto' in kwargs) {
                            let stype = kwargs['applyto'];

                            let kwargs_use = deepcopy(kwargs);
                            delete kwargs_use['applyto'];
                            this.getSprites(stype).forEach((sC) => {
                                let e = effect(sC, sprite1, self, kwargs_use);
                            });
                            this.effectList.push(e);
                            return;
                        }


                        if (dim) {
                            let sprites = this.getSprites(class1);
                            let spritesFiltered = sprites.filter((sprite) => {
                                return sprite[dim] === sprite2[dim];
                            });

                            spritesFiltered.forEach((sC) => {
                                if (!(sprite1 in dead)) {

                                    let e = effect(sprite1, sC, this, kwargs);
                                }
                                this.effectList.push(e);
                            });
                        }

                        if (effect.name === 'changeResource') {
                            let resource = kwargs['resource'];
                            let [sclass, args, stypes] = this.sprite_constr[resource];
                            let resource_color = args['color'];
                            new_effects.push(effect(sprite1, sprite2, resource_color, this, kwargs));
                        } else if (effect.name === 'transformTo') {
                            new_effects.push(effect(sprite1, sprite2,this, kwargs));
                            let new_sprite = this.getSprites(kwargs['stype'])[-1]
                            new_collisions[sprite1].push(new_sprite);
                            dead.push(sprite1)

                        } else if (effect.name === push_effect) {
                            let contained = false;
                            if (force_collisions.length) {
                                force_collisions.forEach(collision_set => {
                                    if (collision_set.contains(sprite2)) {
                                        collision_set.push(sprite1)
                                        contained = true;
                                    }
                                })
                            }
                            if (!(contained)) {
                                force_collisions.push([sprite1, sprite2]);
                            }
                            new_effects.push(effect(sprite1, sprite2, this, kwargs));
                        } else if (effect.name === back_effect) {
                            let contained = false;

                            if (force_collisions.length) {
                                force_collisions.forEach(collision_set => {
                                    if (collision_set.contains(sprite1)) {
                                        collision_set.forEach(sprite => {
                                            new_effects.push(effect(sprite, sprite2, this, kwargs));
                                        })
                                        contained = true;
                                    }
                                })
                            }
                            if (!(contained)) {
                                new_effects.push(effect(sprite1, sprite2, this, kwargs));
                            }
                        } else {
                            new_effects.push(effect(sprite1, sprite2, this, kwargs));
                        }

                    });
                });
            });
            this.effectList = this.effectList.concat(new_effects);
            Object.keys(new_collisions).forEach(collision_sprite => {
                if (collision_sprite in collisions)
                    collisions = collisions[collision_sprite].concat(new_collisions[collision_sprite])
                else
                    collisions[collision_sprite] = new_collisions[collision_sprite]
            })
        }
        return this.effectList;
    }

    run = (on_game_end) => {
        this.on_game_end = on_game_end;
        return this.startGame;
    }

    startGame =  () => {
        this.reset();
        // let clock = gamejs.time.Clock();
        // if (this.playback_actions)
        // 		this.frame_rate = 5;

        let win = false;
        let i = 0;

        let lastKeyPress = [0, 0, 1];
        let lastKeyPressTime = 0;

        // let f = stypes
        // m = re.search('[A-Za-z0-9+)\.py', f)?

        // let name = m.group(1);
        let gamelog = "";

        // -------------- Game-play ----------------
        // from ontology import Immovable, Passive, Resource, ResourcePack, RandomNPC, Chaser, AStarChaser, OrientedSprite, Missile
        // from ontology import initializeDistribution, updateDistribution, updateOptions, sampleFromDistribution
        // import things
        let finalEventList = [];
        let agentStatePrev = [];
        let agentState = {};

        // this.getAvatars()[0].resources.forEach((resource) => {
        // 	agentState[resource[0]] = resource[1];
        // })
        let keyPressPrev = null;

        //Prep for Sprite Induction 
        let sprite_types = [Immovable
            // Passive, 
            // Resource, 
            // ResourcePack, 
            // RandomNPC, 
            // Chaser, 
            // AstarChaser, 
            // OrintedSprite, 
            // Missile
        ];
        this.all_objects = this.getObjects(); // Save all objects, some which may be killed in game

        // figure out keypress type

        // disableContinuousKeyPress = Object.keys(this.all_objects).every((k) => {
        // 	return this.all_objects[k]['sprite'].physicstype.__name__ == 'GridPhysics';
        // });
        // console.log(disableContinuousKeyPress)


        const objects = this.getObjects();
        this.spriteDistribution = {};
        this.movement_options = {};
        Object.keys(objects).forEach((sprite) => {
            this.spriteDistribution[sprite] = initializeDistribution(sprite_types);
            this.movement_options[sprite] = {"OTHER": {}};
            sprite_types.forEach((sprite_type) => {
                this.movement_options[sprite][sprite_type] = {};
            })
        });

        // This should actually be in a game loop function, or something.


        this.time = 0;

        // this._clearAll();

        Object.keys(objects).forEach((sprite_number) => {
            let sprite = objects[sprite_number];
            if (!(this.spriteDistribution in sprite)) {
                this.all_objects[sprite] = objects[sprite];
                this.spriteDistribution[sprite] = initializeDistribution(sprite_types);
                this.movement_options[sprite] = {"OTHER": {}};
                sprite_types.forEach((sprite_type) => {
                    this.movement_options[sprite][sprite_type] = {};
                })
            }
        });

        this.keystate = {};
        this.keywait = {};
        // disableContinuousKeyPress = false;

        // Main Game Loop
        let pre_time = new Date().getTime();
        let new_time = 0;
        let mpf = 1000/this.frame_rate;

    }

    getPossibleActions =  () => {
        return this.getAvatars()[0].declare_possible_actions();
    }



}