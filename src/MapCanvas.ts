import { identity } from "../node_modules/svelte/internal";
import type { EntityStub, Identity, SceneStub, Vector } from "./pokit.types";
import { appdata, AppData, currentScene, ToolType } from "./stores";
import * as util from './utils'

const POKIT_DIMS = {
    x: 320,
    y: 320
}

interface TouchZone {
    entity?: EntityStub;
    priority: number;
    origin: Vector;
    bounds: Vector;
    callback: Function;
}

let parents = {} as Record<string,EntityStub>;
export class MapCanvas {
    ctx: CanvasRenderingContext2D;
    state: AppData;
    scene: SceneStub;
    scroll: Vector;
    depth: number;
    last: Vector;
    mDown: boolean;
    gridX: number;
    gridY: number;
    snapX: number;
    snapY: number;
    presses: Set<string>;

    touchZones: TouchZone[];

    dirty = true;
    canUndo = false;
    constructor(c: HTMLCanvasElement) {
        this.presses = new Set();
        this.ctx = c.getContext('2d', {
            antialias: false
        }) as CanvasRenderingContext2D;
        this.scroll = {x:0,y:0};
        this.depth = 0;
        appdata.subscribe(this.updateState.bind(this));
        currentScene.subscribe(this.updateCurrentScene.bind(this));
        appdata.canUndo.subscribe((v)=>this.canUndo=v)
        this.touchZones = [];

        c.addEventListener('click',(e)=>{
            switch(this.state.currentTool) {
                case ToolType.SELECT: 
                    let p = util.screen2canvas(c, util.vectorSub(e, {x:20,y:20}));
                    for(let zone of this.touchZones.sort((a,b)=>b.priority-a.priority)) {
                        let end = util.vectorAdd(zone.origin, zone.bounds);
                        console.log(zone.origin,end, zone.entity?.components.identity.id);
                        if( p.x >= zone.origin.x &&
                            p.y >= zone.origin.y &&
                            p.x <= end.x &&
                            p.y <= end.y) {
                            
                                zone.callback();
                                return;
                        }
                    }
                    break;
                case ToolType.BRUSH:
                    let offset = {
                        x: this.snapX ? this.gridX : 0,
                        y: this.snapY ? this.gridY : 0
                    }
                    let position = util.vectorAdd(this.scroll, util.screen2pokit(this.ctx.canvas, util.vectorSub(e, {x:20,y:20}), offset))
                    position.x = this.snapX ? Math.round(position.x / this.gridX) * this.gridX : position.x;
                    position.y = this.snapY ? Math.round(position.y / this.gridY) * this.gridY : position.y;
                    appdata.update((a)=>{
                        let s = a.scenes[a.currentScene];
                        s.entities[a.currentBrush] = s.entities[a.currentBrush] || [];
                        if(a.entities[a.currentBrush].components.camera?.isMainCamera) s.entities[a.currentBrush] = [];
                        s.entities[a.currentBrush].push({
                            position
                        } as Identity);
                        return a;
                    })
            }
        });
        c.addEventListener('mousedown', (e)=>{
            e.preventDefault();
            this.last = util.screen2canvas(c, e);
            this.mDown = true;
        })
        c.addEventListener('mouseup', ()=>this.mDown=false);
        c.addEventListener('mousemove', (e)=>{
            if(this.state.currentTool !== ToolType.PAN || !this.mDown) return;
            let scaled = util.screen2canvas(c, e);
            let delta = util.vectorSub(this.last, scaled);
            this.scroll = util.vectorAdd(this.scroll, delta);
            this.last = scaled;
            this.dirty = true;
            console.log(this.scroll, this.mDown, this.state.currentTool);
        })

        window.onkeydown = (e)=>{
            console.log(e.key);
            if(!this.presses.has(e.key))this.presses.add(e.key);
            else return;
            switch(e.key) {
                case "Delete":
                    appdata.update((a)=>{
                        let [sceneKey,stubKey,index]=a.inspecting;
                        let scene = a.scenes[sceneKey];
                        let stub = scene.entities[stubKey];
                        stub.splice(index,1);
                        console.log(stub);
                        return a;
                    })
                case "z":
                    if(this.presses.has("Control")) {
                        console.log(this.canUndo);
                        appdata.undo();
                        this.dirty = true;
                    }
            }
        }

        window.onkeyup = (e)=>this.presses.delete(e.key);

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
        this.state = a;
        this.dirty = true;
    }

    updateCurrentScene(s: SceneStub) {
        this.scene = s;
        this.dirty = true;
    }

    render() {
        this.touchZones = [];
        if (!this.scene || !this.state) {
          return
        }
        this.ctx.clearRect(0,0,this.ctx.canvas.width, this.ctx.canvas.height);
        let entities: EntityStub[] = [];
        console.log(this.scene.entities);
        for(let [s, a] of Object.entries(this.scene.entities)) {
            console.log(s);
            entities.push(...this.mergeEntities(s,a));
        }
        entities.forEach((x)=>parents[x.components.identity.id] = x);
        entities = entities.filter(e=>e.components.identity.z >= this.depth);
        entities.sort((a,b)=>a.components.identity.position.z-b.components.identity.position.z);
        entities.forEach(this.renderEntity.bind(this));
        this.renderGrid();
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
        let entities = deepClone(this.state.entities);
        entities["__DEFAULT_PARENT__"] = {
            inherits: [],
            components: {
                identity: util.defaultParent,
                __transform: util.defaultParent
            }
        };
        parents["__DEFAULT_PARENT__"] = entities["__DEFAULT_PARENT__"]

        let index = 0;
        console.log(stubId);
        return instances.map(i=>{
            console.log(stubId);
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
            return addMeta(applyInheritance(lineage, entities), index++, stubId);
        }) as EntityStub[];
    }

    renderEntity(entity:EntityStub) {
        let pos: Vector, bounds: Vector;
        let identity = entity.components.identity as Identity;
        let prio = 0;
        if(entity.components.camera) {
            [pos, bounds] = this.renderCameraEntity(entity);
            prio = -Infinity;
        }
        else {
            [pos, bounds] = this.renderGeneralEntity(entity);
            prio = -(bounds.x*bounds.y);
        }
        let [scene,stub,instance] = this.state.inspecting;
        if(scene === this.state.currentScene &&
             stub === entity.components.__meta.stub &&
             instance === entity.components.__meta.index) {
                this.renderBorder(pos, bounds);
             }
        this.makeTouchZone(entity, Object.assign({},pos), bounds, prio)
        pos.y -= 30;
        this.renderLabel(pos, identity.id!);
    }

    renderCameraEntity(entity: EntityStub) {
        let transform = entity.components.__transform as Transform;
        let bounds = transform.globalBounds;
        if(entity.components.camera.isMainCamera) bounds = POKIT_DIMS;
        let pos = util.pokit2canvas(this.ctx.canvas, transform.globalPosition, bounds);
        pos = util.vectorSub(pos, this.scroll);
        this.ctx.strokeStyle = "black";
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(pos.x, pos.y, bounds.x, bounds.y);
        return [pos, bounds] 
    }

    renderGeneralEntity(entity: EntityStub) {
        if(entity.components.debug) {
            let color = entity.components.debug.color as [number,number,number,number] ||
            [255,0,0,255];
            this.ctx.fillStyle = `rgba(
                ${color[0]},
                ${color[1]},
                ${color[2]},
                ${color[3]/255}
            )`
        }
        let transform = entity.components.__transform as Transform;
        let pos = util.pokit2canvas(this.ctx.canvas, transform.globalPosition, transform.globalBounds)
        pos = util.vectorSub(pos, this.scroll)
        this.ctx.fillRect(pos.x, pos.y, transform.globalBounds.x, transform.globalBounds.y);
        return [pos, transform.globalBounds];
    }

    renderBorder(pos: Vector, bounds: Vector) {
        this.ctx.strokeStyle = "purple";
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(pos.x, pos.y, bounds.x, bounds.y);
    }

    renderLabel(pos: Vector, txt: string) {
        this.ctx.font = '16px sans-serif'
        let metrics = this.ctx.measureText(txt);
        this.ctx.fillStyle = 'rgba(0,0,0,0.75)'
        this.ctx.fillRect(pos.x, pos.y, metrics.width + 7, 21)
        this.ctx.fillStyle = 'white'
        this.ctx.fillText(txt, pos.x+3, pos.y+15);
    }

    renderGrid() {
        let wide = Math.ceil(this.ctx.canvas.width / this.gridX);
        let high = Math.ceil(this.ctx.canvas.height / this.gridY);
        let maxX = Math.ceil(wide/2)+1;
        let maxY = Math.ceil(high/2)+1;
        let offsetX = this.scroll.x % this.gridX;
        let offsetY = this.scroll.y % this.gridY;
        this.ctx.strokeStyle = 'black';
        this.ctx.lineWidth = 1;
        if(this.snapX)
            for(let cx = -maxX+1; cx < maxX; cx++) {
                let {x} = util.pokit2canvas(this.ctx.canvas, {x:cx * this.gridX, y:0});
                let y = this.ctx.canvas.height;
                x-=offsetX;
                this.renderLine({x,y:0}, {x,y});
            }
        if(this.snapY)
            for(let cy = -maxY+1; cy < maxY; cy++) {
                let {y} = util.pokit2canvas(this.ctx.canvas, {x:0,y:cy * this.gridY});
                let x = this.ctx.canvas.width;
                y-=offsetY;
                this.renderLine({x:0, y}, {x,y});
            }
    }

    renderLine(from: Vector, to: Vector) {
        this.ctx.beginPath();
        this.ctx.moveTo(from.x, from.y);
        this.ctx.lineTo(to.x, to.y);
        this.ctx.stroke();
    }

    makeTouchZone(entity: EntityStub, origin: Vector, bounds: Vector, priority: number) {
        let tz = {
            entity,
            priority,
            origin,
            bounds,
            callback: ()=>{
                let meta = entity.components.__meta;
                appdata.update((a)=>{
                    a.inspecting=[a.currentScene, meta.stub, meta.index]
                    return a;
                });
                this.dirty = true;
            }
        }
        this.touchZones.push(tz);
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

export function resolveLineage(stub: string, entities: Record<string,EntityStub>) {
    let order = [stub]
    let obj = entities[stub];

    console.log(order,obj);

    for(let inherit of obj.inherits){
        order.push(...resolveLineage(inherit, entities))
    }

    return order;
}

export function applyInheritance(lineage: string[], entities: Record<string,EntityStub>) {
    let base = {};
    console.log(lineage);
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

function addMeta(e: EntityStub, index: number, stub: string) {
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
    e.components.__meta = {index,stub}
    console.log(e);
    return e;
}