export const clone = (obj)=> {
    if(obj === null || typeof obj !== "object") return obj
    const copy = obj.constructor()
    for (const copyKey in copy) {
        if(obj.hasOwnProperty(copyKey))
            copy[copyKey] = obj[copyKey]
    }
    return copy
}

export class defaultDict{
    base = {}
    constructor(base) {
        this.base = base
    }

    get = (key)=>{
        if(this.hasOwnProperty(key)){
            if(key === 'get') return []
            return this[key]
        }else{
            return this.base
        }
    }

}
