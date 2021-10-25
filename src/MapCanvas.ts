import { identity } from "../node_modules/svelte/internal";
import type { EntityStub, Identity, SceneStub, Vector } from "./pokit.types";
import { appdata, AppData, spritemap, ToolType } from "./stores";
import * as util from './utils'

const POKIT_DIMS = {
    x: 320,
    y: 320
}

export interface TouchZone {
    entity?: EntityStub;
    priority: number;
    origin: Vector;
    bounds: Vector;
    rotation: number;
    callback: Function;
}

let parents = {} as Record<string,EntityStub>;
let children = [] as EntityStub[];
export class MapCanvas {
    ctx: CanvasRenderingContext2D;
    state: AppData;
    scene: SceneStub;
    sprites: HTMLImageElement;
    scroll: Vector;
    depth: number;
    last: Vector;
    mDown: boolean
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
        this.ctx.imageSmoothingEnabled = false;
        this.scroll = {x:0,y:0};
        this.depth = 0;
        appdata.subscribe(this.updateState.bind(this));
        spritemap.subscribe(this.updateSprites.bind(this));
        this.touchZones = [];

        c.addEventListener('pointerdown',(e)=>{
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
                            return;
                        }
                    }
                    appdata.update(a=>{
                        a.inspecting[2]=-1;
                        return a;
                    });
                    break;
                case ToolType.BRUSH:
                    let offset = {
                        x: this.snapX ? this.gridX : 0,
                        y: this.snapY ? this.gridY : 0
                    }
                    let position = util.vectorAdd(this.scroll, util.screen2pokit(this.ctx.canvas, util.vectorSub(e, {x:20,y:20}), offset))
                    position = this.snap(position);
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
        c.addEventListener('pointerup', ()=>this.mDown=false);
        c.addEventListener('pointermove', (e)=>{
            if(this.state.currentTool !== ToolType.PAN || !this.mDown) return;
            let scaled = util.screen2canvas(c, e);
            let delta = util.vectorSub(this.last, scaled);
            this.scroll = util.vectorAdd(this.scroll, delta);
            this.last = scaled;
            this.dirty = true;
        })

        window.onkeydown = (e)=>{
            if(!this.presses.has(e.key))this.presses.add(e.key);
            else return;
            switch(e.key) {
                case "Delete":
                    appdata.update((a)=>{
                        let [sceneKey,stubKey,index]=a.inspecting;
                        let scene = a.scenes[sceneKey];
                        let stub = scene.entities[stubKey];
                        stub.splice(index,1);
                        return a;
                    })
                    break;
                case "z":
                    if(this.presses.has("Control")) {
                        appdata.undo();
                    }
                    break;
                case "Z":
                    if(this.presses.has("Control")) {
                        appdata.redo();
                    }
                    break;
                case "ArrowRight":
                    if(this.presses.has("Control")) {
                        console.log("right");
                        appdata.update((a)=>{
                            let [scene,stub,index] = a.inspecting;
                            let sStub = a.scenes[scene] || {entities:{}};
                            let eStub = sStub.entities[stub] || [];
                            let selected = eStub[index];
                            if(!selected) return a;
                            selected.rotation += 90;
                            selected.rotation -= selected.rotation > 360 ? 360 : 0;
                            return a;
                        })
                    }
                    break;
                case "ArrowLeft":
                    if(this.presses.has("Control")) {
                        console.log("left");
                        appdata.update((a)=>{
                            let [scene,stub,index] = a.inspecting;
                            let sStub = a.scenes[scene] || {entities:{}};
                            let eStub = sStub.entities[stub] || [];
                            let selected = eStub[index];
                            if(!selected) return a;
                            selected.rotation -= 90;
                            selected.rotation += selected.rotation < 0 ? 360 : 0;
                            return a;
                        })
                    }
                    break;
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
        this.state = deepClone(a);
        this.scene = this.state.scenes[a.currentScene];
        this.dirty = true;
    }

    updateSprites(s: HTMLImageElement) {
        this.sprites = s;
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
        children = [];
        for(let [s, a] of Object.entries(this.scene.entities)) {
            instances[s] = this.mergeEntities(s,a);
            entities.push(...instances[s])
        }
        entities.forEach((x)=>parents[x.components.identity.id] = x);
        entities = entities.filter(e=>e.components.identity.z >= this.depth);
        entities.sort((a,b)=>b.components.identity.z-a.components.identity.z);
        entities.forEach((e)=>this.renderEntity(e));
        children.forEach((e)=>this.renderEntity(e, false));
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
        return (instances).map(i=>{
            return this.resolveEntity(i, stubId, index++);
        }) as EntityStub[];
    }

    resolveEntity(identity: Identity, stub: string, index: number) {
        identity.id = identity.id || stub + index.toString();
        let lineage = resolveLineage(stub, this.state.entities);
        this.state.entities["__POKIT_IDENTITY__"] = {
            inherits: [],
            components: {
                identity
            }
        };
        lineage.push("__DEFAULT_PARENT__")
        lineage.unshift("__POKIT_IDENTITY__");
        let e = applyInheritance(lineage, this.state.entities);
        if(e.children) this.getChildren(e, stub);
        return addMeta(e, index, stub);
    }

    getChildren(e: EntityStub, stub: string) {
        for(let [s,instances] of Object.entries(e.children!)) {
            let i = 0;
            for(let instance of instances) {
                instance.id=`${e.components.identity.id}_${s}${i}`
                instance.parent = stub;
                children.push(this.resolveEntity(instance, s, i++));
            }
        }
    }

    renderEntity(entity:EntityStub, selectable = true) {
        let pos: Vector, bounds: Vector;
        let identity = entity.components.identity as Identity;
        let center = entity.components.__transform.globalPosition;
        center = util.pokit2canvas(this.ctx.canvas, center);
        let rot = entity.components.__transform.globalRotation;
        this.rotate(rot, center);
        let prio = 0;
        
        if(entity.components.sprite) {
            [pos, bounds] = this.renderSpriteEntity(entity);
        }
        else if(entity.components.debug) {
            [pos, bounds] = this.renderDebugEntity(entity);
        }
        else {
            [pos, bounds] = this.renderEmpty(entity);
        }
        prio = -(bounds.x*bounds.y);
        let [scene,stub,instance] = this.state.inspecting;
        if(scene === this.state.currentScene &&
             stub === entity.components.__meta.stub &&
             instance === entity.components.__meta.index) {
                this.renderBorder(pos, bounds);
             }
        if(selectable) this.makeTouchZone(entity, Object.assign({},pos), bounds, entity.components.__transform.globalRotation, prio)
        this.restore();
        pos.y -= 61;
        this.renderLabel(pos, identity.id!);
    }

    renderEmpty(entity: EntityStub) {
        let transform = entity.components.__transform as Transform;
        let bounds = transform.globalBounds;
        let pos = util.pokit2canvas(this.ctx.canvas, transform.globalPosition, bounds);
        pos = util.vectorSub(pos, this.scroll);
        this.ctx.strokeStyle = "black";
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(pos.x, pos.y, bounds.x, bounds.y);
        return [pos, bounds] 
    }

    renderSpriteEntity(entity: EntityStub) {
        let transform = entity.components.__transform as Transform;
        let identity = entity.components.identity;
        let sprite = entity.components.sprite;
        let pos = util.pokit2canvas(this.ctx.canvas, transform.globalPosition, transform.globalBounds);
        pos  = util.vectorSub(pos, this.scroll);
        let source = util.vectorMultiply(sprite.source, identity.bounds);
        source = util.vectorCeil(source);
        this.ctx.drawImage(this.sprites, source.x, source.y, identity.bounds.x, identity.bounds.y, pos.x, pos.y, transform.globalBounds.x, transform.globalBounds.y);
        return [pos, transform.globalBounds];
    }

    renderDebugEntity(entity: EntityStub) {
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
        this.ctx.strokeStyle = 'rgba(0,0,0,0.25)';
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
        if(scene === this.state.currentScene && selected) {
            let center = selected.components.__transform.globalPosition;
            center = util.pokit2canvas(this.ctx.canvas, center);
            let rot = selected.components.__transform.globalRotation;
            this.ctx.strokeStyle='purple';
            this.ctx.fillStyle='purple';
            this.ctx.lineWidth = 3;
            this.rotate(rot, center);
            this.makeRotateHandle(instances);
            this.makeCornerScaleHandle(instances);
            this.makeHorizontalScaleHandle(instances);
            this.makeVerticalScaleHandle(instances);
            this.makeMoveHandle(instances);
            this.restore();
        }
    }

    makeMoveHandle(instances: Record<string, EntityStub[]>) {
        let [,stub,index] = this.state.inspecting;
        let resolved = instances[stub][index];
        let center = resolved.components.__transform.globalPosition;
        let bounds = resolved.components.__transform.globalBounds;
        center = util.vectorSub(center, this.scroll);
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
                        appdata.update(a=>{
                            delete a.handling;
                            return a;
                        })
                        appdata.filter(a=>!a.handling);
                        this.ctx.canvas.removeEventListener("pointermove", cb);
                        return;
                    }
                    let pos = util.screen2pokit(this.ctx.canvas, e);
                    pos = util.vectorAdd(pos, this.scroll);
                    pos = this.snap(pos);
                    let [scene,stub,index] = this.state.inspecting;
                    this.state;
                    appdata.update(a=>{
                        a.handling = true;
                        a.scenes[scene].entities[stub][index].position = resolved.components.__transform.revPosition(pos);
                        return a;
                    });
                }
                this.ctx.canvas.addEventListener("pointermove", cb)
            }
        });
    }

    makeRotateHandle(instances: Record<string,EntityStub[]>) {
        let [,stub,index] = this.state.inspecting;
        let resolved = instances[stub][index];
        let center = resolved.components.__transform.globalPosition;
        center = util.vectorSub(center, this.scroll);
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
                            appdata.update(a=>{
                                delete a.handling;
                                return a;
                            })
                            appdata.filter(a=>!a.handling)
                            this.ctx.canvas.removeEventListener("pointermove", cb);
                            return;
                        }
                        let [scene,stub,index] = this.state.inspecting;
                        let selected = instances[stub][index];
                        let transform = selected.components.__transform as Transform;
                        let pos = transform.globalPosition;
                        let pos2 = util.screen2pokit(this.ctx.canvas, e);
                        pos2 = util.vectorAdd(pos2, this.scroll);
                        let rad =Math.atan2(pos2.y-pos.y,pos2.x-pos.x)
                        rad += Math.PI/2;
                        rad = rad < 0 ? rad+(Math.PI*2) : rad;
                        let deg = util.rad2deg(rad);
                        let snap = this.presses.has("Shift") ? 45 : 22.5;
                        deg = this.presses.has("Control") ? Math.round(deg/snap) * snap : deg;
                        appdata.update(a=>{
                            a.handling = true;
                            a.scenes[scene].entities[stub][index].rotation = resolved.components.__transform.revRotation(deg);
                            return a;
                        })
                    }
                    this.ctx.canvas.addEventListener("pointermove", cb)
                }
            }
        )
    }

    makeCornerScaleHandle(instances: Record<string, EntityStub[]>) {
        let [scene,stub,index] = this.state.inspecting;
        let resolved = instances[stub][index];
        let center = resolved.components.__transform.globalPosition;
        let bounds = resolved.components.__transform.globalBounds;
        center = util.vectorSub(center, this.scroll);
        center = util.pokit2canvas(this.ctx.canvas, center);
        let hBounds = util.vectorDivide(bounds, {x:2,y:2})
        let org = util.vectorAdd(center, hBounds);
        let drawOrg = util.vectorSub(org, {x:5,y:5});
        let touchOrg = util.rotateVector(org, resolved.components.__transform.globalRotation, center);
        touchOrg = util.vectorSub(touchOrg, {x:5,y:5})
        this.ctx.fillRect(drawOrg.x,drawOrg.y, 10, 10);
        this.touchZones.push({
            priority: Infinity,
            origin: touchOrg,
            bounds: {x:10,y:10},
            rotation: resolved.components.__transform.globalRotation,
            callback: ()=>{
                let cb=(e: MouseEvent)=>{
                    if(!this.mDown){
                        appdata.update(a=>{
                            delete a.handling;
                            return a;
                        })
                        appdata.filter(a=>!a.handling);
                        this.ctx.canvas.removeEventListener("pointermove", cb);
                        return;
                    }
                    let scale = this.calculateScale(resolved, e);
                    appdata.update(a=>{
                        a.handling = true;
                        a.scenes[scene].entities[stub][index].scale = scale;
                        return a;
                    })
                }
                this.ctx.canvas.addEventListener("pointermove", cb);
            }
        })
    }

    makeHorizontalScaleHandle(instances: Record<string,EntityStub[]>) {
        let [scene,stub,index] = this.state.inspecting;
        let resolved = instances[stub][index];
        let center = resolved.components.__transform.globalPosition;
        let bounds = resolved.components.__transform.globalBounds;
        center = util.vectorSub(center, this.scroll);
        center = util.pokit2canvas(this.ctx.canvas, center);
        let hBounds = util.vectorDivide(bounds, {x:2,y:2})
        let org = {
            x: center.x + hBounds.x - 5,
            y: center.y - 5
        }
        this.ctx.fillRect(org.x,org.y, 10, 10);
        org = util.vectorAdd(org, {x:5,y:5})
        org = util.rotateVector(org, resolved.components.__transform.globalRotation, center);
        org = util.vectorSub(org, {x:5,y:5});
        this.touchZones.push({
            priority: Infinity,
            origin: org,
            bounds: {x:10,y:10},
            rotation: resolved.components.__transform.globalRotation,
            callback: ()=>{
                let cb=(e: MouseEvent)=>{
                    if(!this.mDown){
                        appdata.update(a=>{
                            delete a.handling;
                            return a;
                        })
                        appdata.filter(a=>!a.handling);
                        this.ctx.canvas.removeEventListener("pointermove", cb);
                        return;
                    }
                    let scale = this.calculateScale(resolved, e);
                    appdata.update(a=>{
                        a.handling = true;
                        a.scenes[scene].entities[stub][index].scale.x = scale.x;
                        return a;
                    })
                }
                this.ctx.canvas.addEventListener("pointermove", cb);
            }
        })
    }

    makeVerticalScaleHandle(instances: Record<string,EntityStub[]>) {
        let [scene,stub,index] = this.state.inspecting;
        let resolved = instances[stub][index];
        let center = resolved.components.__transform.globalPosition;
        let bounds = resolved.components.__transform.globalBounds;
        center = util.vectorSub(center, this.scroll);
        center = util.pokit2canvas(this.ctx.canvas, center);
        let hBounds = util.vectorDivide(bounds, {x:2,y:2})
        let org = {
            x: center.x - 5,
            y: center.y + hBounds.y - 5 
        }
        this.ctx.fillRect(org.x,org.y, 10, 10);
        org = util.vectorAdd(org, {x:5,y:5})
        org = util.rotateVector(org, resolved.components.__transform.globalRotation, center);
        org = util.vectorSub(org, {x:5,y:5});
        this.touchZones.push({
            priority: Infinity,
            origin: org,
            bounds: {x:10,y:10},
            rotation: resolved.components.__transform.globalRotation,
            callback: ()=>{
                let cb=(e: MouseEvent)=>{
                    if(!this.mDown){
                        appdata.update(a=>{
                            delete a.handling;
                            return a;
                        })
                        appdata.filter(a=>!a.handling);
                        this.ctx.canvas.removeEventListener("pointermove", cb);
                        return;
                    }
                    let scale = this.calculateScale(resolved, e);
                    appdata.update(a=>{
                        a.handling = true;
                        a.scenes[scene].entities[stub][index].scale.y = scale.y;
                        return a;
                    })
                }
                this.ctx.canvas.addEventListener("pointermove", cb);
            }
        })
    }

    calculateScale(resolved: EntityStub, e: MouseEvent) {
        let center = resolved.components.__transform.globalPosition;
        center = util.vectorSub(center, this.scroll);
        center = util.pokit2canvas(this.ctx.canvas, center);
        let pos = util.screen2canvas(this.ctx.canvas, e);
        pos = util.rotateVector(pos, -resolved.components.__transform.globalRotation, center);
        console.log(center,pos);
        let scale = resolved.components.identity.bounds;
        let dif = util.vectorSub(pos, center);
        scale = util.vectorDivide(dif, scale);
        scale = util.vectorMultiply(scale, {x:2,y:2});
        return resolved.components.__transform.revScale(scale);
    }

    snap(vec:Vector) {
        return {
            x:this.snapX ? Math.round(vec.x / this.gridX) * this.gridX : vec.x,
            y:this.snapY ? Math.round(vec.y / this.gridY) * this.gridY : vec.y
        }
    }

    rotate(theta: number, origin: Vector) {
        let org = util.vectorSub(origin, this.scroll);
        this.ctx.save();
        this.ctx.translate(org.x,org.y);
        this.ctx.rotate(util.deg2rad(theta));
        this.ctx.translate(-org.x,-org.y);
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

// export function deepClone(o: any): any {
//   if(Array.isArray(o)) {
//     let r = [];
//     for(let v of o) {
//       if(typeof v === "object") r.push(deepClone(v));
//       else r.push(v);
//     }
//     return r;
//   }
//   let r = {} as any;
//   for(let [k,v] of Object.entries(o)) {
//     if(typeof v === "object") r[k] = deepClone(v);
//     else r[k] = v;
//   }
//   return r;
// }

export function deepClone(o: any): any {
    return JSON.parse(JSON.stringify(o));
}

export function resolveLineage(stub: string, entities: Record<string,EntityStub>) {
    if(!(stub in entities)) return [];
    let order = [stub]
    let obj = entities[stub];


    for(let inherit of obj.inherits){
        order.push(...resolveLineage(inherit, entities))
    }

    return order;
}

export function applyInheritance(lineage: string[], entities: Record<string,EntityStub>) {
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

function addMeta(e: EntityStub, index: number, stub: string) {
    let i = e.components.identity as Identity;
    let transform = {
        get globalPosition() {
            let parent = (parents[e.components.identity.parent] || parents["__DEFAULT_PARENT__"]).components.__transform as Transform;
            let scaledPos = util.vectorMultiply(i.position, parent.globalScale);
            return util.vectorAdd(util.rotateVector(scaledPos, parent.globalRotation), parent.globalPosition);
        },
        get globalRotation() {
            let parent = (parents[e.components.identity.parent] || parents["__DEFAULT_PARENT__"]).components.__transform as Transform;
            return i.rotation + parent.globalRotation;
        },
        get globalScale() {
            let parent = (parents[e.components.identity.parent] || parents["__DEFAULT_PARENT__"]).components.__transform as Transform;
            return util.vectorMultiply(i.scale, parent.globalScale);
        },
        get globalBounds() {
            if(e.components.camera?.isMainCamera) return POKIT_DIMS;
            return util.vectorMultiply(i.bounds, transform.globalScale);
        },
        revPosition: (pos: Vector) => {
            let parent = (parents[e.components.identity.parent] || parents["__DEFAULT_PARENT__"]).components.__transform as Transform;
            let vec = util.vectorSub(pos, parent.globalPosition);
            vec = util.rotateVector(vec, -parent.globalRotation);
            vec = util.vectorDivide(vec, parent.globalScale);
            return vec;
        },
        revRotation: (rot: number) => {
            let parent = (parents[e.components.identity.parent] || parents["__DEFAULT_PARENT__"]).components.__transform as Transform;
            return rot-parent.globalRotation;
        },
        revScale: (scale: Vector) => {
            let parent = (parents[e.components.identity.parent] || parents["__DEFAULT_PARENT__"]).components.__transform as Transform;
            return util.vectorDivide(scale, parent.globalScale);
        }
    };
    e.components.__transform = transform;
    e.components.__meta = {index,stub}
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