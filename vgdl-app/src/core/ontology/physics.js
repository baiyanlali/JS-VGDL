
export class GridPhysics{

	passiveMovement = (sprite) => {
		let speed = 0
		if (sprite.speed == null)
			speed = 1;
		else
			speed = sprite.speed;
		if (speed !== 0 && 'orientation' in sprite) {
			sprite._updatePos(sprite.orientation, speed * this.gridsize[0]);
		}
	}
	calculatePassiveMovement = (sprite) => {
		let speed  = 0
		if (sprite.speed === null)
			speed = 1;
		else
			speed = sprite.speed;
		if (speed !== 0 && 'orientation' in sprite) {
			const orientation = sprite.orientation;
			speed = speed * this.gridsize[0];
			if (!(sprite.cooldown > sprite.lastmove + 1 || Math.abs(orientation[0]) + Math.abs(orientation[1]) === 0)) {
				var pos = sprite.rect.move((orientation[0] * speed, orientation[1]*speed));
				return [pos.left, pos.top];
			}
		} else {
			return null;
		}
	}
	activeMovement = (sprite, action, speed) => {
		// console.log('active movement', speed);
		if (!speed) {
			let speed = 0
			if (!sprite.speed)
				speed = 1.0;
			else
				speed = sprite.speed;
		}

		if (speed !== 0 && action)
			sprite._updatePos(action, speed * this.gridsize[0]);
	}
	calculateActiveMovement = (sprite, action, speed = null)=> {

	}

	distance = (r1, r2) => {
		return (Math.sqrt(Math.pow(r1.top - r2.top, 2)) + Math.sqrt(Math.pow(r1.left - r2.left, 2)));
	}

}

export class ContinuousPhysics  extends  GridPhysics{
	gravity = 0.0
	friction = 0.02
	constructor() {
		super();
	}

	passiveMovement = (sprite) => {

	}

	calculatePassiveMovement = (sprite) => {

	}

	activeMovement = (sprite, action, speed=null) => {

	}

	calculateActiveMovement = (sprite, action, speed = null) => {

	}

	distance = (r1, r2) => {
		return (Math.sqrt(Math.pow(r1.top - r2.top, 2)) + Math.sqrt(Math.pow(r1.left - r2.left, 2)));
	}
}

export class NoFrictionPhysics extends ContinuousPhysics{
	friction = 0.0
}

export class GravityPhysics extends ContinuousPhysics{
	gravity = 0.8
}
