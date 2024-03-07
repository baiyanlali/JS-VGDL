import {VGDLSprite} from "./vgdl-sprite.js";

export class Resource {
	constructor(pos, size, args) {
		this.value = args.value || 1;
		this.limit = args.limit || 2;
		this.res_type = args.res_type || null;
	}

	resourceType = () => {
		if (this.res_typ == null)
			return this.name;
		else
			return this.res_type;
}
}

export class ResourcePack extends Resource{
	constructor(pos, size, args) {
		super(pos, size, args)
		this.is_static = true
	}
}


