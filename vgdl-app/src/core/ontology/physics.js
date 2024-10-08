export const distance = (r1, r2) => {
	return (Math.sqrt(Math.pow(r1.location.x - r2.location.x, 2) + Math.sqrt(Math.pow(r1.location.y - r2.location.y, 2))));
}


export const quickDistance = (r1, r2) => {
	return (Math.pow(r1.location.x - r2.location.x, 2)) + Math.pow(r1.location.y - r2.location.y, 2);
}

export class GridPhysics{

	passiveMovement = (sprite) => {
		let speed = sprite.speed ?? 0;

		if (speed !== 0 && 'orientation' in sprite) {
			sprite._updatePos(sprite.orientation, speed);
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
			if (!(sprite.cooldown > sprite.lastmove + 1 || Math.abs(orientation[0]) + Math.abs(orientation[1]) === 0)) {
				var pos = sprite.rect.move((orientation[0] * speed, orientation[1]*speed));
				return [pos.left, pos.top];
			}
		} else {
			return null;
		}
	}
	activeMovement = (sprite, action, speed) => {
		// console.log(`[ActiveMovement] ${sprite} ${action}`);
		if (!speed) {
			speed = speed ?? sprite.speed ?? 1.0
		}

		if (speed !== 0 && (action!== null || action !== undefined) )
			sprite._updatePos(action, speed);
	}

	calculateActiveMovement = (sprite, action, speed = null)=> {

	}

	distance = distance

	quickDistance = quickDistance

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


}

export class NoFrictionPhysics extends ContinuousPhysics{
	friction = 0.0
}

export class GravityPhysics extends ContinuousPhysics{
	gravity = 0.8
}
