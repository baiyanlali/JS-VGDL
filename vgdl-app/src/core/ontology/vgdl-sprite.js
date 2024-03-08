import {clone, defaultDict, new_id, random, triPoints, unitVector} from "../tools.js";

import {ContinuousPhysics, GridPhysics} from "./physics.js";
import {BASEDIRS, BLACK, BLUE, GRAY, ORANGE, PURPLE, RED, RIGHT} from "./constants.js";
import {killSprite} from "./effect";

export class VGDLSprite{

	transformedBy = {};
	name = null;
	COLOR_DISC = [20, 80, 140, 200];
	is_static = false;
	only_active = false;
	is_avatar = false;
	is_stochastic =false;
	color = null;
	cooldown = 0;
	mass = 1;
	physicstype = null;
	shrinkfactor = 0;
	dirtyrects = [];
	size = [10, 10];
	lastrect = null;
	physicstype = GridPhysics;
	speed = 0;
	cooldown = 0;
	ID = 0
	direction = null;
	color = '#8c148c';
	orientation = [0,0]
	location = {x:0, y:0}

	constructor(pos, size, args= {}) {
		args = args ?? {}
		this.name = args.key || null;
		this.location = pos ? {x: pos[0], y: pos[1]} : this.location
		this.size = size ?? this.size
		this.lastlocation = {x: this.location.y, y: this.location.y}
		this.physicstype = args.physicstype || this.physicstype || GridPhysics;
		this.physics = new this.physicstype();
		this.physics.gridsize = size;
		this.speed = args.speed || this.speed;
		this.cooldown = args.cooldown || this.cooldown;
		this.ID = new_id();
		this.direction = null;
		this.color = args.color || this.color || '#8c148c';
		this.image = args.image;

			// iterate over kwargs
		// this.extend(args);
		if (args) {
			Object.keys(args).forEach((name) => {
				const value = args[name];
				try {
					this[name] = value;
				}
				catch (e) {
					console.error(`error: ${e}`)
				}
			});
		}
		// how many timesteps ago was the last move
		this.lastmove = 0;

		// management of resources contained in the sprite
		this.resources = new defaultDict(0);
	}


	update (game) {
		this.lastmove += 1;
		if (!(this.is_static) && !(this.only_active)) {
			this.physics.passiveMovement(this);
		}
	}

	_updatePos = (orientation, speed = null) => {
		if (speed === null)
			speed = this.speed;

		if (this.cooldown > this.lastmove || Math.abs(orientation[0]) + Math.abs(orientation[1]) !== 0) {
			this.lastlocation = {x: this.location.x, y: this.location.y}
			this.location = {
				x: this.location.x + orientation[0] * speed,
				y: this.location.y + orientation[1] * speed,
			}
			this.lastmove = 0;
		}

	}

	_velocity () {
		if (this.speed === null || this.speed === 0 || !('orientation' in this))
			return [0, 0];
		else
			return [this.orientation[0] * this.speed, this.orientation[1]*this.speed];
	}

	lastdirection () {
		return [this.location.x-this.lastlocation.x, this.location.y-this.lastlocation.y];
	}

	_draw (game) {


	}

	_drawResources = (game, screen, location) => {

	}

	_clear = (screen, background, double=null) => {

	}

	toString () {
		return `${this.name} at (${this.location.x}, ${this.location.y})`;
	}
}

export class EOS extends VGDLSprite{
	constructor(pos, size, args) {
		super(pos, size, args)
		this.ID = -1
	}
}

export class Immovable extends VGDLSprite{
	constructor(pos, size, args) {
		args.color = args.color || GRAY;
		super(pos, size, args)
		this.is_static = args.is_static || true;
	}
}

export class Passive extends VGDLSprite{
	constructor(pos, size, args) {
		args.color = args.color || RED;
		super(pos, size, args)
	}
}


export class Flicker extends VGDLSprite{
	constructor(pos, size, args) {
		args.color = args.color || RED;
		super(pos, size, args)
		this._age = 0;
		this.limit = args.limit || 1;
	}

	update (game) {
		this.update(game)
		if (this._age > this.limit)
			killSprite(this, null, game);

		this._age ++;
	}
}

export class SpriteProducer extends VGDLSprite{
	constructor(pos, size, args) {
		super(pos, size, args)
	}
}


export class Portal extends SpriteProducer{
	constructor(pos, size, args) {
		super(pos, size, args)
		this.is_static = true
		this.color = BLUE;
	}
}


export class SpawnPoint extends SpriteProducer{
	constructor(pos, size, args) {
		args.color = args.color || BLACK
		super(pos, size, args)
		if (args.prob !== undefined) {
			this.prob = args.prob
		} else {
			this.prob = 1
		}

		this.is_stochastic = this.prob > 0 && this.prob < 1;

		if (args.cooldown !== undefined) {
			this.cooldown = args.cooldown;
		} else {
			this.cooldown = 1;
		}
		if (args.total !== undefined) this.total = args.total;

		this.counter = 0;
	}

	update (game) {
		// console.log(this.prob, this.cooldown)
		const rnd = random.random()
		// console.log(game.time, this.cooldown)
		if (game.time % this.cooldown === 0 && rnd < this.prob) {
			game._createSprite([this.stype], [this.location.x, this.location.y]);
			this.counter ++;
		}

		if (this.total && this.counter >= this.total) {
			killSprite(this, undefined, game);
		}
	}
}

export class RandomNPC extends VGDLSprite{
	constructor(pos, size, args) {
		args.speed = args.speed || 1;
		args.is_stochastic = args.is_stochastic || true;
		super(pos, size, args)
	}

	update (game) {
		this.direction = random.choice(BASEDIRS);
		super.update(game);
		this.physics.activeMovement(this, this.direction);
	}
}

export class OrientedSprite extends VGDLSprite{
	constructor(pos, size, args) {
		super(pos, size, args);
		this.draw_arrow = false;
		this.orientation = RIGHT;
	}

	_draw (game) {
		super._draw(this, game);
		if (this.draw_arrow) {
			//TODO: Draw OrientedSprite
			const col = (this.color[0], 255 - this.color[1], this.color[2]);
			// this.gamejs.draw.polygon(game.screen, col, triPoints(this.rect, unitVector(this.orientation)))
		}
}
}


export class Conveyer extends OrientedSprite{
	constructor(pos, size, args) {
		super(pos, size, args);
		this.is_static = true;
		this.color = BLUE;
		this.strength = 1;
		this.draw_arrow = true;
	}
}

export class Missile extends OrientedSprite{

	constructor(pos, size, args) {
		super(pos, size, args);
		this.speed = 1;
		this.color = PURPLE;
	}
}

export class Switch extends OrientedSprite{

	constructor(pos, size, args) {
		super(pos, size, args);
		this.speed = 1;
		this.color = PURPLE;
	}
}

export class OrientedFlicker extends OrientedSprite{
	constructor(pos, size, args) {
		//Flicker
		super(pos, size, args);
		this.draw_arrow = true;
		this.speed = 0;
		this._age = 0;
		this.limit = args.limit || 1;
	}

	update (game) {
		super.update(game)
		if (this._age > this.limit)
			killSprite(this, null, game);

		this._age ++;
	}
}



export class Walker extends Missile{
	constructor(pos, size, args) {
		super(pos, size, args)

		this.airsteering = false;
		this.is_stochastic = true;
	}

	update (game) {
		if (this.airsteering || this.lastdirection()[0] === 0) {
			let d = 0
			if (this.orientation[0] > 0)
				d = 1;
			else if (this.orientation[0] < 0)
				d = -1;
			else
				d = random.choice([-1, 1]);
			this.physics.activeMovement(this, [d, 0]);
		}
		super.update(game)
	}

}

export class WalkJumper extends Walker{
	constructor(pos, size, args) {
		super(pos, size, args)

		this.prob = 0.1;
		this.strength = 10;
	}

	update (game) {
		if (this.lastdirection()[0] === 0) {
		if (this.prob < random.random())
			this.physics.activeMovement(this, (0, -this.strength));
		}
		super.update(game)
	}
}


export class RandomInertial extends RandomNPC{
	constructor(pos, size, args) {
		super(pos, size, args);
		this.physicstype = ContinuousPhysics;
	}
}


export class RandomMissile extends Missile{
	constructor(pos, size, args) {
		super(pos, size, args);
	}
}


export class EraticMissile extends Missile{
	constructor(pos, size, args) {
		super(pos, size, args);

		this.prob = args.prob;
		this.is_stochastic = (this.prob > 0 && this.prob < 1);
	}

	update (game) {
		super.update(game)
		if (random.random() < this.prob)
			this.orientation = random.choice(BASEDIRS);
	}
}

export class Bomber extends SpawnPoint{
	constructor(pos, size, args) {
		// Missile
		args.color = args.color || ORANGE;
		args.is_static = args.is_static || false;
		super(pos, size, args);
	}

	update (game) {
		Missile.prototype.update.call(this, game);
		SpawnPoint.prototype.update.call(this, game);
	}
}


//
// function Chaser(gamejs, pos, size, args) {
// 	this.stype = null;
// 	this.fleeing = false;
// 	RandomNPC.call(this, gamejs, pos, size, args);
// }
// Chaser.prototype = Object.create(RandomNPC.prototype);
//
// Chaser.prototype._closestTargets (game) {
// 	var bestd = 1e100;
// 	var res = [];
// 	var that = this;
// 	// console.log(this.stype);
// 	// console.log(game.getSprites(this.stype).map(s => {return s.name}));
// 	game.getSprites(this.stype).forEach(target => {
// 		var d = that.physics.distance(that.rect, target.rect);
// 		// console.log(d)
// 		if (d < bestd) {
// 			bestd = d;
// 			res = [target];
// 		} else if (d == bestd) {
// 			res.push(target);
// 		}
// 	});
// 	// console.log(res)
// 	return res;
// }
//
// Chaser.prototype._movesToward = function(game, target) {
// 	var res = [];
// 	var basedist = this.physics.distance(this.rect, target.rect);
// 	var that = this;
// 	BASEDIRS.forEach(a => {
// 		// console.log(a)
// 		var r = that.rect.copy();
// 		r = r.move(a.map((v) => {return 2*v}));
// 		var newdist = that.physics.distance(r, target.rect);
// 		// console.log(a, basedist,  newdist);
// 		if (that.fleeing && basedist < newdist) {
// 			res.push(a);
// 		}
// 		if (!(that.fleeing) && basedist > newdist){
// 			res.push(a);
// 		}
//
// 	});
// 	return res;
// }
//
// Chaser.prototype.update (game) {
// 	VGDLSprite.prototype.update.call(this, game);
//
// 	options = [];
// 	position_options = {};
// 	var that = this;
// 	this._closestTargets(game).forEach(target => {
// 		options = options.concat(that._movesToward(game, target));
// 	});
// 	if (options.length == 0) {
// 		options = BASEDIRS;
// 	}
// 	this.physics.activeMovement(this, options.randomElement());
// }
//
// function Fleeing(gamejs, pos, size, args) {
// 	Chaser.call(this, gamejs, pos, size, args);
// 	this.fleeing = true;
// }
// Fleeing.prototype = Object.create(Chaser.prototype);
//
//
//
// function AStarChaser(gamejs, pos, size, args) {
// 	this.stype = null;
// 	this.fleeing = false;
// 	this.drawpath = null;
// 	this.walableTiles = null;
// 	this.neighborNodes =null;
// 	RandomNPC.call(this, gamejs, pos, size, args);
// }
// AStarChaser.prototype = Object.create(RandomNPC.prototype);
//
// AStarChaser.prototype._movesToward = (game, target) => {
// 	var res = [];
// 	var basedist = this.physics.distance(this.rect, target.rect);
// 	var that = this;
// 	BASEDIRS.forEach(a => {
// 		var r = that.rect.copy();
// 		r = r.move(a);
// 		var newdist = that.physics.distance(r, target.rect);
// 		if (that.fleeing && basedist < newdist)
// 			res.push(a);
// 		if (!(that.fleeing && basedist > newdist))
// 			res.push(a);
// 	});
// 	return res;
// }
//
// AStarChaser.prototype._draw (game) {
// 	RandomNPC.prototype._draw.call(this, game);
// 	if (this.walableTiles) {
// 		var col = this.gamejs.Color(0, 0, 255, 100);
// 		var that = this;
// 		this.walableTiles.forEach(sprite => {
// 			that.gamejs.draw.rect(game.screen, col, sprite.rect);
// 		});
// 	}
//
// 	if (this.neighborNodes) {
// 		var col = this.gamejs.Color(0, 255, 255, 80);
// 		var that = this;
// 		this.neighborNodes.forEach(node => {
// 			that.gamejs.draw.rect(game.screen, col, node.sprite.rect);
// 		})
// 	}
//
// 	if (this.drawpath) {
// 		var col = this.gamejs.Color(0, 255, 0, 120);
// 		var that = this;
// 		this.drawpath.slice(1, -1).forEach(sprite => {
// 			that.gamejs.draw.rect(game.screen, col, sprite.rect);
// 		});
// 	}
// }
//
//
// AStarChaser.prototype._setDebugVariables = (world, path) => {
// 	var path_sprites = path.map(node => {return node.sprite});
//
// 	this.walableTiles = world.get_walkable_tiles();
// 	this.neighborNodes = world.neighbor_nodes_of_sprite(this);
// 	this.drawpath = path_sprits;
// }
//
// AStarChaser.prototype.update (game) {
// 	VGDLSprite.prototype.update.call(this, game);
// }