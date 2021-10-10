import type { EntityStub, Identity, SceneStub, Vector } from "./pokit.types";
import { appdata, AppData, currentScene } from "./stores";

const POKIT_SCREEN_SIZE = 320;

export class MapCanvas {
    ctx: CanvasRenderingContext2D;
    state: AppData;
    scene: SceneStub;
    scroll: Vector;
    depth: number;

    dirty = true;
    constructor(c: HTMLCanvasElement) {
        this.ctx = c.getContext('2d', {
            antialias: false
        }) as CanvasRenderingContext2D;
        this.scroll = {x:0,y:0};
        this.depth = 0;
        appdata.subscribe(this.updateState.bind(this));
        currentScene.subscribe(this.updateCurrentScene.bind(this));
    }

    raf() {
        if(this.dirty) {
            this.render();
            this.dirty = false;
        }
        requestAnimationFrame(this.raf.bind(this));
    }

    updateState(a: AppData) {
        this.state = a;
    }

    updateCurrentScene(s: SceneStub) {
        this.scene = s;
        this.dirty = true;
    }

    render() {
        this.ctx.clearRect(0,0,this.ctx.canvas.width, this.ctx.canvas.height);
        let entities: EntityStub[] = [];
        for(let [s, a] of Object.entries(this.scene.entities)) {
            entities.push(...this.mergeEntities(s,a));
        }
        entities = entities.filter(e=>e.components.identity.z >= this.depth);
        entities.sort((a,b)=>a.components.identity.position.z-b.components.identity.position.z);
        entities.forEach(this.renderEntity);
    }

    mergeEntities(stubId: string, instances: Identity[]) {
        let entities = this.state.entities;
        let index = 0;
        return instances.map(i=>{
            let lineage = resolveLineage(stubId, entities);
            let identity = i;
            identity.id = identity.id || stubId + index.toString();
            index++;
            entities["__POKIT_IDENTITY__"] = {
                inherits: [],
                components: {
                    identity: i
                }
            };
            lineage.unshift("__POKIT_IDENTITY__");
            return applyInheritance(lineage, entities);
        }) as EntityStub[];
    }

    renderEntity(entity: EntityStub) {
        let identity: Identity = entity.components.Identity;
        let posX = pokit2screen(identity.position.x - this.scroll.x, identity.bounds.x);
        let posY = pokit2screen(identity.position.y - this.scroll.y, identity.bounds.y);
        this.ctx.rect(posX, posY, identity.bounds.x, identity.bounds.y);
        posY -= 30;
        this.ctx.fillText(identity.id!, posX, posY);
    }
}

function pokit2screen(n: number, b: number) {
    return n + (POKIT_SCREEN_SIZE/2-(b/2))
}

export function deepMerge(o: any, ...arr: any[]) {
  let ret = Object.assign({}, o);
  for (let obj of arr) {
    for (let [k, v] of Object.entries(obj)) {
      if (typeof ret[k] !== typeof v || typeof v !== "object")
        ret[k] = v;
      else if (Array.isArray(v))
        ret[k] = (<Array<any>>ret[k]).concat(v);
      else
        ret[k] = deepMergeNoConcat(ret[k], v!);
    }
  }
  return ret;
}

export function deepMergeNoConcat(o: any, ...arr: any[]) {
  let ret = Object.assign({}, o);
  for (let obj of arr) {
    for (let [k, v] of Object.entries(obj)) {
      if (typeof ret[k] !== typeof v || typeof v !== "object" || Array.isArray(v))
        ret[k] = v;
      else
        ret[k] = deepMergeNoConcat(ret[k], v!);
    }
  }
  return ret;
}

export function deepClone(o: any): any {
  if(Array.isArray(o)) {
    let r = [];
    for(let v of o) {
      if(typeof v === "object") r.push(deepClone(v));
      else r.push(v);
    }
    return r;
  }
  let r = {} as any;
  for(let [k,v] of Object.entries(o)) {
    if(typeof v === "object") r[k] = deepClone(v);
    else r[k] = v;
  }
  return r;
}

function resolveLineage(stub: string, entities: Record<string,EntityStub>) {
    let order = [stub]
    let obj = entities[stub];

    for(let inherit of obj.inherits){
        order.concat(...this.resolveLineage(inherit, entities))
    }

    return order;
}

function applyInheritance(lineage: string[], entities: Record<string,EntityStub>) {
    let base = {};
    while(lineage.length) {
        let stub = entities[lineage.pop()!];
        base = deepMergeNoConcat(base, stub)
    }
    return base as EntityStub;
}