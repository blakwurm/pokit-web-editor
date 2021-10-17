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
    rotation: number;
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

        c.addEventListener('mousedown',(e)=>{
            e.preventDefault();
            this.last = util.screen2canvas(c, e);
            this.mDown = true;
            switch(this.state.currentTool) {
                case ToolType.SELECT: 
                    let p = util.screen2canvas(c, e);
                    for(let zone of this.touchZones.sort((a,b)=>b.priority-a.priority)) {
                        let poly=box2poly(zone.origin, zone.bounds, zone.rotation);
                        if(pointInPoly(p, poly)){
                            zone.callback();
                            break;
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
        let instances: Record<string,EntityStub[]> = {};
        for(let [s, a] of Object.entries(this.scene.entities)) {
            instances[s] = this.mergeEntities(s,a);
            entities.push(...instances[s])
        }
        entities.forEach((x)=>parents[x.components.identity.id] = x);
        entities = entities.filter(e=>e.components.identity.z >= this.depth);
        entities.sort((a,b)=>a.components.identity.position.z-b.components.identity.position.z);
        entities.forEach(this.renderEntity.bind(this));
        this.makeHandles(instances);
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
        let center = entity.components.__transform.globalPosition;
        center = util.pokit2canvas(this.ctx.canvas, center);
        let rot = entity.components.__transform.globalRotation;
        this.rotate(rot, center);
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
        this.makeTouchZone(entity, Object.assign({},pos), bounds, entity.components.__transform.globalRotation, prio)
        this.restore();
        pos.y -= 61;
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

    makeTouchZone(entity: EntityStub, origin: Vector, bounds: Vector, rotation: number, priority: number) {
        let tz = {
            entity,
            priority,
            origin,
            bounds,
            rotation,
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

    makeHandles(instances: Record<string,EntityStub[]>) {
        let [scene,stub,index]=this.state.inspecting;
        let entityStub = instances[stub] || [];
        let selected = entityStub[index];
        console.log(selected);
        if(scene === this.state.currentScene && selected) {
            let center = selected.components.__transform.globalPosition;
            center = util.pokit2canvas(this.ctx.canvas, center);
            let rot = selected.components.__transform.globalRotation;
            this.ctx.strokeStyle='purple';
            this.ctx.fillStyle='purple';
            this.ctx.lineWidth = 3;
            this.rotate(rot, center);
            this.makeRotateHandle(instances);
            this.makeMoveHandle(instances);
            this.restore();
            return;
            let ident = selected.components.identity as Identity;
            let origin = util.pokit2canvas(this.ctx.canvas, ident.position, ident.bounds);
            origin.x += ident.bounds.x/2;
            this.renderLine(origin, {x:origin.x,y:origin.y-20});
            let rho=util.vectorSub(origin,{x:5,y:25})
            this.ctx.fillRect(rho.x,rho.y,10,10)
            let mho=util.vectorAdd(origin,{x:0,y:ident.bounds.y/2})
            let halfPlusLen=5;
            let mhoVert = util.vectorSub(mho,{x:0,y:halfPlusLen});
            let mhoHorz = util.vectorSub(mho,{x:halfPlusLen,y:0});
            this.renderLine(mhoHorz, {x:mhoHorz.x+(2*halfPlusLen),y:mhoHorz.y});
            this.renderLine(mhoVert, {x:mhoVert.x, y:mhoVert.y+(2*halfPlusLen)});
            mho = util.vectorSub(mho,{x:halfPlusLen,y:halfPlusLen});
            this.touchZones.push({
                priority: Infinity,
                origin: mho,
                bounds: {x:halfPlusLen*2,y:halfPlusLen*2},
                rotation: 0,
                callback: ()=>{
                    let cb=(e: MouseEvent)=>{
                        if(!this.mDown){
                            this.ctx.canvas.removeEventListener("mousemove", cb);
                            return;
                        }
                        let pos = util.screen2pokit(this.ctx.canvas, e);
                        pos = util.vectorAdd(pos, this.scroll);
                        let [scene,stub,index] = this.state.inspecting;
                        this.state.scenes[scene].entities[stub][index].position = pos;
                        this.dirty = true;
                    }
                    this.ctx.canvas.addEventListener("mousemove", cb)
                }
            },
            {
                priority: Infinity,
                origin: rho,
                bounds: {x:10,y:10},
                rotation: 0,
                callback: ()=>{
                    let cb=(e: MouseEvent)=>{
                        if(!this.mDown){
                            this.ctx.canvas.removeEventListener("mousemove", cb);
                            return;
                        }
                        let [scene,stub,index] = this.state.inspecting;
                        let selected = instances[stub][index];
                        let ident = selected.components.identity as Identity;
                        let transform = selected.components.__transform as Transform;
                        let pos = ident.position;
                        let pos2 = util.screen2pokit(this.ctx.canvas, e);
                        let rad =Math.atan2(pos2.y-pos.y,pos2.x-pos.x)
                        rad += Math.PI/2;
                        rad = rad < 0 ? rad+(Math.PI*2) : rad;
                        let deg = util.rad2deg(rad);
                        let parent = transform.globalRotation - ident.rotation;
                        this.state.scenes[scene].entities[stub][index].rotation = deg - parent;
                    }
                    this.ctx.canvas.addEventListener("mousemove", cb)
                }
            })
        }
    }
    makeMoveHandle(instances: Record<string, EntityStub[]>) {
        let [,stub,index] = this.state.inspecting;
        let resolved = instances[stub][index];
        let center = resolved.components.__transform.globalPosition;
        let bounds = resolved.components.__transform.globalBounds;
        let org = util.pokit2canvas(this.ctx.canvas, center, bounds);
        center = util.pokit2canvas(this.ctx.canvas, center);
        let rot = resolved.components.__transform.globalRotation;
        let hls = util.vectorSub(center, {x:5,y:0});
        let hle = util.vectorAdd(center, {x:5,y:0});
        let vls = util.vectorSub(center, {x:0,y:5});
        let vle = util.vectorAdd(center, {x:0,y:5});
        this.renderLine(hls,hle);
        this.renderLine(vls,vle);
        this.touchZones.push({
            priority: Infinity,
            origin: org,
            bounds,
            rotation: rot,
            callback: ()=>{
                let cb=(e: MouseEvent)=>{
                    if(!this.mDown){
                        this.ctx.canvas.removeEventListener("mousemove", cb);
                        return;
                    }
                    let pos = util.screen2pokit(this.ctx.canvas, e);
                    pos = util.vectorAdd(pos, this.scroll);
                    let [scene,stub,index] = this.state.inspecting;
                    this.state;
                    appdata.update(a=>{
                        a.scenes[scene].entities[stub][index].position = resolved.components.__transform.revPosition(pos);
                        return a;
                    });
                }
                this.ctx.canvas.addEventListener("mousemove", cb)
            }
        });
    }

    makeRotateHandle(instances: Record<string,EntityStub[]>) {
        let [,stub,index] = this.state.inspecting;
        let resolved = instances[stub][index];
        let center = resolved.components.__transform.globalPosition;
        let bounds = resolved.components.__transform.globalBounds;
        let rot = resolved.components.__transform.globalRotation;
        center = util.pokit2canvas(this.ctx.canvas, center);
        let lineStart = util.vectorSub(center, {x:0,y:bounds.y/2});
        let lineEnd = util.vectorSub(lineStart, {x:0,y:20});
        let handleCenter= util.vectorSub(lineEnd, {x:0,y:5});

        this.ctx.fillStyle = 'purple';
        this.ctx.strokeStyle = 'purple';
        this.ctx.lineWidth = 3;
        this.renderLine(lineStart,lineEnd);
        this.ctx.fillRect(handleCenter.x-5,handleCenter.y-5,10,10);

        handleCenter = util.rotateVector(handleCenter, rot, center);

        this.touchZones.push(
            {
                priority: Infinity,
                origin: util.vectorSub(handleCenter,{x:5,y:5}),
                bounds: {x:10,y:10},
                rotation: rot,
                callback: ()=>{
                    let cb=(e: MouseEvent)=>{
                        if(!this.mDown){
                            this.ctx.canvas.removeEventListener("mousemove", cb);
                            return;
                        }
                        let [scene,stub,index] = this.state.inspecting;
                        let selected = instances[stub][index];
                        let transform = selected.components.__transform as Transform;
                        let pos = transform.globalPosition;
                        let pos2 = util.screen2pokit(this.ctx.canvas, e);
                        let rad =Math.atan2(pos2.y-pos.y,pos2.x-pos.x)
                        rad += Math.PI/2;
                        rad = rad < 0 ? rad+(Math.PI*2) : rad;
                        let deg = util.rad2deg(rad);
                        appdata.update(a=>{
                            a.scenes[scene].entities[stub][index].rotation = resolved.components.__transform.revRotation(deg);
                            return a;
                        })
                    }
                    this.ctx.canvas.addEventListener("mousemove", cb)
                }
            }
        )
    }

    rotate(theta: number, origin: Vector) {
        this.ctx.save();
        this.ctx.translate(origin.x,origin.y);
        this.ctx.rotate(util.deg2rad(theta));
        this.ctx.translate(-origin.x,-origin.y);
    }
    restore() {
        this.ctx.restore();
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

    drawPoly(poly:Vector[]) {
        this.ctx.beginPath();
        this.ctx.moveTo(poly[0].x,poly[0].y);
        for(let i=1; i < poly.length;i++) {
            this.ctx.lineTo(poly[i].x,poly[i].y);
        }
        this.ctx.closePath();
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
            if(e.components.camera?.isMainCamera) return POKIT_DIMS;
            return util.vectorMultiply(i.bounds, transform.globalScale);
        },
        revPosition: (pos: Vector) => {
            let parent = parents[e.components.identity.parent || "__DEFAULT_PARENT__"].components.__transform as Transform;
            let vec = util.vectorSub(pos, parent.globalPosition);
            vec = util.rotateVector(vec, -parent.globalRotation);
            vec = util.vectorDivide(vec, parent.globalScale);
            return vec;
        },
        revRotation: (rot: number) => {
            let parent = parents[e.components.identity.parent || "__DEFAULT_PARENT__"].components.__transform as Transform;
            return rot-parent.globalRotation;
        }
    };
    e.components.__transform = transform;
    e.components.__meta = {index,stub}
    console.log(e);
    return e;
}

function box2poly(org:Vector,bounds:Vector,rot:number) {
    let ul = org;
    let ur = util.vectorAdd(org, {x:bounds.x,y:0});
    let ll = util.vectorAdd(org, {x:0,y:bounds.y});
    let lr = util.vectorAdd(org, bounds);
    let center = util.vectorAdd(org,util.vectorDivide(bounds,{x:2,y:2}));
    ul = util.rotateVector(ul, rot, center);
    ur = util.rotateVector(ur, rot, center);
    ll = util.rotateVector(ll, rot, center);
    lr = util.rotateVector(lr, rot, center);
    return [ul,ur,lr,ll];
}

function pointInPoly(p:Vector,poly:Vector[]) {
    let i, j, c = false;
    for(i=0, j=poly.length-1;i<poly.length; j=i++) {
        if(((poly[i].y>p.y)!=(poly[j].y>p.y)) &&
            (p.x < (poly[j].x-poly[i].x) * (p.y-poly[i].y) / (poly[j].y-poly[i].y) + poly[i].x) )
                c=!c;
    }
    return c;
}