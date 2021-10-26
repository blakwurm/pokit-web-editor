<script lang="ts">
import { ClientRequest } from 'http';

import { onMount } from 'svelte';
import { writable } from 'svelte/store';
import Switch from './lib/Switch.svelte';
import type { TouchZone } from './MapCanvas';
import type { Identity, Vector } from './pokit.types';

    import SpriteDisplay from './SpriteDisplay.svelte'
import SpritePickerModal from './SpritePickerModal.svelte';
import { AppData, appdata, spritemap } from './stores';
import { canvas2pokit, deepClone, pokit2canvas, screen2canvas, vectorAdd, vectorCeil, vectorDist, vectorDivide, vectorFloor, vectorMultiply, vectorSub, VectorZero } from './utils';
    let canvo: HTMLCanvasElement
    let historySet = new Set<number>([0]);
    let history = [0];
    let map: number[];
    let colliders: Record<string, Identity[]> = {};
    let tile = 0;
    let zones: TouchZone[] = [];

    let selected = ["",-1];

    let dirty = true;

    let visible = false;

    let spriteBounds = {x:32,y:32};

    let last: Vector;

    let drawMode = 'paint'
    let faces = writable({NORTH:true,EAST:true,SOUTH:true,WEST:true} as Record<string,boolean>);

    $: updateFaces($faces);

    function stateUpdate(a: AppData) {
        let state = deepClone(a);
        let brush = state.entities[state.currentBrush];
        if(!brush.components.tilemap) { 
            map = new Array(mapWidth*mapHeight).fill(0);
            return;
        }
        let tm = brush.components.tilemap;
        mapWidth = tm.width || mapWidth;
        oldWidth = mapWidth;
        map = tm.tiles || new Array(mapWidth*mapHeight).fill(0);
        mapHeight = map.length/mapWidth;
        oldHeight = mapHeight;
        colliders = brush.children || {};
        spriteBounds = {
            x: tm.tilewidth || spriteBounds.x,
            y: tm.tileheight || spriteBounds.y
        }
        dirty = true; 
    }

    function updateState() {
        appdata.update(a=>{
            let brush = a.entities[a.currentBrush];
            brush.components.tilemap = brush.components.tilemap || {};
            let tm = brush.components.tilemap;
            tm.width = mapWidth;
            tm.tiles = deepClone(map);
            tm.tilewidth = spriteBounds.x,
            tm.tileheight = spriteBounds.y
            brush.children = deepClone(colliders);
            return a;
        });
    }

    function updateFaces(_:any) {
        let [key, index] = selected;
        if(key in colliders && colliders[key][index]) {
            let i = colliders[key][index];
            colliders[key].splice(<number>index,1)
            setCollider(i);
        }
        if(map) updateState();
    }

    function setCollider(i: Identity) {
        let arr = [] as string[];
        for(let [k,v] of Object.entries($faces)) {
            if(v)arr.push(k);
        }
        let key = `__col__${JSON.stringify(arr)}`
        colliders[key] = colliders[key] || [];
        colliders[key].push(i);
        selected=[key,colliders[key].length-1];
    }
    
    function atlasWidth(atlas: HTMLImageElement) {
        return atlas.width / spriteBounds.x;
    }

    let oldWidth = 5;
    let oldHeight = 5;
    let mapWidth = 5;
    let mapHeight = 5;

    $: mapWidth = mapWidth || oldWidth;
    $: mapHeight = mapHeight || oldHeight;

    onMount(()=>{
        canvo.addEventListener("pointerdown", beginPointer);
        canvo.addEventListener("pointerup", endPointer);
        window.addEventListener("keydown", onKeyDown);
        appdata.subscribe(stateUpdate);
        raf();
    });

    $:if($spritemap)dirty=true;
    $:resizeMap(mapWidth,mapHeight);

    function resizeMap(width: number, height:number) {
        console.log("resizing");
        if(width>oldWidth) increaseWidth();
        if(width<oldWidth) decreaseWidth();
        oldWidth = width;
        if(height>oldHeight) increaseHeight();
        if(height<oldHeight) decreaseHeight();
        oldHeight = height;
        if(map) updateState();
    }

    function increaseWidth() {
        let arr = [];
        for(let i = 0; i < oldHeight; i++) {
            let a = map.slice(i*oldWidth, i*oldWidth+oldWidth);
            let b = new Array(mapWidth-oldWidth).fill(0);
            arr.push(...a,...b);
        }
        map = arr;
    }

    function decreaseWidth() {
        let arr = [];
        for(let i = 0; i < oldHeight; i++) {
            arr.push(...map.slice(i*oldWidth, i*oldWidth+mapWidth));
        }
        map = arr;
    }

    function increaseHeight() {
        let arr = new Array((mapHeight-oldHeight)*mapWidth).fill(0);
        map = [...map,...arr];
    }
    
    function decreaseHeight() {
        map.splice(mapHeight*mapWidth, (oldHeight-mapHeight)*mapWidth);
    }

    function beginPointer(e: PointerEvent) {
        last = e;
    }

    function endPointer(e: PointerEvent) {
        if(Math.abs(vectorDist(e,last)) > 5) return;
        let p = screen2canvas(canvo, e);
        p = vectorDivide(p, spriteBounds);
        p = vectorFloor(p);
        switch(drawMode) {
            case "paint":
                let i = p.y*mapWidth+p.x;
                map[i]=tile+1;
                updateState();
                break;
            case "collider":
                if(!checkTouch(e)){
                    addCollider(p);
                    updateState();
                }
                break;
        }
    }

    function onKeyDown(e: KeyboardEvent) {
        switch(e.key) {
            case "Delete":
            case "Backspace":
                let [key,index] = selected;
                if(colliders[key] && colliders[key][index]) {
                    colliders[key].splice(index as number,1);
                }
                updateState();
            case "Escape":
                selected = ["",0];
                dirty = true;
                break;
        }
    }

    function checkTouch(p: Vector) {
        p = screen2canvas(canvo, p);
        for(let zone of zones) {
            let min = zone.origin;
            let max = vectorAdd(min, zone.bounds);
            if(p.x>=min.x && p.y >=min.y && p.x <= max.x && p.y <= max.y) {
                zone.callback();
                return true;
            }
        }
        return false;
    }

    function addCollider(org: Vector) {
        let position = vectorMultiply(org, spriteBounds);
        position = canvas2pokit(canvo, position, spriteBounds);
        setCollider({position,bounds:deepClone(spriteBounds)})
    }

    function getHistory(atlas: HTMLImageElement, history: number[]) {
        return history.reverse().map(n=>{
            let o = {indX:n%atlasWidth(atlas),indY:Math.floor(n/atlasWidth(atlas)),width:spriteBounds.x,height:spriteBounds.y,n};
            return o;
        })
    }
    function pushHistoryEvt(e: any) {
        let i = e.detail.source.y * atlasWidth($spritemap);
        i += e.detail.source.x;
        pushHistory(i);
    }
    function pushHistory(i: number) {
        if(historySet.has(i))historySet.delete(i);
        historySet.add(i);
        tile = i;
        history = [...historySet];
    }

    function raf() {
        if(dirty && canvo) {
            render();
            dirty = false;
        }
        requestAnimationFrame(raf);
    }
    function render() {
        let ctx = canvo.getContext('2d');
        canvo.width = mapWidth * spriteBounds.x;
        canvo.height = mapHeight * spriteBounds.y;
        drawMap(ctx);
        drawGrid(ctx);
        drawColliders(ctx);
        drawHandles(ctx);
    }
    function drawLine(ctx: CanvasRenderingContext2D, x1:number,y1:number,x2:number,y2:number) {
        ctx.beginPath();
        ctx.moveTo(x1,y1);
        ctx.lineTo(x2,y2);
        ctx.stroke();
    }
    function drawMap(ctx: CanvasRenderingContext2D) {
        for(let i = 0; i < map.length; i++) {
            let x = i%mapWidth;
            let y = Math.floor(i/mapWidth);
            let spriteIndex = map[i]-1;
            let width = atlasWidth($spritemap);
            let sprite = {
                x: spriteIndex%width,
                y: Math.floor(spriteIndex/width)
            }
            sprite = vectorMultiply(sprite, spriteBounds);
            sprite = vectorCeil(sprite);
            if(map[i]) ctx.drawImage($spritemap, sprite.x, sprite.y, spriteBounds.x, spriteBounds.y, x*spriteBounds.x, y*spriteBounds.y, spriteBounds.x, spriteBounds.y);
        }
    }
    function drawColliders(ctx: CanvasRenderingContext2D) {
        zones = [];
        for(let [k,v] of Object.entries(colliders)) {
            let split = k.split('__');
            let arr = JSON.parse(split[2]);
            for(let i in v) {
                let s = selected[0] === k && selected[1] == i;
                drawCollider(ctx, arr, v[i], k, parseInt(i), s);
            }
        }
    }
    function drawCollider(ctx: CanvasRenderingContext2D, blocked_faces: string[], i: Identity, key: string, index: number, isSelected = false) {
        let color = isSelected ? 'purple' : 'black';
        let org = pokit2canvas(canvo, i.position, i.bounds);
        let passive_faces = new Set(["NORTH","EAST","SOUTH","WEST"]);
        ctx.lineWidth = 1;
        ctx.strokeStyle = color;
        for(let face of blocked_faces) {
            drawFace(ctx, face, org, i.bounds);
            passive_faces.delete(face);
        }
        for(let face of passive_faces) {
            ctx.strokeStyle = "white";
            drawFace(ctx, face, org, i.bounds);
            ctx.strokeStyle = color;
            ctx.setLineDash([4,4]);
            drawFace(ctx, face, org, i.bounds);
            ctx.setLineDash([]);
        }
        let f: Record<string,boolean> = {};
        Object.keys($faces).forEach(v=>f[v]=!passive_faces.has(v));
        zones.push({
            origin: org,
            bounds: i.bounds,
            rotation: 0,
            priority: 0,
            callback: ()=>{
                selected=[key,index];
                $faces = f;
            }
        });
    }
    function drawFace(ctx: CanvasRenderingContext2D, face: string, org: Vector, bounds: Vector){
        switch(face) {
            case "NORTH":
                drawLine(ctx, org.x, org.y, org.x+bounds.x, org.y);
                break;
            case "EAST":
                drawLine(ctx, org.x+bounds.x, org.y, org.x+bounds.x, org.y+bounds.y);
                break;
            case "SOUTH":
                drawLine(ctx, org.x+bounds.x, org.y+bounds.y, org.x, org.y+bounds.y);
                break;
            case "WEST":
                drawLine(ctx, org.x, org.y+bounds.y, org.x, org.y);
                break;
        }
    }
    function drawGrid(ctx: CanvasRenderingContext2D) {
        ctx.strokeStyle = 'rgba(0,0,0,0.25)';
        for(let x = 0; x < mapWidth; x++) {
            let cx = x*spriteBounds.x;
            drawLine(ctx, cx, 0, cx, canvo.height);
        }
        for(let y = 0; y < mapHeight; y++) {
            let cy = y*spriteBounds.y;
            drawLine(ctx, 0, cy, canvo.width, cy);
        }
    }
    function drawHandles(ctx: CanvasRenderingContext2D) {
        let [key, index] = selected;
        if(!colliders[key] || !colliders[key][index]) return;

        let i = colliders[key][index];
        let c = pokit2canvas(canvo, i.position);
        let min = pokit2canvas(canvo, i.position, i.bounds);
        let max = vectorAdd(min, i.bounds);
        ctx.strokeStyle='purple';
        ctx.lineWidth=3;
        let halfSpriteWidth = spriteBounds.x/2;
        let halfSpriteHeight = spriteBounds.y/2;
        let halfWidth = i.bounds.x/2;
        let halfHeight = i.bounds.y/2;
        if(max.x < canvo.width) drawExpansionHandle(ctx, vectorAdd(c,{x:halfWidth+halfSpriteWidth,y:0}), i, "x");
        if(max.y < canvo.height) drawExpansionHandle(ctx, vectorAdd(c,{x:0,y:halfHeight+halfSpriteHeight}), i, "y");
        if(min.x > 0) drawExpansionHandle(ctx, vectorSub(c,{x:halfWidth+halfSpriteWidth,y:0}), i, "x", true);
        if(min.y > 0) drawExpansionHandle(ctx, vectorSub(c,{x:0,y:halfHeight+halfSpriteHeight}), i, "y", true);
        if(i.bounds.x > spriteBounds.x) {
            drawContractHandle(ctx, vectorAdd(c,{x:halfWidth-halfSpriteWidth,y:0}), i, "x");
            drawContractHandle(ctx, vectorSub(c,{x:halfWidth-halfSpriteWidth,y:0}), i, "x", true);
        }
        if(i.bounds.y > spriteBounds.y) {
            drawContractHandle(ctx, vectorAdd(c,{x:0,y:halfHeight-halfSpriteHeight}), i, "y");
            drawContractHandle(ctx, vectorSub(c,{x:0,y:halfHeight-halfSpriteHeight}), i, "y", true);
        }
    }
    function drawExpansionHandle(ctx: CanvasRenderingContext2D, center: Vector, i: Identity, axis:string, neg=false) {
        let len = (spriteBounds.x+spriteBounds.y)/6;
        drawLine(ctx, center.x-len, center.y, center.x+len, center.y);
        drawLine(ctx, center.x, center.y-len, center.x, center.y+len);
        zones.push({
            origin: vectorSub(center,{x:len,y:len}),
            bounds: {x:len*2,y:len*2},
            rotation: 0,
            priority: 0,
            callback: ()=>{
                i.bounds[axis]+=spriteBounds[axis];
                let mul = neg ? -1 : 1;
                i.position[axis]+=mul*spriteBounds[axis]/2;
                updateState();
            }
        });
    }
    function drawContractHandle(ctx: CanvasRenderingContext2D, center: Vector, i: Identity, axis: string, neg=false) {
        let len = (spriteBounds.x+spriteBounds.y)/6;
        drawLine(ctx, center.x-len, center.y, center.x+len, center.y);
        zones.unshift({
            origin: vectorSub(center,{x:len,y:len}),
            bounds: {x:len*2,y:len*2},
            rotation: 0,
            priority: 0,
            callback: ()=>{
                i.bounds[axis]-=spriteBounds[axis];
                let mul = neg ? -1 : 1;
                i.position[axis]-=mul*spriteBounds[axis]/2;
                updateState();
            }
        })
    }
</script>

<button on:click={()=>visible=true}>Open Sprite Picker</button>
<input type="number" onkeydown={()=>{}} bind:value={mapWidth} />
<input type="number" onkeydown={()=>{}} bind:value={mapHeight} />
<Switch bind:value={drawMode} label="Draw mode" design="multi" options={['paint','collider']} />

{#if drawMode=='collider'}
    <ul>
        {#each Object.keys($faces) as face}
            <li>
                <label for={face}>Collide {face}</label>
                <input id={face} type="checkbox" bind:checked={$faces[face]} />
            </li>
        {/each}
    </ul>
{/if}

<SpritePickerModal singleSelect bind:visible on:select={pushHistoryEvt} />

<ul class="spriterow">
    {#each getHistory($spritemap, history) as {indX,indY,width,height,n}(n)}
        <li class="spriterow">
            <button on:click={()=>pushHistory(n)}><SpriteDisplay {indX} {indY} {width} {height} /></button>
        </li>
    {/each}
</ul>
<div class="canvcontainer">
    <canvas bind:this={canvo}></canvas>
</div>

<style>
    .canvcontainer {
        height: calc(100% - 70px);
        width: calc(100%);
        overflow: scroll;
        border: blue 1px solid;
    }
    ul.spriterow {
        display: flex;
        width: 100%;
        overflow: scroll;
    }
    ul.spriterow li button {
        height: 50px;
        width: 50px;
        border: 1px solid white;
    }
    ul.spriterow li button {
        height: 40px;
        width: 40px;
    }

</style>
