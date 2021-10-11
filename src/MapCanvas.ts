import { identity } from "../node_modules/svelte/internal";
import type { EntityStub, Identity, SceneStub, Vector } from "./pokit.types";
import { appdata, AppData, currentScene } from "./stores";
import * as util from './utils'

const POKIT_DIMS = {
    x: 320,
    y: 320
}

let parents = {} as Record<string,EntityStub>;
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
        this.raf()
    }

    raf() {
        if(this.dirty) {
            this.render();
            this.dirty = false;
        }
        requestAnimationFrame(this.raf.bind(this));
    }

    updateState(a: AppData) {
      console.log('updating current state')
        this.state = a;
    }

    updateCurrentScene(s: SceneStub) {
      console.log('updating current scene')
        this.scene = s;
        this.dirty = true;
    }

    render() {
      console.log('scene and state are', this.scene, this.state)
        if (!this.scene || !this.state) {
          return
        }
        this.ctx.clearRect(0,0,this.ctx.canvas.width, this.ctx.canvas.height);
        let entities: EntityStub[] = [];
        for(let [s, a] of Object.entries(this.scene.entities)) {
            entities.push(...this.mergeEntities(s,a));
        }
        entities.forEach((x)=>parents[x.components.identity.id] = x);
        entities = entities.filter(e=>e.components.identity.z >= this.depth);
        entities.sort((a,b)=>a.components.identity.position.z-b.components.identity.position.z);
        entities.forEach(this.renderEntity.bind(this));
    }
    renderdebug() {
      // Set line width
        this.ctx.lineWidth = 10;

        // Wall
        // Set line width
        this.ctx.lineWidth = 10;

        // Wall
        this.ctx.strokeRect(75, 140, 150, 110);

        // Door
        this.ctx.fillRect(130, 190, 40, 60);

        // Roof
        this.ctx.beginPath();
        this.ctx.moveTo(50, 140);
        this.ctx.lineTo(150, 60);
        this.ctx.lineTo(250, 140);
        this.ctx.closePath();
        this.ctx.stroke();
    }

    mergeEntities(stubId: string, instances: Identity[]) {
        let entities = this.state.entities;
        entities["__DEFAULT_PARENT__"] = {
            inherits: [],
            components: {
                identity: util.defaultParent,
                __transform: util.defaultParent
            }
        };
        parents["__DEFAULT_PARENT__"] = entities["__DEFAULT_PARENT__"]

        let index = 0;
        return instances.map(i=>{
            let lineage = resolveLineage(stubId, entities);
            let identity = i;
            identity.id = identity.id || stubId + index.toString();
            entities["__POKIT_IDENTITY__"] = {
                inherits: [],
                components: {
                    identity: i
                }
            };
            lineage.push("__DEFAULT_PARENT__")
            lineage.unshift("__POKIT_IDENTITY__");
            index++;
            return addMeta(applyInheritance(lineage, entities), index);
        }) as EntityStub[];
    }

    renderEntity(entity:EntityStub) {
        if(entity.components.camera) this.renderCameraEntity(entity);
        else this.renderGeneralEntity(entity);
    }

    renderCameraEntity(entity: EntityStub) {
        let transform = entity.components.__transform as Transform;
        let identity = entity.components.identity as Identity;
        let bounds = transform.globalBounds;
        if(entity.components.camera.isMainCamera) bounds = POKIT_DIMS;
        let pos = util.pokit2screen(this.ctx.canvas, transform.globalPosition, bounds);
        pos = util.vectorSub(pos, this.scroll);
        this.ctx.strokeRect(pos.x, pos.y, bounds.x, bounds.y);
        pos.y -= 30;
        this.ctx.fillText(identity.id!, pos.x, pos.y);
    }

    renderGeneralEntity(entity: EntityStub) {
        if(entity.components.debug) {
            let color = entity.components.debug.color as [number,number,number,number] ||
            [255,0,0,255];
            this.ctx.fillStyle = `rgba(
                ${color[0]},
                ${color[1]},
                ${color[2]},
                ${color[3]}
            )`
        }
        let transform = entity.components.__transform as Transform;
        let identity = entity.components.identity as Identity;
        let pos = util.pokit2screen(this.ctx.canvas, transform.globalPosition, transform.globalBounds)
        pos = util.vectorSub(pos, this.scroll)
        this.ctx.fillRect(pos.x, pos.y, transform.globalBounds.x, transform.globalBounds.y);
        pos.y -= 30;
        this.ctx.fillStyle = 'black';
        this.ctx.fillText(identity.id!, pos.x, pos.y);
    }

    translate(x: number, y: number, z?: number) {
        this.scroll.x += x || 0
        this.scroll.y += y || 0
        this.depth += z || 0
        this.dirty=true
    }

    transvec(v: Vector) {
      this.translate(v.x, v.y, 0)
    }
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

interface Transform {
    globalPosition: Vector,
    globalRotation: number,
    globalScale: Vector,
    globalBounds: Vector
}

function addMeta(e: EntityStub, index: number) {
    let i = e.components.identity as Identity;
    let transform = {
        get globalPosition() {
            let parent = parents[e.components.identity.parent || "__DEFAULT_PARENT__"].components.__transform as Transform;
            let scaledPos = util.vectorMultiply(i.position, parent.globalScale);
            return util.vectorAdd(util.rotateVector(scaledPos, parent.globalRotation), parent.globalPosition);
        },
        get globalRotation() {
            let parent = parents[e.components.identity.parent || "__DEFAULT_PARENT__"].components.__transform as Transform;
            return i.rotation + parent.globalRotation;
        },
        get globalScale() {
            let parent = parents[e.components.identity.parent || "__DEFAULT_PARENT__"].components.__transform as Transform;
            return util.vectorMultiply(i.scale, parent.globalScale);
        },
        get globalBounds() {
            return util.vectorMultiply(i.bounds, transform.globalScale);
        }
    };
    e.components.__transform = transform;
    e.components.__meta = {index}
    return e;
}