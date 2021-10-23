<script lang="ts">
import { onMount } from 'svelte';
import type { Vector } from './pokit.types';

    import SpriteDisplay from './SpriteDisplay.svelte'
import SpritePickerModal from './SpritePickerModal.svelte';
import { spritemap } from './stores';
import { screen2canvas, vectorCeil, vectorDist, vectorDivide, vectorFloor, vectorMultiply } from './utils';
    let canvo: HTMLCanvasElement
    let historySet = new Set<number>([0]);
    let history = [0];
    let map: number[];
    let tile = 0;

    let dirty = true;

    let visible = false;

    let spriteWidth = 32;
    let spriteHeight = 32;

    let last: Vector;
    
    function atlasWidth(atlas: HTMLImageElement) {
        return atlas.width / spriteWidth;
    }

    let oldWidth = 5;
    let oldHeight = 5;
    let mapWidth = 5;
    let mapHeight = 5;

    $: mapWidth = mapWidth || oldWidth;
    $: mapHeight = mapHeight || oldHeight;

    onMount(()=>{
        canvo.addEventListener("pointerdown", beginPointer);
        canvo.addEventListener("pointerup", endPointer)
        map = new Array(mapWidth*mapHeight).fill(0);
        raf();
    });

    $:if($spritemap)dirty=true;
    $:resizeMap(mapWidth,mapHeight);
    
    function resizeMap(width: number, height:number) {
        if(width>oldWidth) increaseWidth();
        if(width<oldWidth) decreaseWidth();
        oldWidth = width;
        if(height>oldHeight) increaseHeight();
        if(height<oldHeight) decreaseHeight();
        oldHeight = height;
        dirty = true;
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
        p = vectorDivide(p, {x:spriteWidth,y:spriteHeight});
        p = vectorFloor(p);
        let i = p.y*mapWidth+p.x;
        map[i]=tile+1;
        dirty = true;
    }

    function getHistory(atlas: HTMLImageElement, history: number[]) {
        return history.reverse().map(n=>{
            let o = {indX:n%atlasWidth(atlas),indY:Math.floor(n/atlasWidth(atlas)),width:spriteWidth,height:spriteHeight,n};
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
        canvo.width = mapWidth * spriteWidth;
        canvo.height = mapHeight * spriteHeight;
        drawMap(ctx);        
        drawGrid(ctx);
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
            sprite = vectorMultiply(sprite, {x:spriteWidth,y:spriteHeight});
            sprite = vectorCeil(sprite);
            if(map[i]) ctx.drawImage($spritemap, sprite.x, sprite.y, spriteWidth, spriteHeight, x*spriteWidth, y*spriteHeight, spriteWidth, spriteHeight);
        }
    }
    function drawGrid(ctx: CanvasRenderingContext2D) {
        ctx.strokeStyle = 'rgba(0,0,0,0.25)';
        for(let x = 0; x < mapWidth; x++) {
            let cx = x*spriteWidth;
            drawLine(ctx, cx, 0, cx, canvo.height);
        }
        for(let y = 0; y < mapHeight; y++) {
            let cy = y*spriteHeight;
            drawLine(ctx, 0, cy, canvo.width, cy);
        }
    }
</script>

<button on:click={()=>visible=true}>Open Sprite Picker</button>
<input type="number" onkeydown={()=>{}} bind:value={mapWidth} />
<input type="number" onkeydown={()=>{}} bind:value={mapHeight} />

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
